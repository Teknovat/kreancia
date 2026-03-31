import {
  Merchant,
  Client,
  Credit,
  Payment,
  PaymentAllocation,
  CreditStatus,
  PaymentMethod
} from '@/generated/client'

// Re-export Prisma types
export type {
  Merchant,
  Client,
  Credit,
  Payment,
  PaymentAllocation,
  CreditStatus,
  PaymentMethod
}

// Extended types with computed fields
export interface CreditWithRelations extends Credit {
  client: Client
  merchant: Merchant
  paymentAllocations: PaymentAllocation[]
}

export interface ClientWithCredits extends Client {
  merchant: Merchant
  credits: Credit[]
  totalCredits: number
  totalPaid: number
  totalRemaining: number
}

export interface PaymentWithAllocations extends Payment {
  client: Client
  merchant: Merchant
  paymentAllocations: (PaymentAllocation & {
    credit: Credit
  })[]
}

export interface MerchantWithCounts extends Merchant {
  _count: {
    clients: number
    credits: number
    payments: number
  }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Form types
export interface CreateClientData {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  address?: string
  businessName?: string
  taxId?: string
  creditLimit?: number
  paymentTermDays: number
}

export interface UpdateClientData extends Partial<CreateClientData> {
  id: string
}

export interface CreateCreditData {
  label: string
  totalAmount: number
  description?: string
  dueDate?: Date
  clientId: string
}

export interface UpdateCreditData extends Partial<CreateCreditData> {
  id: string
  remainingAmount?: number
  status?: CreditStatus
}

export interface CreatePaymentData {
  amount: number
  note?: string
  method: PaymentMethod
  reference?: string
  paymentDate: Date
  clientId: string
}

export interface UpdatePaymentData extends Partial<CreatePaymentData> {
  id: string
}

export interface CreatePaymentAllocationData {
  amount: number
  allocatedAmount: number
  paymentId: string
  creditId: string
  clientId: string
  merchantId: string
}

// Filter and search types
export interface ClientFilters {
  search?: string
  creditLimit?: {
    min?: number
    max?: number
  }
  hasOverdueCredits?: boolean
  sortBy?: 'firstName' | 'lastName' | 'createdAt' | 'totalCredits'
  sortOrder?: 'asc' | 'desc'
}

export interface CreditFilters {
  search?: string
  clientId?: string
  status?: CreditStatus | CreditStatus[]
  amount?: {
    min?: number
    max?: number
  }
  dueDate?: {
    from?: Date
    to?: Date
  }
  isOverdue?: boolean
  sortBy?: 'totalAmount' | 'remainingAmount' | 'dueDate' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface PaymentFilters {
  search?: string
  clientId?: string
  method?: PaymentMethod | PaymentMethod[]
  amount?: {
    min?: number
    max?: number
  }
  paymentDate?: {
    from?: Date
    to?: Date
  }
  sortBy?: 'amount' | 'paymentDate' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// Dashboard types
export interface DashboardStats {
  totalClients: number
  totalCredits: number
  totalPayments: number
  totalOutstanding: number
  totalOverdue: number
  averageCreditAmount: number
  averagePaymentTime: number
  thisMonth: {
    newClients: number
    newCredits: number
    paymentsReceived: number
    amountReceived: number
  }
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface CreditsByStatus {
  open: number
  paid: number
  overdue: number
}

export interface PaymentsByMethod {
  [PaymentMethod.CASH]: number
  [PaymentMethod.BANK_TRANSFER]: number
  [PaymentMethod.CHECK]: number
  [PaymentMethod.CARD]: number
  [PaymentMethod.MOBILE_PAYMENT]: number
  [PaymentMethod.OTHER]: number
}

// Authentication types
export interface AuthUser {
  id: string
  email: string
  name: string
  currency: string
  businessName: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  currency?: string
  businessName?: string
  businessAddress?: string
  phone?: string
}

// Component props types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface TableColumn<T = any> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

// Notification types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Modal types
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

// Form validation types
export interface ValidationError {
  field: string
  message: string
}

export interface FormState<T = any> {
  data: T
  errors: ValidationError[]
  isSubmitting: boolean
  isDirty: boolean
}

// Multi-tenant types
export interface TenantContext {
  merchantId: string
}

// Error types
export interface AppError extends Error {
  code?: string
  statusCode?: number
  details?: any
}

// Utility types
export type Nullable<T> = T | null
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Event handler types
export type ChangeHandler<T = string> = (value: T) => void
export type SubmitHandler<T = any> = (data: T) => void | Promise<void>
export type ClickHandler = () => void | Promise<void>

// Status badge colors
export const creditStatusColors: Record<CreditStatus, string> = {
  [CreditStatus.OPEN]: 'bg-blue-100 text-blue-800',
  [CreditStatus.PAID]: 'bg-green-100 text-green-800',
  [CreditStatus.OVERDUE]: 'bg-red-100 text-red-800',
}

export const creditStatusLabels: Record<CreditStatus, string> = {
  [CreditStatus.OPEN]: 'Ouvert',
  [CreditStatus.PAID]: 'Payé',
  [CreditStatus.OVERDUE]: 'En retard',
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Espèces',
  [PaymentMethod.BANK_TRANSFER]: 'Virement',
  [PaymentMethod.CHECK]: 'Chèque',
  [PaymentMethod.CARD]: 'Carte',
  [PaymentMethod.MOBILE_PAYMENT]: 'Mobile',
  [PaymentMethod.OTHER]: 'Autre',
}