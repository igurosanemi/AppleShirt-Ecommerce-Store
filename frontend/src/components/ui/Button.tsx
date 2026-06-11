import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'ghost'
  fullWidth?: boolean
}

export function Button({
  children,
  loading = false,
  variant = 'primary',
  fullWidth = true,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        'inline-flex items-center justify-center px-6 py-3 text-sm font-medium tracking-wide uppercase',
        'transition-all duration-200 active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        fullWidth && 'w-full',
        variant === 'primary' &&
          'bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200',
        variant === 'ghost' &&
          'border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 bg-transparent hover:border-zinc-950 dark:hover:border-zinc-50 hover:text-zinc-950 dark:hover:text-zinc-50',
        className
      )}
    >
      {loading ? 'Please wait...' : children}
    </button>
  )
}
