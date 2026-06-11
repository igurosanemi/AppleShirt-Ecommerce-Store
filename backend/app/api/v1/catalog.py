import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.catalog import (
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    PaginationMeta,
    ProductCreate,
    ProductOut,
    ProductUpdate,
)
from app.services.catalog import (
    create_category,
    create_product,
    delete_category,
    delete_product,
    get_category,
    get_product,
    list_categories,
    list_products,
    update_category,
    update_product,
)

router = APIRouter(prefix="/catalog", tags=["catalog"])

_MAX_PAGE_SIZE = 100


# ---------------------------------------------------------------------------
# Categories — public reads, admin writes
# ---------------------------------------------------------------------------


@router.get("/categories")
async def get_categories(db: AsyncSession = Depends(get_db)) -> dict:
    categories = await list_categories(db)
    return {"data": [CategoryOut.model_validate(c).model_dump() for c in categories]}


@router.post("/categories", status_code=status.HTTP_201_CREATED)
async def add_category(
    body: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    category = await create_category(db, body)
    return {"data": CategoryOut.model_validate(category).model_dump()}


@router.put("/categories/{category_id}")
async def edit_category(
    category_id: int,
    body: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    category = await get_category(db, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    category = await update_category(db, category, body)
    return {"data": CategoryOut.model_validate(category).model_dump()}


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    category = await get_category(db, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    try:
        await delete_category(db, category)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


# ---------------------------------------------------------------------------
# Products — public reads, admin writes
# ---------------------------------------------------------------------------


@router.get("/products")
async def get_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=_MAX_PAGE_SIZE),
    category_id: int | None = Query(None),
    search: str | None = Query(None, max_length=100),
    db: AsyncSession = Depends(get_db),
) -> dict:
    products, total = await list_products(
        db, page=page, page_size=page_size, category_id=category_id, search=search
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return {
        "data": [ProductOut.model_validate(p).model_dump() for p in products],
        "meta": PaginationMeta(
            page=page, page_size=page_size, total=total, total_pages=total_pages
        ).model_dump(),
    }


@router.get("/products/{product_id}")
async def get_product_detail(
    product_id: int,
    db: AsyncSession = Depends(get_db),
) -> dict:
    product = await get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return {"data": ProductOut.model_validate(product).model_dump()}


@router.post("/products", status_code=status.HTTP_201_CREATED)
async def add_product(
    body: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    # Verify category exists
    if not await get_category(db, body.category_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    product = await create_product(db, body)
    return {"data": ProductOut.model_validate(product).model_dump()}


@router.put("/products/{product_id}")
async def edit_product(
    product_id: int,
    body: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    product = await get_product(db, product_id, active_only=False)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if body.category_id is not None and not await get_category(db, body.category_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    product = await update_product(db, product, body)
    return {"data": ProductOut.model_validate(product).model_dump()}


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    product = await get_product(db, product_id, active_only=False)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    await delete_product(db, product)
