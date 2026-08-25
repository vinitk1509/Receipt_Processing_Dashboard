import type { ReceiptStatus } from '../../types/index'

const CONFIG: Record<
  ReceiptStatus,
  { label: string; dot: string; badge: string }
> = {
  PENDING: {
    label: 'Pending',
    dot: 'bg-pending',
    badge: 'bg-pending-surface text-pending border border-pending-border',
  },
  APPROVED: {
    label: 'Approved',
    dot: 'bg-approved',
    badge: 'bg-approved-surface text-approved border border-approved-border',
  },
  REJECTED: {
    label: 'Rejected',
    dot: 'bg-rejected',
    badge: 'bg-rejected-surface text-rejected border border-rejected-border',
  },
}

interface StatusBadgeProps {
  status: ReceiptStatus
  /** Compact removes the label, showing only the dot */
  compact?: boolean
}

export default function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const { label, dot, badge } = CONFIG[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${badge}`}
      aria-label={`Status: ${label}`}
    >
      <span className={`size-1.5 rounded-full ${dot} shrink-0`} aria-hidden />
      {!compact && label}
    </span>
  )
}
