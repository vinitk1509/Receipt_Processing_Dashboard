import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  confirmVariant?: 'primary' | 'danger'
  cancelLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  // Trap focus on open
  useEffect(() => {
    if (open) confirmRef.current?.focus()
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  const confirmStyles =
    confirmVariant === 'danger'
      ? 'bg-rejected text-white hover:bg-rejected/90 disabled:opacity-50'
      : 'bg-primary text-white hover:bg-primary-hover disabled:opacity-50'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-surface rounded-2xl border border-border shadow-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 id="dialog-title" className="font-display text-lg font-semibold text-ink">
            {title}
          </h2>
          <button
            onClick={onCancel}
            aria-label="Close dialog"
            className="text-ink-muted hover:text-ink transition-colors -mt-1 -mr-1"
          >
            <X className="size-4" />
          </button>
        </div>

        <p id="dialog-desc" className="text-sm text-ink-secondary mb-6 leading-relaxed">
          {description}
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-surface text-ink-secondary hover:bg-canvas transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${confirmStyles}`}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
