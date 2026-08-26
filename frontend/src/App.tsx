import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// ── Auth pages ──────────────────────────────────────────────────────────
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// ── User pages ──────────────────────────────────────────────────────────
import DashboardPage from './pages/user/DashboardPage'
import ReceiptsPage from './pages/user/ReceiptsPage'
import SubmitReceiptPage from './pages/user/SubmitReceiptPage'
import ReceiptDetailPage from './pages/user/ReceiptDetailPage'
import AccountPage from './pages/user/AccountPage'

// ── Admin pages ─────────────────────────────────────────────────────────
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import ReceiptReviewsPage from './pages/admin/ReceiptReviewsPage'
import ReceiptReviewDetailPage from './pages/admin/ReceiptReviewDetailPage'
import ApprovedReceiptsPage from './pages/admin/ApprovedReceiptsPage'

// ── Layout & routing ────────────────────────────────────────────────────
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './routes/ProtectedRoute'

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* ── Public routes ──────────────────────────────────────────── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── Root redirect ──────────────────────────────────────────── */}
      <Route
        path="/"
        element={
          <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />
        }
      />

      {/* ── User routes ────────────────────────────────────────────── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {user?.role === 'ADMIN' ? (
              <Navigate to="/admin" replace />
            ) : (
              <AppShell>
                <DashboardPage />
              </AppShell>
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/receipts"
        element={
          <ProtectedRoute>
            <AppShell>
              <ReceiptsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/receipts/new"
        element={
          <ProtectedRoute>
            <AppShell>
              <SubmitReceiptPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/receipts/:id"
        element={
          <ProtectedRoute>
            <AppShell>
              <ReceiptDetailPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AppShell>
              <AccountPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* ── Admin-only routes ───────────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AppShell>
              <AdminDashboardPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/receipts"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AppShell>
              <ReceiptReviewsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/receipts/:id"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AppShell>
              <ReceiptReviewDetailPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/approved"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AppShell>
              <ApprovedReceiptsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/export"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AppShell>
              <ApprovedReceiptsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* ── 404 fallback ───────────────────────────────────────────── */}
      <Route
        path="*"
        element={
          <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
