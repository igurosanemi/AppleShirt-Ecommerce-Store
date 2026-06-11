import clsx from 'clsx'
import type { ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]): string {
  return clsx(...inputs)
}

// All prices from the backend are integer cents — format only at the UI layer.
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}
