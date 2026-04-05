/**
 * Server-side currency formatting utilities
 *
 * Use this on the server side to format currency with merchant context
 * For client-side formatting, use useMerchantCurrency hook
 */

import { formatCurrency } from '@/lib/utils'
import { getAuthenticatedSession } from '@/lib/auth-context'

/**
 * Format currency amount with merchant's currency (server-side)
 */
export async function formatCurrencyWithMerchantContext(
  amount: number | string
): Promise<string> {
  try {
    const session = await getAuthenticatedSession()
    return formatCurrency(amount, session.currency)
  } catch {
    // Fallback to default currency if no session
    return formatCurrency(amount, 'TND')
  }
}

/**
 * Get merchant currency (server-side)
 */
export async function getMerchantCurrency(): Promise<string> {
  try {
    const session = await getAuthenticatedSession()
    return session.currency || 'TND'
  } catch {
    return 'TND'
  }
}