import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import type { ToastMessage } from '../../types/index'

// ─── Context ──────────────────────────────────────────────────────────────

interface ToastContextValue {
  toast: (type: ToastMessage['type'], message: string) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const timeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const t = timeouts.current.get(id)
    if (t) { clearTimeout(t); timeouts.current.delete(id) }
  }, [])

  const toast = useCallback(
    (type: ToastMessage['type'], message: string) => {
      const id = `toast-${Date.now()}-${Math.random()}`
      setToasts((prev) => [...prev.slice(-3), { id, type, message }])
      const t = setTimeout(() => dismiss(id), 4500)
      timeouts.current.set(id, t)
    },
    [dismiss]
  )

  // Cleanup all timeouts on unmount
  useEffect(() => {
    const refs = timeouts.current
    return () => { refs.forEach(clearTimeout) }
  }, [])

  const value: ToastContextValue = {
    toast,
    success: (msg) => toast('success', msg),
    error: (msg) => toast('error', msg),
    info: (msg) => toast('info', msg),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ─── UI ───────────────────────────────────────────────────────────────────

const ICONS: Record<ToastMessage['type'], typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
}

const STYLES: Record<ToastMessage['type'], string> = {
  success: 'bg-approved-surface border-approved-border text-approved',
  error: 'bg-rejected-surface border-rejected-border text-rejected',
  info: 'bg-primary-subtle border-border text-primary',
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}) {
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
    >
      {toasts.map((t) => {
        const Icon = ICONS[t.type]
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg animate-in slide-in-from-right-5 ${STYLES[t.type]}`}
          >
            <Icon className="size-4 mt-0.5 shrink-0" aria-hidden />
            <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
