/**
 * Client Service for Kreancia
 * Handles all client-related database operations with RLS
 */

import { PrismaClient } from '@/generated/client'
import { Decimal } from '@prisma/client/runtime/library'
import { getSecurePrismaClient } from '@/lib/prisma-rls'
import type {
  ClientWithStats,
  ClientFilters,
  ClientListResponse,
  ClientFormData,
  ClientSummary,
  Client
} from '@/types/client'

/**
 * Client Service Class
 */
export class ClientService {
  private prisma: PrismaClient
  private merchantId: string

  constructor(merchantId: string) {
    this.merchantId = merchantId
    this.prisma = new PrismaClient()
  }

  /**
   * Calculate client status based on business logic
   */
  private calculateClientStatus(outstandingAmount: number, overdueAmount: number): 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' {
    if (overdueAmount > 0) {
      return 'SUSPENDED'
    }
    if (outstandingAmount > 0) {
      return 'ACTIVE'
    }
    return 'ACTIVE' // Default to ACTIVE for clients with no outstanding amounts
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
   * Get paginated list of clients with stats
   */
  async getClients(filters: ClientFilters): Promise<ClientListResponse> {
    const client = await this.getSecureClient()

    const {
      search,
      status,
      hasOverdue,
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
        },
        {
          email: {
            contains: search.trim(),
            mode: 'insensitive'
          }
        }
      ]
    }

    // Add status filter
    if (status !== 'ALL') {
      where.status = status
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build orderBy clause
    const orderBy: any = {}

    if (sortBy === 'name') {
      orderBy.firstName = sortOrder
    } else if (sortBy === 'outstandingAmount') {
      // For computed fields, we'll sort in memory
      orderBy.createdAt = 'desc' // default fallback
    } else {
      orderBy[sortBy] = sortOrder
    }

    // Fetch clients with related data
    const [clients, total] = await Promise.all([
      client.client.findMany({
        where,
        include: {
          credits: {
            select: {
              id: true,
              totalAmount: true,
              remainingAmount: true,
              status: true,
              dueDate: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              credits: true,
              payments: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      client.client.count({ where })
    ])

    // Transform clients to include computed fields
    const clientsWithStats: ClientWithStats[] = clients.map(clientData => {
      const totalCredits = clientData.credits.reduce(
        (sum, credit) => sum + Number(credit.totalAmount),
        0
      )

      const outstandingAmount = clientData.credits.reduce(
        (sum, credit) => sum + Number(credit.remainingAmount),
        0
      )

      const overdueAmount = clientData.credits
        .filter(credit =>
          credit.dueDate &&
          credit.dueDate < new Date() &&
          Number(credit.remainingAmount) > 0
        )
        .reduce((sum, credit) => sum + Number(credit.remainingAmount), 0)

      const lastActivity = clientData.credits.length > 0
        ? new Date(Math.max(...clientData.credits.map(c => c.createdAt.getTime())))
        : null

      return {
        id: clientData.id,
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        creditLimit: clientData.creditLimit,
        paymentTermDays: clientData.paymentTermDays,
        status: this.calculateClientStatus(outstandingAmount, overdueAmount),
        merchantId: clientData.merchantId,
        createdAt: clientData.createdAt,
        updatedAt: clientData.updatedAt,
        fullName: `${clientData.firstName} ${clientData.lastName}`,
        totalCredits,
        outstandingAmount,
        overdueAmount,
        lastActivity,
        creditCount: clientData._count.credits,
        paymentCount: clientData._count.payments
      }
    })

    // Apply overdue filter if needed
    let filteredClients = clientsWithStats
    if (hasOverdue) {
      filteredClients = clientsWithStats.filter(client => client.overdueAmount > 0)
    }

    // Sort by computed fields if needed
    if (sortBy === 'outstandingAmount') {
      filteredClients.sort((a, b) => {
        const result = a.outstandingAmount - b.outstandingAmount
        return sortOrder === 'asc' ? result : -result
      })
    }

    return {
      clients: filteredClients,
      total,
      page,
      limit,
      hasMore: skip + filteredClients.length < total
    }
  }

  /**
   * Get client by ID
   */
  async getClientById(clientId: string): Promise<ClientWithStats | null> {
    const client = await this.getSecureClient()

    const clientData = await client.client.findUnique({
      where: {
        id: clientId,
        merchantId: this.merchantId
      },
      include: {
        credits: {
          select: {
            id: true,
            totalAmount: true,
            remainingAmount: true,
            status: true,
            dueDate: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            credits: true,
            payments: true
          }
        }
      }
    })

    if (!clientData) return null

    // Transform to include computed fields (same logic as above)
    const totalCredits = clientData.credits.reduce(
      (sum, credit) => sum + Number(credit.totalAmount),
      0
    )

    const outstandingAmount = clientData.credits.reduce(
      (sum, credit) => sum + Number(credit.remainingAmount),
      0
    )

    const overdueAmount = clientData.credits
      .filter(credit =>
        credit.dueDate &&
        credit.dueDate < new Date() &&
        Number(credit.remainingAmount) > 0
      )
      .reduce((sum, credit) => sum + Number(credit.remainingAmount), 0)

    const lastActivity = clientData.credits.length > 0
      ? new Date(Math.max(...clientData.credits.map(c => c.createdAt.getTime())))
      : null

    return {
      id: clientData.id,
      firstName: clientData.firstName,
      lastName: clientData.lastName,
      email: clientData.email,
      phone: clientData.phone,
      address: clientData.address,
      creditLimit: Number(clientData.creditLimit),
      paymentTermDays: clientData.paymentTermDays,
      status: this.calculateClientStatus(outstandingAmount, overdueAmount),
      merchantId: clientData.merchantId,
      createdAt: clientData.createdAt,
      updatedAt: clientData.updatedAt,
      fullName: `${clientData.firstName} ${clientData.lastName}`,
      totalCredits,
      outstandingAmount,
      overdueAmount,
      lastActivity,
      creditCount: clientData._count.credits,
      paymentCount: clientData._count.payments
    }
  }

  /**
   * Create a new client
   */
  async createClient(data: ClientFormData): Promise<Client> {
    const client = await this.getSecureClient()

    return await client.client.create({
      data: {
        ...data,
        merchantId: this.merchantId,
        creditLimit: data.creditLimit
      }
    })
  }

  /**
   * Update an existing client
   */
  async updateClient(clientId: string, data: Partial<ClientFormData>): Promise<Client> {
    const client = await this.getSecureClient()

    return await client.client.update({
      where: {
        id: clientId,
        merchantId: this.merchantId
      },
      data: {
        ...data,
        creditLimit: data.creditLimit ? data.creditLimit : undefined
      }
    })
  }

  /**
   * Delete a client (hard delete - can only delete clients with no credits/payments)
   */
  async deleteClient(clientId: string): Promise<void> {
    const client = await this.getSecureClient()

    // Check if client has any credits or payments
    const creditCount = await client.credit.count({
      where: { clientId: clientId }
    })

    const paymentCount = await client.payment.count({
      where: { clientId: clientId }
    })

    if (creditCount > 0 || paymentCount > 0) {
      throw new Error('Cannot delete client with existing credits or payments')
    }

    await client.client.delete({
      where: {
        id: clientId,
        merchantId: this.merchantId
      }
    })
  }

  /**
   * Get client summary statistics
   */
  async getClientSummary(): Promise<ClientSummary> {
    const client = await this.getSecureClient()

    const [
      totalClients,
      avgCreditLimit,
      totalOutstanding,
      clientsWithOverdue
    ] = await Promise.all([
      client.client.count({
        where: { merchantId: this.merchantId }
      }),
      client.client.aggregate({
        where: { merchantId: this.merchantId },
        _avg: { creditLimit: true }
      }),
      client.credit.aggregate({
        where: { merchantId: this.merchantId },
        _sum: { remainingAmount: true }
      }),
      client.client.count({
        where: {
          merchantId: this.merchantId,
          credits: {
            some: {
              dueDate: { lt: new Date() },
              remainingAmount: { gt: 0 }
            }
          }
        }
      })
    ])

    // For status counts, we'd need to fetch all clients and compute status
    // For now, let's provide a simplified implementation
    return {
      totalClients,
      activeClients: totalClients, // Simplified: assume all are active for now
      inactiveClients: 0,
      suspendedClients: 0,
      averageCreditLimit: Number(avgCreditLimit._avg.creditLimit) || 0,
      totalOutstanding: Number(totalOutstanding._sum.remainingAmount) || 0,
      clientsWithOverdue
    }
  }

  /**
   * Search clients by name or email
   */
  async searchClients(query: string, limit = 10): Promise<ClientWithStats[]> {
    if (!query.trim()) return []

    const filters: ClientFilters = {
      search: query,
      status: 'ACTIVE',
      hasOverdue: false,
      sortBy: 'name',
      sortOrder: 'asc',
      page: 1,
      limit
    }

    const result = await this.getClients(filters)
    return result.clients
  }
}