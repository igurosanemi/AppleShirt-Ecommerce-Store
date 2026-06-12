'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from '@phosphor-icons/react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    // Render a stable placeholder to avoid layout shift during hydration
    return (
      <span className="w-5 h-5 inline-block" aria-hidden />
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 dark:focus-visible:outline-zinc-50"
    >
      {isDark ? (
        <Sun size={20} weight="regular" aria-hidden />
      ) : (
        <Moon size={20} weight="regular" aria-hidden />
      )}
    </button>
  )
}
