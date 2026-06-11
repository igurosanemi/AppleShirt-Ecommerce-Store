from datetime import datetime

from pydantic import BaseModel, computed_field

from app.schemas.catalog import PaginationMeta  # re-exported for convenience  # noqa: F401


class CheckoutRequest(BaseModel):
    payment_method: str = "mock_card"


class OrderItemOut(BaseModel):
    id: int
    product_id: int | None
    name: str
    unit_price: int  # cents, snapshotted at purchase
    quantity: int

    @computed_field  # type: ignore[prop-decorator]
    @property
    def subtotal(self) -> int:
        return self.unit_price * self.quantity

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: int
    status: str
    total: int  # cents
    items: list[OrderItemOut]
    created_at: datetime

    model_config = {"from_attributes": True}
