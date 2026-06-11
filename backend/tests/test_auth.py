"""
Auth endpoint tests.

Strategy: override FastAPI dependencies to inject mocked DB sessions
and Redis clients — no live Postgres or Redis required.
"""

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from jose import jwt

from app.core.config import settings
from app.core.security import (
    ALGORITHM,
    create_access_token,
    hash_password,
    verify_password,
)
from app.main import app
from app.models.user import User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_user(
    id: int = 1,
    email: str = "test@example.com",
    password: str = "Password1!",
    is_admin: bool = False,
    is_active: bool = True,
) -> User:
    u = User()
    u.id = id
    u.email = email
    u.hashed_password = hash_password(password)
    u.full_name = "Test User"
    u.is_admin = is_admin
    u.is_active = is_active
    u.created_at = datetime.now(timezone.utc)
    u.updated_at = datetime.now(timezone.utc)
    return u


def _mock_db(user: User | None = None):
    """Return a mock AsyncSession whose scalar_one_or_none returns *user*."""
    db = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = user
    db.execute = AsyncMock(return_value=result)
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    return db


def _mock_redis(stored: dict | None = None):
    """Return a mock Redis whose get/set/del mirror *stored*."""
    stored = stored or {}
    redis = AsyncMock()

    async def _get(key):
        return stored.get(key)

    async def _setex(key, ttl, value):
        stored[key] = value

    async def _delete(*keys):
        for k in keys:
            stored.pop(k, None)

    async def _incr(key):
        stored[key] = int(stored.get(key, 0)) + 1
        return stored[key]

    async def _expire(key, ttl):
        pass  # no-op for tests

    redis.get = _get
    redis.setex = _setex
    redis.delete = _delete
    redis.incr = _incr
    redis.expire = _expire
    redis.ping = AsyncMock(return_value=True)
    return redis, stored


# ---------------------------------------------------------------------------
# Unit: security helpers
# ---------------------------------------------------------------------------

def test_password_round_trip():
    hashed = hash_password("hunter2")
    assert verify_password("hunter2", hashed)
    assert not verify_password("wrong", hashed)


def test_access_token_round_trip():
    token = create_access_token(user_id=42, is_admin=True)
    payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    assert payload["sub"] == "42"
    assert payload["is_admin"] is True
    assert payload["type"] == "access"


def test_expired_access_token_rejected():
    expired = datetime.now(timezone.utc) - timedelta(seconds=1)
    payload = {"sub": "1", "type": "access", "is_admin": False, "exp": expired}
    token = jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)
    from jose import JWTError
    from app.core.security import decode_access_token
    with pytest.raises(JWTError):
        decode_access_token(token)


def test_wrong_token_type_rejected():
    payload = {
        "sub": "1",
        "type": "refresh",  # wrong type
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
    }
    token = jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)
    from jose import JWTError
    from app.core.security import decode_access_token
    with pytest.raises(JWTError):
        decode_access_token(token)


# ---------------------------------------------------------------------------
# Unit: refresh token service
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_refresh_token_stored_and_rotated():
    redis, store = _mock_redis()
    from app.services.auth import create_refresh_token, rotate_refresh_token

    token1 = await create_refresh_token(redis, user_id=7)
    assert store.get(f"refresh:{token1}") == "7"

    token2, uid = await rotate_refresh_token(redis, token1)
    assert uid == 7
    assert store.get(f"refresh:{token1}") is None  # old token gone
    assert store.get(f"refresh:{token2}") == "7"


@pytest.mark.asyncio
async def test_rotate_invalid_token_raises():
    redis, _ = _mock_redis()
    from app.services.auth import rotate_refresh_token
    with pytest.raises(ValueError):
        await rotate_refresh_token(redis, "bogus-token")


# ---------------------------------------------------------------------------
# Integration: /register
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_register_success():
    user = _make_user()
    db = _mock_db(user=None)  # no existing user
    # After commit, db.refresh populates the new user onto the passed object
    db.refresh = AsyncMock(side_effect=lambda u: None)
    redis, store = _mock_redis()

    # Patch the DB and Redis that the router actually calls
    with (
        patch("app.api.v1.auth.get_user_by_email", AsyncMock(return_value=None)),
        patch("app.api.v1.auth.create_user", AsyncMock(return_value=user)),
        patch("app.api.v1.auth.redis_client", redis),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.post(
                "/api/v1/auth/register",
                json={"email": "test@example.com", "password": "Password1!"},
            )

    assert r.status_code == 201
    body = r.json()
    assert "access_token" in body["data"]
    assert body["data"]["token_type"] == "bearer"
    assert body["data"]["user"]["email"] == "test@example.com"
    # refresh cookie set
    assert "refresh_token" in r.cookies


@pytest.mark.asyncio
async def test_register_duplicate_email():
    existing_user = _make_user()
    with patch("app.api.v1.auth.get_user_by_email", AsyncMock(return_value=existing_user)):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.post(
                "/api/v1/auth/register",
                json={"email": "test@example.com", "password": "Password1!"},
            )

    assert r.status_code == 409
    assert r.json()["error"]["code"] == "HTTP_409"


# ---------------------------------------------------------------------------
# Integration: /login
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_login_success():
    user = _make_user(password="Password1!")
    redis, _ = _mock_redis()

    with (
        patch("app.api.v1.auth.authenticate_user", AsyncMock(return_value=user)),
        patch("app.api.v1.auth.redis_client", redis),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.post(
                "/api/v1/auth/login",
                json={"email": "test@example.com", "password": "Password1!"},
            )

    assert r.status_code == 200
    assert "access_token" in r.json()["data"]
    assert "refresh_token" in r.cookies


@pytest.mark.asyncio
async def test_login_wrong_password():
    redis, _ = _mock_redis()
    with (
        patch("app.api.v1.auth.authenticate_user", AsyncMock(return_value=None)),
        patch("app.api.v1.auth.redis_client", redis),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.post(
                "/api/v1/auth/login",
                json={"email": "test@example.com", "password": "wrong"},
            )

    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Integration: /refresh
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_refresh_rotates_token():
    user = _make_user()
    redis, store = _mock_redis()

    from app.services.auth import create_refresh_token
    old_token = await create_refresh_token(redis, user.id)

    with (
        patch("app.api.v1.auth.redis_client", redis),
        patch("app.api.v1.auth.rotate_refresh_token", AsyncMock(return_value=("new-token-xyz", 1))),
        patch("app.db.session.AsyncSessionLocal") as mock_session_cls,
    ):
        mock_session = AsyncMock()
        result = MagicMock()
        result.scalar_one_or_none.return_value = user
        mock_session.execute = AsyncMock(return_value=result)
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=False)
        mock_session_cls.return_value = mock_session

        # Override get_db dep
        from app.db.session import get_db
        from app.main import app as _app

        async def override_get_db():
            yield mock_session

        _app.dependency_overrides[get_db] = override_get_db

        async with AsyncClient(
            transport=ASGITransport(app=_app), base_url="http://test",
            cookies={"refresh_token": old_token},
        ) as client:
            r = await client.post("/api/v1/auth/refresh")

        _app.dependency_overrides.clear()

    assert r.status_code == 200
    assert "access_token" in r.json()["data"]


@pytest.mark.asyncio
async def test_refresh_missing_cookie():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        r = await client.post("/api/v1/auth/refresh")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_refresh_invalid_token():
    redis, _ = _mock_redis()
    with patch("app.api.v1.auth.redis_client", redis):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test",
            cookies={"refresh_token": "invalid-token"},
        ) as client:
            r = await client.post("/api/v1/auth/refresh")
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Integration: /me (protected route)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_me_requires_auth():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        r = await client.get("/api/v1/auth/me")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_me_with_valid_token():
    user = _make_user()
    access_token = create_access_token(user.id, user.is_admin)

    from app.core.dependencies import get_current_user

    async def override_current_user():
        return user

    app.dependency_overrides[get_current_user] = override_current_user
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        r = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    app.dependency_overrides.clear()

    assert r.status_code == 200
    assert r.json()["data"]["email"] == "test@example.com"


# ---------------------------------------------------------------------------
# Integration: rate limiting
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_rate_limit_blocks_after_max_requests():
    redis, store = _mock_redis()

    with (
        patch("app.api.v1.auth.get_user_by_email", AsyncMock(return_value=None)),
        patch("app.api.v1.auth.create_user", AsyncMock(return_value=_make_user())),
        patch("app.api.v1.auth.redis_client", redis),
        patch("app.core.rate_limit.enforce_rate_limit") as mock_rl,
    ):
        # First 5 calls pass, 6th raises
        call_count = 0

        async def side_effect(req, red, endpoint, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count > 5:
                from fastapi import HTTPException
                raise HTTPException(status_code=429, detail="Too many requests.")

        mock_rl.side_effect = side_effect

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            for _ in range(5):
                r = await client.post(
                    "/api/v1/auth/register",
                    json={"email": f"u{_}@example.com", "password": "Password1!"},
                )
                assert r.status_code == 201

            r = await client.post(
                "/api/v1/auth/register",
                json={"email": "sixth@example.com", "password": "Password1!"},
            )
            assert r.status_code == 429
