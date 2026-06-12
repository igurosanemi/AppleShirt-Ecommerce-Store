'use client'

import { useEffect, useState } from 'react'
import { notFound, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, Minus, Plus, ArrowRight } from '@phosphor-icons/react'
import { catalogApi, ApiError } from '@/lib/api'
import { useCart } from '@/lib/cart-context'
import { useAuth } from '@/lib/auth-context'
import { formatPrice, cn } from '@/lib/utils'
import type { ProductOut } from '@/types'

const EASE = [0.16, 1, 0.3, 1] as const

// ---------------------------------------------------------------------------
// Quantity Stepper
// ---------------------------------------------------------------------------

function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="inline-flex items-center border border-[var(--color-border)]">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="w-11 h-11 flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-fg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Minus size={13} />
      </button>
      <span className="w-11 text-center text-[15px] tabular-nums font-medium text-[var(--color-fg)]">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="w-11 h-11 flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-fg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Plus size={13} />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Related card
// ---------------------------------------------------------------------------

function RelatedCard({ product }: { product: ProductOut }) {
  return (
    <Link href={`/shop/${product.id}`} className="group block">
      <div className="relative overflow-hidden aspect-[3/4] bg-zinc-100 dark:bg-zinc-900">
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
      <div className="pt-3.5">
        {product.category && (
          <p className="text-[11px] font-medium uppercase tracking-label text-[var(--color-subtle)] mb-1">
            {product.category.name}
          </p>
        )}
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[15px] font-medium text-[var(--color-fg)] truncate group-hover:text-[var(--color-muted)] transition-colors">
            {product.name}
          </h3>
          <p className="text-[14px] font-medium text-[var(--color-muted)] tabular-nums shrink-0">
            {formatPrice(product.price)}
          </p>
        </div>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const reduce = useReducedMotion()
  const { token } = useAuth()
  const { addItem } = useCart()

  const [product, setProduct] = useState<ProductOut | null>(null)
  const [related, setRelated] = useState<ProductOut[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [addedMsg, setAddedMsg] = useState('')
  const [addError, setAddError] = useState('')

  const productId = Number(params.id)

  useEffect(() => {
    if (isNaN(productId)) { notFound(); return }

    setLoading(true)
    catalogApi
      .getProduct(productId)
      .then(({ data }) => {
        setProduct(data)
        if (data.category_id) {
          return catalogApi
            .getProducts({ category_id: data.category_id, page_size: 4, active_only: true })
            .then(({ data: list }) => {
              setRelated(list.filter((p) => p.id !== data.id).slice(0, 3))
            })
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) notFound()
      })
      .finally(() => setLoading(false))
  }, [productId])

  async function handleAddToBag() {
    if (!product) return
    if (!token) {
      router.push(`/login?next=/shop/${product.id}`)
      return
    }
    setAdding(true)
    setAddError('')
    setAddedMsg('')
    try {
      await addItem(product.id, quantity)
      setAddedMsg(`${quantity} item${quantity > 1 ? 's' : ''} added to bag`)
      setTimeout(() => setAddedMsg(''), 2500)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setAddError('Not enough stock available.')
      } else {
        setAddError('Could not add to bag. Please try again.')
      }
    } finally {
      setAdding(false)
    }
  }

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-[100dvh] pt-24 px-6 md:px-12 lg:px-20 xl:px-28 max-w-[1400px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 mt-8">
          <div className="flex-1 aspect-[3/4] bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          <div className="lg:w-[380px] shrink-0 space-y-6 pt-4">
            <div className="h-2.5 w-16 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            <div className="h-10 w-3/4 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            <div className="h-6 w-24 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            <div className="space-y-2 pt-4">
              <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
              <div className="h-4 w-5/6 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null

  const outOfStock = product.stock === 0
  const lowStock = !outOfStock && product.stock <= 5
  const maxQty = Math.min(product.stock, 10)

  return (
    <div className="min-h-[100dvh] pt-24 pb-24">
      {/* Breadcrumb */}
      <div className="px-6 md:px-12 lg:px-20 xl:px-28 max-w-[1400px] mx-auto mb-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[12px] text-[var(--color-subtle)]">
          <Link href="/shop" className="hover:text-[var(--color-fg)] transition-colors">
            Shop
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                href={`/shop?category=${product.category.slug}`}
                className="hover:text-[var(--color-fg)] transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-[var(--color-muted)] truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>
      </div>

      {/* Product layout */}
      <div className="px-6 md:px-12 lg:px-20 xl:px-28 max-w-[1400px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          {/* Image */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="w-full lg:flex-1 relative overflow-hidden aspect-[3/4] bg-zinc-100 dark:bg-zinc-900"
          >
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover object-top"
              />
            ) : (
              <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800" />
            )}
          </motion.div>

          {/* Info panel */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.08 }}
            className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-28"
          >
            {/* Category eyebrow */}
            {product.category && (
              <p className="text-[11px] font-medium uppercase tracking-label text-[var(--color-subtle)] mb-4">
                {product.category.name}
              </p>
            )}

            {/* Name — Cormorant display */}
            <h1 className="font-display font-normal text-[1.75rem] md:text-[2.25rem] lg:text-[2.5rem] leading-[1.05] tracking-[-0.015em] text-[var(--color-fg)] mb-4">
              {product.name}
            </h1>

            {/* Price */}
            <p className="text-[20px] font-medium text-[var(--color-fg)] tabular-nums mb-7">
              {formatPrice(product.price)}
            </p>

            <hr className="border-[var(--color-border)] mb-7" />

            {/* Description */}
            {product.description && (
              <p className="text-[15px] text-[var(--color-muted)] leading-[1.7] mb-7">
                {product.description}
              </p>
            )}

            <hr className="border-[var(--color-border)] mb-7" />

            {/* Stock status */}
            {outOfStock ? (
              <p className="text-[13px] text-[var(--color-muted)] mb-6">
                Out of stock — check back soon
              </p>
            ) : lowStock ? (
              <p className="text-[13px] text-amber-600 dark:text-amber-400 mb-6">
                Only {product.stock} left
              </p>
            ) : null}

            {/* Quantity + CTA */}
            {!outOfStock && (
              <div className="space-y-4 mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)] w-16">
                    Qty
                  </span>
                  <QuantityStepper
                    value={quantity}
                    onChange={setQuantity}
                    min={1}
                    max={maxQty}
                  />
                </div>

                <button
                  onClick={handleAddToBag}
                  disabled={adding || outOfStock}
                  className={cn(
                    'w-full h-11 text-[11px] uppercase tracking-label font-medium transition-all duration-200',
                    'bg-[var(--color-primary)] text-[var(--color-primary-fg)]',
                    'hover:opacity-80 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {adding ? 'Adding…' : 'Add to Bag'}
                </button>
              </div>
            )}

            {/* Feedback */}
            {addedMsg && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[13px] text-emerald-600 dark:text-emerald-400"
              >
                ✓ {addedMsg}
              </motion.p>
            )}
            {addError && (
              <p className="text-[13px] text-red-600 dark:text-red-400">{addError}</p>
            )}

            {/* Back link */}
            <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
              <Link
                href={
                  product.category
                    ? `/shop?category=${product.category.slug}`
                    : '/shop'
                }
                className="inline-flex items-center gap-2 text-[13px] text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
              >
                <ArrowLeft size={13} />
                {product.category ? `More ${product.category.name}` : 'Back to Shop'}
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-24 pt-12 border-t border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-[11px] uppercase tracking-label font-medium text-[var(--color-fg)]">
                You may also like
              </h2>
              {product.category && (
                <Link
                  href={`/shop?category=${product.category.slug}`}
                  className="flex items-center gap-1 text-[11px] uppercase tracking-label text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
                >
                  View all {product.category.name}
                  <ArrowRight size={11} />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10">
              {related.map((p) => (
                <RelatedCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
