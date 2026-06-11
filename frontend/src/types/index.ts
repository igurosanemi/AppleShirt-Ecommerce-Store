// Pagination
export interface PaginationMeta {
  page: number
  page_size: number
  total: number
  total_pages: number
}

// Auth
export interface UserOut {
  id: number
  email: string
  full_name: string
  is_admin: boolean
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: UserOut
}

// Catalog
export interface CategoryOut {
  id: number
  name: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface ProductOut {
  id: number
  name: string
  slug: string
  description: string | null
  price: number       // integer cents — never float
  stock: number
  category_id: number
  category: CategoryOut | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// Cart
export interface CartItemOut {
  product_id: number
  name: string
  price: number       // cents
  quantity: number
  subtotal: number    // cents
  image_url: string | null
}

export interface CartOut {
  items: CartItemOut[]
  total: number       // cents
  item_count: number
}

// Orders
export interface OrderItemOut {
  id: number
  product_id: number | null
  name: string
  unit_price: number  // cents at purchase time
  quantity: number
  subtotal: number    // cents
}

export interface PaymentInfo {
  method: string
  status: string
  transaction_id: string
}

export interface OrderOut {
  id: number
  status: string
  total: number       // cents
  items: OrderItemOut[]
  created_at: string
  payment?: PaymentInfo
}
