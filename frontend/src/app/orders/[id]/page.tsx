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
      <div className="min-h-[100dvh] bg-[var(--color-bg)] pt-24 pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[14px] text-[var(--color-muted)] mb-4">{error ?? 'Order not found.'}</p>
          <Link href="/orders" className="text-[13px] underline underline-offset-2 text-[var(--color-fg)]">
            ← Back to orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] pt-24 pb-20">
      <div className="max-w-[760px] mx-auto px-6 md:px-12 lg:px-16">

        {/* Back nav */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-label text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors mb-8"
        >
          <ArrowLeft size={11} />
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
              <p className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)] mb-2">
                Order
              </p>
              <h1 className="text-[1.625rem] md:text-[2rem] font-medium tracking-[-0.02em] text-[var(--color-fg)]">
                #{order.id}
              </h1>
              <p className="text-[13px] text-[var(--color-muted)] mt-1">
                {new Date(order.created_at).toLocaleDateString('en-GB', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
            <StatusBadge status={order.status} large />
          </div>

          {/* Items */}
          <Section icon={<Package size={13} />} title="Items">
            <div className="divide-y divide-[var(--color-border)]">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-[var(--color-fg)]">{item.name}</p>
                    {item.product_id ? (
                      <Link
                        href={`/shop/${item.product_id}`}
                        className="text-[12px] text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors mt-0.5 inline-block"
                      >
                        View product →
                      </Link>
                    ) : (
                      <span className="text-[12px] text-[var(--color-subtle)] mt-0.5 block">
                        Product no longer available
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-medium tabular-nums text-[var(--color-fg)]">
                      {formatPrice(item.subtotal)}
                    </p>
                    <p className="text-[12px] text-[var(--color-muted)] mt-0.5 tabular-nums">
                      {formatPrice(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-[var(--color-border)] pt-4 mt-2 space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-[var(--color-muted)]">Subtotal</span>
                <span className="tabular-nums text-[var(--color-fg)]">{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[var(--color-muted)]">Shipping</span>
                <span className="text-[var(--color-muted)]">Free</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[var(--color-border)]">
                <span className="text-[14px] font-medium text-[var(--color-fg)]">Total</span>
                <span className="text-[18px] font-medium tabular-nums text-[var(--color-fg)]">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </Section>

          {/* Payment info */}
          {order.payment && (
            <Section icon={<CreditCard size={13} />} title="Payment">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InfoCell label="Method" value={order.payment.method.replace('_', ' ')} />
                <InfoCell label="Status" value={order.payment.status} highlight />
                <InfoCell label="Transaction ID" value={order.payment.transaction_id} mono />
              </div>
            </Section>
          )}

          {/* Summary */}
          <Section icon={<Receipt size={13} />} title="Summary">
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

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              href="/orders"
              className="flex-1 h-11 border border-[var(--color-border)] flex items-center justify-center text-[11px] uppercase tracking-label text-[var(--color-fg)] hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              ← Order History
            </Link>
            <Link
              href="/shop"
              className="flex-1 h-11 bg-[var(--color-primary)] text-[var(--color-primary-fg)] flex items-center justify-center text-[11px] uppercase tracking-label hover:opacity-80 transition-opacity"
            >
              Continue Shopping →
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
    <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-6 mb-4">
      <h2 className="text-[11px] uppercase tracking-label font-medium text-[var(--color-muted)] flex items-center gap-2 mb-5">
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
      <p className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)] mb-1.5">{label}</p>
      <p
        className={[
          'text-[13px]',
          mono ? 'font-mono text-[var(--color-muted)] break-all' : '',
          highlight ? 'font-medium capitalize text-[var(--color-fg)]' : 'text-[var(--color-fg)]',
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
      className={`inline-flex border uppercase tracking-label ${cls} ${large ? 'px-3 py-1.5 text-[11px]' : 'px-2 py-0.5 text-[10px]'}`}
    >
      {status}
    </span>
  )
}

function DetailSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] pt-24 pb-20">
      <div className="max-w-[760px] mx-auto px-6 md:px-12 lg:px-16">
        <div className="h-2.5 w-24 bg-zinc-100 dark:bg-zinc-900 animate-pulse mb-8" />
        <div className="mb-10 space-y-2">
          <div className="h-2.5 w-16 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          <div className="h-8 w-24 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6 mb-4">
          <div className="h-2.5 w-16 bg-zinc-100 dark:bg-zinc-900 animate-pulse mb-5" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-4 border-b border-[var(--color-border)] flex justify-between">
              <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
              <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
