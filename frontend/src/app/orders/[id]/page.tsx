'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'motion/react'
import { ArrowLeft, Package, CreditCard, Receipt } from '@phosphor-icons/react'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { ordersApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import type { OrderOut } from '@/types'

export default function OrderDetailPage() {
  const { token, isLoading: authLoading } = useRequireAuth()
  const params = useParams()
  const orderId = Number(params.id)

  const [order, setOrder] = useState<OrderOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !token || !orderId) return
    ordersApi
      .get(token, orderId)
      .then(({ data }) => setOrder(data))
      .catch((err) => {
        setError(err?.status === 404 ? 'Order not found.' : 'Failed to load order.')
      })
      .finally(() => setLoading(false))
  }, [token, authLoading, orderId])

  if (authLoading || loading) return <DetailSkeleton />

  if (error || !order) {
    return (
      <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{error ?? 'Order not found.'}</p>
          <Link href="/orders" className="text-sm underline underline-offset-2 text-zinc-950 dark:text-zinc-50">
            ← Back to orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20">
      <div className="max-w-[760px] mx-auto px-6 md:px-10 lg:px-16">

        {/* Back nav */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors mb-8"
        >
          <ArrowLeft size={12} />
          All Orders
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-10 gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">Order</p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                #{order.id}
              </h1>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                {new Date(order.created_at).toLocaleDateString('en-GB', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
            <StatusBadge status={order.status} large />
          </div>

          {/* Items */}
          <Section icon={<Package size={14} />} title="Items">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-950 dark:text-zinc-50">{item.name}</p>
                    {item.product_id ? (
                      <Link
                        href={`/shop/${item.product_id}`}
                        className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mt-0.5 inline-block"
                      >
                        View product →
                      </Link>
                    ) : (
                      <span className="text-xs text-zinc-300 dark:text-zinc-600 mt-0.5 block">
                        Product no longer available
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium tabular-nums text-zinc-950 dark:text-zinc-50">
                      {formatPrice(item.subtotal)}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 tabular-nums">
                      {formatPrice(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-2 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Subtotal</span>
                <span className="tabular-nums text-zinc-700 dark:text-zinc-300">{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Shipping</span>
                <span className="text-zinc-500 dark:text-zinc-400">Free</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Total</span>
                <span className="text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </Section>

          {/* Payment info */}
          {order.payment && (
            <Section icon={<CreditCard size={14} />} title="Payment">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InfoCell label="Method" value={order.payment.method.replace('_', ' ')} />
                <InfoCell label="Status" value={order.payment.status} highlight />
                <InfoCell label="Transaction ID" value={order.payment.transaction_id} mono />
              </div>
            </Section>
          )}

          {/* Order summary */}
          <Section icon={<Receipt size={14} />} title="Summary">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <InfoCell label="Order ID" value={`#${order.id}`} mono />
              <InfoCell label="Items" value={String(order.items.reduce((s, i) => s + i.quantity, 0))} />
              <InfoCell label="Status" value={order.status} highlight />
              <InfoCell
                label="Date"
                value={new Date(order.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              />
            </div>
          </Section>

          {/* Footer CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              href="/orders"
              className="flex-1 h-11 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              ← Order History
            </Link>
            <Link
              href="/shop"
              className="flex-1 h-11 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 flex items-center justify-center gap-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors group"
            >
              Continue Shopping
              <ArrowLeft size={14} className="rotate-180 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 p-5 md:p-6 mb-4">
      <h2 className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-2 mb-5">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  )
}

function InfoCell({
  label,
  value,
  mono,
  highlight,
}: {
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">{label}</p>
      <p
        className={[
          'text-sm',
          mono ? 'font-mono text-zinc-600 dark:text-zinc-400 break-all' : '',
          highlight ? 'font-medium capitalize text-zinc-950 dark:text-zinc-50' : 'text-zinc-700 dark:text-zinc-300',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  )
}

function StatusBadge({ status, large }: { status: string; large?: boolean }) {
  const map: Record<string, string> = {
    confirmed: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    pending: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    cancelled: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  }
  const cls = map[status.toLowerCase()] ?? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
  return (
    <span
      className={`inline-flex border uppercase tracking-wider ${cls} ${large ? 'px-3 py-1.5 text-xs' : 'px-2 py-0.5 text-[10px]'}`}
    >
      {status}
    </span>
  )
}

function DetailSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20">
      <div className="max-w-[760px] mx-auto px-6 md:px-10 lg:px-16">
        <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-900 animate-pulse mb-8" />
        <div className="mb-10 space-y-2">
          <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          <div className="h-8 w-24 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>
        <div className="border border-zinc-200 dark:border-zinc-800 p-6 mb-4">
          <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-900 animate-pulse mb-5" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-4 border-b border-zinc-100 dark:border-zinc-900 flex justify-between">
              <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
              <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
