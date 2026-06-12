'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useScroll, useMotionValueEvent, motion, AnimatePresence } from 'motion/react'
import { ShoppingBag, UserCircle, List, X, Package } from '@phosphor-icons/react'
import { useAuth } from '@/lib/auth-context'
import { useCart } from '@/lib/cart-context'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/shop', label: 'Shop', category: null },
  { href: '/shop?category=shirts', label: 'Shirts', category: 'shirts' },
  { href: '/shop?category=trousers', label: 'Trousers', category: 'trousers' },
  { href: '/shop?category=accessories', label: 'Accessories', category: 'accessories' },
  { href: '/shop?category=outerwear', label: 'Outerwear', category: 'outerwear' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  // Read category from window.location on client — avoids useSearchParams / Suspense requirement
  const [activeCategory, setActiveCategory] = useState<string>('')

  const { scrollY } = useScroll()
  const { user, logout } = useAuth()
  const { cart } = useCart()
  const router = useRouter()
  const pathname = usePathname()
  const cartCount = cart?.item_count ?? 0

  // Sync category from URL on every navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveCategory(new URLSearchParams(window.location.search).get('category') ?? '')
    }
  }, [pathname])

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 20)
  })

  function isActive(link: (typeof NAV_LINKS)[number]) {
    if (pathname !== '/shop') return false
    if (link.category) return activeCategory === link.category
    return !activeCategory
  }

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 h-16 transition-all duration-300',
        scrolled
          ? 'bg-[#F6F6F6]/95 dark:bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-[var(--color-border)]'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-[1400px] mx-auto px-8 lg:px-16 xl:px-24 h-full flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-[13px] font-medium tracking-[-0.01em] text-[var(--color-fg)]"
        >
          AppleShirt
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {NAV_LINKS.map((link) => {
            const active = isActive(link)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative text-[13px] transition-colors duration-150 pb-0.5',
                  active
                    ? 'text-[var(--color-fg)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-fg)]'
                )}
              >
                {link.label}
                {active && (
                  <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-[var(--color-fg)]" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Action icons */}
        <div className="flex items-center gap-5">
          <ThemeToggle />

          <Link
            href="/cart"
            aria-label={cartCount > 0 ? `Cart — ${cartCount} item${cartCount !== 1 ? 's' : ''}` : 'Cart'}
            className="relative text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors duration-150"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-[var(--color-fg)] text-[var(--color-bg)] text-[9px] font-semibold leading-none tabular-nums">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <Link
                href="/orders"
                aria-label="My orders"
                className="text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors duration-150"
              >
                <Package size={20} />
              </Link>
              <button
                onClick={handleLogout}
                className="hidden md:block text-[11px] uppercase tracking-label text-[var(--color-subtle)] hover:text-[var(--color-fg)] transition-colors duration-150"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              aria-label="Sign in"
              className="text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors duration-150"
            >
              <UserCircle size={20} />
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors duration-150"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer — animated */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            id="mobile-menu"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="md:hidden bg-[var(--color-bg)] border-b border-[var(--color-border)] px-8 py-6 flex flex-col gap-5"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-[13px] transition-colors',
                  isActive(link)
                    ? 'text-[var(--color-fg)] font-medium'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-fg)]'
                )}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/orders"
                  className="text-[13px] text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
                >
                  My Orders
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-left text-[13px] text-[var(--color-subtle)] hover:text-[var(--color-fg)] transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-[13px] text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
              >
                Sign in
              </Link>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
