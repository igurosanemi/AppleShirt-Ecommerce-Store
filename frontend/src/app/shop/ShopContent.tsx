'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import {
  MagnifyingGlass,
  X,
  ArrowLeft,
  ArrowRight,
  WarningCircle,
} from '@phosphor-icons/react'
import { catalogApi } from '@/lib/api'
import { useCart } from '@/lib/cart-context'
import { useAuth } from '@/lib/auth-context'
import { formatPrice, cn } from '@/lib/utils'
import type { CategoryOut, ProductOut, PaginationMeta } from '@/types'

const PAGE_SIZE = 12
const EASE = [0.16, 1, 0.3, 1] as const

// ---------------------------------------------------------------------------
// Product card
// ---------------------------------------------------------------------------

function ProductCard({ product }: { product: ProductOut }) {
  const { token } = useAuth()
  const { addItem } = useCart()
  const router = useRouter()
  const reduce = useReducedMotion()
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  async function handleAddToBag(e: React.MouseEvent) {
    e.preventDefault()
    if (!token) {
      router.push(`/login?next=/shop/${product.id}`)
      return
    }
    if (product.stock === 0) return
    setAdding(true)
    try {
      await addItem(product.id, 1)
      setAdded(true)
      setTimeout(() => setAdded(false), 1800)
    } catch {
      // silent — don't block navigation
    } finally {
      setAdding(false)
    }
  }

  const outOfStock = product.stock === 0

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: EASE }}
    >
      <Link href={`/shop/${product.id}`} className="block group">
        {/* Image */}
        <div className="relative overflow-hidden aspect-[3/4] bg-zinc-100 dark:bg-zinc-900">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className={cn(
                'object-cover object-top transition-transform duration-700 ease-out',
                !reduce && 'group-hover:scale-[1.04]'
              )}
            />
          ) : (
            <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800" />
          )}

          {/* Out of stock overlay */}
          {outOfStock && (
            <div className="absolute inset-0 bg-[var(--color-bg)]/70 flex items-center justify-center">
              <span className="text-[11px] uppercase tracking-label text-[var(--color-muted)]">
                Out of Stock
              </span>
            </div>
          )}

          {/* Add to Bag hover bar */}
          {!outOfStock && (
            <button
              onClick={handleAddToBag}
              disabled={adding}
              aria-label={`Add ${product.name} to bag`}
              className={cn(
                'absolute inset-x-0 bottom-0 h-11 text-[11px] uppercase tracking-label font-medium transition-all duration-300',
                'bg-[var(--color-primary)] text-[var(--color-primary-fg)]',
                'hover:opacity-80 disabled:opacity-60',
                reduce
                  ? 'opacity-0 group-hover:opacity-100'
                  : 'translate-y-full group-hover:translate-y-0'
              )}
            >
              {adding ? '…' : added ? '✓ Added' : 'Add to Bag'}
            </button>
          )}
        </div>

        {/* Text */}
        <div className="pt-3.5">
          {product.category && (
            <p className="text-[11px] font-medium uppercase tracking-label text-[var(--color-subtle)] mb-1">
              {product.category.name}
            </p>
          )}
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-[15px] font-medium text-[var(--color-fg)] truncate group-hover:text-[var(--color-muted)] transition-colors duration-200">
              {product.name}
            </h2>
            <p className="text-[14px] font-medium text-[var(--color-muted)] tabular-nums shrink-0">
              {formatPrice(product.price)}
            </p>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

export function ShopContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reduce = useReducedMotion()

  const categorySlug = searchParams.get('category') ?? ''
  const searchQuery = searchParams.get('search') ?? ''
  const currentPage = Number(searchParams.get('page') ?? '1')

  const [searchInput, setSearchInput] = useState(searchQuery)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const [categories, setCategories] = useState<CategoryOut[]>([])
  const [products, setProducts] = useState<ProductOut[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [productError, setProductError] = useState(false)

  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    catalogApi
      .getCategories()
      .then(({ data }) => setCategories(data))
      .catch(() => {})
      .finally(() => setLoadingCategories(false))
  }, [])

  const activeCategoryId = categories.find((c) => c.slug === categorySlug)?.id
  const categoriesReady = !loadingCategories

  const fetchProducts = useCallback(() => {
    if (!categoriesReady) return
    setLoadingProducts(true)
    setProductError(false)
    catalogApi
      .getProducts({
        page: currentPage,
        page_size: PAGE_SIZE,
        ...(activeCategoryId ? { category_id: activeCategoryId } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
        active_only: true,
      })
      .then(({ data, meta }) => {
        setProducts(data)
        setMeta(meta)
      })
      .catch(() => {
        setProducts([])
        setMeta(null)
        setProductError(true)
      })
      .finally(() => setLoadingProducts(false))
  }, [categoriesReady, currentPage, activeCategoryId, searchQuery])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  function updateUrl(updates: Record<string, string | number | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, val] of Object.entries(updates)) {
      if (val === undefined || val === '' || val === 1) {
        params.delete(key)
      } else {
        params.set(key, String(val))
      }
    }
    router.replace(`/shop${params.toString() ? `?${params}` : ''}`, { scroll: false })
  }

  function handleCategorySelect(slug: string) {
    const params = new URLSearchParams()
    if (slug) params.set('category', slug)
    if (searchQuery) params.set('search', searchQuery)
    router.replace(`/shop${params.toString() ? `?${params}` : ''}`, { scroll: false })
  }

  function handleSearchChange(value: string) {
    setSearchInput(value)
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (categorySlug) params.set('category', categorySlug)
      if (value) params.set('search', value)
      router.replace(`/shop${params.toString() ? `?${params}` : ''}`, { scroll: false })
    }, 350)
  }

  function handlePageChange(page: number) {
    updateUrl({ page: page === 1 ? undefined : page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeCategory = categories.find((c) => c.slug === categorySlug)
  const headingText = activeCategory
    ? activeCategory.name
    : searchQuery
    ? `"${searchQuery}"`
    : 'Shop All'

  const searchId = 'shop-search'

  return (
    <div className="min-h-[100dvh] pt-32 pb-24">
      {/* Page header */}
      <div className="px-6 md:px-12 lg:px-20 xl:px-28 max-w-[1400px] mx-auto mb-12">
        <motion.h1
          key={headingText}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="font-display font-normal text-[2.5rem] md:text-[3.5rem] lg:text-[4.25rem] leading-[0.96] tracking-display text-[var(--color-fg)]"
        >
          {headingText}
        </motion.h1>
        {meta && (
          <p className="mt-3 text-[13px] text-[var(--color-muted)] tabular-nums">
            {meta.total} {meta.total === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="px-6 md:px-12 lg:px-20 xl:px-28 max-w-[1400px] mx-auto flex gap-12 lg:gap-16 items-start">
        {/* ---- Sidebar ---- */}
        <aside className="hidden lg:block w-48 shrink-0 sticky top-28">
          {/* Search */}
          <div className="relative mb-8">
            <label htmlFor={`${searchId}-desktop`} className="sr-only">Search products</label>
            <MagnifyingGlass
              size={13}
              weight="regular"
              className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--color-subtle)] pointer-events-none"
              aria-hidden
            />
            <input
              id={`${searchId}-desktop`}
              type="search"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search"
              className="w-full pl-5 pr-6 py-1.5 text-[13px] bg-transparent border-b border-[var(--color-border)] text-[var(--color-fg)] placeholder:text-[var(--color-subtle)] focus:outline-none focus:border-[var(--color-fg)] transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-subtle)] hover:text-[var(--color-fg)] transition-colors"
                aria-label="Clear search"
              >
                <X size={13} aria-hidden />
              </button>
            )}
          </div>

          {/* Categories */}
          <nav aria-label="Filter by category">
            <p className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)] mb-4" id="category-label">
              Category
            </p>
            <ul className="space-y-3" aria-labelledby="category-label">
              <li>
                <button
                  onClick={() => handleCategorySelect('')}
                  aria-current={!categorySlug ? 'true' : undefined}
                  className={cn(
                    'text-[13px] transition-colors duration-150',
                    !categorySlug
                      ? 'text-[var(--color-fg)] font-medium'
                      : 'text-[var(--color-subtle)] hover:text-[var(--color-fg)]'
                  )}
                >
                  All
                </button>
              </li>
              {loadingCategories
                ? Array.from({ length: 4 }).map((_, i) => (
                    <li key={i}>
                      <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                    </li>
                  ))
                : categories.map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => handleCategorySelect(cat.slug)}
                        aria-current={categorySlug === cat.slug ? 'true' : undefined}
                        className={cn(
                          'text-[13px] transition-colors duration-150',
                          categorySlug === cat.slug
                            ? 'text-[var(--color-fg)] font-medium'
                            : 'text-[var(--color-subtle)] hover:text-[var(--color-fg)]'
                        )}
                      >
                        {cat.name}
                      </button>
                    </li>
                  ))}
            </ul>
          </nav>
        </aside>

        {/* ---- Main ---- */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter bar */}
          <div className="lg:hidden mb-8 space-y-4">
            {/* Search */}
            <div className="relative">
              <label htmlFor={`${searchId}-mobile`} className="sr-only">Search products</label>
              <MagnifyingGlass
                size={13}
                className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--color-subtle)] pointer-events-none"
                aria-hidden
              />
              <input
                id={`${searchId}-mobile`}
                type="search"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search"
                className="w-full pl-5 pr-6 py-1.5 text-[13px] bg-transparent border-b border-[var(--color-border)] text-[var(--color-fg)] placeholder:text-[var(--color-subtle)] focus:outline-none focus:border-[var(--color-fg)] transition-colors"
              />
              {searchInput && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-subtle)] hover:text-[var(--color-fg)]"
                  aria-label="Clear search"
                >
                  <X size={13} aria-hidden />
                </button>
              )}
            </div>
            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="group" aria-label="Filter by category">
              <button
                onClick={() => handleCategorySelect('')}
                aria-current={!categorySlug ? 'true' : undefined}
                className={cn(
                  'shrink-0 px-3 h-8 text-[11px] uppercase tracking-label border transition-colors duration-150',
                  !categorySlug
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-fg)] hover:text-[var(--color-fg)]'
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.slug)}
                  aria-current={categorySlug === cat.slug ? 'true' : undefined}
                  className={cn(
                    'shrink-0 px-3 h-8 text-[11px] uppercase tracking-label border transition-colors duration-150',
                    categorySlug === cat.slug
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-fg)] hover:text-[var(--color-fg)]'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          {loadingProducts ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-12">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="space-y-3.5">
                  <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                  <div className="h-2.5 w-14 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                  <div className="h-4 w-36 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                </div>
              ))}
            </div>
          ) : productError ? (
            <div className="py-24 text-center">
              <WarningCircle size={36} className="text-zinc-300 dark:text-zinc-700 mx-auto mb-4" weight="thin" />
              <p className="text-[14px] text-[var(--color-muted)] mb-4">
                Could not load products. Please try again.
              </p>
              <button
                onClick={fetchProducts}
                className="text-[13px] underline underline-offset-2 text-[var(--color-fg)] hover:text-[var(--color-muted)] transition-colors"
              >
                Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-[var(--color-muted)] text-[14px]">
                No products found.
              </p>
              <button
                onClick={() => {
                  handleCategorySelect('')
                  handleSearchChange('')
                }}
                className="mt-4 text-[13px] underline underline-offset-2 text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-12">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="mt-16 flex items-center justify-between">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-2 text-[13px] text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={13} />
                Previous
              </button>

              <span className="text-[11px] uppercase tracking-label text-[var(--color-subtle)] tabular-nums">
                {currentPage} / {meta.total_pages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === meta.total_pages}
                className="flex items-center gap-2 text-[13px] text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
