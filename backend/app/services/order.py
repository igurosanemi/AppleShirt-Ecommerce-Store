import math
import secrets

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.services.cart import clear_cart, get_cart_raw


class InsufficientStockError(Exception):
    def __init__(self, product_name: str, requested: int, available: int) -> None:
        self.product_name = product_name
        self.requested = requested
        self.available = available
        super().__init__(
            f"Insufficient stock for: {product_name} "
            f"(requested {requested}, available {available})"
        )


async def get_order(db: AsyncSession, order_id: int, user_id: int | None = None) -> Order | None:
    conditions = [Order.id == order_id]
    if user_id is not None:
        conditions.append(Order.user_id == user_id)
    stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .where(*conditions)
    )
    return (await db.execute(stmt)).scalar_one_or_none()


async def list_orders(
    db: AsyncSession,
    user_id: int,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Order], int]:
    total: int = (
        await db.execute(select(func.count(Order.id)).where(Order.user_id == user_id))
    ).scalar_one()

    stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    orders = list((await db.execute(stmt)).scalars().all())
    return orders, total


async def checkout(
    db: AsyncSession,
    redis,
    user_id: int,
    payment_method: str = "mock_card",
) -> tuple[Order, dict]:
    """
    Atomic checkout:
    1. Read cart from Redis.
    2. Lock product rows (SELECT FOR UPDATE).
    3. Validate stock for every item — raise InsufficientStockError on first failure.
    4. Decrement stock, create Order + OrderItems.
    5. Commit. Clear cart.
    Returns (Order, payment_info_dict).
    """
    cart = await get_cart_raw(redis, user_id)
    if not cart:
        raise ValueError("Cart is empty")

    product_ids = list(cart.keys())

    # Lock rows — prevents concurrent oversell within the transaction
    result = await db.execute(
        select(Product)
        .where(Product.id.in_(product_ids))
        .where(Product.is_active == True)  # noqa: E712
        .with_for_update()
    )
    products: dict[int, Product] = {p.id: p for p in result.scalars().all()}

    # Validate all products exist and have sufficient stock before touching anything
    for pid, qty in cart.items():
        product = products.get(pid)
        if not product:
            raise ValueError(f"Product {pid} is no longer available")
        if product.stock < qty:
            raise InsufficientStockError(product.name, qty, product.stock)

    # All checks passed — decrement stock and build order items
    total = 0
    order_items_data: list[dict] = []
    for pid, qty in cart.items():
        product = products[pid]
        product.stock -= qty
        subtotal = product.price * qty
        total += subtotal
        order_items_data.append(
            {
                "product_id": pid,
                "name": product.name,
                "unit_price": product.price,
                "quantity": qty,
            }
        )

    order = Order(user_id=user_id, status="confirmed", total=total)
    db.add(order)
    await db.flush()  # resolve order.id via RETURNING without committing yet

    for item_data in order_items_data:
        db.add(OrderItem(order_id=order.id, **item_data))

    await db.commit()

    # Cart cleared after commit — if this fails the order still exists (acceptable for mock)
    await clear_cart(redis, user_id)

    # Re-fetch with relationships loaded
    order_with_items = await get_order(db, order.id)
    assert order_with_items is not None

    payment_info = {
        "method": payment_method,
        "status": "approved",
        "transaction_id": f"mock_txn_{secrets.token_hex(8)}",
    }
    return order_with_items, payment_info
