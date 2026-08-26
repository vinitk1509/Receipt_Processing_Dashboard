import { Link, useLocation } from 'react-router-dom'
import { Menu, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'

/** Converts a URL segment to a readable breadcrumb label */
function segmentToLabel(segment: string): string {
  const MAP: Record<string, string> = {
    dashboard: 'Dashboard',
    receipts: 'Receipts',
    new: 'New Receipt',
    admin: 'Admin Overview',
    approved: 'Approved Receipts',
    export: 'Export',
    account: 'Account',
  }
  return MAP[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)
}

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth()
  const { connected } = useNotifications()
  const location = useLocation()

  const segments = location.pathname.split('/').filter(Boolean)
  const homePath = user?.role === 'ADMIN' ? '/admin' : '/dashboard'

  // Construct clickable paths for breadcrumbs
  const breadcrumbItems = segments
    .filter((s) => !s.startsWith('REC-') && !s.match(/^[0-9a-f-]{8,}$/))
    .map((seg, index, arr) => {
      // Reconstruct partial path up to this segment
      const targetPath = '/' + segments.slice(0, segments.indexOf(seg) + 1).join('/')
      const isLast = index === arr.length - 1
      return {
        label: segmentToLabel(seg),
        path: targetPath,
        isLast,
      }
    })

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-8 shrink-0">
      {/* Left: mobile menu + clickable breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="md:hidden text-ink-secondary hover:text-ink transition-colors p-1"
        >
          <Menu className="size-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-ink-muted min-w-0">
          <Link
            to={homePath}
            className="hover:text-ink transition-colors font-medium hover:underline"
          >
            Clearclaim
          </Link>

          {breadcrumbItems.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="text-border" aria-hidden>/</span>
              {item.isLast ? (
                <span className="text-ink font-semibold">{item.label}</span>
              ) : (
                <Link
                  to={item.path}
                  className="hover:text-ink transition-colors hover:underline"
                >
                  {item.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: Live indicator + user identity */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Real-time live status badge */}
        <div
          title={connected ? 'Real-time notifications active' : 'Connecting to live notifications…'}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-canvas/60 text-xs font-medium text-ink-muted select-none"
        >
          <span className="relative flex size-2">
            {connected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-approved opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full size-2 ${
                connected ? 'bg-approved' : 'bg-pending'
              }`}
            ></span>
          </span>
          <span className="text-[11px]">{connected ? 'Live' : 'Syncing'}</span>
        </div>

        {user && (
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-ink leading-none">{user.fullName}</span>
              <span className="text-xs text-ink-muted mt-0.5">
                {user.role === 'ADMIN' ? 'Administrator' : 'User'}
              </span>
            </div>
            <div className="size-8 rounded-full bg-primary-subtle flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{user.initials}</span>
            </div>
            <ChevronDown className="size-3.5 text-ink-muted hidden sm:block" aria-hidden />
          </div>
        )}
      </div>
    </header>
  )
}
