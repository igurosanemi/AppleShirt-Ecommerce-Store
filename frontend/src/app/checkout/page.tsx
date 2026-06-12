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
      <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={40} className="text-zinc-300 dark:text-zinc-700 mx-auto mb-4" weight="thin" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Your bag is empty.</p>
          <Link href="/shop" className="text-sm underline underline-offset-2 text-zinc-950 dark:text-zinc-50">
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
      await clearCart()
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
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20">
      <div className="max-w-[1080px] mx-auto px-6 md:px-10 lg:px-16">

        {/* Header */}
        <div className="mb-10">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors mb-6"
          >
            <ArrowLeft size={12} />
            Back to bag
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 items-start">

          {/* Left: Payment form */}
          <div className="space-y-8">

            {/* Shipping info block (static for mock) */}
            <section>
              <h2 className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-5">
                Delivery
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Demo"
                    readOnly
                    className="w-full h-11 px-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-400 dark:text-zinc-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Customer"
                    readOnly
                    className="w-full h-11 px-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-400 dark:text-zinc-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Address
                  </label>
                  <input
                    type="text"
                    defaultValue="1 Demo Street, London, EC1A 1AA"
                    readOnly
                    className="w-full h-11 px-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-400 dark:text-zinc-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                Shipping details are pre-filled for this demo.
              </p>
            </section>

            {/* Mock payment form */}
            <section>
              <h2 className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-5 flex items-center gap-2">
                <CreditCard size={14} />
                Payment
              </h2>

              <div className="border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      defaultValue="4242 4242 4242 4242"
                      readOnly
                      className="w-full h-11 px-4 pr-16 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-950 dark:text-zinc-50 font-mono tracking-widest focus:outline-none cursor-default"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400 dark:text-zinc-500 font-sans tracking-normal">
                      VISA
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                      Expiry
                    </label>
                    <input
                      type="text"
                      defaultValue="12 / 28"
                      readOnly
                      className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-950 dark:text-zinc-50 font-mono tracking-widest focus:outline-none cursor-default"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                      CVV
                    </label>
                    <input
                      type="text"
                      defaultValue="•••"
                      readOnly
                      className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-950 dark:text-zinc-50 font-mono tracking-widest focus:outline-none cursor-default"
                    />
                  </div>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <LockSimple size={11} />
                  Mock payment — no real card will be charged.
                </p>
              </div>
            </section>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-600 dark:text-red-400"
              >
                {error}
              </motion.div>
            )}
          </div>

          {/* Right: Order summary */}
          <div className="lg:sticky lg:top-28">
            <div className="border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item.product_id} className="flex gap-3">
                    <div className="w-14 h-18 relative bg-zinc-100 dark:bg-zinc-900 shrink-0 overflow-hidden" style={{ height: '72px' }}>
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
                          <ShoppingBag size={16} className="text-zinc-300 dark:text-zinc-700" />
                        </div>
                      )}
                      {item.quantity > 1 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 text-[9px] font-semibold flex items-center justify-center tabular-nums">
                          {item.quantity}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{item.name}</p>
                      <p className="text-sm font-medium tabular-nums text-zinc-950 dark:text-zinc-50 mt-0.5">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Subtotal</span>
                  <span className="tabular-nums text-zinc-700 dark:text-zinc-300">{formatPrice(cart.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Shipping</span>
                  <span className="text-zinc-500 dark:text-zinc-400">Free</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Total</span>
                  <span className="text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                    {formatPrice(cart.total)}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="w-full h-12 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {placing ? (
                  <>
                    <span className="w-4 h-4 border border-zinc-50 dark:border-zinc-950 border-t-transparent animate-spin" />
                    Placing order...
                  </>
                ) : (
                  <>
                    <LockSimple size={14} />
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
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20">
      <div className="max-w-[1080px] mx-auto px-6 md:px-10 lg:px-16">
        <div className="mb-10 space-y-3">
          <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          <div className="h-8 w-32 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-11 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />)}
          </div>
          <div className="border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            <div className="h-12 bg-zinc-100 dark:bg-zinc-900 animate-pulse mt-8" />
          </div>
        </div>
      </div>
    </div>
  )
}
