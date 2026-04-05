/**
 * Payment Types for Kreancia
 * Defines all payment-related types and interfaces
 */

import { Decimal } from "@prisma/client/runtime/library";

/**
 * Payment Method Enum
 */
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CHECK" | "CARD" | "MOBILE_PAYMENT" | "OTHER";

/**
 * Payment Allocation Mode
 */
export type AllocationMode = "FIFO" | "MANUAL";

/**
 * Base payment data from database
 */
export interface Payment {
  id: string;
  amount: number;
  note: string | null;
  method: PaymentMethod;
  reference: string | null;
  paymentDate: Date;
  clientId: string;
  merchantId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment allocation data
 */
export interface PaymentAllocation {
  id: string;
  amount: Decimal;
  paymentId: string;
  creditId: string;
}

/**
 * Extended payment with client information and allocations
 */
export interface PaymentWithDetails {
  id: string;
  amount: number; // Simplifié: toujours number
  note?: string | null;
  method: PaymentMethod;
  reference?: string | null;
  paymentDate: Date;
  clientId: string;
  merchantId: string;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    businessName?: string | null;
  };
  allocations: {
    id: string;
    amount: number; // Simplifié: toujours number
    allocatedAmount: number; // Simplifié: toujours number
    credit: {
      id: string;
      label: string;
      totalAmount: number; // Simplifié: toujours number
      status: string;
    };
  }[];
  totalAllocated: number; // Total des montants alloués
  unallocatedAmount: number; // Montant non alloué
  isFullyAllocated: boolean; // True si entièrement alloué
}

/**
 * Payment creation form data
 */
export interface PaymentFormData {
  amount: number;
  note?: string | null;
  method: PaymentMethod;
  reference?: string | null;
  paymentDate?: Date;
  clientId: string;
  allocationMode?: AllocationMode;
  manualAllocations?: ManualAllocationItem[];
}

/**
 * Payment creation data for API
 */
export interface CreatePaymentData {
  amount: number;
  note?: string | null;
  method: PaymentMethod;
  reference?: string | null;
  paymentDate?: Date;
  clientId: string;
  allocationMode?: AllocationMode;
  manualAllocations?: ManualAllocationItem[];
}

/**
 * Payment update form data
 */
export interface PaymentUpdateData {
  amount?: number;
  note?: string | null;
  method?: PaymentMethod;
  reference?: string | null;
  paymentDate?: Date;
}

/**
 * Payment update data for API
 */
export type UpdatePaymentData = PaymentUpdateData;

/**
 * Manual allocation item for payment creation
 */
export interface ManualAllocationItem {
  creditId: string;
  amount: number;
}

/**
 * FIFO allocation result
 */
export interface FIFOAllocationResult {
  allocations: PaymentAllocation[];
  totalAllocated: number;
  unallocatedAmount: number;
  creditsUpdated: string[];
}

/**
 * Payment filters for listing
 */
export interface PaymentFilters {
  search: string;
  method: PaymentMethod | "ALL";
  clientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  isFullyAllocated?: boolean;
  sortBy: "paymentDate" | "amount" | "client" | "createdAt";
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
}

/**
 * Payment list response
 */
export interface PaymentListResponse {
  payments: PaymentWithDetails[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Payment summary statistics
 */
export interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  totalAllocated: number;
  totalUnallocated: number;
  paymentsByMethod: Record<PaymentMethod, { count: number; amount: number }>;
  averagePaymentAmount: number;
  paymentsThisMonth: number;
  amountThisMonth: number;
}

/**
 * Allocation validation result
 */
export interface AllocationValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalAmount: number;
  availableCredits: {
    id: string;
    label: string;
    remainingAmount: number;
    maxAllowedAllocation: number;
  }[];
}

/**
 * Payment reversal result
 */
export interface PaymentReversalResult {
  paymentId: string;
  reversedAllocations: {
    id: string;
    creditId: string;
    amount: number;
  }[];
  creditsRestored: string[];
  totalReversedAmount: number;
}

/**
 * Client balance calculation
 */
export interface ClientBalance {
  clientId: string;
  totalCredits: number;
  totalPayments: number;
  outstandingAmount: number;
  overdueAmount: number;
  creditCount: number;
  paymentCount: number;
  lastPaymentDate: Date | null;
}

/**
 * Payment method statistics
 */
export interface PaymentMethodStats {
  method: PaymentMethod;
  count: number;
  totalAmount: number;
  percentage: number;
  averageAmount: number;
}

/**
 * Credit allocation summary for a payment
 */
export interface CreditAllocationSummary {
  creditId: string;
  creditLabel: string;
  originalRemaining: number;
  allocatedAmount: number;
  newRemaining: number;
  creditStatus: string;
  allocationPercentage: number;
}
