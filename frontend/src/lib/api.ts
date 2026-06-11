import type {
  CategoryOut,
  ProductOut,
  PaginationMeta,
  CartOut,
  OrderOut,
  TokenResponse,
  UserOut,
  PaymentInfo,
} from '@/types'

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// Standard response envelopes matching the backend convention
type SingleResponse<T> = { data: T }
type ListResponse<T> = { data: T[]; meta: PaginationMeta }

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...init } = options ?? {}

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include', // send httpOnly refresh cookie automatically
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  })

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new ApiError(
      body.error?.message ?? 'Request failed',
      res.status,
      body.error?.code
    )
  }

  return body as T
}

function qs(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return ''
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authApi = {
  register(email: string, password: string, fullName: string) {
    return request<SingleResponse<TokenResponse>>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    })
  },

  login(email: string, password: string) {
    return request<SingleResponse<TokenResponse>>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  refresh() {
    return request<SingleResponse<TokenResponse>>('/api/v1/auth/refresh', {
      method: 'POST',
    })
  },

  logout(token: string) {
    return request<void>('/api/v1/auth/logout', { method: 'POST', token })
  },

  me(token: string) {
    return request<SingleResponse<UserOut>>('/api/v1/auth/me', { token })
  },
}

// ---------------------------------------------------------------------------
// Catalog (public reads, no token required)
// ---------------------------------------------------------------------------

export type ProductListParams = {
  page?: number
  page_size?: number
  category_id?: number
  search?: string
  active_only?: boolean
}

export const catalogApi = {
  getCategories() {
    return request<ListResponse<CategoryOut>>('/api/v1/catalog/categories')
  },

  getProducts(params?: ProductListParams) {
    return request<ListResponse<ProductOut>>(
      `/api/v1/catalog/products${qs(params)}`
    )
  },

  getProduct(id: number) {
    return request<SingleResponse<ProductOut>>(`/api/v1/catalog/products/${id}`)
  },
}

// ---------------------------------------------------------------------------
// Cart (all endpoints require auth token)
// ---------------------------------------------------------------------------

export const cartApi = {
  get(token: string) {
    return request<SingleResponse<CartOut>>('/api/v1/cart', { token })
  },

  addItem(token: string, productId: number, quantity: number) {
    return request<SingleResponse<CartOut>>('/api/v1/cart/items', {
      method: 'POST',
      token,
      body: JSON.stringify({ product_id: productId, quantity }),
    })
  },

  updateItem(token: string, productId: number, quantity: number) {
    return request<SingleResponse<CartOut>>(`/api/v1/cart/items/${productId}`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ quantity }),
    })
  },

  removeItem(token: string, productId: number) {
    return request<void>(`/api/v1/cart/items/${productId}`, {
      method: 'DELETE',
      token,
    })
  },

  clear(token: string) {
    return request<void>('/api/v1/cart', { method: 'DELETE', token })
  },
}

// ---------------------------------------------------------------------------
// Orders (all endpoints require auth token)
// ---------------------------------------------------------------------------

export type OrderListParams = {
  page?: number
  page_size?: number
}

export const ordersApi = {
  checkout(token: string, paymentMethod = 'mock_card') {
    return request<SingleResponse<OrderOut & { payment: PaymentInfo }>>(
      '/api/v1/orders/checkout',
      {
        method: 'POST',
        token,
        body: JSON.stringify({ payment_method: paymentMethod }),
      }
    )
  },

  list(token: string, params?: OrderListParams) {
    return request<ListResponse<OrderOut>>(`/api/v1/orders${qs(params)}`, {
      token,
    })
  },

  get(token: string, id: number) {
    return request<SingleResponse<OrderOut>>(`/api/v1/orders/${id}`, { token })
  },
}
