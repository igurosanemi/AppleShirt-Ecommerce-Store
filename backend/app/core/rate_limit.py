import redis.asyncio as aioredis
from fastapi import HTTPException, Request, status


async def is_rate_limited(
    redis: aioredis.Redis,
    key: str,
    max_requests: int = 5,
    window_seconds: int = 60,
) -> bool:
    count = await redis.incr(key)
    if count == 1:
        await redis.expire(key, window_seconds)
    return count > max_requests


async def enforce_rate_limit(
    request: Request,
    redis: aioredis.Redis,
    endpoint: str,
    max_requests: int = 5,
    window_seconds: int = 60,
) -> None:
    client_ip = request.client.host if request.client else "unknown"
    key = f"rate_limit:{endpoint}:{client_ip}"
    if await is_rate_limited(redis, key, max_requests, window_seconds):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
        )
