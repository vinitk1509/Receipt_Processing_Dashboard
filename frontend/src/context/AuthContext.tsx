import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User } from '../types/index'
import {
  MOCK_USER_ALEX,
  MOCK_ADMIN_PRIYA,
  MOCK_USER_RAJ,
  DEMO_CREDENTIALS,
} from '../data/mockData'

// ─── Types ────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null
  token: string | null
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean
  /** Simulates login — swap body with real authApi.login() call */
  login: (email: string, password: string) => Promise<void>
  /** Simulates registration — swap body with real authApi.register() call */
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

  /**
   * Login — swap this body with a real authApi.login() call when the backend is ready.
   */
  const login = useCallback(async (email: string, password: string) => {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600))

    let user: User
    if (email === DEMO_CREDENTIALS.admin.email) {
      user = MOCK_ADMIN_PRIYA
    } else if (email === DEMO_CREDENTIALS.user.email) {
      user = MOCK_USER_ALEX
    } else if (email.includes('raj')) {
      user = MOCK_USER_RAJ
    } else if (email.includes('@')) {
      // Any other valid email logs in as the demo user
      user = { ...MOCK_USER_ALEX, email }
    } else {
      throw new Error('Invalid email or password.')
    }

    if (password.length < 6) throw new Error('Invalid email or password.')

    const token = 'demo-jwt-token'
    saveToStorage(user, token)
    setState({ user, token })
  }, [])

  /**
   * Register — swap this body with a real authApi.register() call when the backend is ready.
   * New users always receive the USER role.
   */
  const register = useCallback(
    async (fullName: string, email: string, _password: string) => {
      await new Promise((r) => setTimeout(r, 700))

      const initials = fullName
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()

      const user: User = {
        id: `u-${Date.now()}`,
        fullName,
        email,
        role: 'USER',
        initials,
      }
      const token = 'demo-jwt-token'
      saveToStorage(user, token)
      setState({ user, token })
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
        isAuthenticated: !!state.user,
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
