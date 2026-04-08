/**
 * Database Utilities with Row Level Security
 *
 * This module provides high-level database operations that automatically
 * include proper tenant isolation and security validation.
 */

import type { Prisma } from "@/generated/client";
import { getSecureDatabase, withSecureTransaction } from "@/lib/auth-context";
import { formatCurrency as unifiedFormatCurrency } from "@/lib/utils";

// Re-export types for convenience
export type {
  Merchant,
  Client,
  Credit,
  Payment,
  PaymentAllocation,
  CreditStatus,
  PaymentMethod,
} from "@/generated/client";

/**
 * Client Operations with automatic tenant isolation
 */
export const ClientOperations = {
  /**
   * Find all clients for the current merchant
   */
  async findMany(params?: {
    where?: Prisma.ClientWhereInput;
    orderBy?: Prisma.ClientOrderByWithRelationInput;
    take?: number;
    skip?: number;
    include?: Prisma.ClientInclude;
  }) {
    const db = await getSecureDatabase();
    return await db.client.findMany({
      ...params,
      include: {
        _count: {
          select: {
            credits: true,
            payments: true,
          },
        },
        ...params?.include,
      },
    });
  },

  /**
   * Find a specific client by ID (with tenant validation)
   */
  async findUnique(id: string, include?: Prisma.ClientInclude) {
    const db = await getSecureDatabase();
    return await db.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            credits: true,
            payments: true,
          },
        },
        ...include,
      },
    });
  },

  /**
   * Create a new client
   */
  async create(data: Omit<Prisma.ClientCreateInput, "merchant">) {
    // Get session context before transaction
    const session = await import("@/lib/auth-context").then((m) => m.getAuthenticatedSession());
    console.log("Creating client with session:", JSON.stringify(session));

    // Verify merchant exists using raw Prisma client (bypassing RLS)
    const { PrismaClient } = await import("@/generated/client");
    const rawPrisma = new PrismaClient();

    try {
      const merchant = await rawPrisma.merchant.findUnique({
        where: { id: session.merchantId },
        select: { id: true, email: true },
      });

      if (!merchant) {
        console.error(`Session contains invalid merchantId: ${session.merchantId}`);
        throw new Error(`Invalid session: Merchant ${session.merchantId} does not exist in database`);
      }

      console.log("Verified merchant exists:", merchant.email);

      return await withSecureTransaction(async (db) => {
        return await db.client.create({
          data: {
            ...data,
            merchantId: session.merchantId,
          },
          include: {
            _count: {
              select: {
                credits: true,
                payments: true,
              },
            },
          },
        });
      });
    } finally {
      await rawPrisma.$disconnect();
    }
  },

  /**
   * Update a client
   */
  async update(id: string, data: Prisma.ClientUpdateInput) {
    const db = await getSecureDatabase();
    return await db.client.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            credits: true,
            payments: true,
          },
        },
      },
    });
  },

  /**
   * Delete a client
   */
  async delete(id: string) {
    const db = await getSecureDatabase();
    return await db.client.delete({
      where: { id },
    });
  },

  /**
   * Search clients by name or email
   */
  async search(query: string, limit = 10) {
    const db = await getSecureDatabase();
    return await db.client.findMany({
      where: {
        OR: [
          {
            firstName: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            businessName: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      take: limit,
      include: {
        _count: {
          select: {
            credits: true,
            payments: true,
          },
        },
      },
    });
  },
};

/**
 * Credit Operations with automatic tenant isolation
 */
export const CreditOperations = {
  /**
   * Find all credits for the current merchant
   */
  async findMany(params?: {
    where?: Prisma.CreditWhereInput;
    orderBy?: Prisma.CreditOrderByWithRelationInput;
    take?: number;
    skip?: number;
    include?: Prisma.CreditInclude;
  }) {
    const db = await getSecureDatabase();
    return await db.credit.findMany({
      ...params,
      include: {
        client: true,
        paymentAllocations: {
          include: {
            payment: true,
          },
        },
        ...params?.include,
      },
    });
  },

  /**
   * Find a specific credit by ID
   */
  async findUnique(id: string, include?: Prisma.CreditInclude) {
    const db = await getSecureDatabase();
    return await db.credit.findUnique({
      where: { id },
      include: {
        client: true,
        paymentAllocations: {
          include: {
            payment: true,
          },
        },
        ...include,
      },
    });
  },

  /**
   * Create a new credit
   */
  async create(data: { label: string; totalAmount: number; clientId: string; dueDate?: Date; description?: string }) {
    // Get session context before transaction
    const session = await import("@/lib/auth-context").then((m) => m.getAuthenticatedSession());

    return await withSecureTransaction(async (db) => {
      // Calculate initial status
      const status = data.dueDate && data.dueDate < new Date() ? "OVERDUE" : "OPEN";

      return await db.credit.create({
        data: {
          label: data.label,
          totalAmount: data.totalAmount,
          remainingAmount: data.totalAmount, // Initially, remaining = total
          dueDate: data.dueDate,
          status,
          description: data.description,
          merchant: {
            connect: { id: session.merchantId },
          },
          client: {
            connect: { id: data.clientId },
          },
        },
        include: {
          client: true,
          paymentAllocations: {
            include: {
              payment: true,
            },
          },
        },
      });
    });
  },

  /**
   * Update a credit
   */
  async update(id: string, data: Prisma.CreditUpdateInput) {
    const db = await getSecureDatabase();
    return await db.credit.update({
      where: { id },
      data,
      include: {
        client: true,
        paymentAllocations: {
          include: {
            payment: true,
          },
        },
      },
    });
  },

  /**
   * Delete a credit
   */
  async delete(id: string) {
    const db = await getSecureDatabase();
    return await db.credit.delete({
      where: { id },
    });
  },

  /**
   * Get credits by status
   */
  async findByStatus(status: "OPEN" | "PAID" | "OVERDUE", limit?: number) {
    const db = await getSecureDatabase();
    return await db.credit.findMany({
      where: { status },
      ...(limit && { take: limit }),
      include: {
        client: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    });
  },

  /**
   * Get overdue credits
   */
  async findOverdue() {
    return await this.findByStatus("OVERDUE");
  },
};

/**
 * Payment Operations with automatic tenant isolation
 */
export const PaymentOperations = {
  /**
   * Find all payments for the current merchant
   */
  async findMany(params?: {
    where?: Prisma.PaymentWhereInput;
    orderBy?: Prisma.PaymentOrderByWithRelationInput;
    take?: number;
    skip?: number;
    include?: Prisma.PaymentInclude;
  }) {
    const db = await getSecureDatabase();
    return await db.payment.findMany({
      ...params,
      include: {
        client: true,
        paymentAllocations: {
          include: {
            credit: true,
          },
        },
        ...params?.include,
      },
    });
  },

  /**
   * Find a specific payment by ID
   */
  async findUnique(id: string, include?: Prisma.PaymentInclude) {
    const db = await getSecureDatabase();
    return await db.payment.findUnique({
      where: { id },
      include: {
        client: true,
        paymentAllocations: {
          include: {
            credit: true,
          },
        },
        ...include,
      },
    });
  },

  /**
   * Create a new payment
   */
  async create(data: {
    amount: number;
    clientId: string;
    method?: "CASH" | "BANK_TRANSFER" | "CHECK" | "CARD" | "MOBILE_PAYMENT" | "OTHER";
    reference?: string;
    note?: string;
    paymentDate?: Date;
  }) {
    // Get session context before transaction
    const session = await import("@/lib/auth-context").then((m) => m.getAuthenticatedSession());

    return await withSecureTransaction(async (db) => {
      return await db.payment.create({
        data: {
          amount: data.amount,
          method: data.method || "CASH",
          reference: data.reference,
          note: data.note,
          paymentDate: data.paymentDate || new Date(),
          merchant: {
            connect: { id: session.merchantId },
          },
          client: {
            connect: { id: data.clientId },
          },
        },
        include: {
          client: true,
          paymentAllocations: {
            include: {
              credit: true,
            },
          },
        },
      });
    });
  },
};

/**
 * Dashboard Analytics with automatic tenant isolation
 */
export const AnalyticsOperations = {
  /**
   * Get key performance indicators for the current merchant
   */
  async getKPIs() {
    const db = await getSecureDatabase();

    const [totalClients, openCredits, totalCreditsAmount, totalPaymentsAmount, overdueCredits] = await Promise.all([
      // Total clients
      db.client.count(),

      // Open credits
      db.credit.count({
        where: { status: "OPEN" },
      }),

      // Total credits amount
      db.credit.aggregate({
        _sum: { totalAmount: true },
      }),

      // Total payments amount
      db.payment.aggregate({
        _sum: { amount: true },
      }),

      // Overdue credits
      db.credit.count({
        where: { status: "OVERDUE" },
      }),
    ]);

    return {
      totalClients,
      openCredits,
      totalCreditsAmount: totalCreditsAmount._sum.totalAmount || 0,
      totalPaymentsAmount: totalPaymentsAmount._sum.amount || 0,
      overdueCredits,
    };
  },

  /**
   * Get recent activity
   */
  async getRecentActivity(limit = 10) {
    const db = await getSecureDatabase();

    const [recentCredits, recentPayments] = await Promise.all([
      db.credit.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),

      db.payment.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return {
      recentCredits,
      recentPayments,
    };
  },
};

/**
 * Utility functions for data validation and transformation
 */
export const DataUtils = {
  /**
   * Format currency amount for display
   * @deprecated Use formatCurrency from '@/lib/utils' for unified currency formatting
   */
  formatCurrency(amount: number | string, currency = "TND"): string {
    // This method is deprecated - use the unified function from utils.ts
    return unifiedFormatCurrency(amount, currency);
  },

  /**
   * Calculate credit status based on business rules
   */
  calculateCreditStatus(remainingAmount: number, dueDate?: Date | null): "OPEN" | "PAID" | "OVERDUE" {
    if (remainingAmount === 0) {
      return "PAID";
    }

    if (dueDate && dueDate < new Date() && remainingAmount > 0) {
      return "OVERDUE";
    }

    return "OPEN";
  },

  /**
   * Validate merchant ownership of resource
   */
  async validateOwnership(resourceType: "client" | "credit" | "payment", resourceId: string): Promise<boolean> {
    try {
      const db = await getSecureDatabase();

      switch (resourceType) {
        case "client":
          const client = await db.client.findUnique({ where: { id: resourceId } });
          return !!client;

        case "credit":
          const credit = await db.credit.findUnique({ where: { id: resourceId } });
          return !!credit;

        case "payment":
          const payment = await db.payment.findUnique({ where: { id: resourceId } });
          return !!payment;

        default:
          return false;
      }
    } catch {
      return false;
    }
  },
};
