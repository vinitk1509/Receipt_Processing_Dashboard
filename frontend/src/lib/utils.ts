// ─── Currency formatting (Australian Dollars) ───────────────────────────────

/** Format a number as Australian Dollars (AUD). */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// ─── Date formatting ──────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' })
const dateTimeFormatter = new Intl.DateTimeFormat('en-AU', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Helper to parse ISO strings ensuring UTC awareness */
function parseSafeDate(value: string): Date {
  if (!value) return new Date()
  let str = value.trim()
  // If it's an ISO datetime missing 'Z' or offset, append 'Z' to treat as UTC
  if (str.includes('T') && !str.endsWith('Z') && !str.includes('+') && !str.match(/-\d{2}:\d{2}$/)) {
    str = str + 'Z'
  }
  return new Date(str)
}

/** Format an ISO date string or datetime string as a readable date. */
export function formatDate(value: string): string {
  return dateFormatter.format(parseSafeDate(value))
}

/** Format an ISO datetime string with local time. */
export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(parseSafeDate(value))
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
