import { useState, useMemo, useEffect } from 'react'
import { Download, FileSpreadsheet, Filter, X } from 'lucide-react'
import { adminApi } from '../../api/adminApi'
import { receiptApi } from '../../api/receiptApi'
import { RECEIPT_CATEGORIES } from '../../types/index'
import type { Receipt, User, ReceiptCategory } from '../../types/index'
import Page from '../../components/layout/Page'
import StatusBadge from '../../components/ui/StatusBadge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { formatCurrency, formatDate } from '../../lib/utils'

export default function ApprovedReceiptsPage() {
  const { success, error: toastError } = useToast()

  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)

  const [userId, setUserId] = useState('ALL')
  const [category, setCategory] = useState<ReceiptCategory | 'ALL'>('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    let isMounted = true
    adminApi
      .list({ status: 'APPROVED' })
      .then((res) => {
        if (isMounted) {
          setReceipts(res.data)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Failed to load approved receipts:', err)
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Extract unique users
  const availableUsers = useMemo(() => {
    const map = new Map<string, User>()
    for (const r of receipts) {
      if (r.user && !map.has(r.user.id)) {
        map.set(r.user.id, r.user)
      }
    }
    return Array.from(map.values())
  }, [receipts])

  const filtered = useMemo(() => {
    let rows = receipts.filter((r) => r.status === 'APPROVED')
    if (userId !== 'ALL') rows = rows.filter((r) => r.user.id === userId)
    if (category !== 'ALL') rows = rows.filter((r) => r.category === category)
    if (fromDate) rows = rows.filter((r) => r.receiptDate >= fromDate)
    if (toDate) rows = rows.filter((r) => r.receiptDate <= toDate)
    rows.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    return rows
  }, [receipts, userId, category, fromDate, toDate])

  const totalApproved = filtered.reduce((sum, r) => sum + r.amount, 0)
  const hasFilters = userId !== 'ALL' || category !== 'ALL' || fromDate || toDate

  function clearFilters() {
    setUserId('ALL')
    setCategory('ALL')
    setFromDate('')
    setToDate('')
  }

  async function handleExport(format: 'csv' | 'excel') {
    try {
      await receiptApi.export(format)
      success(`${format.toUpperCase()} export downloaded successfully.`)
    } catch (err) {
      toastError(`Failed to download ${format.toUpperCase()} export. Please try again.`)
    }
  }

  const inputClass =
    'px-3 py-2 rounded-lg border border-border bg-surface text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all'

  return (
    <Page
      title="Approved Receipts"
      subtitle="View and export all approved expense receipts."
    >
      {/* Summary + export row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 p-5 bg-surface border border-border rounded-xl">
        <div>
          <p className="text-sm font-semibold text-ink">
            {loading ? '…' : `${filtered.length} approved ${filtered.length === 1 ? 'receipt' : 'receipts'}`}
          </p>
          <p className="text-2xl font-display font-bold text-ink mt-0.5">
            {loading ? '…' : formatCurrency(totalApproved)}
            <span className="text-base font-normal text-ink-muted ml-2">total approved</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-surface text-sm font-semibold text-ink-secondary hover:bg-canvas transition-colors"
          >
            <Download className="size-4" aria-hidden />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            <FileSpreadsheet className="size-4" aria-hidden />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className={inputClass}
          aria-label="Filter by user"
        >
          <option value="ALL">All users</option>
          {availableUsers.map((u) => (
            <option key={u.id} value={u.id}>{u.fullName}</option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as typeof category)}
          className={inputClass}
          aria-label="Filter by category"
        >
          <option value="ALL">All categories</option>
          {RECEIPT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={inputClass}
            aria-label="From date"
          />
          <span className="text-ink-muted text-sm">–</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={inputClass}
            aria-label="To date"
          />
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-ink-secondary hover:text-ink border border-border hover:border-ink/20 transition-colors"
          >
            <X className="size-3.5" aria-hidden />
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle bg-canvas/50">
          <p className="text-xs text-ink-muted">{filtered.length} approved receipts</p>
          <div className="flex items-center gap-1 text-ink-muted">
            <Filter className="size-3.5" aria-hidden />
            <span className="text-xs">{hasFilters ? 'Filtered' : 'All approved'}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-border-subtle bg-canvas">
                {[
                  { label: 'Receipt ID', cls: 'pl-6' },
                  { label: 'Submitted by', cls: '' },
                  { label: 'Title', cls: '' },
                  { label: 'Category', cls: '' },
                  { label: 'Receipt date', cls: '' },
                  { label: 'Approved on', cls: '' },
                  { label: 'Amount', cls: 'text-right' },
                  { label: 'Status', cls: '' },
                ].map(({ label, cls }) => (
                  <th
                    key={label}
                    className={`px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide text-left ${cls}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton />
            ) : (
              <tbody>
                {filtered.map((r) => (
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
                    <td className="px-4 py-3.5 text-ink-secondary whitespace-nowrap">
                      {r.reviewedAt ? formatDate(r.reviewedAt) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-ink whitespace-nowrap">
                      {formatCurrency(r.amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <FileSpreadsheet className="size-10 text-border mb-3" aria-hidden />
            <h3 className="font-semibold text-ink mb-1">No approved receipts</h3>
            <p className="text-sm text-ink-muted">
              {hasFilters
                ? 'No approved receipts match your current filters.'
                : 'No receipts have been approved yet.'}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold border border-border hover:bg-canvas transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </Page>
  )
}
