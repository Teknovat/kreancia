import { PrismaClient } from '@/generated/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Database utilities
export const db = prisma

// Transaction helper
export async function withTransaction<T>(
  callback: (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback)
}

// Health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Cleanup function for graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}

/**
 * Helper function to calculate credit status based on business rules
 */
export function calculateCreditStatus(
  remainingAmount: number,
  dueDate?: Date | null
): 'OPEN' | 'PAID' | 'OVERDUE' {
  if (remainingAmount === 0) {
    return 'PAID'
  }

  if (dueDate && dueDate < new Date() && remainingAmount > 0) {
    return 'OVERDUE'
  }

  return 'OPEN'
}

// Currency formatting moved to src/lib/utils.ts
// Import { formatCurrency } from '@/lib/utils' to use the unified function

/**
 * Type exports for the application
 */
export type {
  Merchant,
  Client,
  Credit,
  Payment,
  PaymentAllocation,
  CreditStatus,
  PaymentMethod,
} from '@/generated/client'