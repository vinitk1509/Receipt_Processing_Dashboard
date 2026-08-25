import { useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface AppShellProps {
  children: ReactNode
}

/**
 * Main application shell.
 * Desktop: persistent sidebar + header + scrollable main content.
 * Mobile: header with hamburger → slide-in sidebar overlay.
 */
export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* ── Desktop sidebar (always visible) ── */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          aria-modal="true"
          role="dialog"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 z-50">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main column ── */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
