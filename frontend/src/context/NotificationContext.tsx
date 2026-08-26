import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useToast } from '../components/ui/Toast'

interface NotificationContextValue {
  connected: boolean
}

const NotificationContext = createContext<NotificationContextValue>({ connected: false })

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const { success, error: toastError } = useToast()
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      setConnected(false)
      return
    }

    let unmounted = false

    function connectWebSocket() {
      if (unmounted) return

      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
      const wsProtocol = apiBase.startsWith('https') ? 'wss' : 'ws'
      const host = apiBase.replace(/^https?:\/\//, '')
      const wsUrl = `${wsProtocol}://${host}/ws/notifications/${user?.id}`

      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          if (!unmounted) setConnected(true)
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'RECEIPT_STATUS_UPDATED') {
              const { title, status, reviewComment, receiptId } = data
              if (status === 'APPROVED') {
                success(
                  `Receipt "${title || receiptId}" was APPROVED by admin!`
                )
              } else if (status === 'REJECTED') {
                toastError(
                  `Receipt "${title || receiptId}" was REJECTED${
                    reviewComment ? `: "${reviewComment}"` : '.'
                  }`
                )
              }

              // Dispatch window event for open pages to automatically refresh data
              window.dispatchEvent(
                new CustomEvent('receipt-status-updated', { detail: data })
              )
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e)
          }
        }

        ws.onclose = () => {
          if (!unmounted) {
            setConnected(false)
            // Reconnect attempt after 5 seconds
            reconnectTimeoutRef.current = window.setTimeout(connectWebSocket, 5000)
          }
        }

        ws.onerror = () => {
          ws.close()
        }
      } catch (e) {
        if (!unmounted) {
          reconnectTimeoutRef.current = window.setTimeout(connectWebSocket, 5000)
        }
      }
    }

    connectWebSocket()

    return () => {
      unmounted = true
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [isAuthenticated, user?.id, success, toastError])

  return (
    <NotificationContext.Provider value={{ connected }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
