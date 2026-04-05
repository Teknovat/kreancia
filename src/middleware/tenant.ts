/**
 * Tenant Isolation Middleware
 *
 * This middleware ensures that all API routes have proper tenant isolation
 * by validating sessions and setting up secure database contexts.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { SessionContext } from '@/lib/prisma-rls'

/**
 * Paths that don't require tenant isolation
 */
const PUBLIC_PATHS = [
  '/api/health',
  '/api/auth',
  '/login',
  '/register',
  '/_next',
  '/favicon.ico',
  '/api/webhook',
]

/**
 * Paths that require authentication but handle their own tenant isolation
 */
const SELF_MANAGED_PATHS = [
  '/api/auth/session',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/callback',
]

/**
 * Check if a path should be handled by tenant middleware
 */
function shouldApplyTenantMiddleware(pathname: string): boolean {
  // Skip public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return false
  }

  // Skip self-managed auth paths
  if (SELF_MANAGED_PATHS.some(path => pathname.startsWith(path))) {
    return false
  }

  // Apply to all API routes and app routes
  return pathname.startsWith('/api/') || pathname.startsWith('/app/')
}

/**
 * Extract session context from the request
 */
async function getSessionContext(_request: NextRequest): Promise<SessionContext | null> {
  try {
    // Get session using NextAuth
    const session = await auth()

    if (!session?.user?.merchantId) {
      return null
    }

    return {
      merchantId: session.user.merchantId,
      userId: session.user.id,
      email: session.user.email || undefined,
      businessName: session.user.businessName || undefined,
    }
  } catch (error) {
    console.error('Error extracting session context:', error)
    return null
  }
}

/**
 * Main tenant middleware function
 */
export async function tenantMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for paths that don't need tenant isolation
  if (!shouldApplyTenantMiddleware(pathname)) {
    return NextResponse.next()
  }

  // Get session context
  const sessionContext = await getSessionContext(request)

  // If no valid session, redirect to login for protected routes
  if (!sessionContext) {
    console.warn(`Unauthorized access attempt to ${pathname}`)

    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // For app routes, redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Create response with session context in headers
  const response = NextResponse.next()

  // Add session context to headers for use in API routes
  response.headers.set('X-Merchant-ID', sessionContext.merchantId)
  response.headers.set('X-User-ID', sessionContext.userId)

  if (sessionContext.email) {
    response.headers.set('X-User-Email', sessionContext.email)
  }

  if (sessionContext.businessName) {
    response.headers.set('X-Business-Name', sessionContext.businessName)
  }

  // Log access for security monitoring
  if (process.env.NODE_ENV === 'development') {
    console.log(`Tenant access: ${sessionContext.merchantId} -> ${pathname}`)
  }

  return response
}

/**
 * Extract session context from request headers (for API routes)
 */
export function getSessionFromHeaders(request: NextRequest): SessionContext | null {
  const merchantId = request.headers.get('X-Merchant-ID')
  const userId = request.headers.get('X-User-ID')

  if (!merchantId || !userId) {
    return null
  }

  return {
    merchantId,
    userId,
    email: request.headers.get('X-User-Email') || undefined,
    businessName: request.headers.get('X-Business-Name') || undefined,
  }
}

/**
 * Validate tenant access for API routes
 * Throws error if merchantId in URL doesn't match session
 */
export function validateTenantAccess(
  sessionContext: SessionContext,
  requestedMerchantId?: string
): void {
  if (requestedMerchantId && requestedMerchantId !== sessionContext.merchantId) {
    throw new Error(
      `Access denied: User ${sessionContext.userId} cannot access data for merchant ${requestedMerchantId}`
    )
  }
}

/**
 * Helper to create error responses for API routes
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: message,
      status,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

/**
 * Audit logging for security events
 */
export function auditLog(event: {
  type: 'ACCESS' | 'ERROR' | 'SECURITY_VIOLATION'
  merchantId?: string
  userId?: string
  path: string
  details?: any
}): void {
  // In production, this would send to a security monitoring system
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...event,
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('Security Audit:', logEntry)
  }

  // TODO: Implement production logging (e.g., to CloudWatch, DataDog, etc.)
}