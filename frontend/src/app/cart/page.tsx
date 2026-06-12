'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Minus, Plus, Trash, ArrowRight, ShoppingBag } from '@phosphor-icons/react'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/utils'

export default function CartPage() {
  const { isLoading: authLoading } = useRequireAuth()
  const { cart, isLoading, updateItem, removeItem } = useCart()
  const router = useRouter()
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)

  if (authLoading || isLoading) return <CartSkeleton />

  async function handleQtyChange(productId: number, newQty: number) {
    if (newQty < 1) return
    setUpdatingId(productId)
    try {
      await updateItem(productId, newQty)
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleRemove(productId: number) {
    setRemovingId(productId)
    try {
      await removeItem(productId)
    } finally {
      setRemovingId(null)
    }
  }

  const isEmpty = !cart || cart.items.length === 0

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">

        {/* Header */}
        <div className="mb-12">
          <p className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Your Selection</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Shopping Bag
            {!isEmpty && (
              <span className="ml-3 text-base font-normal text-zinc-400 dark:text-zinc-500 tabular-nums">
                {cart.item_count} {cart.item_count === 1 ? 'item' : 'items'}
              </span>
            )}
          </h1>
        </div>

        {isEmpty ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-start">
            {/* Items column */}
            <div>
              <div className="border-t border-zinc-200 dark:border-zinc-800">
                <AnimatePresence initial={false}>
                  {cart.items.map((item) => (
                    <motion.div
                      key={item.product_id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: removingId === item.product_id ? 0.4 : 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-b border-zinc-200 dark:border-zinc-800 py-6"
                    >
                      <div className="flex gap-5">
                        {/* Image */}
                        <Link href={`/shop/${item.product_id}`} className="shrink-0">
                          <div className="w-24 h-32 md:w-28 md:h-36 bg-zinc-100 dark:bg-zinc-900 overflow-hidden relative">
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                className="object-cover object-top"
                                sizes="112px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag size={24} className="text-zinc-300 dark:text-zinc-700" />
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div>
                            <Link
                              href={`/shop/${item.product_id}`}
                              className="text-sm font-medium text-zinc-950 dark:text-zinc-50 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors line-clamp-2"
                            >
                              {item.name}
                            </Link>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                              {formatPrice(item.price)} each
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            {/* Qty stepper */}
                            <div className="flex items-center border border-zinc-200 dark:border-zinc-800">
                              <button
                                onClick={() => handleQtyChange(item.product_id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || updatingId === item.product_id}
                                aria-label="Decrease quantity"
                                className="w-9 h-9 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-9 h-9 flex items-center justify-center text-sm font-medium tabular-nums text-zinc-950 dark:text-zinc-50 border-x border-zinc-200 dark:border-zinc-800">
                                {updatingId === item.product_id ? (
                                  <span className="w-3 h-3 border border-zinc-400 border-t-transparent animate-spin" />
                                ) : (
                                  item.quantity
                                )}
                              </span>
                              <button
                                onClick={() => handleQtyChange(item.product_id, item.quantity + 1)}
                                disabled={item.quantity >= 10 || updatingId === item.product_id}
                                aria-label="Increase quantity"
                                className="w-9 h-9 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            {/* Subtotal + remove */}
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                                {formatPrice(item.subtotal)}
                              </span>
                              <button
                                onClick={() => handleRemove(item.product_id)}
                                disabled={removingId === item.product_id}
                                aria-label={`Remove ${item.name}`}
                                className="text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-40 transition-colors"
                              >
                                <Trash size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="mt-6">
                <Link
                  href="/shop"
                  className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
                >
                  ← Continue shopping
                </Link>
              </div>
            </div>

            {/* Summary panel */}
            <div className="lg:sticky lg:top-28">
              <div className="border border-zinc-200 dark:border-zinc-800 p-6">
                <h2 className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-6">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  {cart.items.map((item) => (
                    <div key={item.product_id} className="flex justify-between text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400 truncate pr-4">
                        {item.name}
                        {item.quantity > 1 && (
                          <span className="text-zinc-400 dark:text-zinc-500"> ×{item.quantity}</span>
                        )}
                      </span>
                      <span className="shrink-0 tabular-nums text-zinc-700 dark:text-zinc-300">
                        {formatPrice(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mb-8">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Total</span>
                    <span className="text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                      {formatPrice(cart.total)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                    Shipping calculated at checkout
                  </p>
                </div>

                <button
                  onClick={() => router.push('/checkout')}
                  className="w-full h-12 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors group"
                >
                  Proceed to Checkout
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-0.5 transition-transform duration-150"
                  />
                </button>

                <p className="mt-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
                  Secure checkout. Mock payment for demo.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyCart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <ShoppingBag
        size={48}
        className="text-zinc-200 dark:text-zinc-800 mb-6"
        weight="thin"
      />
      <h2 className="text-xl font-medium text-zinc-950 dark:text-zinc-50 mb-2">
        Your bag is empty
      </h2>
      <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-8 max-w-xs">
        Discover our considered collection of menswear essentials.
      </p>
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 px-8 h-11 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
      >
        Browse the Collection
        <ArrowRight size={14} />
      </Link>
    </motion.div>
  )
}

function CartSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">
        <div className="mb-12">
          <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-900 animate-pulse mb-3" />
          <div className="h-9 w-48 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
          <div className="border-t border-zinc-200 dark:border-zinc-800">
            {[1, 2].map((i) => (
              <div key={i} className="border-b border-zinc-200 dark:border-zinc-800 py-6 flex gap-5">
                <div className="w-28 h-36 bg-zinc-100 dark:bg-zinc-900 animate-pulse shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 w-40 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                  <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
          <div className="border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            <div className="h-4 w-3/4 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            <div className="h-12 w-full bg-zinc-100 dark:bg-zinc-900 animate-pulse mt-8" />
          </div>
        </div>
      </div>
    </div>
  )
}
