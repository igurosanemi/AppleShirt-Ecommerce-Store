import secrets

import redis.asyncio as aioredis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.models.user import User

_REFRESH_PREFIX = "refresh:"


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def create_user(
    db: AsyncSession,
    email: str,
    password: str,
    full_name: str | None = None,
) -> User:
    user = User(
        email=email,
        hashed_password=hash_password(password),
        full_name=full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(
    db: AsyncSession, email: str, password: str
) -> User | None:
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


async def create_refresh_token(redis: aioredis.Redis, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    ttl = settings.refresh_token_expire_days * 24 * 60 * 60
    await redis.setex(f"{_REFRESH_PREFIX}{token}", ttl, str(user_id))
    return token


async def rotate_refresh_token(
    redis: aioredis.Redis, old_token: str
) -> tuple[str, int]:
    key = f"{_REFRESH_PREFIX}{old_token}"
    user_id_str = await redis.get(key)
    if not user_id_str:
        raise ValueError("Invalid or expired refresh token")
    await redis.delete(key)
    user_id = int(user_id_str)
    new_token = await create_refresh_token(redis, user_id)
    return new_token, user_id


async def revoke_refresh_token(redis: aioredis.Redis, token: str) -> None:
    await redis.delete(f"{_REFRESH_PREFIX}{token}")
