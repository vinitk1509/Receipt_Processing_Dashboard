export type ReceiptStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type UserRole = 'USER' | 'ADMIN'
export type ReceiptCategory = 'Travel' | 'Meals' | 'Accommodation' | 'Office Supplies' | 'Transportation' | 'Software' | 'Client Expense' | 'Other'
export interface User { id: string; fullName: string; email: string; role: UserRole; avatar?: string }
export interface Receipt { id: string; title: string; amount: number; receiptDate: string; category: ReceiptCategory; notes: string; fileUrl?: string; fileName: string; fileSize?: number; status: ReceiptStatus; reviewComment?: string; submittedAt: string; reviewedAt?: string; user: User; reviewedBy?: User }
export interface LoginRequest { email: string; password: string }
export interface RegisterRequest { fullName: string; email: string; password: string; confirmPassword: string }
export interface ReceiptCreateRequest { title: string; amount: number; receiptDate: string; category: ReceiptCategory; notes: string; file: File }
export interface ReceiptReviewRequest { reviewComment: string }
