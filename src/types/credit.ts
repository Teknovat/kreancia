/**
 * Credit Types for Kreancia
 * Defines all credit-related types and interfaces
 */

import { Decimal } from '@prisma/client/runtime/library'

/**
 * Credit Status Enum
 */
export type CreditStatus = 'OPEN' | 'PAID' | 'OVERDUE'

/**
 * Base credit data from database
 */
export interface Credit {
  id: string
  label: string
  description?: string | null
  totalAmount: Decimal
  remainingAmount: Decimal
  dueDate: Date | null
  status: CreditStatus
  clientId: string
  merchantId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Extended credit with client information and payment details
 */
export interface CreditWithDetails {
  id: string
  label: string
  description?: string | null
  totalAmount: number        // Simplifié: toujours number
  remainingAmount: number    // Simplifié: toujours number
  dueDate: Date | null
  status: CreditStatus
  clientId: string
  merchantId: string
  createdAt: Date
  updatedAt: Date
  client: {
    id: string
    firstName: string
    lastName: string
    fullName: string
    businessName?: string | null
  }
  allocations: {
    id: string
    amount: number           // Simplifié: toujours number
    paymentId: string
    payment: {
      id: string
      amount: number         // Simplifié: toujours number
      paymentDate: Date
      method: string
    }
  }[]
  paidAmount: number
  daysOverdue: number | null
  isOverdue: boolean
}

/**
 * Credit creation form data
 */
export interface CreditFormData {
  label: string
  totalAmount: number
  dueDate?: Date | null
  clientId: string
}

/**
 * Credit creation data
 */
export interface CreateCreditData {
  label: string
  totalAmount: number
  description?: string
  dueDate?: Date | null
  clientId: string
}

/**
 * Credit update form data
 */
export interface CreditUpdateData {
  label?: string
  totalAmount?: number
  description?: string
  dueDate?: Date | null
  status?: CreditStatus
}

/**
 * Credit update data for API
 */
export type UpdateCreditData = CreditUpdateData

/**
 * Credit filters for listing
 */
export interface CreditFilters {
  search: string
  status: CreditStatus | 'ALL'
  clientId?: string
  dueAfter?: Date
  dueBefore?: Date
  sortBy: 'createdAt' | 'dueDate' | 'totalAmount' | 'remainingAmount' | 'client'
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

/**
 * Credit list response
 */
export interface CreditListResponse {
  credits: CreditWithDetails[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/**
 * Credit summary statistics
 */
export interface CreditSummary {
  totalCredits: number
  openCredits: number
  paidCredits: number
  overdueCredits: number
  totalAmountOpen: number
  totalAmountOverdue: number
  averageCreditAmount: number
  oldestCreditDays: number
}

/**
 * Credit status calculation result
 */
export interface CreditStatusUpdate {
  id: string
  newStatus: CreditStatus
  previousStatus: CreditStatus
  remainingAmount: Decimal
}

/**
 * Bulk credit status update result
 */
export interface BulkCreditStatusResult {
  updatedCredits: CreditStatusUpdate[]
  totalProcessed: number
  totalUpdated: number
}