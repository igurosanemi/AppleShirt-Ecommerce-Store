from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.redis import redis_client
from app.db.session import get_db
from app.models.user import User
from app.schemas.catalog import ProductOut
from app.schemas.cart import CartItemIn, CartItemQuantityUpdate, CartItemOut
from app.services.cart import (
    build_cart,
    remove_cart_item,
    clear_cart,
    get_cart_raw,
    set_cart_item,
)
from app.services.catalog import get_product

router = APIRouter(prefix="/cart", tags=["cart"])


async def _cart_response(db: AsyncSession, user: User) -> dict:
    cart = await build_cart(redis_client, db, user.id)
    return {"data": cart}


@router.get("")
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await _cart_response(db, current_user)


@router.post("/items", status_code=status.HTTP_201_CREATED)
async def add_item(
    body: CartItemIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    product = await get_product(db, body.product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    await set_cart_item(redis_client, current_user.id, body.product_id, body.quantity)
    return await _cart_response(db, current_user)


@router.put("/items/{product_id}")
async def update_item(
    product_id: int,
    body: CartItemQuantityUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    product = await get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    # Verify item is actually in the cart
    raw = await get_cart_raw(redis_client, current_user.id)
    if product_id not in raw:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not in cart")
    await set_cart_item(redis_client, current_user.id, product_id, body.quantity)
    return await _cart_response(db, current_user)


@router.delete("/items/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_item(
    product_id: int,
    current_user: User = Depends(get_current_user),
) -> None:
    await remove_cart_item(redis_client, current_user.id, product_id)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear(
    current_user: User = Depends(get_current_user),
) -> None:
    await clear_cart(redis_client, current_user.id)
