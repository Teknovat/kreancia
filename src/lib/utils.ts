import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency amounts with merchant currency support
 */
export function formatCurrency(
  amount: number | string,
  currency?: string,
  locale = 'fr-FR'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount

  // Si pas de currency fournie, utiliser TND par défaut (currency principale du système)
  const finalCurrency = currency || 'TND'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: finalCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Format numbers with locale-specific formatting
 */
export function formatNumber(
  value: number | string,
  options?: Intl.NumberFormatOptions
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('fr-FR', options).format(num)
}

/**
 * Format dates with locale-specific formatting
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions & { relative?: boolean }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (options?.relative) {
    return formatRelativeTime(dateObj)
  }

  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(dateObj)
}

/**
 * Format date and time
 */
export function formatDateTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(dateObj)
}

/**
 * Format relative time (e.g., "il y a 2 jours")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - dateObj.getTime()

  const rtf = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' })

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(months / 12)

  if (years > 0) return rtf.format(-years, 'year')
  if (months > 0) return rtf.format(-months, 'month')
  if (days > 0) return rtf.format(-days, 'day')
  if (hours > 0) return rtf.format(-hours, 'hour')
  if (minutes > 0) return rtf.format(-minutes, 'minute')
  return rtf.format(-seconds, 'second')
}

/**
 * Calculate days between dates
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Check if a date is overdue
 */
export function isOverdue(dueDate: Date | string): boolean {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset to start of day
  return due < today
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
  if (obj instanceof Object) {
    const clonedObj = {} as { [key: string]: any }
    for (const key in obj) {
      clonedObj[key] = deepClone(obj[key])
    }
    return clonedObj as T
  }
  return obj
}

/**
 * Sleep function for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone format (French format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(?:\+33|0)[1-9](?:[0-9]{8})$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('33')) {
    return `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7, 9)} ${cleaned.substring(9, 11)}`
  }
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`
  }
  return phone
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.substring(0, length).trim() + '...'
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Convert to title case
 */
export function toTitleCase(text: string): string {
  return text.replace(/\w\S*/g, capitalize)
}

/**
 * Create a range of numbers
 */
export function range(start: number, end?: number, step = 1): number[] {
  if (end === undefined) {
    end = start
    start = 0
  }
  const result = []
  for (let i = start; i < end; i += step) {
    result.push(i)
  }
  return result
}