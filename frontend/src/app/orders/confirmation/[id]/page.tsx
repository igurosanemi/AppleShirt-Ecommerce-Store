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
      <div className="min-h-[100dvh] bg-[var(--color-bg)] pt-24 pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[14px] text-[var(--color-muted)] mb-4">Order not found.</p>
          <Link href="/orders" className="text-[13px] underline underline-offset-2 text-[var(--color-fg)]">
            View all orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] pt-24 pb-20">
      <div className="max-w-[600px] mx-auto px-6 md:px-10">

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
            className="inline-flex mb-7"
          >
            <CheckCircle
              size={52}
              weight="light"
              className="text-[var(--color-fg)]"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <p className="text-[11px] uppercase tracking-label font-medium text-[var(--color-muted)] mb-4">
              Order Confirmed
            </p>
            {/* Cormorant for the emotional headline */}
            <h1 className="font-display font-normal text-[2.5rem] md:text-[3rem] leading-[0.96] tracking-display text-[var(--color-fg)] mb-3">
              Thank you.
            </h1>
            <p className="text-[14px] text-[var(--color-muted)]">
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
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)] mb-5">
            <div className="px-5 py-4 flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)]">Order</span>
              <span className="text-[14px] font-medium tabular-nums text-[var(--color-fg)]">#{order.id}</span>
            </div>
            <div className="px-5 py-4 flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)]">Status</span>
              <StatusBadge status={order.status} />
            </div>
            <div className="px-5 py-4 flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)]">Date</span>
              <span className="text-[13px] text-[var(--color-fg)]">
                {new Date(order.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            </div>
            {order.payment && (
              <div className="px-5 py-4 flex justify-between items-center">
                <span className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)]">Transaction</span>
                <span className="text-[11px] font-mono text-[var(--color-muted)]">
                  {order.payment.transaction_id}
                </span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] mb-5">
            <div className="px-5 py-3 border-b border-[var(--color-border)]">
              <span className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)]">Items</span>
            </div>
            {order.items.map((item) => (
              <div
                key={item.id}
                className="px-5 py-4 flex justify-between items-start border-b border-[var(--color-border)] last:border-0"
              >
                <div>
                  <p className="text-[14px] text-[var(--color-fg)]">{item.name}</p>
                  <p className="text-[12px] text-[var(--color-muted)] mt-0.5 tabular-nums">
                    {formatPrice(item.unit_price)} × {item.quantity}
                  </p>
                </div>
                <span className="text-[14px] font-medium tabular-nums text-[var(--color-fg)]">
                  {formatPrice(item.subtotal)}
                </span>
              </div>
            ))}
            <div className="px-5 py-4 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
              <span className="text-[13px] font-medium text-[var(--color-fg)]">Total</span>
              <span className="text-[16px] font-medium tabular-nums text-[var(--color-fg)]">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/orders/${order.id}`}
              className="flex-1 h-11 border border-[var(--color-border)] flex items-center justify-center gap-2 text-[11px] uppercase tracking-label text-[var(--color-fg)] hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <Package size={14} />
              View Order Details
            </Link>
            <Link
              href="/shop"
              className="flex-1 h-11 bg-[var(--color-primary)] text-[var(--color-primary-fg)] flex items-center justify-center gap-2 text-[11px] uppercase tracking-label hover:opacity-80 transition-opacity group"
            >
              Continue Shopping
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
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
    <span className={`inline-flex px-2.5 py-1 text-[10px] uppercase tracking-label border ${cls}`}>
      {status}
    </span>
  )
}

function ConfirmationSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] pt-24 pb-20">
      <div className="max-w-[600px] mx-auto px-6 md:px-10">
        <div className="text-center mb-12">
          <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-900 animate-pulse mx-auto mb-7" />
          <div className="h-2.5 w-32 bg-zinc-100 dark:bg-zinc-900 animate-pulse mx-auto mb-4" />
          <div className="h-10 w-40 bg-zinc-100 dark:bg-zinc-900 animate-pulse mx-auto" />
        </div>
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-5 py-4 flex justify-between">
              <div className="h-2.5 w-16 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
              <div className="h-2.5 w-24 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
