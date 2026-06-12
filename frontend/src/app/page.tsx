'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const EASE = [0.16, 1, 0.3, 1] as const

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
        'relative group overflow-hidden bg-zinc-100 dark:bg-zinc-900 block',
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
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-zinc-950/10 to-transparent transition-opacity duration-300 group-hover:from-zinc-950/70" />
      <div className="absolute bottom-5 left-5 flex items-center gap-2">
        <span className="text-zinc-50 font-medium text-base tracking-tight">
          {title}
        </span>
        <ArrowRight
          size={14}
          weight="bold"
          className="text-zinc-50 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
        />
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const reduce = useReducedMotion()

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
      viewport: { once: true, amount: 0.25 },
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
        <div className="relative z-10 flex flex-col justify-end lg:justify-center px-8 pt-24 pb-16 lg:px-16 xl:px-24 lg:pt-24 lg:pb-0">
          {/* Mobile hero image sits behind text */}
          <div className="absolute inset-0 lg:hidden">
            <Image
              src="/images/hero/hero-editorial.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/30 to-zinc-950/10" />
          </div>

          <div className="relative">
            <motion.p
              {...fadeUp(0.05)}
              className="text-[10px] uppercase tracking-widest text-zinc-400 lg:text-zinc-400 dark:text-zinc-400 mb-4"
            >
              New Collection — 2025
            </motion.p>

            <motion.h1
              {...fadeUp(0.15)}
              className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tightest leading-[1.04] text-zinc-50 lg:text-zinc-950 dark:text-zinc-50"
            >
              Dressed
              <br />
              with intent.
            </motion.h1>

            <motion.p
              {...fadeUp(0.3)}
              className="mt-6 text-base md:text-lg text-zinc-300 lg:text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[40ch]"
            >
              Considered menswear. Shirts, trousers, and accessories that outlast trends.
            </motion.p>

            <motion.div {...fadeUp(0.45)} className="mt-10">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2.5 bg-zinc-50 lg:bg-zinc-950 dark:bg-zinc-50 text-zinc-950 lg:text-zinc-50 dark:text-zinc-950 px-7 py-3.5 text-sm font-medium tracking-wide uppercase hover:bg-zinc-200 lg:hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all duration-200"
              >
                Shop Collection
                <ArrowRight size={15} weight="bold" />
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
            alt="AppleShirt editorial"
            fill
            priority
            sizes="45vw"
            className="object-cover object-top"
          />
        </motion.div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* COLLECTIONS GRID                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-8 lg:px-16 xl:px-24 py-20 lg:py-28">
        <div className="flex items-end justify-between mb-10">
          <motion.h2
            {...revealOnScroll(0)}
            className="text-2xl md:text-3xl font-medium tracking-tight text-zinc-950 dark:text-zinc-50"
          >
            Shop the collection
          </motion.h2>
          <motion.div {...revealOnScroll(0.05)}>
            <Link
              href="/shop"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
            >
              View all
              <ArrowRight size={12} />
            </Link>
          </motion.div>
        </div>

        {/*
          Mobile  (grid-cols-2): Shirts full-row, Trousers+Accessories half each, Outerwear full-row
          Desktop (grid-cols-3): Shirts 2/3, Trousers 1/3  |  Accessories 1/3, Outerwear 2/3
        */}
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
      <section className="px-8 lg:px-16 xl:px-24 py-24 lg:py-36 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-[900px]">
          <motion.p
            {...revealOnScroll(0)}
            className="text-[10px] uppercase tracking-widest text-zinc-400 mb-8"
          >
            Why AppleShirt
          </motion.p>

          <motion.h2
            {...revealOnScroll(0.08)}
            className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tightest leading-[1.04] text-zinc-950 dark:text-zinc-50"
          >
            Built to last.
            <br />
            Worn with intent.
          </motion.h2>

          <motion.p
            {...revealOnScroll(0.18)}
            className="mt-8 text-base md:text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[55ch]"
          >
            Every piece in the AppleShirt collection is designed to outlast trends —
            crafted from materials chosen for longevity and precision cut for a modern fit.
          </motion.p>

          <motion.div {...revealOnScroll(0.28)} className="mt-12">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-950 dark:text-zinc-50 border-b border-zinc-950 dark:border-zinc-50 pb-0.5 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-400 dark:hover:text-zinc-500 transition-all duration-200"
            >
              Explore the range
              <ArrowRight size={14} weight="bold" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* EDITORIAL STRIP — 3 product images in a horizontal band             */}
      {/* ------------------------------------------------------------------ */}
      <section className="overflow-hidden border-t border-zinc-200 dark:border-zinc-800">
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="flex"
        >
          {[
            { src: '/images/products/outerwear/olive-bomber.jpg', alt: 'Olive Bomber Jacket' },
            { src: '/images/products/shirts/slim-check-dress.jpg', alt: 'Slim Check Dress Shirt' },
            { src: '/images/products/outerwear/blue-denim-jacket.jpg', alt: 'Washed Denim Jacket' },
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
        <div className="px-8 lg:px-16 xl:px-24 py-8 flex items-center justify-between">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            The full collection, curated for the modern wardrobe.
          </p>
          <Link
            href="/shop"
            className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
          >
            Shop now
            <ArrowRight size={12} />
          </Link>
        </div>
      </section>
    </>
  )
}
