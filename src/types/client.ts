/**
 * Client Types for Kreancia
 * Defines all client-related types and interfaces
 */

import { Decimal } from '@prisma/client/runtime/library'

/**
 * Base client data from database
 */
export interface Client {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  address: string | null
  businessName: string | null
  taxId: string | null
  creditLimit: Decimal | null
  paymentTermDays: number
  merchantId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Extended client with computed fields and relationships
 */
export interface ClientWithStats extends Client {
  fullName: string
  totalCredits: number
  outstandingAmount: number
  overdueAmount: number
  lastActivity: Date | null
  creditCount: number
  paymentCount: number
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' // Computed field based on business logic
}

/**
 * Client form data for creation/editing
 */
export interface ClientFormData {
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  address: string | null
  businessName: string | null
  taxId: string | null
  creditLimit: Decimal | null
  paymentTermDays: number
}

/**
 * Client search and filter options
 */
export interface ClientFilters {
  search: string
  status: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  hasOverdue: boolean
  sortBy: 'name' | 'email' | 'createdAt' | 'creditLimit' | 'outstandingAmount'
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

/**
 * Client list response
 */
export interface ClientListResponse {
  clients: ClientWithStats[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/**
 * Client summary for dashboard
 */
export interface ClientSummary {
  totalClients: number
  activeClients: number
  inactiveClients: number
  suspendedClients: number
  averageCreditLimit: number
  totalOutstanding: number
  clientsWithOverdue: number
}

/**
 * Client activity entry
 */
export interface ClientActivity {
  id: string
  type: 'CREDIT_CREATED' | 'PAYMENT_RECEIVED' | 'STATUS_CHANGED' | 'PROFILE_UPDATED'
  description: string
  amount?: number
  date: Date
  relatedId?: string // credit ID, payment ID, etc.
}

/**
 * Client validation errors
 */
export interface ClientValidationErrors {
  firstName?: string[]
  lastName?: string[]
  email?: string[]
  phone?: string[]
  address?: string[]
  creditLimit?: string[]
  paymentTermDays?: string[]
  status?: string[]
}

/**
 * Client status color mappings
 */
export const CLIENT_STATUS_COLORS = {
  ACTIVE: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    dot: 'bg-green-500'
  },
  INACTIVE: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
    dot: 'bg-gray-500'
  },
  SUSPENDED: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    dot: 'bg-red-500'
  }
} as const

/**
 * Default client filter values
 */
export const DEFAULT_CLIENT_FILTERS: ClientFilters = {
  search: '',
  status: 'ALL',
  hasOverdue: false,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 25
}

/**
 * Client validation rules
 */
export const CLIENT_VALIDATION_RULES = {
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  email: {
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 255
  },
  phone: {
    required: false,
    pattern: /^\+?[\d\s()-]+$/,
    maxLength: 20
  },
  address: {
    required: false,
    maxLength: 255
  },
  creditLimit: {
    required: true,
    min: 0,
    max: 1000000
  },
  paymentTermDays: {
    required: true,
    min: 1,
    max: 365
  }
} as const