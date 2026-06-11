'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

// Ease curve: snappy decelerate, matches premium feel
const EASE = [0.16, 1, 0.3, 1] as const

export default function HomePage() {
  const reduce = useReducedMotion()

  function fadeUp(delay = 0) {
    return {
      initial: reduce ? false : { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.7, delay, ease: EASE },
    }
  }

  function revealOnScroll(delay = 0) {
    return {
      initial: reduce ? false : { opacity: 0, y: 16 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, amount: 0.3 },
      transition: { duration: 0.6, delay, ease: EASE },
    }
  }

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* HERO - Asymmetric Split (DESIGN_VARIANCE: 7 anti-center bias)       */}
      {/* ------------------------------------------------------------------ */}
      <section className="min-h-[100dvh] grid grid-cols-1 lg:grid-cols-[55fr_45fr]">
        {/* Left: text */}
        <div className="flex flex-col justify-center px-8 pt-24 pb-16 lg:px-16 xl:px-24 lg:pt-24 lg:pb-0">
          <motion.h1
            {...fadeUp(0.1)}
            className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tightest leading-[1.04] text-zinc-950 dark:text-zinc-50"
          >
            Dressed
            <br />
            with intent.
          </motion.h1>

          <motion.p
            {...fadeUp(0.25)}
            className="mt-6 text-base md:text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[42ch]"
          >
            Considered menswear for the modern wardrobe. Shirts, trousers, and accessories that last.
          </motion.p>

          <motion.div {...fadeUp(0.4)} className="mt-10">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2.5 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 px-7 py-3.5 text-sm font-medium tracking-wide uppercase hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all duration-200"
            >
              Shop Collection
              <ArrowRight size={15} weight="bold" />
            </Link>
          </motion.div>
        </div>

        {/* Right: editorial image (hidden on mobile, full-bleed on desktop) */}
        <div className="relative hidden lg:block bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
          <Image
            src="https://picsum.photos/seed/menswear-editorial-hero/800/1000"
            alt="AppleShirt editorial"
            fill
            priority
            sizes="45vw"
            className="object-cover object-center"
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* COLLECTIONS - Mixed bento grid (no three-equal-cards)               */}
      {/* Grid: [Shirts 2col][Trousers 1col] / [Accessories 1col][Outerwear 2col] */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-8 lg:px-16 xl:px-24 py-20 lg:py-28">
        <motion.h2
          {...revealOnScroll(0)}
          className="text-2xl md:text-3xl font-medium tracking-tight text-zinc-950 dark:text-zinc-50 mb-8"
        >
          Shop the collection
        </motion.h2>

        {/*
          Mobile  (grid-cols-2): Shirts full-row, Trousers+Accessories half each, Outerwear full-row
          Desktop (grid-cols-3): Shirts 2/3, Trousers 1/3, Accessories 1/3, Outerwear 2/3
          No empty cells at either breakpoint.
        */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3">
          <CollectionTile
            title="Shirts"
            href="/shop?category=shirts"
            image="https://picsum.photos/seed/dress-shirts-editorial/700/560"
            className="col-span-2 aspect-[4/3] lg:aspect-[16/10]"
          />
          <CollectionTile
            title="Trousers"
            href="/shop?category=trousers"
            image="https://picsum.photos/seed/tailored-trousers-editorial/400/560"
            className="col-span-1 aspect-[3/4]"
          />
          <CollectionTile
            title="Accessories"
            href="/shop?category=accessories"
            image="https://picsum.photos/seed/leather-accessories-minimal/500/400"
            className="col-span-1 aspect-[3/4]"
          />
          <CollectionTile
            title="Outerwear"
            href="/shop?category=outerwear"
            image="https://picsum.photos/seed/premium-outerwear-editorial/700/400"
            className="col-span-2 aspect-[4/3] lg:aspect-[16/10]"
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* BRAND STATEMENT - Full-width left-aligned, editorial type            */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-8 lg:px-16 xl:px-24 py-24 lg:py-32 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl">
          <motion.h2
            {...revealOnScroll(0)}
            className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tightest leading-[1.04] text-zinc-950 dark:text-zinc-50"
          >
            Built to last.
            <br />
            Worn with intent.
          </motion.h2>

          <motion.p
            {...revealOnScroll(0.15)}
            className="mt-8 text-base md:text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[55ch]"
          >
            Every piece in the AppleShirt collection is designed to outlast trends,
            crafted from materials chosen for longevity and precision cut for a modern fit.
          </motion.p>

          <motion.div {...revealOnScroll(0.28)} className="mt-10">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-950 dark:text-zinc-50 border-b border-zinc-950 dark:border-zinc-50 pb-0.5 hover:border-zinc-500 dark:hover:border-zinc-500 hover:text-zinc-500 dark:hover:text-zinc-500 transition-all duration-200"
            >
              Explore the range
              <ArrowRight size={14} weight="bold" />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}

// ---------------------------------------------------------------------------
// CollectionTile - individual category card (server-renderable, no motion)
// ---------------------------------------------------------------------------

function CollectionTile({
  title,
  href,
  image,
  className,
}: {
  title: string
  href: string
  image: string
  className?: string
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
        sizes="(max-width: 768px) 50vw, 33vw"
        className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-500 ease-out"
      />
      {/* Subtle scrim so text is always legible over the image */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-zinc-950/10 to-transparent group-hover:from-zinc-950/60 transition-colors duration-300" />
      <div className="absolute bottom-5 left-5">
        <span className="text-zinc-50 font-medium text-base tracking-tight">
          {title}
        </span>
      </div>
    </Link>
  )
}
