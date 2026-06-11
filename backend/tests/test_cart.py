"""
Cart endpoint tests.

Strategy: override get_current_user dependency for auth; patch service
functions at the router import level to avoid live Redis/DB calls.
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.dependencies import get_current_user
from app.main import app
from app.models.user import User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_user(id: int = 1) -> User:
    u = User()
    u.id = id
    u.email = "user@example.com"
    u.full_name = "Test User"
    u.is_admin = False
    u.is_active = True
    return u


def _auth(user_id: int = 1):
    user = _make_user(user_id)

    async def override():
        return user

    return override


_EMPTY_CART = {"items": [], "total": 0, "item_count": 0}

_FULL_CART = {
    "items": [
        {
            "product_id": 1,
            "name": "Test Shirt",
            "price": 5999,
            "quantity": 2,
            "subtotal": 11998,
            "image_url": "/images/products/shirts/test.jpg",
        }
    ],
    "total": 11998,
    "item_count": 1,
}


# ---------------------------------------------------------------------------
# GET /cart
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_cart_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/api/v1/cart")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_get_cart_empty():
    app.dependency_overrides[get_current_user] = _auth()
    with patch("app.api.v1.cart.build_cart", AsyncMock(return_value=_EMPTY_CART)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.get("/api/v1/cart")
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 200
    body = r.json()["data"]
    assert body["items"] == []
    assert body["total"] == 0
    assert body["item_count"] == 0


@pytest.mark.asyncio
async def test_get_cart_with_items():
    app.dependency_overrides[get_current_user] = _auth()
    with patch("app.api.v1.cart.build_cart", AsyncMock(return_value=_FULL_CART)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.get("/api/v1/cart")
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 200
    body = r.json()["data"]
    assert body["item_count"] == 1
    assert body["total"] == 11998
    item = body["items"][0]
    assert item["price"] == 5999
    assert item["quantity"] == 2
    assert item["subtotal"] == 11998


# ---------------------------------------------------------------------------
# POST /cart/items
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_add_item_to_cart():
    from app.models.product import Product

    mock_product = Product()
    mock_product.id = 1
    mock_product.name = "Test Shirt"
    mock_product.price = 5999
    mock_product.stock = 20
    mock_product.is_active = True
    mock_product.image_url = None

    app.dependency_overrides[get_current_user] = _auth()
    with (
        patch("app.api.v1.cart.get_product", AsyncMock(return_value=mock_product)),
        patch("app.api.v1.cart.set_cart_item", AsyncMock()),
        patch("app.api.v1.cart.build_cart", AsyncMock(return_value=_FULL_CART)),
    ):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.post(
                "/api/v1/cart/items", json={"product_id": 1, "quantity": 2}
            )
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 201
    assert r.json()["data"]["item_count"] == 1


@pytest.mark.asyncio
async def test_add_item_product_not_found_is_404():
    app.dependency_overrides[get_current_user] = _auth()
    with patch("app.api.v1.cart.get_product", AsyncMock(return_value=None)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.post(
                "/api/v1/cart/items", json={"product_id": 999, "quantity": 1}
            )
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 404


@pytest.mark.asyncio
async def test_add_item_quantity_zero_is_422():
    app.dependency_overrides[get_current_user] = _auth()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post(
            "/api/v1/cart/items", json={"product_id": 1, "quantity": 0}
        )
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 422


# ---------------------------------------------------------------------------
# PUT /cart/items/{product_id}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_cart_item():
    from app.models.product import Product

    mock_product = Product()
    mock_product.id = 1
    mock_product.name = "Test Shirt"
    mock_product.price = 5999
    mock_product.is_active = True
    mock_product.image_url = None

    updated_cart = {**_FULL_CART, "total": 17997}

    app.dependency_overrides[get_current_user] = _auth()
    with (
        patch("app.api.v1.cart.get_product", AsyncMock(return_value=mock_product)),
        patch("app.api.v1.cart.get_cart_raw", AsyncMock(return_value={1: 2})),
        patch("app.api.v1.cart.set_cart_item", AsyncMock()),
        patch("app.api.v1.cart.build_cart", AsyncMock(return_value=updated_cart)),
    ):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.put("/api/v1/cart/items/1", json={"quantity": 3})
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 200
    assert r.json()["data"]["total"] == 17997


@pytest.mark.asyncio
async def test_update_item_not_in_cart_is_404():
    from app.models.product import Product

    mock_product = Product()
    mock_product.id = 1
    mock_product.is_active = True

    app.dependency_overrides[get_current_user] = _auth()
    with (
        patch("app.api.v1.cart.get_product", AsyncMock(return_value=mock_product)),
        patch("app.api.v1.cart.get_cart_raw", AsyncMock(return_value={})),  # empty cart
    ):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.put("/api/v1/cart/items/1", json={"quantity": 3})
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /cart/items/{product_id}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_remove_cart_item():
    app.dependency_overrides[get_current_user] = _auth()
    with patch("app.api.v1.cart.remove_cart_item", AsyncMock()):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.delete("/api/v1/cart/items/1")
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 204


# ---------------------------------------------------------------------------
# DELETE /cart
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_clear_cart():
    app.dependency_overrides[get_current_user] = _auth()
    with patch("app.api.v1.cart.clear_cart", AsyncMock()):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.delete("/api/v1/cart")
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 204
