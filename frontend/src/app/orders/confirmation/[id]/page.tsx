'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'motion/react'
import { CheckCircle, ArrowRight, Package } from '@phosphor-icons/react'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { ordersApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import type { OrderOut } from '@/types'

export default function OrderConfirmationPage() {
  const { token, isLoading: authLoading } = useRequireAuth()
  const params = useParams()
  const orderId = Number(params.id)

  const [order, setOrder] = useState<OrderOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (authLoading || !token || !orderId) return
    ordersApi
      .get(token, orderId)
      .then(({ data }) => setOrder(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [token, authLoading, orderId])

  if (authLoading || loading) return <ConfirmationSkeleton />

  if (error || !order) {
    return (
      <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Order not found.</p>
          <Link href="/orders" className="text-sm underline underline-offset-2 text-zinc-950 dark:text-zinc-50">
            View all orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20">
      <div className="max-w-[640px] mx-auto px-6 md:px-10">

        {/* Success header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="inline-flex mb-6"
          >
            <CheckCircle
              size={56}
              weight="light"
              className="text-zinc-950 dark:text-zinc-50"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <p className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
              Order Confirmed
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 mb-2">
              Thank you.
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              We&apos;ve received your order and will have it ready shortly.
            </p>
          </motion.div>
        </motion.div>

        {/* Order meta */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <div className="border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 mb-6">
            <div className="px-5 py-4 flex justify-between items-center">
              <span className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Order</span>
              <span className="text-sm font-medium tabular-nums text-zinc-950 dark:text-zinc-50">#{order.id}</span>
            </div>
            <div className="px-5 py-4 flex justify-between items-center">
              <span className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Status</span>
              <StatusBadge status={order.status} />
            </div>
            <div className="px-5 py-4 flex justify-between items-center">
              <span className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Date</span>
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {new Date(order.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            </div>
            {order.payment && (
              <div className="px-5 py-4 flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Transaction</span>
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  {order.payment.transaction_id}
                </span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border border-zinc-200 dark:border-zinc-800 mb-6">
            <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Items</span>
            </div>
            {order.items.map((item) => (
              <div
                key={item.id}
                className="px-5 py-4 flex justify-between items-start border-b border-zinc-100 dark:border-zinc-900 last:border-0"
              >
                <div>
                  <p className="text-sm text-zinc-950 dark:text-zinc-50">{item.name}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {formatPrice(item.unit_price)} × {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                  {formatPrice(item.subtotal)}
                </span>
              </div>
            ))}
            <div className="px-5 py-4 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
              <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Total</span>
              <span className="text-base font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/orders/${order.id}`}
              className="flex-1 h-11 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <Package size={16} />
              View Order Details
            </Link>
            <Link
              href="/shop"
              className="flex-1 h-11 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 flex items-center justify-center gap-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors group"
            >
              Continue Shopping
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    pending: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    cancelled: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  }
  const cls = map[status.toLowerCase()] ?? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
  return (
    <span className={`inline-flex px-2.5 py-1 text-xs uppercase tracking-wider border ${cls}`}>
      {status}
    </span>
  )
}

function ConfirmationSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20">
      <div className="max-w-[640px] mx-auto px-6 md:px-10">
        <div className="text-center mb-12">
          <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-900 animate-pulse mx-auto mb-6" />
          <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-900 animate-pulse mx-auto mb-3" />
          <div className="h-8 w-40 bg-zinc-100 dark:bg-zinc-900 animate-pulse mx-auto" />
        </div>
        <div className="border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-5 py-4 flex justify-between">
              <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
              <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
