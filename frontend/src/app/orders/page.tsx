'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Package, ArrowRight, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { ordersApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import type { OrderOut, PaginationMeta } from '@/types'

export default function OrdersPage() {
  const { token, isLoading: authLoading } = useRequireAuth()
  const [orders, setOrders] = useState<OrderOut[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)

  const fetchOrders = useCallback(
    async (p: number) => {
      if (!token) return
      setLoading(true)
      setError(false)
      try {
        const { data, meta: m } = await ordersApi.list(token, { page: p, page_size: 10 })
        setOrders(data)
        setMeta(m)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    },
    [token]
  )

  useEffect(() => {
    if (!authLoading && token) {
      fetchOrders(page)
    }
  }, [authLoading, token, page, fetchOrders])

  if (authLoading) return <OrdersSkeleton />

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] pt-24 pb-20">
      <div className="max-w-[900px] mx-auto px-6 md:px-12 lg:px-20">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)] mb-3">
            Account
          </p>
          <h1 className="text-[1.625rem] md:text-[2rem] font-medium tracking-[-0.02em] text-[var(--color-fg)]">
            Order History
          </h1>
        </div>

        {loading ? (
          <OrdersSkeleton inline />
        ) : error ? (
          <ErrorState onRetry={() => fetchOrders(page)} />
        ) : orders.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Desktop table header */}
            <div className="hidden md:grid grid-cols-[80px_1fr_140px_120px_80px] gap-4 px-5 pb-3 border-b border-[var(--color-border)]">
              {['Order', 'Date', 'Status', 'Total', ''].map((col) => (
                <span key={col} className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)] last:sr-only">
                  {col || <span className="sr-only">Actions</span>}
                </span>
              ))}
            </div>

            <div className="divide-y divide-[var(--color-border)]">
              {orders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-[80px_1fr_140px_120px_80px] gap-4 px-5 py-5 items-center hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40 transition-colors group">
                    <span className="text-[14px] font-medium tabular-nums text-[var(--color-fg)]">
                      #{order.id}
                    </span>
                    <span className="text-[13px] text-[var(--color-muted)]">
                      {new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                    <StatusBadge status={order.status} />
                    <span className="text-[14px] font-medium tabular-nums text-[var(--color-fg)] text-right">
                      {formatPrice(order.total)}
                    </span>
                    <div className="flex justify-end">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-[11px] uppercase tracking-label text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors flex items-center gap-1"
                        aria-label={`View order #${order.id}`}
                      >
                        View
                        <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </div>
                  </div>

                  {/* Mobile card */}
                  <Link
                    href={`/orders/${order.id}`}
                    className="md:hidden flex items-start justify-between py-5 px-1 gap-4 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <p className="text-[14px] font-medium text-[var(--color-fg)]">Order #{order.id}</p>
                      <p className="text-[12px] text-[var(--color-muted)]">
                        {new Date(order.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[14px] font-medium tabular-nums text-[var(--color-fg)]">
                        {formatPrice(order.total)}
                      </p>
                      <ArrowRight size={13} className="ml-auto mt-2 text-[var(--color-muted)]" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.total_pages > 1 && (
              <div className="mt-10 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1.5 text-[13px] text-[var(--color-muted)] hover:text-[var(--color-fg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <CaretLeft size={12} />
                  Previous
                </button>
                <span className="text-[11px] uppercase tracking-label text-[var(--color-subtle)] tabular-nums">
                  Page {meta.page} of {meta.total_pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
                  disabled={page === meta.total_pages}
                  className="flex items-center gap-1.5 text-[13px] text-[var(--color-muted)] hover:text-[var(--color-fg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <CaretRight size={12} />
                </button>
              </div>
            )}
          </motion.div>
        )}
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
    <span className={`inline-flex px-2 py-0.5 text-[10px] uppercase tracking-label border ${cls}`}>
      {status}
    </span>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <Package size={44} className="text-[var(--color-border-strong)] mb-6" weight="thin" />
      <h2 className="text-[1.25rem] font-medium text-[var(--color-fg)] mb-2">No orders yet</h2>
      <p className="text-[14px] text-[var(--color-muted)] mb-8 max-w-xs">
        When you place your first order, it will appear here.
      </p>
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 h-11 px-8 bg-[var(--color-primary)] text-[var(--color-primary-fg)] text-[11px] font-medium uppercase tracking-label hover:opacity-80 transition-opacity"
      >
        Browse the Collection
        <ArrowRight size={13} />
      </Link>
    </motion.div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-16 text-center">
      <p className="text-[14px] text-[var(--color-muted)] mb-4">Failed to load orders.</p>
      <button
        onClick={onRetry}
        className="text-[11px] uppercase tracking-label text-[var(--color-fg)] underline underline-offset-2"
      >
        Try again
      </button>
    </div>
  )
}

function OrdersSkeleton({ inline }: { inline?: boolean }) {
  const content = (
    <div className="divide-y divide-[var(--color-border)]">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="py-5 flex justify-between">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            <div className="h-3 w-32 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          </div>
          <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>
      ))}
    </div>
  )

  if (inline) return content

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] pt-24 pb-20">
      <div className="max-w-[900px] mx-auto px-6 md:px-12 lg:px-20">
        <div className="mb-10 space-y-3">
          <div className="h-2.5 w-20 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          <div className="h-8 w-40 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>
        {content}
      </div>
    </div>
  )
}
