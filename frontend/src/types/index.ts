// ─── Core domain types ────────────────────────────────────────────────────

export type UserRole = 'USER' | 'ADMIN'

export type ReceiptStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type ReceiptCategory =
  | 'Travel'
  | 'Meals'
  | 'Accommodation'
  | 'Office Supplies'
  | 'Transportation'
  | 'Software'
  | 'Client Expense'
  | 'Other'

export const RECEIPT_CATEGORIES: ReceiptCategory[] = [
  'Travel',
  'Meals',
  'Accommodation',
  'Office Supplies',
  'Transportation',
  'Software',
  'Client Expense',
  'Other',
]

// ─── User ─────────────────────────────────────────────────────────────────

export interface User {
  id: string
  fullName: string
  email: string
  role: UserRole
  /** Initials derived from fullName, used for avatar rendering */
  initials: string
}

// ─── Receipt ──────────────────────────────────────────────────────────────

export interface Receipt {
  id: string
  title: string
  amount: number
  receiptDate: string        // ISO date string YYYY-MM-DD
  category: ReceiptCategory
  notes: string
  fileUrl?: string
  fileName: string
  fileSize?: number          // bytes
  status: ReceiptStatus
  reviewComment?: string
  submittedAt: string        // ISO datetime string
  reviewedAt?: string        // ISO datetime string
  user: User
  reviewedBy?: User
}

// ─── API request / response shapes ────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

export interface ReceiptCreateRequest {
  title: string
  amount: number
  receiptDate: string
  category: ReceiptCategory
  notes: string
  file: File
}

export interface ReceiptReviewRequest {
  reviewComment: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

// ─── UI helpers ───────────────────────────────────────────────────────────

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}
