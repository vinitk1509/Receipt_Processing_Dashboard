import { useState, useEffect } from 'react'
import { X, ZoomIn, ZoomOut, RotateCcw, Download, FileText, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react'
import { api, downloadFile } from '../../api/axios'

interface FilePreviewModalProps {
  open: boolean
  onClose: () => void
  receiptId: string
  fileName: string
  fileSize?: number
}

export default function FilePreviewModal({
  open,
  onClose,
  receiptId,
  fileName,
  fileSize,
}: FilePreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [contentType, setContentType] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)

  const isPdf = fileName?.toLowerCase().endsWith('.pdf') || contentType.includes('pdf')
  const isImage =
    fileName?.toLowerCase().endsWith('.jpg') ||
    fileName?.toLowerCase().endsWith('.jpeg') ||
    fileName?.toLowerCase().endsWith('.png') ||
    contentType.includes('image')

  useEffect(() => {
    if (!open || !receiptId) {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setZoom(1)
      return
    }

    let active = true
    setLoading(true)
    setError(null)

    api
      .get(`/api/receipts/${receiptId}/file`, { responseType: 'blob' })
      .then((res) => {
        if (!active) return
        const mime = res.headers['content-type'] || (isPdf ? 'application/pdf' : 'image/jpeg')
        setContentType(mime)
        const blob = new Blob([res.data], { type: mime })
        const url = URL.createObjectURL(blob)
        setBlobUrl(url)
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        console.error('Failed to load document preview:', err)
        setError('Could not load document preview. Please try downloading the file.')
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, receiptId, isPdf])

  // Clean up object URL when modal closes or unmounts
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

  // ESC key to close
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const handleDownload = () => {
    downloadFile(`/api/receipts/${receiptId}/file`, fileName)
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5))
  const handleResetZoom = () => setZoom(1)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Modal Window */}
      <div className="relative z-10 w-full max-w-5xl h-[88vh] bg-surface rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-canvas/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-lg bg-primary-subtle flex items-center justify-center shrink-0">
              {isPdf ? (
                <FileText className="size-5 text-primary" />
              ) : (
                <ImageIcon className="size-5 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <h2 id="preview-title" className="font-semibold text-ink text-sm truncate max-w-md">
                {fileName}
              </h2>
              <p className="text-xs text-ink-muted flex items-center gap-2">
                <span>{isPdf ? 'PDF Document' : 'Image File'}</span>
                {fileSize ? <span>· {Math.round(fileSize / 1024)} KB</span> : null}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Image zoom controls */}
            {isImage && blobUrl && !loading && (
              <div className="hidden sm:flex items-center gap-1 bg-surface border border-border rounded-lg p-1 mr-2">
                <button
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  disabled={zoom <= 0.5}
                  className="p-1.5 rounded hover:bg-canvas text-ink-secondary disabled:opacity-40 transition-colors"
                >
                  <ZoomOut className="size-4" />
                </button>
                <span className="text-xs font-mono font-medium px-1.5 text-ink">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  title="Zoom In"
                  disabled={zoom >= 3}
                  className="p-1.5 rounded hover:bg-canvas text-ink-secondary disabled:opacity-40 transition-colors"
                >
                  <ZoomIn className="size-4" />
                </button>
                <button
                  onClick={handleResetZoom}
                  title="Reset Zoom"
                  className="p-1.5 rounded hover:bg-canvas text-ink-secondary transition-colors"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              </div>
            )}

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-ink-secondary hover:bg-canvas hover:text-ink transition-colors"
            >
              <Download className="size-3.5" />
              Download
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close preview"
              className="size-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-canvas/30 overflow-auto flex items-center justify-center p-4 relative select-none">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-ink-muted py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading document preview…</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 max-w-md text-center p-6 bg-surface border border-border rounded-xl">
              <AlertCircle className="size-10 text-rejected" />
              <h3 className="text-sm font-semibold text-ink">Preview Unavailable</h3>
              <p className="text-xs text-ink-secondary leading-relaxed">{error}</p>
              <button
                onClick={handleDownload}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors"
              >
                <Download className="size-3.5" />
                Download to view
              </button>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <>
              {isPdf ? (
                <iframe
                  src={`${blobUrl}#toolbar=1&navpanes=0`}
                  title={fileName}
                  className="w-full h-full rounded-xl border border-border shadow-inner bg-white"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                  <img
                    src={blobUrl}
                    alt={fileName}
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                    className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-md border border-border transition-transform duration-150"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
