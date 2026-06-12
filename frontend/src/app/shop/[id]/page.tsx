'use client'

import { useEffect, useState } from 'react'
import { notFound, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, Minus, Plus, ShoppingBag, ArrowRight } from '@phosphor-icons/react'
import { catalogApi, ApiError } from '@/lib/api'
import { useCart } from '@/lib/cart-context'
import { useAuth } from '@/lib/auth-context'
import { formatPrice, cn } from '@/lib/utils'
import type { ProductOut } from '@/types'

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
    <div className="inline-flex items-center border border-zinc-200 dark:border-zinc-700">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Minus size={14} />
      </button>
      <span className="w-10 text-center text-sm tabular-nums font-medium text-zinc-950 dark:text-zinc-50">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Related products
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
      <div className="pt-3 space-y-0.5">
        <h3 className="text-sm font-medium text-zinc-950 dark:text-zinc-50 truncate">
          {product.name}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 tabular-nums">
          {formatPrice(product.price)}
        </p>
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
        // Fetch related from same category
        if (data.category_id) {
          return catalogApi
            .getProducts({
              category_id: data.category_id,
              page_size: 4,
              active_only: true,
            })
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
      <div className="min-h-[100dvh] pt-24 px-8 lg:px-16 xl:px-24 max-w-[1400px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 mt-8">
          <div className="flex-1 aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          <div className="lg:w-[380px] shrink-0 space-y-6 pt-4">
            <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            <div className="h-8 w-3/4 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            <div className="h-6 w-24 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              <div className="h-4 w-5/6 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              <div className="h-4 w-4/6 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
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
      <div className="px-8 lg:px-16 xl:px-24 max-w-[1400px] mx-auto mb-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
          <Link href="/shop" className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors">
            Shop
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                href={`/shop?category=${product.category.slug}`}
                className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>
      </div>

      {/* Product layout */}
      <div className="px-8 lg:px-16 xl:px-24 max-w-[1400px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          {/* Image */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-28"
          >
            {/* Category */}
            {product.category && (
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
                {product.category.name}
              </p>
            )}

            {/* Name */}
            <h1 className="text-2xl lg:text-3xl font-medium tracking-[-0.02em] text-zinc-950 dark:text-zinc-50 mb-3">
              {product.name}
            </h1>

            {/* Price */}
            <p className="text-xl text-zinc-950 dark:text-zinc-50 tabular-nums mb-6">
              {formatPrice(product.price)}
            </p>

            <hr className="border-zinc-200 dark:border-zinc-800 mb-6" />

            {/* Description */}
            {product.description && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
                {product.description}
              </p>
            )}

            <hr className="border-zinc-200 dark:border-zinc-800 mb-6" />

            {/* Stock status */}
            {outOfStock ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-6">
                Out of stock — check back soon
              </p>
            ) : lowStock ? (
              <p className="text-sm text-amber-600 dark:text-amber-400 mb-6">
                Only {product.stock} left
              </p>
            ) : null}

            {/* Quantity + CTA */}
            {!outOfStock && (
              <div className="space-y-4 mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 w-16">Quantity</span>
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
                    'w-full py-4 text-sm uppercase tracking-widest font-medium transition-all duration-200',
                    'bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950',
                    'hover:bg-zinc-800 dark:hover:bg-zinc-200',
                    'active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {adding ? 'Adding…' : 'Add to Bag'}
                </button>
              </div>
            )}

            {/* Feedback messages */}
            {addedMsg && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-emerald-600 dark:text-emerald-400"
              >
                ✓ {addedMsg}
              </motion.p>
            )}
            {addError && (
              <p className="text-sm text-red-600 dark:text-red-400">{addError}</p>
            )}

            {/* Back link */}
            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <Link
                href={
                  product.category
                    ? `/shop?category=${product.category.slug}`
                    : '/shop'
                }
                className="inline-flex items-center gap-2 text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
              >
                <ArrowLeft size={14} />
                {product.category
                  ? `More ${product.category.name}`
                  : 'Back to Shop'}
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-24 pt-12 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-sm uppercase tracking-widest text-zinc-950 dark:text-zinc-50">
                You may also like
              </h2>
              {product.category && (
                <Link
                  href={`/shop?category=${product.category.slug}`}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
                >
                  View all {product.category.name}
                  <ArrowRight size={12} />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
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
