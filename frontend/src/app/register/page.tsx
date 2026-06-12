'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import { useAuth } from '@/lib/auth-context'
import { ApiError } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!fullName.trim() || fullName.trim().length < 2) {
    errors.fullName = 'Enter your full name (at least 2 characters)'
  }
  if (!email.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address'
  }
  if (!password) {
    errors.password = 'Password is required'
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  }
  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (password && confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return errors
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RegisterPage() {
  const router = useRouter()
  const { register, token, isLoading: authLoading } = useAuth()
  const reduce = useReducedMotion()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Redirect away if already authenticated
  useEffect(() => {
    if (!authLoading && token) {
      router.replace('/')
    }
  }, [authLoading, token, router])

  if (authLoading) return null

  function clearError(field: string) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const errors = validate(fullName, email, password, confirmPassword)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setServerError('')
    setSubmitting(true)

    try {
      await register(email, password, fullName.trim())
      router.replace('/')
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(
          err.status === 409
            ? 'An account with this email already exists.'
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
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-20">
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
          Create an account.
        </h1>
        <p className="text-[14px] text-[var(--color-muted)] mb-8">
          Join AppleShirt to save your cart and track orders.
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

          {/* Full name */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="fullName"
              className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)]"
            >
              Full name
            </label>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              autoFocus
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); clearError('fullName') }}
              hasError={!!fieldErrors.fullName}
              placeholder="Jane Smith"
            />
            {fieldErrors.fullName && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                {fieldErrors.fullName}
              </p>
            )}
          </div>

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
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError('email') }}
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError('password') }}
              hasError={!!fieldErrors.password}
            />
            {fieldErrors.password ? (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                {fieldErrors.password}
              </p>
            ) : (
              <p className="text-[12px] text-[var(--color-subtle)]">
                At least 8 characters
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-[11px] uppercase tracking-label font-medium text-[var(--color-subtle)]"
            >
              Confirm password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword') }}
              hasError={!!fieldErrors.confirmPassword}
            />
            {fieldErrors.confirmPassword && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <Button type="submit" loading={submitting} className="mt-1">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-[13px] text-[var(--color-muted)]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[var(--color-fg)] underline underline-offset-2 hover:text-[var(--color-muted)] transition-colors"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
