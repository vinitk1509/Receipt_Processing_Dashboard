import { useState, useEffect } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { ChevronLeft, AlertCircle } from 'lucide-react'
import { adminApi } from '../../api/adminApi'
import type { Receipt } from '../../types/index'
import Page from '../../components/layout/Page'
import StatusBadge from '../../components/ui/StatusBadge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { TableSkeleton } from '../../components/ui/Skeleton'
import DocumentPreviewCard from '../../components/ui/DocumentPreviewCard'
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

  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [loadingReceipt, setLoadingReceipt] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [comment, setComment] = useState('')
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [commentError, setCommentError] = useState('')

  useEffect(() => {
    if (!id) return
    let isMounted = true
    adminApi
      .get(id)
      .then((res) => {
        if (isMounted) {
          setReceipt(res.data)
          setComment(res.data.reviewComment ?? '')
          setLoadingReceipt(false)
        }
      })
      .catch((err) => {
        console.error('Failed to load receipt:', err)
        if (isMounted) {
          setNotFound(true)
          setLoadingReceipt(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [id])

  if (notFound) return <Navigate to="/admin/receipts" replace />

  if (loadingReceipt || !receipt) {
    return (
      <Page title="Review Receipt" subtitle="Loading receipt details…">
        <div className="p-6 bg-surface border border-border rounded-xl">
          <TableSkeleton rows={4} />
        </div>
      </Page>
    )
  }

  const safeReceipt = receipt
  const isReviewed = receipt.status !== 'PENDING'

  async function handleApprove() {
    setLoading(true)
    try {
      const res = await adminApi.approve(safeReceipt.id, { reviewComment: comment })
      setReceipt(res.data)
      setShowApproveDialog(false)
      success(`Receipt ${safeReceipt.id} has been approved.`)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Approval failed. Please try again.'
      toastError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleReject() {
    setCommentError('')
    if (!comment.trim()) {
      setCommentError('A review comment is required when rejecting a receipt.')
      return
    }
    setLoading(true)
    try {
      const res = await adminApi.reject(safeReceipt.id, { reviewComment: comment })
      setReceipt(res.data)
      success(`Receipt ${safeReceipt.id} has been rejected.`)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Rejection failed. Please try again.'
      toastError(msg)
    } finally {
      setLoading(false)
    }
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
            {isReviewed && receipt.reviewedAt
              ? `Reviewed ${formatDate(receipt.reviewedAt)}`
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

            {/* Document preview with interactive thumbnail & in-app modal */}
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
                  <p className="font-semibold text-ink mb-1">
                    This receipt has been {receipt.status.toLowerCase()}.
                  </p>
                  {receipt.reviewedBy && (
                    <p className="text-xs text-ink-muted">
                      Reviewed by {receipt.reviewedBy.fullName}
                      {receipt.reviewedAt && ` on ${formatDate(receipt.reviewedAt)}`}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setShowApproveDialog(true)}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-approved text-white text-sm font-semibold hover:bg-approved/90 disabled:opacity-50 transition-all shadow-sm"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleReject}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-rejected text-white text-sm font-semibold hover:bg-rejected/90 disabled:opacity-50 transition-all shadow-sm"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </Page>

      <ConfirmDialog
        open={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={handleApprove}
        title="Approve this receipt?"
        description={`You are about to approve receipt ${safeReceipt.id} for ${formatCurrency(
          safeReceipt.amount
        )} submitted by ${safeReceipt.user.fullName}. This action marks the expense as reimbursable.`}
        confirmLabel="Approve Receipt"
        confirmVariant="primary"
        loading={loading}
        onCancel={() => setShowApproveDialog(false)}
      />
    </>
  )
}
