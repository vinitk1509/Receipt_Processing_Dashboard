import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types/index'

interface ProtectedRouteProps {
  /** Restrict to a specific role. Omit to allow any authenticated user. */
  requiredRole?: UserRole
  children: React.ReactNode
}

/**
 * Guards a route behind authentication (and optionally role checks).
 *
 * - Unauthenticated  → redirect to /login (preserving intended destination)
 * - Wrong role       → redirect to /dashboard
 * - Authenticated    → render children
 */
export default function ProtectedRoute({ requiredRole, children }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    const fallback = user?.role === 'ADMIN' ? '/admin' : '/dashboard'
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
