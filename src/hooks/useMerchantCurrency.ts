/**
 * Hook for accessing merchant currency throughout the application
 */
'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'

interface MerchantCurrency {
  currency: string
  formatAmount: (amount: number | string) => string
  isLoading: boolean
  error: string | null
}

export function useMerchantCurrency(): MerchantCurrency {
  const [currency, setCurrency] = useState<string>('TND')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchCurrency = async () => {
      try {
        const response = await fetch('/api/merchant/currency')

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (isMounted) {
          setCurrency(data.currency || 'TND')
          setError(null)
        }
      } catch (err) {
        console.error('Failed to fetch merchant currency:', err)
        if (isMounted) {
          setCurrency('TND') // Fallback to default
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchCurrency()

    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [])

  const formatAmount = (amount: number | string) => {
    return formatCurrency(amount, currency)
  }

  return {
    currency,
    formatAmount,
    isLoading,
    error
  }
}