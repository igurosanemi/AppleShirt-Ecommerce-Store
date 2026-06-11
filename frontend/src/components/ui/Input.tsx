'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          // Base
          'w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-900',
          'text-zinc-950 dark:text-zinc-50',
          'placeholder:text-zinc-500',
          // Border + focus ring — sharp, no radius (cold-luxury aesthetic)
          'border transition-colors duration-150',
          'focus:outline-none focus:ring-1',
          // Error vs normal state
          hasError
            ? 'border-red-400 dark:border-red-600 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500/20'
            : 'border-zinc-200 dark:border-zinc-700 focus:border-zinc-950 dark:focus:border-zinc-50 focus:ring-zinc-950/10 dark:focus:ring-zinc-50/10',
          // Disabled
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'
