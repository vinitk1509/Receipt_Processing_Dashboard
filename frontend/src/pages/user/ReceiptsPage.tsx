import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, FileText, Plus, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { receiptApi } from '../../api/receiptApi'
import { RECEIPT_CATEGORIES } from '../../types/index'
import type { Receipt, ReceiptStatus, ReceiptCategory } from '../../types/index'
import Page from '../../components/layout/Page'
import StatusBadge from '../../components/ui/StatusBadge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { formatCurrency, formatDate } from '../../lib/utils'

const PAGE_SIZE = 8

const STATUS_OPTIONS: { value: ReceiptStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
]

export default function ReceiptsPage() {
  const { user } = useAuth()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ReceiptStatus | 'ALL'>('ALL')
  const [category, setCategory] = useState<ReceiptCategory | 'ALL'>('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [page, setPage] = useState(1)

  const loadReceipts = () => {
    receiptApi
      .listMine()
      .then((res) => {
        setReceipts(res.data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load receipts:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadReceipts()

    // Listen for live WebSocket updates
    const handleStatusUpdate = () => {
      loadReceipts()
    }
    window.addEventListener('receipt-status-updated', handleStatusUpdate)
    return () => {
      window.removeEventListener('receipt-status-updated', handleStatusUpdate)
    }
  }, [])

  const filtered = useMemo(() => {
    let rows = [...receipts]

    if (query.trim()) {
      const q = query.toLowerCase()
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      )
    }
    if (status !== 'ALL') rows = rows.filter((r) => r.status === status)
    if (category !== 'ALL') rows = rows.filter((r) => r.category === category)
    if (fromDate) rows = rows.filter((r) => r.receiptDate >= fromDate)
    if (toDate) rows = rows.filter((r) => r.receiptDate <= toDate)

    rows.sort((a, b) =>
      sortDir === 'desc'
        ? b.submittedAt.localeCompare(a.submittedAt)
        : a.submittedAt.localeCompare(b.submittedAt)
    )
    return rows
  }, [receipts, query, status, category, fromDate, toDate, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const hasFilters = query || status !== 'ALL' || category !== 'ALL' || fromDate || toDate

  function clearFilters() {
    setQuery('')
    setStatus('ALL')
    setCategory('ALL')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  function handleFilterChange(fn: () => void) {
    fn()
    setPage(1)
  }

  const inputClass =
    'px-3 py-2 rounded-lg border border-border bg-surface text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all'

  return (
    <Page
      title="My Receipts"
      subtitle="Track the status of all your submitted expenses."
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
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="flex items-center gap-2.5 bg-surface border border-border rounded-lg px-3 py-2 flex-1 min-w-52">
          <Search className="size-4 text-ink-muted shrink-0" aria-hidden />
          <input
            type="search"
            placeholder="Search receipts…"
            value={query}
            onChange={(e) => handleFilterChange(() => setQuery(e.target.value))}
            className="bg-transparent flex-1 text-sm text-ink placeholder:text-ink-muted outline-none"
            aria-label="Search receipts"
          />
        </div>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => handleFilterChange(() => setStatus(e.target.value as typeof status))}
          className={inputClass}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Category */}
        <select
          value={category}
          onChange={(e) => handleFilterChange(() => setCategory(e.target.value as typeof category))}
          className={inputClass}
          aria-label="Filter by category"
        >
          <option value="ALL">All categories</option>
          {RECEIPT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => handleFilterChange(() => setFromDate(e.target.value))}
            className={inputClass}
            aria-label="From date"
          />
          <span className="text-ink-muted text-sm">–</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => handleFilterChange(() => setToDate(e.target.value))}
            className={inputClass}
            aria-label="To date"
          />
        </div>

        {/* Sort */}
        <select
          value={sortDir}
          onChange={(e) => handleFilterChange(() => setSortDir(e.target.value as 'asc' | 'desc'))}
          className={inputClass}
          aria-label="Sort order"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>

        {/* Clear */}
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

      {/* Table panel */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {/* Results count */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle bg-canvas/50">
          <p className="text-xs text-ink-muted">
            {filtered.length} {filtered.length === 1 ? 'receipt' : 'receipts'}
          </p>
          <div className="flex items-center gap-1 text-ink-muted">
            <Filter className="size-3.5" aria-hidden />
            <span className="text-xs">{hasFilters ? 'Filtered' : 'All'}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead>
              <tr className="border-b border-border-subtle bg-canvas">
                {['Receipt', 'Category', 'Receipt date', 'Submitted', 'Amount', 'Status', 'Action'].map(
                  (h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide ${
                        h === 'Amount' ? 'text-right' : 'text-left'
                      } ${h === 'Receipt' ? 'pl-6' : ''}`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>

            {loading ? (
              <TableSkeleton />
            ) : (
              <tbody>
                {paged.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border-subtle last:border-0 hover:bg-canvas/60 transition-colors"
                  >
                    <td className="pl-6 pr-4 py-3.5">
                      <p className="font-semibold text-ink truncate max-w-[160px]">{r.title}</p>
                      <p className="text-xs text-ink-muted mt-0.5">{r.id}</p>
                    </td>
                    <td className="px-4 py-3.5 text-ink-secondary">{r.category}</td>
                    <td className="px-4 py-3.5 text-ink-secondary whitespace-nowrap">
                      {formatDate(r.receiptDate)}
                    </td>
                    <td className="px-4 py-3.5 text-ink-secondary whitespace-nowrap">
                      {formatDate(r.submittedAt)}
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
            )}
          </table>
        </div>

        {/* Empty state */}
        {!loading && paged.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <FileText className="size-10 text-border mb-3" aria-hidden />
            {hasFilters ? (
              <>
                <h3 className="font-semibold text-ink mb-1">No receipts match your filters</h3>
                <p className="text-sm text-ink-muted mb-4">Try adjusting or clearing your filters.</p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-border hover:bg-canvas transition-colors"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-border-subtle">
            <p className="text-xs text-ink-muted">
              Page {page} of {totalPages} · {filtered.length} receipts
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-ink-secondary hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-ink-secondary hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </Page>
  )
}
