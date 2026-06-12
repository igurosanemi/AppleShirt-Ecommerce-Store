'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react'
import { cn, formatPrice } from '@/lib/utils'
import { catalogApi } from '@/lib/api'
import type { ProductOut } from '@/types'

const EASE = [0.16, 1, 0.3, 1] as const

const MARQUEE_TEXT = 'CONSIDERED MENSWEAR · DRESSED WITH INTENT · NEW COLLECTION 2025 · FREE SHIPPING OVER $150 · '

// ---------------------------------------------------------------------------
// CollectionTile
// ---------------------------------------------------------------------------

function CollectionTile({
  title,
  href,
  image,
  className,
  priority = false,
}: {
  title: string
  href: string
  image: string
  className?: string
  priority?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'relative group overflow-hidden block',
        'bg-zinc-100 dark:bg-zinc-900',
        className
      )}
    >
      <Image
        src={image}
        alt={title}
        fill
        priority={priority}
        sizes="(max-width: 768px) 50vw, 33vw"
        className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
      {/* Stronger gradient for legibility — bottom 40% darkened heavily */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent transition-opacity duration-300 group-hover:from-zinc-950/95" />
      <div className="absolute bottom-5 left-5 flex items-center gap-2">
        {/* Text shadow for extra safety on very light images */}
        <span
          className="text-zinc-50 text-[11px] font-medium uppercase tracking-label"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
        >
          {title}
        </span>
        <ArrowRight
          size={12}
          weight="bold"
          className="text-zinc-50 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
        />
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// FeaturedCard — real data from API
// ---------------------------------------------------------------------------

function FeaturedCard({ product, delay = 0 }: { product: ProductOut; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      <Link href={`/shop/${product.id}`} className="group block">
        <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100 dark:bg-zinc-900 mb-4">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800" />
          )}
          <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/8 transition-colors duration-300" />
        </div>
        <p className="text-[11px] font-medium uppercase tracking-label text-[var(--color-subtle)] mb-1">
          {product.category?.name ?? ''}
        </p>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[15px] font-medium text-[var(--color-fg)] group-hover:text-[var(--color-muted)] transition-colors duration-200 leading-snug">
            {product.name}
          </p>
          <p className="text-[14px] font-medium text-[var(--color-muted)] tabular-nums shrink-0">
            {formatPrice(product.price)}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton for featured cards while loading
// ---------------------------------------------------------------------------

function FeaturedSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          <div className="h-2.5 w-12 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const reduce = useReducedMotion()
  const [featured, setFeatured] = useState<ProductOut[]>([])
  const [featuredLoading, setFeaturedLoading] = useState(true)

  useEffect(() => {
    catalogApi
      .getProducts({ page_size: 4, active_only: true })
      .then(({ data }) => setFeatured(data))
      .catch(() => {})
      .finally(() => setFeaturedLoading(false))
  }, [])

  function fadeUp(delay = 0) {
    return {
      initial: reduce ? false : { opacity: 0, y: 22 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.75, delay, ease: EASE },
    }
  }

  function revealOnScroll(delay = 0) {
    return {
      initial: reduce ? false : { opacity: 0, y: 18 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, amount: 0.2 },
      transition: { duration: 0.65, delay, ease: EASE },
    }
  }

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative min-h-[100dvh] grid grid-cols-1 lg:grid-cols-[55fr_45fr] overflow-hidden">
        {/* Left: text panel */}
        <div className="relative z-10 flex flex-col justify-end lg:justify-center px-6 pt-28 pb-16 md:px-12 lg:px-20 xl:px-28 lg:pt-24 lg:pb-0">
          {/* Mobile: hero image sits behind text with a strong scrim */}
          <div className="absolute inset-0 lg:hidden">
            <Image
              src="/images/hero/hero-editorial.jpg"
              alt="Man in tailored AppleShirt clothing, editorial shot"
              fill
              priority
              sizes="100vw"
              className="object-cover object-top"
            />
            {/* Stronger gradient — text reads clearly even on mid-tone images */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/60 to-zinc-950/20" />
          </div>

          <div className="relative">
            <motion.p
              {...fadeUp(0.05)}
              className="text-[11px] uppercase tracking-label text-zinc-400 mb-5"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
            >
              New Collection — 2025
            </motion.p>

            <motion.h1
              {...fadeUp(0.15)}
              className="font-display font-normal text-[3.75rem] md:text-[5rem] lg:text-[5.75rem] xl:text-[6.5rem] leading-[0.93] tracking-display text-zinc-50 lg:text-[var(--color-fg)]"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.35)' }}
            >
              Dressed
              <br />
              <em className="not-italic">with intent.</em>
            </motion.h1>

            <motion.p
              {...fadeUp(0.3)}
              className="mt-7 text-[15px] text-zinc-300 lg:text-[var(--color-muted)] leading-relaxed max-w-[36ch]"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
            >
              Considered menswear. Shirts, trousers, and accessories that outlast trends.
            </motion.p>

            <motion.div {...fadeUp(0.45)} className="mt-10 flex items-center gap-8">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2.5 h-11 px-7 text-[11px] font-medium uppercase tracking-label bg-zinc-50 lg:bg-[var(--color-fg)] text-zinc-950 lg:text-[var(--color-bg)] hover:opacity-80 active:scale-[0.98] transition-all duration-200"
              >
                Shop Collection
                <ArrowRight size={13} weight="bold" />
              </Link>
              <Link
                href="/shop?category=outerwear"
                className="hidden lg:inline-flex items-center gap-1.5 text-[11px] uppercase tracking-label text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors duration-150"
              >
                Outerwear
                <ArrowRight size={11} />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Right: editorial image — desktop only */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.0, ease: EASE }}
          className="relative hidden lg:block bg-zinc-100 dark:bg-zinc-900"
        >
          <Image
            src="/images/hero/hero-editorial.jpg"
            alt="Man in tailored AppleShirt clothing, editorial shot"
            fill
            priority
            sizes="45vw"
            className="object-cover object-top"
          />
        </motion.div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* MARQUEE                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="border-y border-[var(--color-border)] overflow-hidden py-4 bg-[var(--color-bg)]"
        aria-hidden="true"
      >
        <div className="flex whitespace-nowrap animate-marquee">
          {[1, 2].map((i) => (
            <span
              key={i}
              className="inline-flex shrink-0 text-[11px] font-medium uppercase tracking-label text-[var(--color-subtle)] pr-0"
            >
              {MARQUEE_TEXT.repeat(6)}
            </span>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* FEATURED PRODUCTS — real data from API                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-6 md:px-12 lg:px-20 xl:px-28 py-20 lg:py-28">
        <div className="flex items-end justify-between mb-10">
          <motion.h2
            {...revealOnScroll(0)}
            className="text-2xl md:text-3xl font-medium tracking-[-0.02em] text-[var(--color-fg)]"
          >
            Featured pieces
          </motion.h2>
          <motion.div {...revealOnScroll(0.05)}>
            <Link
              href="/shop"
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] uppercase tracking-label text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
            >
              View all
              <ArrowRight size={11} />
            </Link>
          </motion.div>
        </div>

        {featuredLoading ? (
          <FeaturedSkeleton />
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-5">
            {featured.map((product, i) => (
              <FeaturedCard key={product.id} product={product} delay={i * 0.07} />
            ))}
          </div>
        ) : null}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* COLLECTIONS GRID                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-6 md:px-12 lg:px-20 xl:px-28 py-8 lg:py-16 border-t border-[var(--color-border)]">
        <div className="flex items-end justify-between mb-10">
          <motion.h2
            {...revealOnScroll(0)}
            className="text-2xl md:text-3xl font-medium tracking-[-0.02em] text-[var(--color-fg)]"
          >
            Shop by category
          </motion.h2>
          <motion.div {...revealOnScroll(0.05)}>
            <Link
              href="/shop"
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] uppercase tracking-label text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
            >
              All categories
              <ArrowRight size={11} />
            </Link>
          </motion.div>
        </div>

        <motion.div
          {...revealOnScroll(0.1)}
          className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3"
        >
          <CollectionTile
            title="Shirts"
            href="/shop?category=shirts"
            image="/images/products/shirts/classic-white-oxford.jpg"
            className="col-span-2 aspect-[4/3] lg:aspect-[16/10]"
            priority
          />
          <CollectionTile
            title="Trousers"
            href="/shop?category=trousers"
            image="/images/products/trousers/charcoal-dress-trousers.jpg"
            className="col-span-1 aspect-[3/4]"
          />
          <CollectionTile
            title="Accessories"
            href="/shop?category=accessories"
            image="/images/products/accessories/brushed-steel-watch.jpg"
            className="col-span-1 aspect-[3/4]"
          />
          <CollectionTile
            title="Outerwear"
            href="/shop?category=outerwear"
            image="/images/products/outerwear/camel-overcoat.jpg"
            className="col-span-2 aspect-[4/3] lg:aspect-[16/10]"
          />
        </motion.div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* BRAND STATEMENT                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-6 md:px-12 lg:px-20 xl:px-28 py-24 lg:py-36 border-t border-[var(--color-border)]">
        <div className="max-w-[860px]">
          <motion.p
            {...revealOnScroll(0)}
            className="text-[11px] uppercase tracking-label text-[var(--color-muted)] mb-8"
          >
            Why AppleShirt
          </motion.p>

          <motion.h2
            {...revealOnScroll(0.08)}
            className="font-display font-normal text-[2.5rem] md:text-[3.5rem] lg:text-[4.25rem] leading-[0.96] tracking-display text-[var(--color-fg)]"
          >
            Built to last.
            <br />
            <em className="not-italic">Worn with intent.</em>
          </motion.h2>

          <motion.p
            {...revealOnScroll(0.18)}
            className="mt-8 text-[15px] text-[var(--color-muted)] leading-relaxed max-w-[52ch]"
          >
            Every piece in the AppleShirt collection is designed to outlast trends —
            crafted from materials chosen for longevity and precision cut for a modern fit.
          </motion.p>

          <motion.div {...revealOnScroll(0.26)} className="mt-10 flex flex-wrap gap-10">
            {[
              { stat: '100%', desc: 'Natural fibres' },
              { stat: '30+', desc: 'Styles per season' },
              { stat: '2-yr', desc: 'Quality guarantee' },
            ].map(({ stat, desc }) => (
              <div key={stat}>
                <p className="text-[2rem] font-display font-normal tracking-display text-[var(--color-fg)]">
                  {stat}
                </p>
                <p className="text-[12px] text-[var(--color-muted)] mt-1">{desc}</p>
              </div>
            ))}
          </motion.div>

          <motion.div {...revealOnScroll(0.34)} className="mt-12">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--color-fg)] border-b border-[var(--color-fg)] pb-px hover:border-[var(--color-subtle)] hover:text-[var(--color-muted)] transition-all duration-200"
            >
              Explore the range
              <ArrowRight size={13} weight="bold" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* EDITORIAL STRIP                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section className="overflow-hidden border-t border-[var(--color-border)]">
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="flex"
        >
          {[
            { src: '/images/products/outerwear/olive-bomber.jpg', alt: 'Olive Bomber Jacket on model' },
            { src: '/images/products/shirts/slim-check-dress.jpg', alt: 'Slim Check Dress Shirt styled' },
            { src: '/images/products/outerwear/blue-denim-jacket.jpg', alt: 'Washed Denim Jacket editorial' },
          ].map(({ src, alt }, i) => (
            <motion.div
              key={src}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65, delay: i * 0.12, ease: EASE }}
              className="flex-1 relative aspect-[2/3] overflow-hidden"
            >
              <Image
                src={src}
                alt={alt}
                fill
                sizes="33vw"
                className="object-cover object-top"
              />
            </motion.div>
          ))}
        </motion.div>
        <div className="px-6 md:px-12 lg:px-20 xl:px-28 py-7 flex items-center justify-between border-b border-[var(--color-border)]">
          <p className="text-[13px] text-[var(--color-muted)]">
            The full collection, curated for the modern wardrobe.
          </p>
          <Link
            href="/shop"
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-label text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
          >
            Shop now
            <ArrowRight size={11} />
          </Link>
        </div>
      </section>
    </>
  )
}
