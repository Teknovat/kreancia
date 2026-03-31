/**
 * Currency Context (Alternative approach)
 *
 * Provides merchant currency through React Context
 * Alternative to useMerchantCurrency hook for better performance
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { formatCurrency } from '@/lib/utils'

interface CurrencyContextValue {
  currency: string
  formatAmount: (amount: number | string) => string
  isLoading: boolean
  error: string | null
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'TND',
  formatAmount: (amount) => formatCurrency(amount, 'TND'),
  isLoading: true,
  error: null
})

interface CurrencyProviderProps {
  children: ReactNode
  initialCurrency?: string
}

export function CurrencyProvider({ children, initialCurrency }: CurrencyProviderProps) {
  const [currency, setCurrency] = useState<string>(initialCurrency || 'TND')
  const [isLoading, setIsLoading] = useState(!initialCurrency)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Si on a déjà une currency initiale, pas besoin de fetch
    if (initialCurrency) {
      setIsLoading(false)
      return
    }

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
          setCurrency('TND')
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchCurrency()

    return () => {
      isMounted = false
    }
  }, [initialCurrency])

  const formatAmount = (amount: number | string) => {
    return formatCurrency(amount, currency)
  }

  const value: CurrencyContextValue = {
    currency,
    formatAmount,
    isLoading,
    error
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

/**
 * Hook to use currency context
 */
export function useCurrencyContext(): CurrencyContextValue {
  const context = useContext(CurrencyContext)

  if (!context) {
    throw new Error('useCurrencyContext must be used within a CurrencyProvider')
  }

  return context
}

/**
 * Utility to get currency from server-side for initial props
 */
export async function getServerCurrency(): Promise<string> {
  try {
    // Import server-side function
    const { getMerchantCurrency } = await import('@/lib/format-currency-server')
    return await getMerchantCurrency()
  } catch (error) {
    console.error('Failed to get server currency:', error)
    return 'TND'
  }
}