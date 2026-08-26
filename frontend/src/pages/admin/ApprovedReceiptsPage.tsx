import { useState, useMemo, useEffect } from 'react'
import { Download, FileSpreadsheet, Filter, X } from 'lucide-react'
import { adminApi } from '../../api/adminApi'
import { receiptApi } from '../../api/receiptApi'
import { RECEIPT_CATEGORIES } from '../../types/index'
import type { Receipt, User, ReceiptStatus, ReceiptCategory } from '../../types/index'
import Page from '../../components/layout/Page'
import StatusBadge from '../../components/ui/StatusBadge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { formatCurrency, formatDate } from '../../lib/utils'

const STATUS_FILTER_OPTIONS: { value: ReceiptStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'APPROVED', label: 'Approved only' },
  { value: 'PENDING', label: 'Pending only' },
  { value: 'REJECTED', label: 'Rejected only' },
]

export default function ApprovedReceiptsPage() {
  const { success, error: toastError } = useToast()

  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)

  const [status, setStatus] = useState<ReceiptStatus | 'ALL'>('ALL')
  const [userId, setUserId] = useState('ALL')
  const [category, setCategory] = useState<ReceiptCategory | 'ALL'>('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    let isMounted = true
    adminApi
      .list()
      .then((res) => {
        if (isMounted) {
          setReceipts(res.data)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Failed to load receipts for export:', err)
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
    let rows = [...receipts]
    if (status !== 'ALL') rows = rows.filter((r) => r.status === status)
    if (userId !== 'ALL') rows = rows.filter((r) => r.user.id === userId)
    if (category !== 'ALL') rows = rows.filter((r) => r.category === category)
    if (fromDate) rows = rows.filter((r) => r.receiptDate >= fromDate)
    if (toDate) rows = rows.filter((r) => r.receiptDate <= toDate)
    rows.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    return rows
  }, [receipts, status, userId, category, fromDate, toDate])

  const totalAmount = filtered.reduce((sum, r) => sum + r.amount, 0)
  const hasFilters = status !== 'ALL' || userId !== 'ALL' || category !== 'ALL' || fromDate || toDate

  function clearFilters() {
    setStatus('ALL')
    setUserId('ALL')
    setCategory('ALL')
    setFromDate('')
    setToDate('')
  }

  async function handleExport(format: 'csv' | 'excel') {
    try {
      await receiptApi.export(format, {
        status: status !== 'ALL' ? status : '',
        userId: userId !== 'ALL' ? userId : '',
        category: category !== 'ALL' ? category : '',
        fromDate,
        toDate,
      })
      success(`${format.toUpperCase()} export downloaded successfully.`)
    } catch (err) {
      toastError(`Failed to download ${format.toUpperCase()} export. Please try again.`)
    }
  }

  const inputClass =
    'px-3 py-2 rounded-lg border border-border bg-surface text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all'

  return (
    <Page
      title="Export Receipts"
      subtitle="View, filter, and export expense receipts across all statuses to CSV or Excel."
    >
      {/* Summary + export row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 p-5 bg-surface border border-border rounded-xl">
        <div>
          <p className="text-sm font-semibold text-ink">
            {loading ? '…' : `${filtered.length} matching ${filtered.length === 1 ? 'receipt' : 'receipts'}`}
          </p>
          <p className="text-2xl font-display font-bold text-ink mt-0.5">
            {loading ? '…' : formatCurrency(totalAmount)}
            <span className="text-base font-normal text-ink-muted ml-2">filtered total (AUD)</span>
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

      {/* Filters toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className={inputClass}
          aria-label="Filter by status"
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* User filter */}
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

        {/* Category filter */}
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

        {/* Date range with visible From and To labels */}
        <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-ink-secondary">
          <span className="font-medium text-ink-muted">From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-transparent text-xs text-ink outline-none py-1"
            aria-label="From date"
          />
          <span className="text-ink-muted px-1">To:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-transparent text-xs text-ink outline-none py-1"
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
          <p className="text-xs text-ink-muted">{filtered.length} receipts in view</p>
          <div className="flex items-center gap-1 text-ink-muted">
            <Filter className="size-3.5" aria-hidden />
            <span className="text-xs">{hasFilters ? 'Filtered' : 'All'}</span>
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
                  { label: 'Reviewed on', cls: '' },
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
            <h3 className="font-semibold text-ink mb-1">No receipts found</h3>
            <p className="text-sm text-ink-muted">
              {hasFilters
                ? 'No receipts match your current filter selection.'
                : 'No receipts have been submitted yet.'}
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
