import { Link } from 'react-router-dom'
import { Clock, CheckCircle2, XCircle, InboxIcon } from 'lucide-react'
import { MOCK_RECEIPTS } from '../../data/mockData'
import Page from '../../components/layout/Page'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatCurrency, formatDate } from '../../lib/utils'

function MetricCard({
  label,
  value,
  icon: Icon,
  iconClass = '',
}: {
  label: string
  value: string
  icon?: typeof Clock
  iconClass?: string
}) {
  return (
    <article className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">{label}</p>
        {Icon && (
          <div className={`size-8 rounded-lg flex items-center justify-center ${iconClass}`}>
            <Icon className="size-4" aria-hidden />
          </div>
        )}
      </div>
      <p className="font-display text-2xl font-bold text-ink">{value}</p>
    </article>
  )
}

export default function AdminDashboardPage() {
  const all = MOCK_RECEIPTS
  const pending = all.filter((r) => r.status === 'PENDING')
  const approved = all.filter((r) => r.status === 'APPROVED')
  const rejected = all.filter((r) => r.status === 'REJECTED')
  const approvedValue = approved.reduce((sum, r) => sum + r.amount, 0)

  return (
    <Page
      title="Admin Overview"
      subtitle="Review and manage submitted receipts across all users."
    >
      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-7">
        <MetricCard label="Total submissions" value={String(all.length)} />
        <MetricCard
          label="Pending review"
          value={String(pending.length)}
          icon={Clock}
          iconClass="bg-pending-surface text-pending"
        />
        <MetricCard
          label="Approved"
          value={String(approved.length)}
          icon={CheckCircle2}
          iconClass="bg-approved-surface text-approved"
        />
        <MetricCard
          label="Rejected"
          value={String(rejected.length)}
          icon={XCircle}
          iconClass="bg-rejected-surface text-rejected"
        />
        <MetricCard label="Approved value" value={formatCurrency(approvedValue)} />
      </div>

      {/* Pending receipts panel */}
      <div className="bg-surface border border-border rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">
              Receipts awaiting review
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              {pending.length} pending{' '}
              {pending.length === 1 ? 'receipt needs' : 'receipts need'} attention
            </p>
          </div>
          <Link
            to="/admin/receipts"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all receipts
          </Link>
        </div>

        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <InboxIcon className="size-10 text-border mb-3" aria-hidden />
            <h3 className="font-semibold text-ink mb-1">You're all caught up</h3>
            <p className="text-sm text-ink-muted">
              There are currently no receipts waiting for review.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-border-subtle bg-canvas">
                  {[
                    'Receipt ID',
                    'Submitted by',
                    'Receipt',
                    'Category',
                    'Receipt date',
                    'Amount',
                    'Status',
                    'Action',
                  ].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide text-left ${
                        h === 'Amount' ? 'text-right' : ''
                      } ${h === 'Receipt ID' ? 'pl-6' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border-subtle last:border-0 hover:bg-canvas/60 transition-colors"
                  >
                    <td className="pl-6 pr-4 py-3.5">
                      <span className="text-xs font-semibold text-ink-muted font-mono">{r.id}</span>
                    </td>
                    <td className="px-4 py-3.5 text-ink-secondary">{r.user.fullName}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-ink truncate max-w-[160px]">{r.title}</p>
                    </td>
                    <td className="px-4 py-3.5 text-ink-secondary">{r.category}</td>
                    <td className="px-4 py-3.5 text-ink-secondary whitespace-nowrap">
                      {formatDate(r.receiptDate)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-ink whitespace-nowrap">
                      {formatCurrency(r.amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/admin/receipts/${r.id}`}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Page>
  )
}
