import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.redis import redis_client
from app.db.session import get_db
from app.models.user import User
from app.schemas.order import CheckoutRequest, OrderItemOut, OrderOut, PaginationMeta
from app.services.order import InsufficientStockError, checkout, get_order, list_orders

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/checkout", status_code=status.HTTP_201_CREATED)
async def do_checkout(
    body: CheckoutRequest = CheckoutRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        order, payment = await checkout(db, redis_client, current_user.id, body.payment_method)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except InsufficientStockError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    return {
        "data": {
            **OrderOut.model_validate(order).model_dump(),
            "payment": payment,
        }
    }


@router.get("")
async def get_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    orders, total = await list_orders(db, current_user.id, page=page, page_size=page_size)
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return {
        "data": [OrderOut.model_validate(o).model_dump() for o in orders],
        "meta": PaginationMeta(
            page=page, page_size=page_size, total=total, total_pages=total_pages
        ).model_dump(),
    }


@router.get("/{order_id}")
async def get_order_detail(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    order = await get_order(db, order_id, user_id=current_user.id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return {"data": OrderOut.model_validate(order).model_dump()}
