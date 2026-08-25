import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User } from '../types/index'
import { authApi } from '../api/authApi'

// ─── Types ────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null
  token: string | null
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string) => Promise<void>
  logout: () => void
}

// ─── Context ──────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Storage helpers ──────────────────────────────────────────────────────

const STORAGE_KEY_USER = 'clearclaim_user'
const STORAGE_KEY_TOKEN = 'clearclaim_token'

function loadFromStorage(): AuthState {
  try {
    const user = localStorage.getItem(STORAGE_KEY_USER)
    const token = localStorage.getItem(STORAGE_KEY_TOKEN)
    return { user: user ? (JSON.parse(user) as User) : null, token }
  } catch {
    return { user: null, token: null }
  }
}

function saveToStorage(user: User, token: string) {
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user))
  localStorage.setItem(STORAGE_KEY_TOKEN, token)
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY_USER)
  localStorage.removeItem(STORAGE_KEY_TOKEN)
}

// ─── Provider ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadFromStorage)

  // Verify and sync current user on initial mount if token exists
  useEffect(() => {
    if (state.token && !state.user) {
      authApi
        .me()
        .then((res) => {
          setState((prev) => ({ ...prev, user: res.data }))
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(res.data))
        })
        .catch(() => {
          clearStorage()
          setState({ user: null, token: null })
        })
    }
  }, [state.token, state.user])

  /**
   * Real Login API call
   */
  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    const { access_token, user } = res.data
    saveToStorage(user, access_token)
    setState({ user, token: access_token })
  }, [])

  /**
   * Real Registration API call
   */
  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      const res = await authApi.register({
        fullName,
        email,
        password,
        confirmPassword: password,
      })
      const { access_token, user } = res.data
      saveToStorage(user, access_token)
      setState({ user, token: access_token })
    },
    []
  )

  const logout = useCallback(() => {
    clearStorage()
    setState({ user: null, token: null })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isAuthenticated: !!state.user && !!state.token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
