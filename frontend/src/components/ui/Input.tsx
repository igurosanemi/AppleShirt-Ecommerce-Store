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
          'w-full h-11 px-4 text-[15px]',
          'bg-[var(--color-surface)] text-[var(--color-fg)]',
          'placeholder:text-[var(--color-subtle)]',
          'border transition-colors duration-150',
          'focus:outline-none',
          hasError
            ? 'border-red-400 dark:border-red-600 focus:border-red-500'
            : 'border-[var(--color-border)] focus:border-[var(--color-fg)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'
