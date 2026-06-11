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
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-16 xl:px-24 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Brand */}
          <div>
            <p className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 mb-3">
              AppleShirt
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[30ch]">
              Considered menswear for the modern wardrobe.
            </p>
          </div>

          {/* Shop */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-4">
              Shop
            </p>
            <ul className="flex flex-col gap-2.5">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-4">
              Account
            </p>
            <ul className="flex flex-col gap-2.5">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between gap-2">
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            2026 AppleShirt. All rights reserved.
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Crafted with care.
          </p>
        </div>
      </div>
    </footer>
  )
}
