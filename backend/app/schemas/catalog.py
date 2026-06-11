from pydantic import BaseModel, Field, field_validator


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str | None = Field(None, max_length=100)
    description: str | None = None


class CategoryUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    slug: str | None = Field(None, max_length=100)
    description: str | None = None


class ProductOut(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    price: int  # integer cents
    stock: int
    category_id: int
    category: CategoryOut | None
    image_url: str | None
    is_active: bool

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str | None = Field(None, max_length=255)
    description: str | None = None
    price: int = Field(..., ge=0, description="Price in minor units (cents)")
    stock: int = Field(0, ge=0)
    category_id: int
    image_url: str | None = Field(None, max_length=500)
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    slug: str | None = Field(None, max_length=255)
    description: str | None = None
    price: int | None = Field(None, ge=0)
    stock: int | None = Field(None, ge=0)
    category_id: int | None = None
    image_url: str | None = Field(None, max_length=500)
    is_active: bool | None = None


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int
