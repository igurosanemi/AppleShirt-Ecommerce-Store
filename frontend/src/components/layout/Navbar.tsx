'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useScroll, useMotionValueEvent } from 'motion/react'
import { ShoppingBag, UserCircle, List, X } from '@phosphor-icons/react'
import { useAuth } from '@/lib/auth-context'
import { useCart } from '@/lib/cart-context'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/shop?category=shirts', label: 'Shirts' },
  { href: '/shop?category=trousers', label: 'Trousers' },
  { href: '/shop?category=accessories', label: 'Accessories' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { scrollY } = useScroll()
  const { user, logout } = useAuth()
  const { cart } = useCart()
  const router = useRouter()
  const cartCount = cart?.item_count ?? 0

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 20)
  })

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 h-16 transition-all duration-300',
        scrolled
          ? 'bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-[1400px] mx-auto px-8 lg:px-16 xl:px-24 h-full flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
        >
          AppleShirt
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Action icons */}
        <div className="flex items-center gap-5">
          <Link
            href="/cart"
            aria-label={cartCount > 0 ? `Cart — ${cartCount} item${cartCount !== 1 ? 's' : ''}` : 'Cart'}
            className="relative text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors duration-150"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 text-[9px] font-semibold leading-none tabular-nums">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          <Link
            href={user ? '/account' : '/login'}
            aria-label={user ? 'My account' : 'Sign in'}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors duration-150"
          >
            <UserCircle size={20} />
          </Link>

          {/* Logout — visible only when authenticated */}
          {user && (
            <button
              onClick={handleLogout}
              className="hidden md:block text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors duration-150"
            >
              Sign out
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors duration-150"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-8 py-6 flex flex-col gap-5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <button
              onClick={() => { setMobileOpen(false); handleLogout() }}
              className="text-left text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
            >
              Sign out
            </button>
          )}
        </div>
      )}
    </header>
  )
}
