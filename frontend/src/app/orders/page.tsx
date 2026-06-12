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
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20">
      <div className="max-w-[900px] mx-auto px-6 md:px-10 lg:px-16">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Account</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
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
            <div className="hidden md:grid grid-cols-[80px_1fr_140px_120px_80px] gap-4 px-5 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Order</span>
              <span className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Date</span>
              <span className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Status</span>
              <span className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-right">Total</span>
              <span className="sr-only">Actions</span>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {orders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-[80px_1fr_140px_120px_80px] gap-4 px-5 py-5 items-center hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40 transition-colors group">
                    <span className="text-sm font-medium tabular-nums text-zinc-950 dark:text-zinc-50">
                      #{order.id}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-semibold tabular-nums text-zinc-950 dark:text-zinc-50 text-right">
                      {formatPrice(order.total)}
                    </span>
                    <div className="flex justify-end">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors flex items-center gap-1"
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
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Order #{order.id}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {new Date(order.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                        {formatPrice(order.total)}
                      </p>
                      <ArrowRight size={14} className="ml-auto mt-2 text-zinc-400 dark:text-zinc-500" />
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
                  className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <CaretLeft size={12} />
                  Previous
                </button>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  Page {meta.page} of {meta.total_pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
                  disabled={page === meta.total_pages}
                  className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
    <span className={`inline-flex px-2 py-0.5 text-[10px] uppercase tracking-wider border ${cls}`}>
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
      <Package size={48} className="text-zinc-200 dark:text-zinc-800 mb-6" weight="thin" />
      <h2 className="text-xl font-medium text-zinc-950 dark:text-zinc-50 mb-2">No orders yet</h2>
      <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-8 max-w-xs">
        When you place your first order, it will appear here.
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

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Failed to load orders.</p>
      <button
        onClick={onRetry}
        className="text-xs uppercase tracking-widest text-zinc-950 dark:text-zinc-50 underline underline-offset-2"
      >
        Try again
      </button>
    </div>
  )
}

function OrdersSkeleton({ inline }: { inline?: boolean }) {
  const content = (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
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
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20">
      <div className="max-w-[900px] mx-auto px-6 md:px-10 lg:px-16">
        <div className="mb-10 space-y-3">
          <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          <div className="h-9 w-40 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>
        {content}
      </div>
    </div>
  )
}
