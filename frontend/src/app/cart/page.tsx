'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Minus, Plus, Trash, ArrowRight, ShoppingBag } from '@phosphor-icons/react'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { useCart } from '@/lib/cart-context'
import { catalogApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import type { ProductOut } from '@/types'

export default function CartPage() {
  const { isLoading: authLoading } = useRequireAuth()
  const { cart, isLoading, updateItem, removeItem } = useCart()
  const router = useRouter()
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [crossSell, setCrossSell] = useState<ProductOut[]>([])

  const isEmpty = !cart || cart.items.length === 0

  useEffect(() => {
    if (isEmpty && !isLoading) {
      catalogApi
        .getProducts({ page_size: 4, active_only: true })
        .then(({ data }) => setCrossSell(data))
        .catch(() => {})
    }
  }, [isEmpty, isLoading])

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

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] pt-24 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-20">

        {/* Header */}
        <div className="mb-12">
          <p className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)] mb-3">
            Your Selection
          </p>
          <h1 className="text-[1.625rem] md:text-[2rem] font-medium tracking-[-0.02em] text-[var(--color-fg)]">
            Shopping Bag
            {!isEmpty && (
              <span className="ml-3 text-[1rem] font-normal text-[var(--color-muted)] tabular-nums">
                {cart.item_count} {cart.item_count === 1 ? 'item' : 'items'}
              </span>
            )}
          </h1>
        </div>

        {isEmpty ? (
          <EmptyCart crossSell={crossSell} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12 items-start">
            {/* Items column */}
            <div>
              <div className="border-t border-[var(--color-border)]">
                <AnimatePresence initial={false}>
                  {cart.items.map((item) => (
                    <motion.div
                      key={item.product_id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: removingId === item.product_id ? 0.4 : 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-b border-[var(--color-border)] py-6"
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
                                <ShoppingBag size={22} className="text-[var(--color-subtle)]" />
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div>
                            <Link
                              href={`/shop/${item.product_id}`}
                              className="text-[15px] font-medium text-[var(--color-fg)] hover:text-[var(--color-muted)] transition-colors line-clamp-2"
                            >
                              {item.name}
                            </Link>
                            <p className="mt-1 text-[13px] text-[var(--color-muted)]">
                              {formatPrice(item.price)} each
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            {/* Qty stepper */}
                            <div className="flex items-center border border-[var(--color-border)]">
                              <button
                                onClick={() => handleQtyChange(item.product_id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || updatingId === item.product_id}
                                aria-label="Decrease quantity"
                                className="w-9 h-9 flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-fg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="w-9 h-9 flex items-center justify-center text-[14px] font-medium tabular-nums text-[var(--color-fg)] border-x border-[var(--color-border)]">
                                {updatingId === item.product_id ? (
                                  <span className="w-3 h-3 border border-current border-t-transparent animate-spin" />
                                ) : (
                                  item.quantity
                                )}
                              </span>
                              <button
                                onClick={() => handleQtyChange(item.product_id, item.quantity + 1)}
                                disabled={item.quantity >= 10 || updatingId === item.product_id}
                                aria-label="Increase quantity"
                                className="w-9 h-9 flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-fg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <Plus size={13} />
                              </button>
                            </div>

                            {/* Subtotal + remove */}
                            <div className="flex items-center gap-4">
                              <span className="text-[15px] font-medium tabular-nums text-[var(--color-fg)]">
                                {formatPrice(item.subtotal)}
                              </span>
                              <button
                                onClick={() => handleRemove(item.product_id)}
                                disabled={removingId === item.product_id}
                                aria-label={`Remove ${item.name}`}
                                className="text-[var(--color-subtle)] hover:text-red-500 dark:hover:text-red-400 disabled:opacity-40 transition-colors"
                              >
                                <Trash size={15} />
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
                  className="text-[11px] uppercase tracking-label text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
                >
                  ← Continue shopping
                </Link>
              </div>
            </div>

            {/* Summary panel */}
            <div className="lg:sticky lg:top-28">
              <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <h2 className="text-[11px] uppercase tracking-label font-medium text-[var(--color-muted)] mb-6">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  {cart.items.map((item) => (
                    <div key={item.product_id} className="flex justify-between text-[14px]">
                      <span className="text-[var(--color-muted)] truncate pr-4">
                        {item.name}
                        {item.quantity > 1 && (
                          <span className="text-[var(--color-subtle)]"> ×{item.quantity}</span>
                        )}
                      </span>
                      <span className="shrink-0 tabular-nums text-[var(--color-fg)]">
                        {formatPrice(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[var(--color-border)] pt-4 mb-7">
                  <div className="flex justify-between">
                    <span className="text-[14px] font-medium text-[var(--color-fg)]">Total</span>
                    <span className="text-[18px] font-medium tabular-nums text-[var(--color-fg)]">
                      {formatPrice(cart.total)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] text-[var(--color-subtle)]">
                    Shipping calculated at checkout
                  </p>
                </div>

                <button
                  onClick={() => router.push('/checkout')}
                  className="w-full h-11 bg-[var(--color-primary)] text-[var(--color-primary-fg)] text-[11px] font-medium uppercase tracking-label flex items-center justify-center gap-2 hover:opacity-80 transition-opacity group"
                >
                  Proceed to Checkout
                  <ArrowRight
                    size={13}
                    className="group-hover:translate-x-0.5 transition-transform duration-150"
                  />
                </button>

                <p className="mt-4 text-center text-[12px] text-[var(--color-subtle)]">
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

function EmptyCart({ crossSell }: { crossSell: ProductOut[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Empty message */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShoppingBag
          size={44}
          className="text-[var(--color-border-strong)] mb-6"
          weight="thin"
        />
        <h2 className="text-[1.25rem] font-medium text-[var(--color-fg)] mb-2">
          Your bag is empty
        </h2>
        <p className="text-[14px] text-[var(--color-muted)] mb-8 max-w-xs">
          Discover our considered collection of menswear essentials.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 h-11 px-8 bg-[var(--color-primary)] text-[var(--color-primary-fg)] text-[11px] font-medium uppercase tracking-label hover:opacity-80 transition-opacity"
        >
          Browse the Collection
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Cross-sell */}
      {crossSell.length > 0 && (
        <div className="mt-4 pt-12 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-8">
            <p className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)]">
              You might like
            </p>
            <Link
              href="/shop"
              className="text-[11px] uppercase tracking-label text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors flex items-center gap-1"
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
            {crossSell.map((product) => (
              <Link key={product.id} href={`/shop/${product.id}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100 dark:bg-zinc-900 mb-3">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800" />
                  )}
                </div>
                <p className="text-[11px] uppercase tracking-label text-[var(--color-subtle)] mb-1">
                  {product.category?.name ?? ''}
                </p>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[14px] font-medium text-[var(--color-fg)] group-hover:text-[var(--color-muted)] transition-colors truncate">
                    {product.name}
                  </p>
                  <p className="text-[13px] text-[var(--color-muted)] tabular-nums shrink-0">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function CartSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] pt-24 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-20">
        <div className="mb-12">
          <div className="h-2.5 w-20 bg-zinc-100 dark:bg-zinc-900 animate-pulse mb-4" />
          <div className="h-8 w-48 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12">
          <div className="border-t border-[var(--color-border)]">
            {[1, 2].map((i) => (
              <div key={i} className="border-b border-[var(--color-border)] py-6 flex gap-5">
                <div className="w-28 h-36 bg-zinc-100 dark:bg-zinc-900 animate-pulse shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 w-40 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                  <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
            <div className="h-2.5 w-24 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            <div className="h-11 w-full bg-zinc-100 dark:bg-zinc-900 animate-pulse mt-8" />
          </div>
        </div>
      </div>
    </div>
  )
}
