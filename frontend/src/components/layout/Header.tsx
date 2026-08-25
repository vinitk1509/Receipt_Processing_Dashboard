import { useLocation } from 'react-router-dom'
import { Menu, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

/** Converts a URL segment to a readable breadcrumb label */
function segmentToLabel(segment: string): string {
  const MAP: Record<string, string> = {
    dashboard: 'Dashboard',
    receipts: 'Receipts',
    new: 'New Receipt',
    admin: 'Admin',
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
  const location = useLocation()

  const segments = location.pathname.split('/').filter(Boolean)
  // Skip ID-looking segments from breadcrumb (e.g. REC-2026-00124)
  const breadcrumbSegments = segments.filter((s) => !s.startsWith('REC-') && !s.match(/^[0-9a-f-]{8,}$/))

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-8 shrink-0">
      {/* Left: mobile menu + breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="md:hidden text-ink-secondary hover:text-ink transition-colors p-1"
        >
          <Menu className="size-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-ink-muted min-w-0">
          <span>Clearclaim</span>
          {breadcrumbSegments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="text-border" aria-hidden>/</span>
              <span className={i === breadcrumbSegments.length - 1 ? 'text-ink font-medium' : ''}>
                {segmentToLabel(seg)}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right: user identity */}
      {user && (
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-ink leading-none">{user.fullName}</span>
            <span className="text-xs text-ink-muted mt-0.5">{user.role === 'ADMIN' ? 'Administrator' : 'Finance team'}</span>
          </div>
          <div className="size-8 rounded-full bg-primary-subtle flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">{user.initials}</span>
          </div>
          <ChevronDown className="size-3.5 text-ink-muted hidden sm:block" aria-hidden />
        </div>
      )}
    </header>
  )
}
