import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, patch

from app.main import app


@pytest.mark.asyncio
async def test_health_ok():
    """Health returns 200 when DB and Redis are reachable."""
    with (
        patch("app.api.v1.health.AsyncSessionLocal") as mock_session_cls,
        patch("app.api.v1.health.redis_client") as mock_redis,
    ):
        # Mock DB session context manager
        mock_session = AsyncMock()
        mock_session.execute = AsyncMock()
        mock_session_cls.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        # Mock Redis ping
        mock_redis.ping = AsyncMock(return_value=True)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/api/v1/health")

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["status"] == "healthy"
    assert body["data"]["checks"]["database"] == "ok"
    assert body["data"]["checks"]["redis"] == "ok"


@pytest.mark.asyncio
async def test_health_degraded_on_db_error():
    """Health returns 503 when DB is unreachable."""
    with (
        patch("app.api.v1.health.AsyncSessionLocal") as mock_session_cls,
        patch("app.api.v1.health.redis_client") as mock_redis,
    ):
        mock_session_cls.return_value.__aenter__ = AsyncMock(
            side_effect=Exception("connection refused")
        )
        mock_session_cls.return_value.__aexit__ = AsyncMock(return_value=False)
        mock_redis.ping = AsyncMock(return_value=True)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/api/v1/health")

    assert response.status_code == 503
    body = response.json()
    assert body["data"]["status"] == "degraded"
    assert "error" in body["data"]["checks"]["database"]


@pytest.mark.asyncio
async def test_error_shape_on_404():
    """Unknown routes return the standard error envelope."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/does-not-exist")

    assert response.status_code == 404
    body = response.json()
    assert "error" in body
    assert "code" in body["error"]
    assert "message" in body["error"]
