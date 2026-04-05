/**
 * Prisma Row Level Security Wrapper
 *
 * This module provides a secure database layer that automatically injects
 * merchantId filtering for all multi-tenant operations using PostgreSQL RLS.
 */

import { PrismaClient } from '@/generated/client'
import type { Prisma } from '@/generated/client'

export type TenantPrismaClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

/**
 * Interface for session context containing merchant information
 */
export interface SessionContext {
  merchantId: string
  userId: string
  email?: string
  businessName?: string
  currency?: string
}

/**
 * Error thrown when merchant ID is missing from session context
 */
export class MissingMerchantIdError extends Error {
  constructor(operation: string) {
    super(`Security violation: merchantId is required for operation ${operation}. Ensure user is authenticated.`)
    this.name = 'MissingMerchantIdError'
  }
}

/**
 * Row Level Security enabled Prisma client
 *
 * This class wraps the standard Prisma client and automatically:
 * 1. Sets the PostgreSQL session variable for RLS
 * 2. Validates that merchantId is present for all operations
 * 3. Provides type-safe database operations with automatic tenant isolation
 */
export class SecurePrismaClient {
  private prisma: PrismaClient
  private merchantId: string | null = null

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Initialize the secure client with session context
   * Must be called before any database operations
   */
  async withSession(context: SessionContext): Promise<TenantPrismaClient> {
    if (!context.merchantId) {
      throw new MissingMerchantIdError('session initialization')
    }

    this.merchantId = context.merchantId

    // Set the PostgreSQL session variable for RLS
    await this.prisma.$executeRaw`
      SELECT set_config('app.current_merchant_id', ${context.merchantId}, true)
    `

    // Return proxied client with automatic tenant filtering
    return this.createSecureProxy()
  }

  /**
   * Creates a proxy that ensures all operations include merchantId validation
   */
  private createSecureProxy(): TenantPrismaClient {
    return new Proxy(this.prisma as TenantPrismaClient, {
      get: (target, prop, receiver) => {
        const originalMethod = target[prop as keyof TenantPrismaClient]

        // If it's not a model operation, pass through
        if (typeof originalMethod !== 'object' || !originalMethod) {
          return Reflect.get(target, prop, receiver)
        }

        // For model operations, wrap them with security checks
        return new Proxy(originalMethod, {
          get: (modelTarget, modelProp) => {
            const modelMethod = modelTarget[modelProp as keyof typeof modelTarget]

            if (typeof modelMethod !== 'function') {
              return modelMethod
            }

            // Wrap database operations with security validation
            return (...args: any[]) => {
              // Verify merchantId is still set - arrow function preserves 'this' context
              if (!this.merchantId) {
                throw new MissingMerchantIdError(`${String(prop)}.${String(modelProp)}`)
              }

              // Call the original method with proper typing
              return (modelMethod as any).apply(modelTarget, args)
            }
          }
        })
      }
    })
  }

  /**
   * Clear the session context (useful for cleanup)
   */
  async clearSession(): Promise<void> {
    await this.prisma.$executeRaw`
      SELECT set_config('app.current_merchant_id', '', true)
    `
    this.merchantId = null
  }

  /**
   * Get the current merchant ID for the session
   */
  getCurrentMerchantId(): string | null {
    return this.merchantId
  }

  /**
   * Execute a transaction with RLS enabled
   */
  async $transaction<T>(
    callback: (client: TenantPrismaClient) => Promise<T>
  ): Promise<T> {
    if (!this.merchantId) {
      throw new MissingMerchantIdError('transaction')
    }

    return await this.prisma.$transaction(async (tx) => {
      // Ensure RLS session variable is set in transaction
      await tx.$executeRaw`
        SELECT set_config('app.current_merchant_id', ${this.merchantId}, true)
      `

      // Create secure proxy for the transaction client
      const secureTx = new SecurePrismaClient(tx as PrismaClient)
      secureTx.merchantId = this.merchantId // Set merchant ID directly for transaction

      return await callback(secureTx.createSecureProxy())
    })
  }

  /**
   * Execute raw query with automatic merchant ID injection
   * Use with caution - prefer typed operations when possible
   */
  async $queryRaw<T = unknown>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: any[]
  ): Promise<T> {
    if (!this.merchantId) {
      throw new MissingMerchantIdError('queryRaw')
    }

    // Ensure RLS is active
    await this.prisma.$executeRaw`
      SELECT set_config('app.current_merchant_id', ${this.merchantId}, true)
    `

    return await this.prisma.$queryRaw(query, ...values)
  }

  /**
   * Execute raw SQL with automatic merchant ID injection
   * Use with caution - prefer typed operations when possible
   */
  async $executeRaw(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: any[]
  ): Promise<number> {
    if (!this.merchantId) {
      throw new MissingMerchantIdError('executeRaw')
    }

    // Ensure RLS is active
    await this.prisma.$executeRaw`
      SELECT set_config('app.current_merchant_id', ${this.merchantId}, true)
    `

    return await this.prisma.$executeRaw(query, ...values)
  }
}

/**
 * Global instance for the secure Prisma client
 * This ensures we have a single instance across the application
 */
let globalSecureClient: SecurePrismaClient | undefined

/**
 * Get or create the global secure Prisma client
 */
export function getSecurePrismaClient(): SecurePrismaClient {
  if (!globalSecureClient) {
    const prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
    globalSecureClient = new SecurePrismaClient(prisma)
  }
  return globalSecureClient
}

/**
 * Cleanup function for graceful shutdown
 */
export async function disconnectSecureClient(): Promise<void> {
  if (globalSecureClient) {
    await globalSecureClient.clearSession()
    globalSecureClient = undefined
  }
}