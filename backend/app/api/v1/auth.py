from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.rate_limit import enforce_rate_limit
from app.core.security import create_access_token
from app.db.redis import redis_client
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.services.auth import (
    authenticate_user,
    create_refresh_token,
    get_user_by_email,
    create_user,
    revoke_refresh_token,
    rotate_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])

_COOKIE_NAME = "refresh_token"
_COOKIE_MAX_AGE = settings.refresh_token_expire_days * 24 * 60 * 60
_SECURE_COOKIE = settings.app_env != "development"


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=_SECURE_COOKIE,
        samesite="lax",
        max_age=_COOKIE_MAX_AGE,
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=_COOKIE_NAME, path="/api/v1/auth")


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> dict:
    await enforce_rate_limit(request, redis_client, "register")

    if await get_user_by_email(db, body.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = await create_user(db, body.email, body.password, body.full_name)
    access_token = create_access_token(user.id, user.is_admin)
    refresh_token = await create_refresh_token(redis_client, user.id)
    _set_refresh_cookie(response, refresh_token)

    return {
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserOut.model_validate(user).model_dump(),
        }
    }


@router.post("/login")
async def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> dict:
    await enforce_rate_limit(request, redis_client, "login")

    user = await authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    access_token = create_access_token(user.id, user.is_admin)
    refresh_token = await create_refresh_token(redis_client, user.id)
    _set_refresh_cookie(response, refresh_token)

    return {
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserOut.model_validate(user).model_dump(),
        }
    }


@router.post("/refresh")
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> dict:
    old_token = request.cookies.get(_COOKIE_NAME)
    if not old_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    try:
        new_refresh, user_id = await rotate_refresh_token(redis_client, old_token)
    except ValueError:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    access_token = create_access_token(user.id, user.is_admin)
    _set_refresh_cookie(response, new_refresh)

    return {"data": {"access_token": access_token, "token_type": "bearer"}}


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    _: User = Depends(get_current_user),
) -> dict:
    token = request.cookies.get(_COOKIE_NAME)
    if token:
        await revoke_refresh_token(redis_client, token)
    _clear_refresh_cookie(response)
    return {"data": {"message": "Logged out successfully"}}


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)) -> dict:
    return {"data": UserOut.model_validate(current_user).model_dump()}
