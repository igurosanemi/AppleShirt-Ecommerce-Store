"""
Catalog endpoint tests.

Strategy: override FastAPI dependencies to inject mocked DB sessions
and patch service functions — no live Postgres required.
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.dependencies import get_current_user, require_admin
from app.core.security import create_access_token
from app.db.session import get_db
from app.main import app
from app.models.category import Category
from app.models.product import Product
from app.models.user import User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_category(id: int = 1, name: str = "Shirts", slug: str = "shirts") -> Category:
    c = Category()
    c.id = id
    c.name = name
    c.slug = slug
    c.description = f"{name} category"
    c.created_at = datetime.now(timezone.utc)
    c.updated_at = datetime.now(timezone.utc)
    return c


def _make_product(
    id: int = 1,
    name: str = "Test Shirt",
    slug: str = "test-shirt",
    price: int = 5999,
    stock: int = 10,
    category_id: int = 1,
    is_active: bool = True,
) -> Product:
    p = Product()
    p.id = id
    p.name = name
    p.slug = slug
    p.description = "A test product"
    p.price = price
    p.stock = stock
    p.category_id = category_id
    p.image_url = "/images/products/test.jpg"
    p.is_active = is_active
    p.created_at = datetime.now(timezone.utc)
    p.updated_at = datetime.now(timezone.utc)
    p.category = _make_category(id=category_id)
    return p


def _make_admin(id: int = 99) -> User:
    u = User()
    u.id = id
    u.email = "admin@example.com"
    u.full_name = "Admin User"
    u.is_admin = True
    u.is_active = True
    return u


def _make_non_admin(id: int = 88) -> User:
    u = User()
    u.id = id
    u.email = "user@example.com"
    u.full_name = "Regular User"
    u.is_admin = False
    u.is_active = True
    return u


def _mock_db():
    db = AsyncMock()
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    db.flush = AsyncMock()
    db.delete = AsyncMock()
    return db


def _admin_override():
    admin = _make_admin()

    async def override():
        return admin

    return override


def _user_override():
    user = _make_non_admin()

    async def override():
        return user

    return override


# ---------------------------------------------------------------------------
# Categories — public read
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_categories_empty():
    with patch("app.api.v1.catalog.list_categories", AsyncMock(return_value=[])):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.get("/api/v1/catalog/categories")

    assert r.status_code == 200
    body = r.json()
    assert body["data"] == []


@pytest.mark.asyncio
async def test_list_categories_returns_items():
    cats = [_make_category(1, "Shirts", "shirts"), _make_category(2, "Trousers", "trousers")]
    with patch("app.api.v1.catalog.list_categories", AsyncMock(return_value=cats)):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.get("/api/v1/catalog/categories")

    assert r.status_code == 200
    data = r.json()["data"]
    assert len(data) == 2
    assert data[0]["slug"] == "shirts"
    assert data[1]["slug"] == "trousers"


# ---------------------------------------------------------------------------
# Categories — admin writes
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_category_as_admin():
    cat = _make_category()
    app.dependency_overrides[require_admin] = _admin_override()
    with patch("app.api.v1.catalog.create_category", AsyncMock(return_value=cat)):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.post(
                "/api/v1/catalog/categories",
                json={"name": "Shirts", "description": "Great shirts"},
            )
    app.dependency_overrides.pop(require_admin, None)

    assert r.status_code == 201
    assert r.json()["data"]["slug"] == "shirts"


@pytest.mark.asyncio
async def test_create_category_non_admin_is_403():
    app.dependency_overrides[require_admin] = _user_override()
    # require_admin dependency will raise 403 from the real implementation
    # We need to NOT override require_admin and instead let it fail
    app.dependency_overrides.pop(require_admin, None)

    # Use a non-admin user for get_current_user so require_admin raises 403
    app.dependency_overrides[get_current_user] = _user_override()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        r = await client.post(
            "/api/v1/catalog/categories",
            json={"name": "Shirts"},
        )
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 403


@pytest.mark.asyncio
async def test_create_category_requires_auth():
    # No auth at all — 401
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        r = await client.post("/api/v1/catalog/categories", json={"name": "Shirts"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_update_category_as_admin():
    cat = _make_category()
    cat.description = "Updated description"
    app.dependency_overrides[require_admin] = _admin_override()
    with (
        patch("app.api.v1.catalog.get_category", AsyncMock(return_value=_make_category())),
        patch("app.api.v1.catalog.update_category", AsyncMock(return_value=cat)),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.put(
                "/api/v1/catalog/categories/1",
                json={"description": "Updated description"},
            )
    app.dependency_overrides.pop(require_admin, None)

    assert r.status_code == 200
    assert r.json()["data"]["description"] == "Updated description"


@pytest.mark.asyncio
async def test_update_category_not_found():
    app.dependency_overrides[require_admin] = _admin_override()
    with patch("app.api.v1.catalog.get_category", AsyncMock(return_value=None)):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.put("/api/v1/catalog/categories/999", json={"name": "X"})
    app.dependency_overrides.pop(require_admin, None)

    assert r.status_code == 404


@pytest.mark.asyncio
async def test_delete_category_as_admin():
    app.dependency_overrides[require_admin] = _admin_override()
    with (
        patch("app.api.v1.catalog.get_category", AsyncMock(return_value=_make_category())),
        patch("app.api.v1.catalog.delete_category", AsyncMock(return_value=None)),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.delete("/api/v1/catalog/categories/1")
    app.dependency_overrides.pop(require_admin, None)

    assert r.status_code == 204


@pytest.mark.asyncio
async def test_delete_category_with_products_is_409():
    app.dependency_overrides[require_admin] = _admin_override()
    with (
        patch("app.api.v1.catalog.get_category", AsyncMock(return_value=_make_category())),
        patch(
            "app.api.v1.catalog.delete_category",
            AsyncMock(side_effect=ValueError("Category has 3 product(s)")),
        ),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.delete("/api/v1/catalog/categories/1")
    app.dependency_overrides.pop(require_admin, None)

    assert r.status_code == 409


# ---------------------------------------------------------------------------
# Products — public read
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_products_empty():
    with patch("app.api.v1.catalog.list_products", AsyncMock(return_value=([], 0))):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.get("/api/v1/catalog/products")

    assert r.status_code == 200
    body = r.json()
    assert body["data"] == []
    meta = body["meta"]
    assert meta["total"] == 0
    assert meta["page"] == 1
    assert meta["total_pages"] == 1


@pytest.mark.asyncio
async def test_list_products_returns_items_with_meta():
    products = [_make_product(1), _make_product(2, name="Polo", slug="polo")]
    with patch("app.api.v1.catalog.list_products", AsyncMock(return_value=(products, 2))):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.get("/api/v1/catalog/products")

    assert r.status_code == 200
    body = r.json()
    assert len(body["data"]) == 2
    meta = body["meta"]
    assert meta["total"] == 2
    assert meta["page"] == 1
    assert meta["page_size"] == 20
    assert meta["total_pages"] == 1


@pytest.mark.asyncio
async def test_list_products_filter_by_category():
    """category_id query param is forwarded to the service."""
    products = [_make_product(category_id=3)]

    async def mock_list(db, page, page_size, category_id, search, active_only=True):
        assert category_id == 3
        return products, 1

    with patch("app.api.v1.catalog.list_products", mock_list):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.get("/api/v1/catalog/products?category_id=3")

    assert r.status_code == 200
    assert r.json()["data"][0]["category_id"] == 3


@pytest.mark.asyncio
async def test_list_products_search():
    """search query param is forwarded to the service."""
    products = [_make_product(name="Oxford Shirt", slug="oxford")]

    async def mock_list(db, page, page_size, category_id, search, active_only=True):
        assert search == "Oxford"
        return products, 1

    with patch("app.api.v1.catalog.list_products", mock_list):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.get("/api/v1/catalog/products?search=Oxford")

    assert r.status_code == 200


@pytest.mark.asyncio
async def test_list_products_search_too_long_is_422():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        r = await client.get(f"/api/v1/catalog/products?search={'x' * 101}")
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_list_products_pagination_params():
    """page/page_size params propagate to service and meta."""
    products = [_make_product()]

    async def mock_list(db, page, page_size, category_id, search, active_only=True):
        assert page == 2
        assert page_size == 5
        return products, 12

    with patch("app.api.v1.catalog.list_products", mock_list):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.get("/api/v1/catalog/products?page=2&page_size=5")

    assert r.status_code == 200
    meta = r.json()["meta"]
    assert meta["page"] == 2
    assert meta["page_size"] == 5
    assert meta["total"] == 12
    assert meta["total_pages"] == 3  # ceil(12/5)


@pytest.mark.asyncio
async def test_list_products_invalid_page_is_422():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        r = await client.get("/api/v1/catalog/products?page=0")
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_get_product_detail():
    product = _make_product()
    with patch("app.api.v1.catalog.get_product", AsyncMock(return_value=product)):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.get("/api/v1/catalog/products/1")

    assert r.status_code == 200
    body = r.json()["data"]
    assert body["id"] == 1
    assert body["price"] == 5999
    assert body["category"]["slug"] == "shirts"


@pytest.mark.asyncio
async def test_get_product_detail_not_found():
    with patch("app.api.v1.catalog.get_product", AsyncMock(return_value=None)):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.get("/api/v1/catalog/products/999")

    assert r.status_code == 404
    assert r.json()["error"]["code"] == "HTTP_404"


# ---------------------------------------------------------------------------
# Products — admin writes
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_product_as_admin():
    product = _make_product()
    app.dependency_overrides[require_admin] = _admin_override()
    with (
        patch("app.api.v1.catalog.get_category", AsyncMock(return_value=_make_category())),
        patch("app.api.v1.catalog.create_product", AsyncMock(return_value=product)),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.post(
                "/api/v1/catalog/products",
                json={
                    "name": "Test Shirt",
                    "price": 5999,
                    "stock": 10,
                    "category_id": 1,
                },
            )
    app.dependency_overrides.pop(require_admin, None)

    assert r.status_code == 201
    assert r.json()["data"]["price"] == 5999


@pytest.mark.asyncio
async def test_create_product_non_admin_is_403():
    app.dependency_overrides[get_current_user] = _user_override()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        r = await client.post(
            "/api/v1/catalog/products",
            json={"name": "X", "price": 100, "stock": 1, "category_id": 1},
        )
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 403


@pytest.mark.asyncio
async def test_create_product_invalid_category_is_404():
    app.dependency_overrides[require_admin] = _admin_override()
    with patch("app.api.v1.catalog.get_category", AsyncMock(return_value=None)):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.post(
                "/api/v1/catalog/products",
                json={"name": "X", "price": 100, "stock": 1, "category_id": 999},
            )
    app.dependency_overrides.pop(require_admin, None)

    assert r.status_code == 404


@pytest.mark.asyncio
async def test_create_product_negative_price_is_422():
    app.dependency_overrides[require_admin] = _admin_override()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        r = await client.post(
            "/api/v1/catalog/products",
            json={"name": "X", "price": -1, "stock": 1, "category_id": 1},
        )
    app.dependency_overrides.pop(require_admin, None)

    assert r.status_code == 422


@pytest.mark.asyncio
async def test_update_product_as_admin():
    updated = _make_product(price=7999)
    app.dependency_overrides[require_admin] = _admin_override()
    with (
        patch("app.api.v1.catalog.get_product", AsyncMock(return_value=_make_product())),
        patch("app.api.v1.catalog.get_category", AsyncMock(return_value=None)),
        patch("app.api.v1.catalog.update_product", AsyncMock(return_value=updated)),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.put("/api/v1/catalog/products/1", json={"price": 7999})
    app.dependency_overrides.pop(require_admin, None)

    assert r.status_code == 200
    assert r.json()["data"]["price"] == 7999


@pytest.mark.asyncio
async def test_delete_product_as_admin():
    app.dependency_overrides[require_admin] = _admin_override()
    with (
        patch("app.api.v1.catalog.get_product", AsyncMock(return_value=_make_product())),
        patch("app.api.v1.catalog.delete_product", AsyncMock(return_value=None)),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.delete("/api/v1/catalog/products/1")
    app.dependency_overrides.pop(require_admin, None)

    assert r.status_code == 204


@pytest.mark.asyncio
async def test_delete_product_not_found():
    app.dependency_overrides[require_admin] = _admin_override()
    with patch("app.api.v1.catalog.get_product", AsyncMock(return_value=None)):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            r = await client.delete("/api/v1/catalog/products/999")
    app.dependency_overrides.pop(require_admin, None)

    assert r.status_code == 404
