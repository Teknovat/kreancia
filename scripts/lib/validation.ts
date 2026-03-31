/**
 * Validation utilities for merchant account creation
 */

import { z } from 'zod'

/**
 * Supported currencies for merchant accounts
 */
export const SUPPORTED_CURRENCIES = [
  'TND', // Tunisian Dinar
  'EUR', // Euro
  'USD', // US Dollar
  'MAD', // Moroccan Dirham
  'DZD', // Algerian Dinar
  'LYD', // Libyan Dinar
] as const

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number]

/**
 * Password strength validation
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

/**
 * Email validation
 */
const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be less than 255 characters')

/**
 * Business name validation
 */
const businessNameSchema = z
  .string()
  .min(2, 'Business name must be at least 2 characters')
  .max(100, 'Business name must be less than 100 characters')
  .regex(/^[a-zA-Z0-9\s\-&.,()]+$/, 'Business name contains invalid characters')

/**
 * Merchant name validation (personal/contact name)
 */
const merchantNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')

/**
 * Phone validation (international format)
 */
const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Phone must be in international format (+country code + number)')
  .optional()

/**
 * Complete merchant account validation schema
 */
export const merchantAccountSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: merchantNameSchema,
  currency: z.enum(SUPPORTED_CURRENCIES, {
    errorMap: () => ({ message: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}` })
  }),
  businessName: businessNameSchema.optional(),
  businessAddress: z.string().max(255, 'Address must be less than 255 characters').optional(),
  phone: phoneSchema,
})

export type MerchantAccountData = z.infer<typeof merchantAccountSchema>

/**
 * Validate merchant account data
 */
export function validateMerchantAccount(data: unknown): {
  success: boolean
  data?: MerchantAccountData
  errors?: string[]
} {
  const result = merchantAccountSchema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return {
    success: false,
    errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
  }
}

/**
 * Validate individual fields
 */
export const fieldValidators = {
  email: (email: string) => {
    const result = emailSchema.safeParse(email)
    return result.success ? null : result.error.errors[0].message
  },

  password: (password: string) => {
    const result = passwordSchema.safeParse(password)
    return result.success ? null : result.error.errors[0].message
  },

  name: (name: string) => {
    const result = merchantNameSchema.safeParse(name)
    return result.success ? null : result.error.errors[0].message
  },

  businessName: (businessName: string) => {
    if (!businessName) return null
    const result = businessNameSchema.safeParse(businessName)
    return result.success ? null : result.error.errors[0].message
  },

  currency: (currency: string) => {
    return SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency)
      ? null
      : `Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`
  },

  phone: (phone: string) => {
    if (!phone) return null
    const result = phoneSchema.safeParse(phone)
    return result.success ? null : result.error.errors[0].message
  }
}

/**
 * Check password strength and provide feedback
 */
export function getPasswordStrengthFeedback(password: string): {
  score: number // 0-5
  feedback: string[]
  isValid: boolean
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) score++
  else feedback.push('Use at least 8 characters')

  if (/[A-Z]/.test(password)) score++
  else feedback.push('Include uppercase letters')

  if (/[a-z]/.test(password)) score++
  else feedback.push('Include lowercase letters')

  if (/[0-9]/.test(password)) score++
  else feedback.push('Include numbers')

  if (/[^A-Za-z0-9]/.test(password)) score++
  else feedback.push('Include special characters')

  return {
    score,
    feedback,
    isValid: score === 5
  }
}

/**
 * Sanitize and format input data
 */
export function sanitizeMerchantData(data: Partial<MerchantAccountData>): Partial<MerchantAccountData> {
  const sanitized: Partial<MerchantAccountData> = {}

  if (data.email) {
    sanitized.email = data.email.toLowerCase().trim()
  }

  if (data.name) {
    sanitized.name = data.name.trim()
  }

  if (data.businessName) {
    sanitized.businessName = data.businessName.trim()
  }

  if (data.businessAddress) {
    sanitized.businessAddress = data.businessAddress.trim()
  }

  if (data.phone) {
    sanitized.phone = data.phone.replace(/\s/g, '')
  }

  if (data.currency) {
    sanitized.currency = data.currency.toUpperCase() as SupportedCurrency
  }

  if (data.password) {
    sanitized.password = data.password // Don't trim passwords
  }

  return sanitized
}