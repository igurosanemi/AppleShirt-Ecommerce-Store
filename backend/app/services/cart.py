from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product

_CART_TTL_SECONDS = 7 * 24 * 60 * 60  # 7 days


def _key(user_id: int) -> str:
    return f"cart:{user_id}"


async def get_cart_raw(redis, user_id: int) -> dict[int, int]:
    """Return {product_id: quantity} from Redis hash."""
    raw: dict[str, str] = await redis.hgetall(_key(user_id))
    return {int(k): int(v) for k, v in raw.items()}


async def set_cart_item(redis, user_id: int, product_id: int, quantity: int) -> None:
    key = _key(user_id)
    await redis.hset(key, str(product_id), str(quantity))
    await redis.expire(key, _CART_TTL_SECONDS)


async def remove_cart_item(redis, user_id: int, product_id: int) -> None:
    await redis.hdel(_key(user_id), str(product_id))


async def clear_cart(redis, user_id: int) -> None:
    await redis.delete(_key(user_id))


async def build_cart(redis, db: AsyncSession, user_id: int) -> dict:
    """Fetch cart from Redis and enrich with product details from DB."""
    raw = await get_cart_raw(redis, user_id)
    if not raw:
        return {"items": [], "total": 0, "item_count": 0}

    result = await db.execute(
        select(Product)
        .where(Product.id.in_(raw.keys()))
        .where(Product.is_active == True)  # noqa: E712
    )
    products = {p.id: p for p in result.scalars().all()}

    items = []
    total = 0
    for pid, qty in raw.items():
        product = products.get(pid)
        if not product:
            # Product was deleted or deactivated — silently skip
            continue
        subtotal = product.price * qty
        total += subtotal
        items.append(
            {
                "product_id": pid,
                "name": product.name,
                "price": product.price,
                "quantity": qty,
                "subtotal": subtotal,
                "image_url": product.image_url,
            }
        )

    return {"items": items, "total": total, "item_count": len(items)}
