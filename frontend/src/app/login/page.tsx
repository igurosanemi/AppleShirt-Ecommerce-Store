'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import { useAuth } from '@/lib/auth-context'
import { ApiError } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(email: string, password: string): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!email.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address'
  }
  if (!password) {
    errors.password = 'Password is required'
  }
  return errors
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, token, isLoading: authLoading } = useAuth()
  const reduce = useReducedMotion()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Redirect away if already authenticated
  useEffect(() => {
    if (!authLoading && token) {
      const next = searchParams.get('next') ?? '/'
      router.replace(next)
    }
  }, [authLoading, token, router, searchParams])

  // Suppress flash-of-form while auth state resolves
  if (authLoading) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const errors = validate(email, password)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setServerError('')
    setSubmitting(true)

    try {
      await login(email, password)
      const next = searchParams.get('next') ?? '/'
      router.replace(next)
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(
          err.status === 401
            ? 'Invalid email or password.'
            : err.message
        )
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[360px]"
      >
        {/* Brand mark */}
        <Link
          href="/"
          className="block text-center mb-10 text-[11px] uppercase tracking-label font-medium text-[var(--color-fg)]"
        >
          AppleShirt
        </Link>

        <h1 className="text-[1.625rem] font-medium tracking-[-0.02em] text-[var(--color-fg)] mb-1">
          Welcome back.
        </h1>
        <p className="text-[14px] text-[var(--color-muted)] mb-8">
          Sign in to continue.
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {/* Server-level error */}
          {serverError && (
            <div
              role="alert"
              className="text-sm text-red-700 dark:text-red-400 px-3 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
            >
              {serverError}
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)]"
            >
              Email address
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }))
              }}
              hasError={!!fieldErrors.email}
              placeholder="you@example.com"
            />
            {fieldErrors.email && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)]"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }))
              }}
              hasError={!!fieldErrors.password}
            />
            {fieldErrors.password && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <Button type="submit" loading={submitting} className="mt-1">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-[13px] text-[var(--color-muted)]">
          No account?{' '}
          <Link
            href="/register"
            className="text-[var(--color-fg)] underline underline-offset-2 hover:text-[var(--color-muted)] transition-colors"
          >
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
