import { api, downloadFile } from './axios'
import type { Receipt, ReceiptCreateRequest } from '../types/index'

/**
 * User receipt API service.
 * Connects to: POST /api/receipts, GET /api/receipts/me, GET /api/receipts/:id
 */
export const receiptApi = {
  listMine: () =>
    api.get<Receipt[]>('/api/receipts/me'),

  get: (id: string) =>
    api.get<Receipt>(`/api/receipts/${id}`),

  create: (payload: ReceiptCreateRequest) => {
    const form = new FormData()
    form.append('title', payload.title)
    form.append('amount', String(payload.amount))
    form.append('receiptDate', payload.receiptDate)
    form.append('category', payload.category)
    form.append('notes', payload.notes)
    form.append('file', payload.file)
    return api.post<Receipt>('/api/receipts', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /** Triggers a download of receipts in the specified format with optional filters. */
  export: (format: 'csv' | 'excel', params?: Record<string, string>) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val && val !== 'ALL') {
          searchParams.append(key, val)
        }
      })
    }
    const queryStr = searchParams.toString()
    const url = `/api/admin/receipts/export/${format}${queryStr ? `?${queryStr}` : ''}`
    return downloadFile(url)
  },
}
