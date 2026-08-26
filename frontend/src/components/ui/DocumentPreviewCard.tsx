import { useState, useEffect } from 'react'
import { FileText, Image as ImageIcon, Download, ExternalLink, Eye, Loader2 } from 'lucide-react'
import { api, downloadFile } from '../../api/axios'
import FilePreviewModal from './FilePreviewModal'

interface DocumentPreviewCardProps {
  receiptId: string
  fileName: string
  fileSize?: number
}

export default function DocumentPreviewCard({
  receiptId,
  fileName,
  fileSize,
}: DocumentPreviewCardProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const isPdf = fileName?.toLowerCase().endsWith('.pdf')

  useEffect(() => {
    let active = true
    if (!receiptId) return

    api
      .get(`/api/receipts/${receiptId}/file`, { responseType: 'blob' })
      .then((res) => {
        if (!active) return
        const mime = res.headers['content-type'] || (isPdf ? 'application/pdf' : 'image/jpeg')
        const blob = new Blob([res.data], { type: mime })
        const url = URL.createObjectURL(blob)
        setBlobUrl(url)
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        console.error('Thumbnail preview fetch error:', err)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [receiptId, isPdf])

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

  const handleDownload = () => {
    downloadFile(`/api/receipts/${receiptId}/file`, fileName)
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Interactive Thumbnail Area */}
        <div
          onClick={() => setShowModal(true)}
          className="group relative rounded-xl border border-border bg-canvas hover:border-accent/50 cursor-pointer overflow-hidden transition-all duration-200"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-ink-muted">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs">Loading preview…</p>
            </div>
          ) : !isPdf && blobUrl ? (
            <div className="relative h-48 w-full flex items-center justify-center bg-black/5 overflow-hidden">
              <img
                src={blobUrl}
                alt={fileName}
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white text-sm font-semibold transition-opacity backdrop-blur-[2px]">
                <Eye className="size-5" />
                <span>Click to Preview</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="size-14 rounded-full bg-primary-subtle flex items-center justify-center group-hover:scale-110 transition-transform">
                {isPdf ? (
                  <FileText className="size-7 text-primary" aria-hidden />
                ) : (
                  <ImageIcon className="size-7 text-primary" aria-hidden />
                )}
              </div>
              <div className="text-center px-4">
                <p className="font-semibold text-ink text-sm truncate max-w-xs">{fileName}</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {isPdf ? 'PDF document' : 'Image file'}
                  {fileSize ? ` · ${Math.round(fileSize / 1024)} KB` : ''}
                </p>
                <span className="inline-block mt-2 text-xs font-semibold text-primary group-hover:underline">
                  Click to open interactive preview
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-sm font-semibold text-ink-secondary hover:bg-canvas hover:text-ink transition-colors"
          >
            <ExternalLink className="size-4" aria-hidden />
            Preview document
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-sm font-semibold text-ink-secondary hover:bg-canvas hover:text-ink transition-colors"
          >
            <Download className="size-4" aria-hidden />
            Download
          </button>
        </div>
      </div>

      {/* In-App Full Modal Preview */}
      <FilePreviewModal
        open={showModal}
        onClose={() => setShowModal(false)}
        receiptId={receiptId}
        fileName={fileName}
        fileSize={fileSize}
      />
    </>
  )
}
