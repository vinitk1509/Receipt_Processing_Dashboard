import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  ShieldCheck,
  CheckSquare,
  Download,
  UserRound,
  LogOut,
  FileCheck2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface NavItem {
  to: string
  label: string
  Icon: typeof LayoutDashboard
  /** exact match required for active state */
  end?: boolean
}

const USER_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Overview', Icon: LayoutDashboard, end: true },
  { to: '/receipts/new', label: 'Submit Receipt', Icon: UploadCloud, end: true },
  { to: '/receipts', label: 'My Receipts', Icon: FileText },
]

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Overview', Icon: LayoutDashboard, end: true },
  { to: '/admin/receipts', label: 'Receipt Reviews', Icon: ShieldCheck },
  { to: '/admin/approved', label: 'Approved Receipts', Icon: CheckSquare },
  { to: '/admin/export', label: 'Export', Icon: Download, end: true },
]

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const isAdmin = user?.role === 'ADMIN'
  const navItems = isAdmin ? ADMIN_NAV : USER_NAV

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex flex-col h-full w-64 bg-surface border-r border-border py-5 px-4">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-6">
        <div className="size-8 rounded-lg bg-mark flex items-center justify-center shrink-0">
          <FileCheck2 className="size-4 text-approved-surface" />
        </div>
        <span className="font-display text-xl font-bold text-ink">
          Clear<span className="text-accent">claim</span>
        </span>
      </div>

      {/* User card */}
      {user && (
        <div className="flex items-center gap-3 px-2 py-3 mb-4 rounded-xl bg-canvas border border-border-subtle">
          <div className="size-9 rounded-full bg-primary-subtle flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">{user.initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink truncate">{user.fullName}</p>
            <p className="text-xs text-ink-muted truncate">{user.email}</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav aria-label="Main navigation" className="flex-1 flex flex-col gap-0.5">
        {navItems.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-subtle text-primary font-semibold'
                  : 'text-ink-secondary hover:bg-canvas hover:text-ink'
              }`
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="flex flex-col gap-0.5 border-t border-border-subtle pt-4 mt-4">
        <NavLink
          to="/account"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-subtle text-primary font-semibold'
                : 'text-ink-secondary hover:bg-canvas hover:text-ink'
            }`
          }
        >
          <UserRound className="size-4 shrink-0" aria-hidden />
          Account
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink-secondary hover:bg-canvas hover:text-ink transition-colors w-full text-left"
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          Log out
        </button>

        {/* Role indicator */}
        <div className="flex items-center gap-2 px-3 py-2 mt-1">
          <span className="size-2 rounded-full bg-accent shrink-0" aria-hidden />
          <span className="text-xs text-ink-muted">
            {isAdmin ? 'Administrator account' : 'Finance team member'}
          </span>
        </div>
      </div>
    </aside>
  )
}
