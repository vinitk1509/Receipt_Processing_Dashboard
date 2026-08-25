import type { ReactNode } from 'react'

interface PageProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}

/**
 * Standard page container used across all authenticated pages.
 * Provides consistent max-width, padding, and title/action header.
 */
export default function Page({ title, subtitle, action, children }: PageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <p className="text-xs font-bold tracking-widest text-accent uppercase mb-2">
            Clearclaim
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-ink-secondary mt-1.5 max-w-xl">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  )
}
