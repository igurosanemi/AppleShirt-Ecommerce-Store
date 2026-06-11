"""
Order + Checkout endpoint tests.

Strategy: override get_current_user; patch service functions at the router
import level so no live DB or Redis is needed.
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.dependencies import get_current_user
from app.main import app
from app.models.order import Order, OrderItem
from app.models.user import User
from app.services.order import InsufficientStockError


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


def _make_order_item(
    id: int = 1,
    order_id: int = 1,
    product_id: int = 1,
    name: str = "Test Shirt",
    unit_price: int = 5999,
    quantity: int = 2,
) -> OrderItem:
    item = OrderItem()
    item.id = id
    item.order_id = order_id
    item.product_id = product_id
    item.name = name
    item.unit_price = unit_price
    item.quantity = quantity
    return item


def _make_order(
    id: int = 1,
    user_id: int = 1,
    status: str = "confirmed",
    total: int = 11998,
    items: list | None = None,
) -> Order:
    order = Order()
    order.id = id
    order.user_id = user_id
    order.status = status
    order.total = total
    order.created_at = datetime.now(timezone.utc)
    order.updated_at = datetime.now(timezone.utc)
    order.items = items if items is not None else [_make_order_item(order_id=id)]
    return order


_MOCK_PAYMENT = {
    "method": "mock_card",
    "status": "approved",
    "transaction_id": "mock_txn_abc123",
}


# ---------------------------------------------------------------------------
# POST /orders/checkout
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_checkout_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/api/v1/orders/checkout")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_checkout_success():
    order = _make_order()
    app.dependency_overrides[get_current_user] = _auth()
    with patch(
        "app.api.v1.orders.checkout",
        AsyncMock(return_value=(order, _MOCK_PAYMENT)),
    ):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.post("/api/v1/orders/checkout", json={})
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 201
    body = r.json()["data"]
    assert body["id"] == 1
    assert body["status"] == "confirmed"
    assert body["total"] == 11998
    assert len(body["items"]) == 1
    item = body["items"][0]
    assert item["unit_price"] == 5999
    assert item["quantity"] == 2
    assert item["subtotal"] == 11998  # computed field
    assert body["payment"]["status"] == "approved"
    assert body["payment"]["transaction_id"] == "mock_txn_abc123"


@pytest.mark.asyncio
async def test_checkout_empty_cart_is_400():
    app.dependency_overrides[get_current_user] = _auth()
    with patch(
        "app.api.v1.orders.checkout",
        AsyncMock(side_effect=ValueError("Cart is empty")),
    ):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.post("/api/v1/orders/checkout", json={})
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 400
    assert "Cart is empty" in r.json()["error"]["message"]


@pytest.mark.asyncio
async def test_checkout_insufficient_stock_is_409():
    app.dependency_overrides[get_current_user] = _auth()
    with patch(
        "app.api.v1.orders.checkout",
        AsyncMock(
            side_effect=InsufficientStockError("Navy Blue Polo Shirt", requested=5, available=2)
        ),
    ):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.post("/api/v1/orders/checkout", json={})
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 409
    msg = r.json()["error"]["message"]
    assert "Navy Blue Polo Shirt" in msg
    assert "requested 5" in msg
    assert "available 2" in msg


@pytest.mark.asyncio
async def test_checkout_product_not_available_is_400():
    app.dependency_overrides[get_current_user] = _auth()
    with patch(
        "app.api.v1.orders.checkout",
        AsyncMock(side_effect=ValueError("Product 99 is no longer available")),
    ):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.post("/api/v1/orders/checkout", json={})
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 400


# ---------------------------------------------------------------------------
# GET /orders
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_orders_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/api/v1/orders")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_list_orders_empty():
    app.dependency_overrides[get_current_user] = _auth()
    with patch("app.api.v1.orders.list_orders", AsyncMock(return_value=([], 0))):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.get("/api/v1/orders")
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 200
    body = r.json()
    assert body["data"] == []
    assert body["meta"]["total"] == 0
    assert body["meta"]["total_pages"] == 1


@pytest.mark.asyncio
async def test_list_orders_returns_items_with_meta():
    orders = [_make_order(id=1), _make_order(id=2)]
    app.dependency_overrides[get_current_user] = _auth()
    with patch("app.api.v1.orders.list_orders", AsyncMock(return_value=(orders, 2))):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.get("/api/v1/orders")
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 200
    body = r.json()
    assert len(body["data"]) == 2
    assert body["meta"]["total"] == 2
    assert body["meta"]["total_pages"] == 1


@pytest.mark.asyncio
async def test_list_orders_pagination_params():
    orders = [_make_order()]

    async def mock_list(db, user_id, page, page_size):
        assert page == 2
        assert page_size == 5
        return orders, 11

    app.dependency_overrides[get_current_user] = _auth()
    with patch("app.api.v1.orders.list_orders", mock_list):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.get("/api/v1/orders?page=2&page_size=5")
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 200
    meta = r.json()["meta"]
    assert meta["page"] == 2
    assert meta["page_size"] == 5
    assert meta["total"] == 11
    assert meta["total_pages"] == 3  # ceil(11/5)


# ---------------------------------------------------------------------------
# GET /orders/{id}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_order_detail():
    order = _make_order()
    app.dependency_overrides[get_current_user] = _auth()
    with patch("app.api.v1.orders.get_order", AsyncMock(return_value=order)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.get("/api/v1/orders/1")
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 200
    body = r.json()["data"]
    assert body["id"] == 1
    assert body["total"] == 11998
    assert body["items"][0]["subtotal"] == 11998


@pytest.mark.asyncio
async def test_get_order_detail_not_found():
    app.dependency_overrides[get_current_user] = _auth()
    with patch("app.api.v1.orders.get_order", AsyncMock(return_value=None)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.get("/api/v1/orders/999")
    app.dependency_overrides.pop(get_current_user, None)

    assert r.status_code == 404
    assert r.json()["error"]["code"] == "HTTP_404"


@pytest.mark.asyncio
async def test_get_order_detail_wrong_user_is_404():
    """get_order called with user_id scoping — returns None for another user's order."""
    app.dependency_overrides[get_current_user] = _auth(user_id=2)
    with patch("app.api.v1.orders.get_order", AsyncMock(return_value=None)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.get("/api/v1/orders/1")
    app.dependency_overrides.pop(get_current_user, None)

    # Returns 404, not 403 — don't reveal existence to other users
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# Unit: InsufficientStockError message
# ---------------------------------------------------------------------------


def test_insufficient_stock_error_message():
    exc = InsufficientStockError("Classic Shirt", requested=10, available=3)
    assert "Classic Shirt" in str(exc)
    assert "requested 10" in str(exc)
    assert "available 3" in str(exc)
