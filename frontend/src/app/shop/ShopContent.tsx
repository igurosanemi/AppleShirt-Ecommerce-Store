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
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
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
            <div className="absolute inset-0 bg-zinc-50/70 dark:bg-zinc-950/70 flex items-center justify-center">
              <span className="text-xs uppercase tracking-widest text-zinc-500">
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
                'absolute inset-x-0 bottom-0 py-3 text-xs uppercase tracking-widest font-medium transition-all duration-300',
                'bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950',
                'hover:bg-zinc-800 dark:hover:bg-zinc-200',
                'disabled:opacity-60',
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
        <div className="pt-3 space-y-0.5">
          {product.category && (
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {product.category.name}
            </p>
          )}
          <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50 truncate">
            {product.name}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 tabular-nums">
            {formatPrice(product.price)}
          </p>
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

  // Local search input (decoupled from URL for debounce)
  const [searchInput, setSearchInput] = useState(searchQuery)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const [categories, setCategories] = useState<CategoryOut[]>([])
  const [products, setProducts] = useState<ProductOut[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [productError, setProductError] = useState(false)

  // Sync search input when URL changes externally (e.g. browser back)
  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  // Fetch categories once
  useEffect(() => {
    catalogApi
      .getCategories()
      .then(({ data }) => setCategories(data))
      .catch(() => {})
      .finally(() => setLoadingCategories(false))
  }, [])

  // Derive category_id from slug — only valid once categories are loaded
  const activeCategoryId = categories.find((c) => c.slug === categorySlug)?.id

  // Wait for categories to load before fetching products when a category slug is in the URL.
  // Without this guard, the first fetch runs with no category_id (shows all products),
  // then re-runs once categories resolve — causing a flash of wrong results.
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
      <div className="px-8 lg:px-16 xl:px-24 max-w-[1400px] mx-auto mb-12">
        <motion.h1
          key={headingText}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl md:text-5xl font-medium tracking-[-0.03em] text-zinc-950 dark:text-zinc-50"
        >
          {headingText}
        </motion.h1>
        {meta && (
          <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500 tabular-nums">
            {meta.total} {meta.total === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="px-8 lg:px-16 xl:px-24 max-w-[1400px] mx-auto flex gap-12 lg:gap-16 items-start">
        {/* ---- Sidebar ---- */}
        <aside className="hidden lg:block w-52 shrink-0 sticky top-28">
          {/* Search */}
          <div className="relative mb-8">
            <label htmlFor={`${searchId}-desktop`} className="sr-only">Search products</label>
            <MagnifyingGlass
              size={14}
              weight="regular"
              className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              aria-hidden
            />
            <input
              id={`${searchId}-desktop`}
              type="search"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search"
              className="w-full pl-5 pr-6 py-1.5 text-sm bg-transparent border-b border-zinc-200 dark:border-zinc-700 text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-50 transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
                aria-label="Clear search"
              >
                <X size={14} aria-hidden />
              </button>
            )}
          </div>

          {/* Categories */}
          <nav aria-label="Filter by category">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4" id="category-label">
              Category
            </p>
            <ul className="space-y-2.5" aria-labelledby="category-label">
              <li>
                <button
                  onClick={() => handleCategorySelect('')}
                  aria-current={!categorySlug ? 'true' : undefined}
                  className={cn(
                    'text-sm transition-colors duration-150',
                    !categorySlug
                      ? 'text-zinc-950 dark:text-zinc-50 font-medium'
                      : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50'
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
                          'text-sm transition-colors duration-150',
                          categorySlug === cat.slug
                            ? 'text-zinc-950 dark:text-zinc-50 font-medium'
                            : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50'
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
                size={14}
                className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                aria-hidden
              />
              <input
                id={`${searchId}-mobile`}
                type="search"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search"
                className="w-full pl-5 pr-6 py-1.5 text-sm bg-transparent border-b border-zinc-200 dark:border-zinc-700 text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-50 transition-colors"
              />
              {searchInput && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50"
                  aria-label="Clear search"
                >
                  <X size={14} aria-hidden />
                </button>
              )}
            </div>
            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="group" aria-label="Filter by category">
              <button
                onClick={() => handleCategorySelect('')}
                aria-current={!categorySlug ? 'true' : undefined}
                className={cn(
                  'shrink-0 px-3 py-1 text-xs uppercase tracking-widest border transition-colors duration-150',
                  !categorySlug
                    ? 'bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 border-zinc-950 dark:border-zinc-50'
                    : 'border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-zinc-950 dark:hover:border-zinc-50 hover:text-zinc-950 dark:hover:text-zinc-50'
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
                    'shrink-0 px-3 py-1 text-xs uppercase tracking-widest border transition-colors duration-150',
                    categorySlug === cat.slug
                      ? 'bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 border-zinc-950 dark:border-zinc-50'
                      : 'border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-zinc-950 dark:hover:border-zinc-50 hover:text-zinc-950 dark:hover:text-zinc-50'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          {loadingProducts ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-4 w-40 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                </div>
              ))}
            </div>
          ) : productError ? (
            <div className="py-24 text-center">
              <WarningCircle size={36} className="text-zinc-300 dark:text-zinc-700 mx-auto mb-4" weight="thin" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                Could not load products. Please try again.
              </p>
              <button
                onClick={fetchProducts}
                className="text-sm underline underline-offset-2 text-zinc-950 dark:text-zinc-50 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-zinc-400 dark:text-zinc-500 text-sm">
                No products found.
              </p>
              <button
                onClick={() => {
                  handleCategorySelect('')
                  handleSearchChange('')
                }}
                className="mt-4 text-sm underline underline-offset-2 text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
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
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={14} />
                Previous
              </button>

              <span className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 tabular-nums">
                {currentPage} / {meta.total_pages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === meta.total_pages}
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
