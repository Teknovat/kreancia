/**
 * Merchant Management Utilities
 * Handles merchant account creation, validation, and database operations
 */

import { PrismaClient } from '../../src/generated/client'
import { hash } from 'bcryptjs'
import { MerchantAccountData, validateMerchantAccount, sanitizeMerchantData } from './validation'

/**
 * Merchant creation result types
 */
export interface CreateMerchantResult {
  success: boolean
  merchant?: {
    id: string
    email: string
    name: string
    businessName?: string
    currency: string
    createdAt: Date
  }
  errors?: string[]
}

/**
 * Merchant existence check result
 */
export interface MerchantExistsResult {
  exists: boolean
  merchant?: {
    id: string
    email: string
    name: string
    createdAt: Date
  }
}

/**
 * Configuration for password hashing
 */
const BCRYPT_SALT_ROUNDS = 10

/**
 * MerchantManager class handles all merchant account operations
 */
export class MerchantManager {
  private prisma: PrismaClient

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  }

  /**
   * Check if a merchant already exists by email
   */
  async checkMerchantExists(email: string): Promise<MerchantExistsResult> {
    try {
      const merchant = await this.prisma.merchant.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      })

      return {
        exists: !!merchant,
        merchant: merchant || undefined,
      }
    } catch (error) {
      console.error('Error checking merchant existence:', error)
      throw new Error('Failed to check merchant existence')
    }
  }

  /**
   * Create a new merchant account
   */
  async createMerchant(rawData: Partial<MerchantAccountData>): Promise<CreateMerchantResult> {
    try {
      // Sanitize input data
      const sanitizedData = sanitizeMerchantData(rawData)

      // Validate the data
      const validation = validateMerchantAccount(sanitizedData)
      if (!validation.success) {
        return {
          success: false,
          errors: validation.errors,
        }
      }

      const data = validation.data!

      // Check if merchant already exists
      const existsResult = await this.checkMerchantExists(data.email)
      if (existsResult.exists) {
        return {
          success: false,
          errors: [`Merchant with email '${data.email}' already exists`],
        }
      }

      // Hash the password
      const hashedPassword = await hash(data.password, BCRYPT_SALT_ROUNDS)

      // Create the merchant
      const merchant = await this.prisma.merchant.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          currency: data.currency,
          businessName: data.businessName,
          businessAddress: data.businessAddress,
          phone: data.phone,
        },
        select: {
          id: true,
          email: true,
          name: true,
          businessName: true,
          currency: true,
          createdAt: true,
        },
      })

      return {
        success: true,
        merchant: {
          ...merchant,
          businessName: merchant.businessName || undefined,
        },
      }
    } catch (error) {
      console.error('Error creating merchant:', error)
      return {
        success: false,
        errors: ['Failed to create merchant account. Please try again.'],
      }
    }
  }

  /**
   * List all merchants (for admin purposes)
   */
  async listMerchants(options?: {
    limit?: number
    offset?: number
    orderBy?: 'createdAt' | 'name' | 'email'
    orderDirection?: 'asc' | 'desc'
  }): Promise<{
    merchants: Array<{
      id: string
      email: string
      name: string
      businessName?: string
      currency: string
      createdAt: Date
    }>
    total: number
  }> {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = 'createdAt',
        orderDirection = 'desc',
      } = options || {}

      const [merchants, total] = await Promise.all([
        this.prisma.merchant.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            businessName: true,
            currency: true,
            createdAt: true,
          },
          orderBy: {
            [orderBy]: orderDirection,
          },
          take: limit,
          skip: offset,
        }),
        this.prisma.merchant.count(),
      ])

      return {
        merchants: merchants.map(merchant => ({
          ...merchant,
          businessName: merchant.businessName || undefined,
        })),
        total
      }
    } catch (error) {
      console.error('Error listing merchants:', error)
      throw new Error('Failed to list merchants')
    }
  }

  /**
   * Get merchant details by ID
   */
  async getMerchantById(id: string): Promise<{
    id: string
    email: string
    name: string
    businessName?: string
    businessAddress?: string
    phone?: string
    currency: string
    createdAt: Date
    updatedAt: Date
  } | null> {
    try {
      const merchant = await this.prisma.merchant.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          businessName: true,
          businessAddress: true,
          phone: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!merchant) return null

      return {
        ...merchant,
        businessName: merchant.businessName || undefined,
        businessAddress: merchant.businessAddress || undefined,
        phone: merchant.phone || undefined,
      }
    } catch (error) {
      console.error('Error fetching merchant:', error)
      throw new Error('Failed to fetch merchant')
    }
  }

  /**
   * Update merchant password
   */
  async updateMerchantPassword(
    email: string,
    newPassword: string
  ): Promise<{
    success: boolean
    errors?: string[]
  }> {
    try {
      // Validate the new password
      const validation = validateMerchantAccount({
        email,
        password: newPassword,
        name: 'temp',
        currency: 'TND' as const
      })

      if (!validation.success) {
        const passwordErrors = validation.errors?.filter(error =>
          error.startsWith('password:')
        ) || ['Invalid password']
        return {
          success: false,
          errors: passwordErrors,
        }
      }

      // Check if merchant exists
      const existsResult = await this.checkMerchantExists(email)
      if (!existsResult.exists) {
        return {
          success: false,
          errors: [`Merchant with email '${email}' not found`],
        }
      }

      // Hash the new password
      const hashedPassword = await hash(newPassword, BCRYPT_SALT_ROUNDS)

      // Update the password
      await this.prisma.merchant.update({
        where: { email: email.toLowerCase().trim() },
        data: { password: hashedPassword },
      })

      return { success: true }
    } catch (error) {
      console.error('Error updating merchant password:', error)
      return {
        success: false,
        errors: ['Failed to update password. Please try again.'],
      }
    }
  }

  /**
   * Delete merchant account (use with extreme caution)
   */
  async deleteMerchant(email: string): Promise<{
    success: boolean
    errors?: string[]
  }> {
    try {
      // Check if merchant exists
      const existsResult = await this.checkMerchantExists(email)
      if (!existsResult.exists) {
        return {
          success: false,
          errors: [`Merchant with email '${email}' not found`],
        }
      }

      // Delete the merchant (cascade will handle related records due to onDelete: Cascade in schema)
      await this.prisma.merchant.delete({
        where: { email: email.toLowerCase().trim() },
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting merchant:', error)
      return {
        success: false,
        errors: ['Failed to delete merchant. Please try again.'],
      }
    }
  }

  /**
   * Validate database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('Database connection failed:', error)
      return false
    }
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

/**
 * Create a singleton instance for script usage
 */
let merchantManagerInstance: MerchantManager | null = null

export function getMerchantManager(): MerchantManager {
  if (!merchantManagerInstance) {
    merchantManagerInstance = new MerchantManager()
  }
  return merchantManagerInstance
}

/**
 * Cleanup function for graceful shutdown
 */
export async function cleanup(): Promise<void> {
  if (merchantManagerInstance) {
    await merchantManagerInstance.disconnect()
    merchantManagerInstance = null
  }
}