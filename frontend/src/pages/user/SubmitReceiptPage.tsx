import { useState, useCallback, type FormEvent, type DragEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react'
import { RECEIPT_CATEGORIES } from '../../types/index'
import Page from '../../components/layout/Page'
import { useToast } from '../../components/ui/Toast'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ACCEPTED = ['.pdf', '.jpg', '.jpeg', '.png']
const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png']

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function SubmitReceiptPage() {
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [receiptDate, setReceiptDate] = useState('')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [fileError, setFileError] = useState('')
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  function validateAndSetFile(f: File | undefined) {
    setFileError('')
    if (!f) return
    if (!ACCEPTED_MIME.includes(f.type)) {
      setFileError('Only PDF, JPG, JPEG, and PNG files are accepted.')
      return
    }
    if (f.size > MAX_FILE_SIZE_BYTES) {
      setFileError('File must be smaller than 10 MB.')
      return
    }
    setFile(f)
  }

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    validateAndSetFile(e.dataTransfer.files[0])
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!title.trim()) { setFormError('Please enter a receipt title.'); return }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setFormError('Please enter a valid amount greater than zero.')
      return
    }
    if (!receiptDate) { setFormError('Please select the receipt date.'); return }
    if (!category) { setFormError('Please select a category.'); return }
    if (!file) { setFormError('Please attach a receipt file.'); return }

    setLoading(true)
    try {
      // TODO: replace with real API call → receiptApi.create({ title, amount: Number(amount), receiptDate, category, notes, file })
      await new Promise((r) => setTimeout(r, 800))

      success('Receipt submitted successfully. It will be reviewed by an admin.')
      navigate('/receipts')
    } catch {
      toastError('Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'px-3.5 py-2.5 rounded-lg border border-border bg-surface text-sm text-ink placeholder:text-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all disabled:opacity-60 w-full'
  const labelClass = 'flex flex-col gap-1.5 text-sm font-semibold text-ink-secondary'

  return (
    <Page
      title="Submit Receipt"
      subtitle="Upload a receipt and fill in the details for admin review."
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          {/* ── Main form panel ── */}
          <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-5">

            {/* Title */}
            <label className={labelClass}>
              Receipt title
              <input
                type="text"
                required
                placeholder="e.g. Client dinner at The Grill"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                className={inputClass}
              />
            </label>

            {/* Amount + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className={labelClass}>
                Amount (₹)
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-muted font-medium">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    className={`${inputClass} pl-8`}
                  />
                </div>
              </label>
              <label className={labelClass}>
                Receipt date
                <input
                  type="date"
                  required
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  disabled={loading}
                  className={inputClass}
                />
              </label>
            </div>

            {/* Category */}
            <label className={labelClass}>
              Category
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
                className={inputClass}
              >
                <option value="" disabled>Select a category</option>
                {RECEIPT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            {/* Notes */}
            <label className={labelClass}>
              Notes
              <span className="text-xs font-normal text-ink-muted">Optional</span>
              <textarea
                placeholder="Add context for the reviewer (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
                rows={3}
                className={`${inputClass} resize-y min-h-[90px]`}
              />
            </label>

            {/* File upload */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-ink-secondary">Receipt file</span>

              {!file ? (
                <div
                  role="region"
                  aria-label="File upload area"
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 px-6 text-center transition-colors cursor-pointer ${
                    dragging
                      ? 'border-accent bg-primary-subtle'
                      : 'border-border hover:border-accent/60 hover:bg-canvas'
                  }`}
                >
                  <UploadCloud
                    className={`size-9 mb-1 ${dragging ? 'text-primary' : 'text-ink-muted'}`}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Drop your file here, or{' '}
                      <span className="text-primary underline">browse</span>
                    </p>
                    <p className="text-xs text-ink-muted mt-1">
                      PDF, JPG, JPEG, PNG · Maximum 10 MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept={ACCEPTED.join(',')}
                    onChange={(e) => validateAndSetFile(e.target.files?.[0])}
                    disabled={loading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label="Upload receipt file"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4 rounded-xl border border-approved-border bg-approved-surface px-4 py-3.5">
                  <FileText className="size-8 text-approved shrink-0" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{file.name}</p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {file.type} · {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    aria-label="Remove file"
                    disabled={loading}
                    className="text-ink-muted hover:text-ink transition-colors shrink-0"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}

              {fileError && (
                <p className="text-xs text-rejected flex items-center gap-1.5">
                  <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                  {fileError}
                </p>
              )}
            </div>

            {/* Form error */}
            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 bg-error-surface text-error text-sm px-4 py-3 rounded-lg"
              >
                <AlertCircle className="size-4 mt-0.5 shrink-0" aria-hidden />
                {formError}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-subtle">
              <Link
                to="/receipts"
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-semibold text-ink-secondary hover:bg-canvas transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden />
                    Submitting…
                  </>
                ) : (
                  'Submit Receipt'
                )}
              </button>
            </div>
          </div>

          {/* ── Info sidebar ── */}
          <div className="bg-surface border border-border rounded-xl p-5 h-max">
            <h2 className="font-display text-sm font-semibold text-ink mb-3">Before you submit</h2>
            <div className="flex flex-col gap-3 text-sm text-ink-secondary leading-relaxed">
              <p>
                Your receipt will be placed in the{' '}
                <span className="font-semibold text-pending">PENDING</span> queue for admin review.
              </p>
              <p>Ensure the document clearly shows the merchant, date, and total amount.</p>
              <p>
                If rejected, you'll receive a comment explaining the reason and can re-submit after corrections.
              </p>
              <hr className="border-border-subtle my-1" />
              <p className="text-xs text-ink-muted">Accepted formats: PDF, JPG, JPEG, PNG · Max 10 MB</p>
            </div>
          </div>
        </div>
      </form>
    </Page>
  )
}
