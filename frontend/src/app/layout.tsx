import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AuthProvider } from '@/lib/auth-context'
import { CartProvider } from '@/lib/cart-context'

export const metadata: Metadata = {
  title: {
    template: '%s | AppleShirt',
    default: 'AppleShirt - Considered Menswear',
  },
  description:
    'Premium menswear for the modern wardrobe. Shirts, trousers, accessories and outerwear.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <Navbar />
              <main>{children}</main>
              <Footer />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
