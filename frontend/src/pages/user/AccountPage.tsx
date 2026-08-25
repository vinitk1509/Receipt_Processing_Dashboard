import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogOut, Mail, ShieldCheck, User } from 'lucide-react'
import Page from '../../components/layout/Page'

export default function AccountPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  if (!user) return null

  return (
    <Page title="Account" subtitle="Your profile and access details.">
      <div className="max-w-lg">
        <div className="bg-surface border border-border rounded-xl p-6">
          {/* Avatar */}
          <div className="flex items-center gap-5 mb-6 pb-6 border-b border-border-subtle">
            <div className="size-16 rounded-full bg-primary-subtle flex items-center justify-center shrink-0">
              <span className="font-display text-xl font-bold text-primary">{user.initials}</span>
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">{user.fullName}</h2>
              <p className="text-sm text-ink-secondary">{user.email}</p>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 py-3 border-b border-border-subtle">
              <User className="size-4 text-ink-muted shrink-0" aria-hidden />
              <div>
                <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">Full name</p>
                <p className="text-sm font-medium text-ink mt-0.5">{user.fullName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-border-subtle">
              <Mail className="size-4 text-ink-muted shrink-0" aria-hidden />
              <div>
                <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">Email address</p>
                <p className="text-sm font-medium text-ink mt-0.5">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-3">
              <ShieldCheck className="size-4 text-ink-muted shrink-0" aria-hidden />
              <div>
                <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">Role</p>
                <p className="text-sm font-medium text-ink mt-0.5">
                  {user.role === 'ADMIN' ? 'Administrator' : 'Finance team member'}
                </p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 bg-canvas border border-border-subtle rounded-lg p-4 text-sm text-ink-secondary leading-relaxed">
            {user.role === 'USER'
              ? 'Your account has the USER role. Admin access is assigned by your organization administrator.'
              : 'Your account has full Administrator access. You can review, approve, and reject all receipts.'}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-semibold text-ink-secondary hover:bg-canvas hover:text-ink transition-colors"
          >
            <LogOut className="size-4" aria-hidden />
            Log out
          </button>
        </div>
      </div>
    </Page>
  )
}
