/**
 * Credit Service for Kreancia
 * Handles all credit-related database operations with RLS
 */

import { PrismaClient } from '@/generated/client'
import { Decimal } from '@prisma/client/runtime/library'
import { getSecurePrismaClient } from '@/lib/prisma-rls'
import { withSecureTransaction } from '@/lib/auth-context'
import type {
  Credit,
  CreditWithDetails,
  CreditFilters,
  CreditListResponse,
  CreditFormData,
  CreditUpdateData,
  CreditSummary,
  CreditStatus,
  BulkCreditStatusResult
} from '@/types/credit'

/**
 * Credit Service Class
 */
export class CreditService {
  private prisma: PrismaClient
  private merchantId: string

  constructor(merchantId: string) {
    this.merchantId = merchantId
    this.prisma = new PrismaClient()
  }

  /**
   * Get secure client with RLS enabled
   */
  private async getSecureClient() {
    const secureClient = getSecurePrismaClient()
    return await secureClient.withSession({
      merchantId: this.merchantId,
      userId: this.merchantId, // Since merchant IS the user
      businessName: undefined // Optional
    })
  }

  /**
   * Calculate credit status based on remaining amount and due date
   */
  private calculateCreditStatus(remainingAmount: Decimal, dueDate: Date | null): CreditStatus {
    const remaining = Number(remainingAmount)

    if (remaining <= 0) {
      return 'PAID'
    }

    if (dueDate && new Date() > dueDate) {
      return 'OVERDUE'
    }

    return 'OPEN'
  }

  /**
   * Calculate days overdue for a credit
   */
  private calculateDaysOverdue(dueDate: Date | null): number | null {
    if (!dueDate) return null

    const today = new Date()
    const due = new Date(dueDate)

    if (today <= due) return null

    const diffTime = today.getTime() - due.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Transform database credit to CreditWithDetails
   */
  private transformCreditWithDetails(creditData: any): CreditWithDetails {
    const totalAmountNumber = Number(creditData.totalAmount)
    const remainingAmountNumber = Number(creditData.remainingAmount)
    const paidAmount = totalAmountNumber - remainingAmountNumber
    const daysOverdue = this.calculateDaysOverdue(creditData.dueDate)
    const isOverdue = daysOverdue !== null && daysOverdue > 0

    return {
      id: creditData.id,
      label: creditData.label,
      totalAmount: creditData.totalAmount,
      remainingAmount: creditData.remainingAmount,
      dueDate: creditData.dueDate,
      status: creditData.status,
      clientId: creditData.clientId,
      merchantId: creditData.merchantId,
      createdAt: creditData.createdAt,
      updatedAt: creditData.updatedAt,
      client: {
        id: creditData.client.id,
        firstName: creditData.client.firstName,
        lastName: creditData.client.lastName,
        fullName: `${creditData.client.firstName} ${creditData.client.lastName}`
      },
      allocations: creditData.paymentAllocations?.map((allocation: any) => ({
        id: allocation.id,
        amount: allocation.amount,
        paymentId: allocation.paymentId,
        payment: {
          id: allocation.payment.id,
          amount: allocation.payment.amount,
          paymentDate: allocation.payment.paymentDate,
          method: allocation.payment.method
        }
      })) || [],
      paidAmount,
      remainingAmountNumber,
      totalAmountNumber,
      daysOverdue,
      isOverdue
    }
  }

  /**
   * Get paginated list of credits with filters
   */
  async getCredits(filters: CreditFilters): Promise<CreditListResponse> {
    const client = await this.getSecureClient()

    const {
      search,
      status,
      clientId,
      dueAfter,
      dueBefore,
      sortBy,
      sortOrder,
      page,
      limit
    } = filters

    // Build where clause
    const where: any = {
      merchantId: this.merchantId
    }

    // Add search filter
    if (search.trim()) {
      where.OR = [
        {
          label: {
            contains: search.trim(),
            mode: 'insensitive'
          }
        },
        {
          client: {
            OR: [
              {
                firstName: {
                  contains: search.trim(),
                  mode: 'insensitive'
                }
              },
              {
                lastName: {
                  contains: search.trim(),
                  mode: 'insensitive'
                }
              }
            ]
          }
        }
      ]
    }

    // Add status filter
    if (status !== 'ALL') {
      where.status = status
    }

    // Add client filter
    if (clientId) {
      where.clientId = clientId
    }

    // Add date filters
    if (dueAfter) {
      where.dueDate = { ...where.dueDate, gte: dueAfter }
    }
    if (dueBefore) {
      where.dueDate = { ...where.dueDate, lte: dueBefore }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build orderBy clause
    const orderBy: any = {}
    if (sortBy === 'client') {
      orderBy.client = {
        firstName: sortOrder
      }
    } else {
      orderBy[sortBy] = sortOrder
    }

    // Fetch credits with related data
    const [credits, total] = await Promise.all([
      client.credit.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          paymentAllocations: {
            include: {
              payment: {
                select: {
                  id: true,
                  amount: true,
                  paymentDate: true,
                  method: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      client.credit.count({ where })
    ])

    // Transform credits to include computed fields
    const creditsWithDetails = credits.map(creditData =>
      this.transformCreditWithDetails(creditData)
    )

    return {
      credits: creditsWithDetails,
      total,
      page,
      limit,
      hasMore: skip + creditsWithDetails.length < total
    }
  }

  /**
   * Get credit by ID with full details
   */
  async getCreditById(creditId: string): Promise<CreditWithDetails | null> {
    const client = await this.getSecureClient()

    const creditData = await client.credit.findUnique({
      where: {
        id: creditId,
        merchantId: this.merchantId
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        allocations: {
          include: {
            payment: {
              select: {
                id: true,
                amount: true,
                paymentDate: true,
                method: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!creditData) return null

    return this.transformCreditWithDetails(creditData)
  }

  /**
   * Create a new credit
   */
  async createCredit(data: CreditFormData): Promise<Credit> {
    const client = await this.getSecureClient()

    const totalAmountDecimal = new Decimal(data.totalAmount)
    const initialStatus = this.calculateCreditStatus(totalAmountDecimal, data.dueDate || null)

    return await client.credit.create({
      data: {
        label: data.label,
        totalAmount: totalAmountDecimal,
        remainingAmount: totalAmountDecimal, // Initially, nothing is paid
        dueDate: data.dueDate || null,
        status: initialStatus,
        clientId: data.clientId,
        merchantId: this.merchantId
      }
    })
  }

  /**
   * Update an existing credit
   */
  async updateCredit(creditId: string, data: CreditUpdateData): Promise<Credit> {
    const client = await this.getSecureClient()

    // Get current credit to calculate new remaining amount if total amount changes
    const currentCredit = await client.credit.findUnique({
      where: { id: creditId, merchantId: this.merchantId }
    })

    if (!currentCredit) {
      throw new Error('Credit not found')
    }

    const updateData: any = {}

    if (data.label !== undefined) {
      updateData.label = data.label
    }

    if (data.totalAmount !== undefined) {
      const newTotalAmount = new Decimal(data.totalAmount)
      const currentPaidAmount = Number(currentCredit.totalAmount) - Number(currentCredit.remainingAmount)
      const newRemainingAmount = Math.max(0, data.totalAmount - currentPaidAmount)

      updateData.totalAmount = newTotalAmount
      updateData.remainingAmount = new Decimal(newRemainingAmount)
    }

    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate
    }

    // Recalculate status if necessary
    const remainingAmount = updateData.remainingAmount || currentCredit.remainingAmount
    const dueDate = updateData.dueDate !== undefined ? updateData.dueDate : currentCredit.dueDate
    updateData.status = data.status || this.calculateCreditStatus(remainingAmount, dueDate)

    return await client.credit.update({
      where: {
        id: creditId,
        merchantId: this.merchantId
      },
      data: updateData
    })
  }

  /**
   * Delete a credit (only if no allocations exist)
   */
  async deleteCredit(creditId: string): Promise<void> {
    const client = await this.getSecureClient()

    // Check if credit has any allocations
    const allocationsCount = await client.paymentAllocation.count({
      where: {
        creditId: creditId
      }
    })

    if (allocationsCount > 0) {
      throw new Error('Cannot delete credit with existing payment allocations')
    }

    await client.credit.delete({
      where: {
        id: creditId,
        merchantId: this.merchantId
      }
    })
  }

  /**
   * Get credit summary statistics
   */
  async getCreditSummary(): Promise<CreditSummary> {
    const client = await this.getSecureClient()

    const [
      statusCounts,
      amountAggregates,
      oldestCredit
    ] = await Promise.all([
      client.credit.groupBy({
        by: ['status'],
        where: { merchantId: this.merchantId },
        _count: true,
        _sum: {
          remainingAmount: true
        }
      }),
      client.credit.aggregate({
        where: { merchantId: this.merchantId },
        _avg: { totalAmount: true },
        _sum: { totalAmount: true }
      }),
      client.credit.findFirst({
        where: {
          merchantId: this.merchantId,
          status: { in: ['OPEN', 'OVERDUE'] }
        },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true }
      })
    ])

    const summary = statusCounts.reduce((acc, item) => {
      acc[item.status] = {
        count: item._count,
        totalRemaining: Number(item._sum.remainingAmount || 0)
      }
      return acc
    }, {} as Record<string, { count: number; totalRemaining: number }>)

    const oldestCreditDays = oldestCredit
      ? Math.ceil((Date.now() - oldestCredit.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return {
      totalCredits: Object.values(summary).reduce((sum, s) => sum + s.count, 0),
      openCredits: summary.OPEN?.count || 0,
      paidCredits: summary.PAID?.count || 0,
      overdueCredits: summary.OVERDUE?.count || 0,
      totalAmountOpen: summary.OPEN?.totalRemaining || 0,
      totalAmountOverdue: summary.OVERDUE?.totalRemaining || 0,
      averageCreditAmount: Number(amountAggregates._avg.totalAmount) || 0,
      oldestCreditDays
    }
  }

  /**
   * Bulk update credit statuses (useful for scheduled jobs)
   */
  async bulkUpdateCreditStatuses(): Promise<BulkCreditStatusResult> {
    const client = await this.getSecureClient()

    // Get all credits that might need status updates
    const credits = await client.credit.findMany({
      where: {
        merchantId: this.merchantId,
        status: { in: ['OPEN', 'OVERDUE'] }
      }
    })

    const updates: any[] = []
    const results: any[] = []

    for (const credit of credits) {
      const newStatus = this.calculateCreditStatus(credit.remainingAmount, credit.dueDate)

      if (newStatus !== credit.status) {
        updates.push({
          where: { id: credit.id },
          data: { status: newStatus }
        })

        results.push({
          id: credit.id,
          newStatus,
          previousStatus: credit.status,
          remainingAmount: credit.remainingAmount
        })
      }
    }

    // Execute all updates in a transaction
    if (updates.length > 0) {
      await withSecureTransaction(async (tx) => {
        for (const update of updates) {
          await tx.credit.update(update)
        }
      })
    }

    return {
      updatedCredits: results,
      totalProcessed: credits.length,
      totalUpdated: updates.length
    }
  }

  /**
   * Get credits for a specific client
   */
  async getClientCredits(clientId: string): Promise<CreditWithDetails[]> {
    const filters: CreditFilters = {
      search: '',
      status: 'ALL',
      clientId: clientId,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 1000 // Large limit to get all credits for a client
    }

    const result = await this.getCredits(filters)
    return result.credits
  }

  /**
   * Get open credits for a client (for FIFO allocation)
   */
  async getOpenCreditsForClient(clientId: string): Promise<CreditWithDetails[]> {
    const client = await this.getSecureClient()

    const credits = await client.credit.findMany({
      where: {
        clientId: clientId,
        merchantId: this.merchantId,
        status: 'OPEN',
        remainingAmount: { gt: 0 }
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        allocations: {
          include: {
            payment: {
              select: {
                id: true,
                amount: true,
                paymentDate: true,
                method: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' } // FIFO: oldest first
    })

    return credits.map(creditData => this.transformCreditWithDetails(creditData))
  }
}