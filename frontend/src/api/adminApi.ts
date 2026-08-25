import { api } from './axios'
import type { Receipt, ReceiptReviewRequest } from '../types/index'

/**
 * Admin receipt API service.
 * Connects to: GET /api/admin/receipts, GET /api/admin/receipts/:id,
 *              PATCH /api/admin/receipts/:id/approve, /reject
 */
export const adminApi = {
  list: (params?: Record<string, string>) =>
    api.get<Receipt[]>('/api/admin/receipts', { params }),

  get: (id: string) =>
    api.get<Receipt>(`/api/admin/receipts/${id}`),

  approve: (id: string, payload: ReceiptReviewRequest) =>
    api.patch<Receipt>(`/api/admin/receipts/${id}/approve`, payload),

  reject: (id: string, payload: ReceiptReviewRequest) =>
    api.patch<Receipt>(`/api/admin/receipts/${id}/reject`, payload),
}
