/**
 * Authentication Context Utilities
 *
 * This module provides utilities for extracting session context
 * and creating secure database connections with proper tenant isolation.
 */

import { auth } from './auth'
import { getSecurePrismaClient } from './prisma-rls'
import type { SessionContext, TenantPrismaClient } from './prisma-rls'
import { redirect } from 'next/navigation'

/**
 * Error thrown when user is not authenticated
 */
export class UnauthenticatedError extends Error {
  constructor() {
    super('User must be authenticated to access this resource')
    this.name = 'UnauthenticatedError'
  }
}

/**
 * Error thrown when session is invalid or missing required data
 */
export class InvalidSessionError extends Error {
  constructor(reason: string) {
    super(`Invalid session: ${reason}`)
    this.name = 'InvalidSessionError'
  }
}

/**
 * Get the current authenticated session
 * Throws error if user is not authenticated or session is invalid
 */
export async function getAuthenticatedSession(): Promise<SessionContext> {
  const session = await auth()

  if (!session?.user) {
    throw new UnauthenticatedError()
  }

  if (!session.user.merchantId) {
    throw new InvalidSessionError('merchantId is missing from session')
  }

  if (!session.user.id) {
    throw new InvalidSessionError('user ID is missing from session')
  }

  return {
    merchantId: session.user.merchantId,
    userId: session.user.id,
    email: session.user.email || undefined,
    businessName: session.user.businessName || undefined,
    currency: 'TND', // Default currency - can be retrieved separately if needed
  }
}

/**
 * Get the current session or redirect to login
 * Useful for page-level authentication
 */
export async function getAuthenticatedSessionOrRedirect(loginUrl = '/login'): Promise<SessionContext> {
  try {
    return await getAuthenticatedSession()
  } catch (error) {
    if (error instanceof UnauthenticatedError || error instanceof InvalidSessionError) {
      redirect(loginUrl)
    }
    throw error
  }
}

/**
 * Get a secure database client with the current user's session context
 * This is the primary way to access the database in the application
 */
export async function getSecureDatabase(): Promise<TenantPrismaClient> {
  const sessionContext = await getAuthenticatedSession()
  const secureClient = getSecurePrismaClient()
  return await secureClient.withSession(sessionContext)
}

/**
 * Get a secure database client or redirect to login
 * Useful for page-level database access
 */
export async function getSecureDatabaseOrRedirect(loginUrl = '/login'): Promise<TenantPrismaClient> {
  try {
    return await getSecureDatabase()
  } catch (error) {
    if (error instanceof UnauthenticatedError || error instanceof InvalidSessionError) {
      redirect(loginUrl)
    }
    throw error
  }
}

/**
 * Execute a database operation with automatic session context
 * This is a convenience wrapper for simple database operations
 */
export async function withSecureDatabase<T>(
  operation: (db: TenantPrismaClient) => Promise<T>
): Promise<T> {
  const db = await getSecureDatabase()
  return await operation(db)
}

/**
 * Execute a database transaction with automatic session context
 */
export async function withSecureTransaction<T>(
  operation: (db: TenantPrismaClient) => Promise<T>
): Promise<T> {
  const sessionContext = await getAuthenticatedSession()
  const secureClient = getSecurePrismaClient()

  // Initialize session if not already set
  if (secureClient.getCurrentMerchantId() !== sessionContext.merchantId) {
    await secureClient.withSession(sessionContext)
  }

  return await secureClient.$transaction(operation)
}

/**
 * Check if the current user can access a specific merchant's data
 * Returns true only if the merchantId matches the session merchantId
 */
export async function canAccessMerchant(merchantId: string): Promise<boolean> {
  try {
    const session = await getAuthenticatedSession()
    return session.merchantId === merchantId
  } catch {
    return false
  }
}

/**
 * Validate that the current user can access a specific merchant's data
 * Throws error if access is not allowed
 */
export async function validateMerchantAccess(merchantId: string): Promise<void> {
  const hasAccess = await canAccessMerchant(merchantId)
  if (!hasAccess) {
    throw new Error(`Access denied: User cannot access data for merchant ${merchantId}`)
  }
}

/**
 * Get the merchant ID from the current session
 * Returns null if user is not authenticated
 */
export async function getCurrentMerchantId(): Promise<string | null> {
  try {
    const session = await getAuthenticatedSession()
    return session.merchantId
  } catch {
    return null
  }
}

/**
 * Type guard to check if a session is valid
 */
export function isValidSession(session: any): session is SessionContext {
  return (
    session &&
    typeof session.merchantId === 'string' &&
    typeof session.userId === 'string' &&
    session.merchantId.length > 0 &&
    session.userId.length > 0
  )
}