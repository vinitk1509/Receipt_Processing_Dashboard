import { Link } from 'react-router-dom'
import { Plus, TrendingUp } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { MOCK_RECEIPTS } from '../../data/mockData'
import Page from '../../components/layout/Page'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatCurrency, formatDate, getGreeting } from '../../lib/utils'

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <article className="bg-surface border border-border rounded-xl p-5">
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">{label}</p>
      <p className="font-display text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="text-xs text-ink-muted mt-1">{sub}</p>}
    </article>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()

  const myReceipts = MOCK_RECEIPTS.filter((r) => r.user.id === user?.id)
  const pending = myReceipts.filter((r) => r.status === 'PENDING')
  const approved = myReceipts.filter((r) => r.status === 'APPROVED')
  const rejected = myReceipts.filter((r) => r.status === 'REJECTED')
  const approvedTotal = approved.reduce((sum, r) => sum + r.amount, 0)

  const recent = myReceipts.slice(0, 5)

  return (
    <Page
      title={`${getGreeting()}, ${user?.fullName.split(' ')[0] ?? 'there'}`}
      subtitle="Here's an overview of your receipt submissions."
      action={
        <Link
          to="/receipts/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          <Plus className="size-4" aria-hidden />
          Submit Receipt
        </Link>
      }
    >
      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-7">
        <MetricCard label="Total receipts" value={String(myReceipts.length)} />
        <MetricCard label="Pending" value={String(pending.length)} sub="Awaiting review" />
        <MetricCard label="Approved" value={String(approved.length)} />
        <MetricCard label="Rejected" value={String(rejected.length)} />
        <MetricCard
          label="Approved amount"
          value={formatCurrency(approvedTotal)}
          sub="Total reimbursable"
        />
      </div>

      {/* Recent receipts */}
      <div className="bg-surface border border-border rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">Recent receipts</h2>
            <p className="text-xs text-ink-muted mt-0.5">Your latest submitted expenses</p>
          </div>
          <Link to="/receipts" className="text-sm font-semibold text-primary hover:underline">
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <TrendingUp className="size-10 text-border mb-3" aria-hidden />
            <h3 className="font-semibold text-ink mb-1">No receipts yet</h3>
            <p className="text-sm text-ink-muted mb-4">
              Once you submit a receipt, it will appear here.
            </p>
            <Link
              to="/receipts/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              <Plus className="size-4" aria-hidden />
              Submit your first receipt
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-border-subtle bg-canvas">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                    Receipt
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-b border-border-subtle last:border-0 hover:bg-canvas/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-ink truncate max-w-[180px]">{r.title}</p>
                      <p className="text-xs text-ink-muted mt-0.5">{r.id}</p>
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
                        to={`/receipts/${r.id}`}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        View
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
