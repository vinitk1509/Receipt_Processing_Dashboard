import { useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { ChevronLeft, FileText, Download, ExternalLink, AlertCircle } from 'lucide-react'
import { MOCK_RECEIPTS } from '../../data/mockData'
import Page from '../../components/layout/Page'
import StatusBadge from '../../components/ui/StatusBadge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useToast } from '../../components/ui/Toast'
import { formatCurrency, formatDate, formatDateTime } from '../../lib/utils'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">{label}</dt>
      <dd className="text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

export default function ReceiptReviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { success, error: toastError } = useToast()

  // Find the receipt (in production this would be fetched from the API)
  const receipt = MOCK_RECEIPTS.find((r) => r.id === id)

  const [comment, setComment] = useState(receipt?.reviewComment ?? '')
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [commentError, setCommentError] = useState('')

  if (!receipt) return <Navigate to="/admin/receipts" replace />

  // After this point receipt is guaranteed non-null — used in callbacks below
  const safeReceipt = receipt

  const isReviewed = !!receipt.reviewedAt
  const isPdf = receipt.fileName?.toLowerCase().endsWith('.pdf')

  async function handleApprove() {
    setLoading(true)
    try {
      // TODO: replace with → await adminApi.approve(safeReceipt.id, { reviewComment: comment })
      await new Promise((r) => setTimeout(r, 800))
      setShowApproveDialog(false)
      success(`Receipt ${safeReceipt.id} has been approved.`)
    } catch {
      toastError('Approval failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleReject() {
    setCommentError('')
    if (!comment.trim()) {
      setCommentError('A review comment is required when rejecting a receipt.')
      return
    }
    setLoading(true)
    // TODO: replace with → await adminApi.reject(safeReceipt.id, { reviewComment: comment })
    setTimeout(() => {
      setLoading(false)
      success(`Receipt ${safeReceipt.id} has been rejected.`)
    }, 700)
  }

  return (
    <>
      <Page
        title="Review Receipt"
        subtitle={`${receipt.id} · Submitted by ${receipt.user.fullName}`}
      >
        <div className="mb-5">
          <Link
            to="/admin/receipts"
            className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink transition-colors"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Back to Receipt Reviews
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <StatusBadge status={receipt.status} />
          <span className="text-sm text-ink-muted">
            {isReviewed
              ? `Reviewed ${formatDate(receipt.reviewedAt!)}`
              : 'Awaiting review'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
          {/* ── Left: Receipt details ── */}
          <div className="flex flex-col gap-5">
            {/* Receipt info */}
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
                <Field label="User email" value={receipt.user.email} />
                {receipt.notes && (
                  <div className="col-span-2 sm:col-span-3">
                    <dt className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">Notes</dt>
                    <dd className="text-sm text-ink-secondary leading-relaxed">{receipt.notes}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Document preview */}
            <section className="bg-surface border border-border rounded-xl p-6">
              <h2 className="font-display text-base font-semibold text-ink mb-4">
                Attached Document
              </h2>
              <div className="rounded-xl border border-border bg-canvas flex flex-col items-center justify-center py-14 mb-4 gap-3">
                <div className="size-14 rounded-full bg-primary-subtle flex items-center justify-center">
                  <FileText className="size-7 text-primary" aria-hidden />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-ink text-sm">{receipt.fileName}</p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {isPdf ? 'PDF document' : 'Image file'}
                    {receipt.fileSize ? ` · ${Math.round(receipt.fileSize / 1024)} KB` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-ink-secondary hover:bg-canvas transition-colors">
                  <ExternalLink className="size-4" aria-hidden />
                  Preview document
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-ink-secondary hover:bg-canvas transition-colors">
                  <Download className="size-4" aria-hidden />
                  Download
                </button>
              </div>
            </section>
          </div>

          {/* ── Right: Review panel ── */}
          <aside className="bg-surface border border-border rounded-xl p-6 h-max">
            <h2 className="font-display text-base font-semibold text-ink mb-1">Review Receipt</h2>
            <p className="text-sm text-ink-muted mb-5">
              Leave a clear comment for the submitter and mark the receipt as approved or rejected.
            </p>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-secondary">
                Review comment
                {receipt.status === 'PENDING' && (
                  <span className="text-xs font-normal text-ink-muted">
                    Required when rejecting
                  </span>
                )}
                <textarea
                  value={comment}
                  onChange={(e) => { setComment(e.target.value); setCommentError('') }}
                  placeholder="Add approval notes or reason for rejection…"
                  disabled={isReviewed || loading}
                  rows={5}
                  className="px-3.5 py-2.5 rounded-lg border border-border bg-surface text-sm text-ink placeholder:text-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-y min-h-[120px] disabled:opacity-60 disabled:bg-canvas"
                />
              </label>

              {commentError && (
                <div className="flex items-start gap-2 text-xs text-rejected bg-rejected-surface border border-rejected-border rounded-lg px-3 py-2.5">
                  <AlertCircle className="size-3.5 mt-0.5 shrink-0" aria-hidden />
                  {commentError}
                </div>
              )}

              {isReviewed ? (
                <div className="rounded-lg bg-canvas border border-border-subtle px-4 py-3 text-sm text-ink-secondary">
                  This receipt has already been reviewed and cannot be changed.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => setShowApproveDialog(true)}
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden />
                        Processing…
                      </>
                    ) : (
                      'Approve receipt'
                    )}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg border border-rejected-border bg-rejected-surface text-rejected text-sm font-semibold hover:bg-rejected/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Reject receipt
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </Page>

      {/* Approve confirmation dialog */}
      <ConfirmDialog
        open={showApproveDialog}
        title="Approve this receipt?"
        description="The receipt will be marked as approved and the submitter will be notified. This action cannot be undone."
        confirmLabel="Approve receipt"
        cancelLabel="Cancel"
        loading={loading}
        onConfirm={handleApprove}
        onCancel={() => setShowApproveDialog(false)}
      />
    </>
  )
}
