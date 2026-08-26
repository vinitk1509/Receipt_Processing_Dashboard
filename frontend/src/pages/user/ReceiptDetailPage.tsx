import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { receiptApi } from '../../api/receiptApi'
import type { Receipt } from '../../types/index'
import Page from '../../components/layout/Page'
import StatusBadge from '../../components/ui/StatusBadge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import DocumentPreviewCard from '../../components/ui/DocumentPreviewCard'
import { formatCurrency, formatDate, formatDateTime } from '../../lib/utils'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">{label}</dt>
      <dd className="text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

export default function ReceiptDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    let isMounted = true
    receiptApi
      .get(id)
      .then((res) => {
        if (isMounted) {
          setReceipt(res.data)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Failed to load receipt detail:', err)
        if (isMounted) {
          setNotFound(true)
          setLoading(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [id])

  if (notFound) return <Navigate to="/receipts" replace />

  if (loading || !receipt) {
    return (
      <Page title="Receipt Details" subtitle="Loading receipt information…">
        <div className="p-6 bg-surface border border-border rounded-xl">
          <TableSkeleton rows={3} />
        </div>
      </Page>
    )
  }

  return (
    <Page
      title={receipt.title}
      subtitle={`${receipt.id} · Submitted ${formatDateTime(receipt.submittedAt)}`}
    >
      <div className="mb-5">
        <Link
          to="/receipts"
          className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink transition-colors"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Back to My Receipts
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <StatusBadge status={receipt.status} />
        <span className="text-sm text-ink-muted">
          {receipt.reviewedAt
            ? `Reviewed ${formatDate(receipt.reviewedAt)}`
            : 'Awaiting admin review'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* ── Main content ── */}
        <div className="flex flex-col gap-5">
          {/* Receipt information */}
          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="font-display text-base font-semibold text-ink mb-5">
              Receipt Information
            </h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <Field label="Amount" value={formatCurrency(receipt.amount)} />
              <Field label="Category" value={receipt.category} />
              <Field label="Receipt date" value={formatDate(receipt.receiptDate)} />
              <Field label="Submitted" value={formatDateTime(receipt.submittedAt)} />
              <Field label="Submitted by" value={receipt.user.fullName} />
              {receipt.notes && (
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">
                    Notes
                  </dt>
                  <dd className="text-sm text-ink-secondary leading-relaxed">{receipt.notes}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Attached document with in-app preview & modal */}
          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="font-display text-base font-semibold text-ink mb-4">
              Attached Document
            </h2>
            <DocumentPreviewCard
              receiptId={receipt.id}
              fileName={receipt.fileName}
              fileSize={receipt.fileSize}
            />
          </section>
        </div>

        {/* ── Review panel (read-only for users) ── */}
        <aside className="bg-surface border border-border rounded-xl p-6 h-max">
          <h2 className="font-display text-base font-semibold text-ink mb-4">Review Details</h2>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">
                Current status
              </p>
              <StatusBadge status={receipt.status} />
            </div>

            {receipt.reviewedBy && (
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">
                  Reviewed by
                </p>
                <p className="text-sm font-medium text-ink">{receipt.reviewedBy.fullName}</p>
              </div>
            )}

            {receipt.reviewedAt && (
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">
                  Review date
                </p>
                <p className="text-sm font-medium text-ink">{formatDateTime(receipt.reviewedAt)}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">
                Admin comment
              </p>
              {receipt.reviewComment ? (
                <p className="text-sm text-ink-secondary leading-relaxed bg-canvas rounded-lg p-3 border border-border-subtle">
                  {receipt.reviewComment}
                </p>
              ) : (
                <p className="text-sm text-ink-muted italic">
                  {receipt.status === 'PENDING'
                    ? 'Awaiting admin review.'
                    : 'No comment provided.'}
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </Page>
  )
}
