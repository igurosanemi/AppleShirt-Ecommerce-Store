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
        'inline-flex items-center justify-center h-11 px-6 gap-2',
        'text-[11px] font-medium tracking-label uppercase',
        'transition-all duration-200 active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        fullWidth && 'w-full',
        variant === 'primary' && [
          'bg-[var(--color-primary)] text-[var(--color-primary-fg)]',
          'hover:opacity-80',
          'focus-visible:outline-[var(--color-fg)]',
        ],
        variant === 'ghost' && [
          'border border-[var(--color-border-strong)] text-[var(--color-fg)]',
          'hover:border-[var(--color-fg)] bg-transparent',
          'focus-visible:outline-[var(--color-fg)]',
        ],
        className
      )}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 border border-current border-t-transparent animate-spin" />
          <span>Please wait</span>
        </span>
      ) : children}
    </button>
  )
}
