// ─── Currency formatting ──────────────────────────────────────────────────

/** Format a number as Indian Rupees. Change this function to switch currency. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// ─── Date formatting ──────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' })
const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Format an ISO date string or datetime string as a readable date. */
export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value))
}

/** Format an ISO datetime string with time. */
export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value))
}

// ─── Greeting ────────────────────────────────────────────────────────────

/** Return a time-appropriate greeting word. */
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// ─── Class name utility ───────────────────────────────────────────────────

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely (deduplication + conflict resolution). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
