from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.db.redis import redis_client
from app.db.session import AsyncSessionLocal

router = APIRouter()


@router.get("/health", tags=["system"])
async def health_check() -> JSONResponse:
    checks: dict[str, str] = {}
    ok = True

    # --- Database ---
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as exc:
        checks["database"] = f"error: {exc}"
        ok = False

    # --- Redis ---
    try:
        await redis_client.ping()
        checks["redis"] = "ok"
    except Exception as exc:
        checks["redis"] = f"error: {exc}"
        ok = False

    status_code = status.HTTP_200_OK if ok else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(
        status_code=status_code,
        content={"data": {"status": "healthy" if ok else "degraded", "checks": checks}},
    )
