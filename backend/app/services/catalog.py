import math
import re

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.category import Category
from app.models.product import Product
from app.schemas.catalog import CategoryCreate, CategoryUpdate, ProductCreate, ProductUpdate


def _slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


# ---------------------------------------------------------------------------
# Category service
# ---------------------------------------------------------------------------


async def list_categories(db: AsyncSession) -> list[Category]:
    result = await db.execute(select(Category).order_by(Category.name))
    return list(result.scalars().all())


async def get_category(db: AsyncSession, category_id: int) -> Category | None:
    result = await db.execute(select(Category).where(Category.id == category_id))
    return result.scalar_one_or_none()


async def get_category_by_slug(db: AsyncSession, slug: str) -> Category | None:
    result = await db.execute(select(Category).where(Category.slug == slug))
    return result.scalar_one_or_none()


async def create_category(db: AsyncSession, data: CategoryCreate) -> Category:
    slug = data.slug or _slugify(data.name)
    category = Category(name=data.name, slug=slug, description=data.description)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


async def update_category(db: AsyncSession, category: Category, data: CategoryUpdate) -> Category:
    if data.name is not None:
        category.name = data.name
    if data.slug is not None:
        category.slug = data.slug
    if data.description is not None:
        category.description = data.description
    await db.commit()
    await db.refresh(category)
    return category


async def delete_category(db: AsyncSession, category: Category) -> None:
    # Guard: reject if products exist under this category
    count = (
        await db.execute(
            select(func.count(Product.id)).where(Product.category_id == category.id)
        )
    ).scalar_one()
    if count > 0:
        raise ValueError(f"Category has {count} product(s) — remove them first")
    await db.delete(category)
    await db.commit()


# ---------------------------------------------------------------------------
# Product service
# ---------------------------------------------------------------------------


async def list_products(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    category_id: int | None = None,
    search: str | None = None,
    active_only: bool = True,
) -> tuple[list[Product], int]:
    conditions = []
    if active_only:
        conditions.append(Product.is_active == True)  # noqa: E712
    if category_id is not None:
        conditions.append(Product.category_id == category_id)
    if search:
        conditions.append(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
            )
        )

    count_stmt = select(func.count(Product.id)).where(*conditions)
    total: int = (await db.execute(count_stmt)).scalar_one()

    stmt = (
        select(Product)
        .options(selectinload(Product.category))
        .where(*conditions)
        .order_by(Product.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    products = list((await db.execute(stmt)).scalars().all())
    return products, total


async def get_product(
    db: AsyncSession, product_id: int, active_only: bool = True
) -> Product | None:
    conditions = [Product.id == product_id]
    if active_only:
        conditions.append(Product.is_active == True)  # noqa: E712
    stmt = (
        select(Product)
        .options(selectinload(Product.category))
        .where(*conditions)
    )
    return (await db.execute(stmt)).scalar_one_or_none()


async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    slug = data.slug or _slugify(data.name)
    product = Product(
        name=data.name,
        slug=slug,
        description=data.description,
        price=data.price,
        stock=data.stock,
        category_id=data.category_id,
        image_url=data.image_url,
        is_active=data.is_active,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    # Re-fetch with relationship loaded
    return (await get_product(db, product.id, active_only=False))  # type: ignore[return-value]


async def update_product(db: AsyncSession, product: Product, data: ProductUpdate) -> Product:
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(product, field, value)
    await db.commit()
    await db.refresh(product)
    return (await get_product(db, product.id, active_only=False))  # type: ignore[return-value]


async def delete_product(db: AsyncSession, product: Product) -> None:
    await db.delete(product)
    await db.commit()
