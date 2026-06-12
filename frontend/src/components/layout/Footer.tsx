import Link from 'next/link'

const SHOP_LINKS = [
  { href: '/shop', label: 'All Products' },
  { href: '/shop?category=shirts', label: 'Shirts' },
  { href: '/shop?category=trousers', label: 'Trousers' },
  { href: '/shop?category=accessories', label: 'Accessories' },
  { href: '/shop?category=outerwear', label: 'Outerwear' },
]

const ACCOUNT_LINKS = [
  { href: '/login', label: 'Sign In' },
  { href: '/register', label: 'Create Account' },
  { href: '/orders', label: 'My Orders' },
]

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-16 xl:px-24 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Brand */}
          <div>
            <p className="text-[13px] font-medium tracking-[-0.01em] text-[var(--color-fg)] mb-3">
              AppleShirt
            </p>
            <p className="text-[13px] text-[var(--color-muted)] leading-relaxed max-w-[30ch]">
              Considered menswear for the modern wardrobe.
            </p>
          </div>

          {/* Shop */}
          <div>
            <p className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)] mb-5">
              Shop
            </p>
            <ul className="flex flex-col gap-2.5">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)] mb-5">
              Account
            </p>
            <ul className="flex flex-col gap-2.5">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-[var(--color-border)] flex flex-col sm:flex-row justify-between gap-2">
          <p className="text-[11px] text-[var(--color-subtle)]">
            © 2026 AppleShirt. All rights reserved.
          </p>
          <p className="text-[11px] text-[var(--color-subtle)]">
            Crafted with care.
          </p>
        </div>
      </div>
    </footer>
  )
}
