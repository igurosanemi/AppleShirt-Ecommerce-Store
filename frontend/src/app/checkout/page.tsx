'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { LockSimple, ShoppingBag, ArrowLeft, CreditCard } from '@phosphor-icons/react'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { useCart } from '@/lib/cart-context'
import { ordersApi, ApiError } from '@/lib/api'
import { formatPrice } from '@/lib/utils'

export default function CheckoutPage() {
  const { token, isLoading: authLoading } = useRequireAuth()
  const { cart, isLoading: cartLoading, clearCart } = useCart()
  const router = useRouter()

  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (authLoading || cartLoading) return <CheckoutSkeleton />

  const isEmpty = !cart || cart.items.length === 0

  if (isEmpty) {
    return (
      <div className="min-h-[100dvh] bg-[var(--color-bg)] pt-24 pb-20 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={40} className="text-[var(--color-border-strong)] mx-auto mb-4" weight="thin" />
          <p className="text-[14px] text-[var(--color-muted)] mb-6">Your bag is empty.</p>
          <Link href="/shop" className="text-[13px] underline underline-offset-2 text-[var(--color-fg)]">
            Return to shop
          </Link>
        </div>
      </div>
    )
  }

  async function handlePlaceOrder() {
    if (!token) return
    setPlacing(true)
    setError(null)
    try {
      const { data: order } = await ordersApi.checkout(token)
      clearCart().catch(() => {})
      router.push(`/orders/confirmation/${order.id}`)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError('Some items in your bag are out of stock. Please review your cart and try again.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Something went wrong. Please try again.')
      }
      setPlacing(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] pt-24 pb-20">
      <div className="max-w-[1080px] mx-auto px-6 md:px-12 lg:px-20">

        {/* Header */}
        <div className="mb-10">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-label text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors mb-6"
          >
            <ArrowLeft size={11} />
            Back to bag
          </Link>
          <h1 className="text-[1.625rem] md:text-[2rem] font-medium tracking-[-0.02em] text-[var(--color-fg)]">
            Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-start">

          {/* Left: Payment form */}
          <div className="space-y-8">

            {/* Delivery */}
            <section>
              <h2 className="text-[11px] uppercase tracking-label font-medium text-[var(--color-muted)] mb-5">
                Delivery
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'First Name', value: 'Demo' },
                  { label: 'Last Name', value: 'Customer' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <label className="block text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)] mb-2">
                      {label}
                    </label>
                    <input
                      type="text"
                      defaultValue={value}
                      readOnly
                      className="w-full h-11 px-4 bg-zinc-100 dark:bg-zinc-900 border border-[var(--color-border)] text-[14px] text-[var(--color-muted)] cursor-not-allowed focus:outline-none"
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)] mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    defaultValue="1 Demo Street, London, EC1A 1AA"
                    readOnly
                    className="w-full h-11 px-4 bg-zinc-100 dark:bg-zinc-900 border border-[var(--color-border)] text-[14px] text-[var(--color-muted)] cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>
              <p className="mt-3 text-[12px] text-[var(--color-subtle)]">
                Shipping details are pre-filled for this demo.
              </p>
            </section>

            {/* Payment */}
            <section>
              <h2 className="text-[11px] uppercase tracking-label font-medium text-[var(--color-muted)] mb-5 flex items-center gap-2">
                <CreditCard size={13} />
                Payment
              </h2>

              <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)] mb-2">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      defaultValue="4242 4242 4242 4242"
                      readOnly
                      className="w-full h-11 px-4 pr-16 bg-[var(--color-bg)] border border-[var(--color-border)] text-[14px] text-[var(--color-fg)] font-mono tracking-widest focus:outline-none cursor-default"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-[var(--color-subtle)] tracking-label uppercase">
                      VISA
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Expiry', value: '12 / 28' },
                    { label: 'CVV', value: '•••' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <label className="block text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)] mb-2">
                        {label}
                      </label>
                      <input
                        type="text"
                        defaultValue={value}
                        readOnly
                        className="w-full h-11 px-4 bg-[var(--color-bg)] border border-[var(--color-border)] text-[14px] text-[var(--color-fg)] font-mono tracking-widest focus:outline-none cursor-default"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[12px] text-[var(--color-subtle)] flex items-center gap-1.5">
                  <LockSimple size={11} />
                  Mock payment — no real card will be charged.
                </p>
              </div>
            </section>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-[14px] text-red-600 dark:text-red-400"
              >
                {error}
              </motion.div>
            )}
          </div>

          {/* Right: Order summary */}
          <div className="lg:sticky lg:top-28">
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h2 className="text-[11px] uppercase tracking-label font-medium text-[var(--color-muted)] mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item.product_id} className="flex gap-3">
                    <div className="w-14 relative bg-zinc-100 dark:bg-zinc-900 shrink-0 overflow-hidden" style={{ height: '72px' }}>
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover object-top"
                          sizes="56px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={14} className="text-[var(--color-subtle)]" />
                        </div>
                      )}
                      {item.quantity > 1 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--color-primary)] text-[var(--color-primary-fg)] text-[9px] font-semibold flex items-center justify-center tabular-nums">
                          {item.quantity}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[var(--color-fg)] truncate">{item.name}</p>
                      <p className="text-[13px] font-medium tabular-nums text-[var(--color-fg)] mt-0.5">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--color-border)] pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[var(--color-muted)]">Subtotal</span>
                  <span className="tabular-nums text-[var(--color-fg)]">{formatPrice(cart.total)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[var(--color-muted)]">Shipping</span>
                  <span className="text-[var(--color-muted)]">Free</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[var(--color-border)]">
                  <span className="text-[14px] font-medium text-[var(--color-fg)]">Total</span>
                  <span className="text-[18px] font-medium tabular-nums text-[var(--color-fg)]">
                    {formatPrice(cart.total)}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="w-full h-11 bg-[var(--color-primary)] text-[var(--color-primary-fg)] text-[11px] font-medium uppercase tracking-label flex items-center justify-center gap-2 hover:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
              >
                {placing ? (
                  <>
                    <span className="w-3.5 h-3.5 border border-current border-t-transparent animate-spin" />
                    Placing order...
                  </>
                ) : (
                  <>
                    <LockSimple size={13} />
                    Place Order — {formatPrice(cart.total)}
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function CheckoutSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] pt-24 pb-20">
      <div className="max-w-[1080px] mx-auto px-6 md:px-12 lg:px-20">
        <div className="mb-10 space-y-3">
          <div className="h-2.5 w-20 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          <div className="h-8 w-32 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-11 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />)}
          </div>
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
            <div className="h-2.5 w-24 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            <div className="h-11 bg-zinc-100 dark:bg-zinc-900 animate-pulse mt-8" />
          </div>
        </div>
      </div>
    </div>
  )
}
