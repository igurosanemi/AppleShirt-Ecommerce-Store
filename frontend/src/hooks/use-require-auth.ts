'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

/**
 * Use in any page that requires authentication.
 * Redirects to `redirectTo` as soon as auth state settles and no token is found.
 * Returns the current auth state for conditional rendering.
 */
export function useRequireAuth(redirectTo = '/login') {
  const { user, token, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace(`${redirectTo}?next=${encodeURIComponent(window.location.pathname)}`)
    }
  }, [isLoading, token, router, redirectTo])

  return { user, token, isLoading }
}
