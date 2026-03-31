/**
 * Merchant Currency API Route
 *
 * Returns the currency setting for the authenticated merchant
 */

import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-context'

/**
 * GET /api/merchant/currency
 * Returns the merchant's currency setting
 */
export async function GET() {
  try {
    // Get authenticated session with currency included
    const session = await getAuthenticatedSession()

    return NextResponse.json({
      success: true,
      currency: session.currency || 'TND'
    })
  } catch (error) {
    console.error('Error fetching merchant currency:', error)

    // Return default currency for unauthenticated users
    return NextResponse.json(
      {
        success: false,
        currency: 'TND',
        error: 'Authentication required'
      },
      { status: 401 }
    )
  }
}