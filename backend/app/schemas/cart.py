from pydantic import BaseModel, Field, computed_field


class CartItemIn(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=1, le=100)


class CartItemQuantityUpdate(BaseModel):
    quantity: int = Field(..., ge=1, le=100)


class CartItemOut(BaseModel):
    product_id: int
    name: str
    price: int  # cents
    quantity: int

    @computed_field  # type: ignore[prop-decorator]
    @property
    def subtotal(self) -> int:
        return self.price * self.quantity

    image_url: str | None


class CartOut(BaseModel):
    items: list[CartItemOut]
    total: int  # cents
    item_count: int
