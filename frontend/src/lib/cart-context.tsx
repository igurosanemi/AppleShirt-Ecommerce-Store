'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { cartApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import type { CartOut } from '@/types'

type CartContextValue = {
  cart: CartOut | null
  isLoading: boolean
  addItem: (productId: number, quantity: number) => Promise<void>
  updateItem: (productId: number, quantity: number) => Promise<void>
  removeItem: (productId: number) => Promise<void>
  clearCart: () => Promise<void>
  refresh: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token, isLoading: authLoading } = useAuth()
  const [cart, setCart] = useState<CartOut | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!token) {
      setCart(null)
      return
    }
    setIsLoading(true)
    try {
      const { data } = await cartApi.get(token)
      setCart(data)
    } catch {
      setCart(null)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!authLoading) {
      if (token) {
        refresh()
      } else {
        setCart(null)
      }
    }
  }, [authLoading, token, refresh])

  const addItem = useCallback(
    async (productId: number, quantity: number) => {
      if (!token) throw new Error('Not authenticated')
      const { data } = await cartApi.addItem(token, productId, quantity)
      setCart(data)
    },
    [token]
  )

  const updateItem = useCallback(
    async (productId: number, quantity: number) => {
      if (!token) throw new Error('Not authenticated')
      const { data } = await cartApi.updateItem(token, productId, quantity)
      setCart(data)
    },
    [token]
  )

  const removeItem = useCallback(
    async (productId: number) => {
      if (!token) throw new Error('Not authenticated')
      await cartApi.removeItem(token, productId)
      await refresh()
    },
    [token, refresh]
  )

  const clearCart = useCallback(async () => {
    if (!token) throw new Error('Not authenticated')
    await cartApi.clear(token)
    setCart(null)
  }, [token])

  return (
    <CartContext.Provider
      value={{ cart, isLoading, addItem, updateItem, removeItem, clearCart, refresh }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
