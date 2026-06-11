'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { authApi } from './api'
import type { UserOut } from '@/types'

interface AuthState {
  user: UserOut | null
  token: string | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  })

  const refreshing = useRef(false)

  // On mount, silently try to exchange the httpOnly refresh cookie for a new
  // access token. This restores the session after a page reload.
  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (refreshing.current) return null
    refreshing.current = true
    try {
      const { data } = await authApi.refresh()
      setState({ user: data.user, token: data.access_token, isLoading: false })
      return data.access_token
    } catch {
      setState({ user: null, token: null, isLoading: false })
      return null
    } finally {
      refreshing.current = false
    }
  }, [])

  useEffect(() => {
    refreshToken()
  }, [refreshToken])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password)
    setState({ user: data.user, token: data.access_token, isLoading: false })
  }, [])

  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { data } = await authApi.register(email, password, fullName)
      setState({ user: data.user, token: data.access_token, isLoading: false })
    },
    []
  )

  const logout = useCallback(async () => {
    const currentToken = state.token
    // Clear client state immediately so UI updates right away
    setState({ user: null, token: null, isLoading: false })
    if (currentToken) {
      await authApi.logout(currentToken).catch(() => {})
    }
  }, [state.token])

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
