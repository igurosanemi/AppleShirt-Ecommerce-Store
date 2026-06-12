import { Suspense } from 'react'
import { ShopContent } from './ShopContent'

export const metadata = {
  title: 'Shop',
  description: 'Browse our full collection of shirts, trousers, accessories and outerwear.',
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] pt-40 px-8 lg:px-16 xl:px-24 max-w-[1400px] mx-auto">
          <div className="h-10 w-48 bg-zinc-100 dark:bg-zinc-800 animate-pulse mb-16" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                <div className="h-4 w-40 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  )
}
