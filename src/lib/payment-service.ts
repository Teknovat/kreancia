/**
 * Payment Service for Kreancia
 * Handles payment operations with FIFO allocation algorithm
 */

import { getSecurePrismaClient } from "@/lib/prisma-rls";
import { withSecureTransaction } from "@/lib/auth-context";
import { CreditService } from "@/lib/credit-service";
import { Decimal } from "@prisma/client/runtime/library";
import type {
  Payment,
  PaymentWithDetails,
  PaymentFormData,
  PaymentUpdateData as _PaymentUpdateData,
  PaymentFilters,
  PaymentListResponse,
  PaymentSummary,
  PaymentAllocation,
  FIFOAllocationResult,
  ManualAllocationItem,
  AllocationValidation,
  PaymentReversalResult,
  ClientBalance,
  PaymentMethod,
  AllocationMode as _AllocationMode,
} from "@/types/payment";
import type { CreditWithDetails as _CreditWithDetails } from "@/types/credit";

/**
 * Payment Service Class
 */
export class PaymentService {
  private merchantId: string;
  private creditService: CreditService;

  constructor(merchantId: string) {
    this.merchantId = merchantId;
    this.creditService = new CreditService(merchantId);
  }

  /**
   * Get secure client with RLS enabled
   */
  private async getSecureClient() {
    const secureClient = getSecurePrismaClient();
    return await secureClient.withSession({
      merchantId: this.merchantId,
      userId: this.merchantId,
      businessName: undefined,
    });
  }

  /**
   * Transform database payment to PaymentWithDetails
   */
  private transformPaymentWithDetails(paymentData: any): PaymentWithDetails {
    const totalAllocated =
      paymentData.paymentAllocations?.reduce((sum: number, allocation: any) => sum + Number(allocation.amount), 0) || 0;
    const unallocatedAmount = paymentData.amount - totalAllocated;
    const isFullyAllocated = unallocatedAmount <= 0.01; // Allow for small rounding differences

    return {
      id: paymentData.id,
      amount: Number(paymentData.amount),
      note: paymentData.note,
      method: paymentData.method,
      reference: paymentData.reference,
      paymentDate: paymentData.paymentDate,
      clientId: paymentData.clientId,
      merchantId: paymentData.merchantId,
      createdAt: paymentData.createdAt,
      updatedAt: paymentData.updatedAt,
      client: {
        id: paymentData.client.id,
        firstName: paymentData.client.firstName,
        lastName: paymentData.client.lastName,
        fullName: `${paymentData.client.firstName} ${paymentData.client.lastName}`,
      },
      allocations:
        paymentData.paymentAllocations?.map((allocation: any) => ({
          id: allocation.id,
          amount: Number(allocation.amount),
          allocatedAmount: Number(allocation.allocatedAmount || allocation.amount),
          credit: {
            id: allocation.credit.id,
            label: allocation.credit.label,
            totalAmount: Number(allocation.credit.totalAmount),
            status: allocation.credit.status,
          },
        })) || [],
      totalAllocated,
      unallocatedAmount,
      isFullyAllocated,
    };
  }

  /**
   * CORE FIFO ALLOCATION ALGORITHM
   * Allocates payment amount to oldest unpaid credits first
   */
  async allocatePaymentFIFO(
    paymentId: string,
    paymentAmount: number,
    clientId: string,
    tx?: any, // Optional transaction client
  ): Promise<FIFOAllocationResult> {
    // Get all open credits for the client, ordered by creation date (FIFO)
    const openCredits = await this.creditService.getOpenCreditsForClient(clientId);

    if (openCredits.length === 0) {
      return {
        allocations: [],
        totalAllocated: 0,
        unallocatedAmount: Number(paymentAmount),
        creditsUpdated: [],
      };
    }

    let remainingPaymentAmount = Number(paymentAmount);
    const allocations: PaymentAllocation[] = [];
    const creditsUpdated: string[] = [];

    // Function to execute allocation logic
    const executeAllocation = async (client: any) => {
      for (const credit of openCredits) {
        if (remainingPaymentAmount <= 0.01) break; // Stop if payment fully allocated

        const creditRemainingAmount = Number(credit.remainingAmount);

        if (creditRemainingAmount <= 0) continue; // Skip if credit is fully paid

        // Calculate allocation amount: minimum of payment remaining and credit remaining
        const allocationAmount = Math.min(remainingPaymentAmount, creditRemainingAmount);

        if (allocationAmount <= 0) continue;

        // Create payment allocation record
        const allocation = await client.paymentAllocation.create({
          data: {
            amount: Number(allocationAmount),
            allocatedAmount: Number(allocationAmount),
            paymentId: paymentId,
            creditId: credit.id,
            merchantId: this.merchantId,
            clientId: clientId,
          },
        });

        allocations.push(allocation);

        // Update credit remaining amount
        const newRemainingAmount = creditRemainingAmount - allocationAmount;
        const newStatus =
          newRemainingAmount <= 0.01 ? "PAID" : credit.dueDate && new Date() > credit.dueDate ? "OVERDUE" : "OPEN";

        await client.credit.update({
          where: { id: credit.id },
          data: {
            remainingAmount: Number(Math.max(0, newRemainingAmount)),
            status: newStatus,
          },
        });

        creditsUpdated.push(credit.id);
        remainingPaymentAmount -= allocationAmount;
      }
    };

    // If transaction client provided, use it; otherwise create new transaction
    if (tx) {
      await executeAllocation(tx);
    } else {
      await withSecureTransaction(executeAllocation);
    }

    return {
      allocations,
      totalAllocated: Number(paymentAmount) - remainingPaymentAmount,
      unallocatedAmount: remainingPaymentAmount,
      creditsUpdated,
    };
  }

  /**
   * Validate manual allocation before processing
   */
  private async validateManualAllocation(
    clientId: string,
    paymentAmount: number,
    manualAllocations: ManualAllocationItem[],
  ): Promise<AllocationValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Get available credits for the client
    const availableCredits = await this.creditService.getOpenCreditsForClient(clientId);

    // Calculate total allocation amount
    const totalAllocationAmount = manualAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);

    // Validate total amount doesn't exceed payment amount
    if (totalAllocationAmount > paymentAmount) {
      errors.push(`Total allocation amount (${totalAllocationAmount}) exceeds payment amount (${paymentAmount})`);
    }

    // Validate each allocation
    for (const allocation of manualAllocations) {
      const credit = availableCredits.find((c) => c.id === allocation.creditId);

      if (!credit) {
        errors.push(`Credit ${allocation.creditId} not found or not available for allocation`);
        continue;
      }

      if (allocation.amount <= 0) {
        errors.push(`Allocation amount must be positive for credit ${credit.label}`);
      }

      if (allocation.amount > credit.remainingAmount) {
        errors.push(
          `Allocation amount (${allocation.amount}) exceeds remaining amount (${credit.remainingAmount}) for credit ${credit.label}`,
        );
      }
    }

    // Warn about unallocated amount
    if (totalAllocationAmount < paymentAmount) {
      const unallocated = paymentAmount - totalAllocationAmount;
      warnings.push(`${unallocated} will remain unallocated`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalAmount: totalAllocationAmount,
      availableCredits: availableCredits.map((credit) => ({
        id: credit.id,
        label: credit.label,
        remainingAmount: credit.remainingAmount,
        maxAllowedAllocation: credit.remainingAmount,
      })),
    };
  }

  /**
   * Allocate payment manually to specific credits
   */
  async allocatePaymentManual(
    paymentId: string,
    paymentAmount: number,
    clientId: string,
    manualAllocations: ManualAllocationItem[],
    tx?: any, // Optional transaction client
  ): Promise<FIFOAllocationResult> {
    // Validate allocations first
    const validation = await this.validateManualAllocation(clientId, Number(paymentAmount), manualAllocations);

    if (!validation.isValid) {
      throw new Error(`Invalid allocation: ${validation.errors.join(", ")}`);
    }

    const allocations: PaymentAllocation[] = [];
    const creditsUpdated: string[] = [];
    let totalAllocated = 0;

    // Function to execute allocation logic
    const executeAllocation = async (client: any) => {
      for (const manualAllocation of manualAllocations) {
        // Get current credit state
        const credit = await client.credit.findUnique({
          where: { id: manualAllocation.creditId },
        });

        if (!credit) {
          throw new Error(`Credit ${manualAllocation.creditId} not found`);
        }

        const allocationAmount = manualAllocation.amount;

        // Create payment allocation record
        const allocation = await client.paymentAllocation.create({
          data: {
            amount: Number(allocationAmount),
            allocatedAmount: Number(allocationAmount),
            paymentId: paymentId,
            creditId: credit.id,
            merchantId: this.merchantId,
            clientId: clientId,
          },
        });

        allocations.push(allocation);

        // Update credit remaining amount
        const currentRemaining = Number(credit.remainingAmount);
        const newRemainingAmount = currentRemaining - allocationAmount;
        const newStatus =
          newRemainingAmount <= 0.01 ? "PAID" : credit.dueDate && new Date() > credit.dueDate ? "OVERDUE" : "OPEN";

        await client.credit.update({
          where: { id: credit.id },
          data: {
            remainingAmount: Number(Math.max(0, newRemainingAmount)),
            status: newStatus,
          },
        });

        creditsUpdated.push(credit.id);
        totalAllocated += allocationAmount;
      }
    };

    // If transaction client provided, use it; otherwise create new transaction
    if (tx) {
      await executeAllocation(tx);
    } else {
      await withSecureTransaction(executeAllocation);
    }

    return {
      allocations,
      totalAllocated,
      unallocatedAmount: Number(paymentAmount) - totalAllocated,
      creditsUpdated,
    };
  }

  /**
   * Create a new payment with automatic or manual allocation
   */
  async createPayment(data: PaymentFormData): Promise<PaymentWithDetails> {
    const _client = await this.getSecureClient();

    let payment: Payment;
    let _allocationResult: FIFOAllocationResult;

    // Execute payment creation and allocation in a transaction
    await withSecureTransaction(async (tx) => {
      // Create the payment
      const createdPayment = await tx.payment.create({
        data: {
          amount: Number(data.amount),
          note: data.note || null,
          method: data.method,
          reference: data.reference || null,
          paymentDate: data.paymentDate || new Date(),
          clientId: data.clientId,
          merchantId: this.merchantId,
        },
      });

      // Transform Prisma result to match Payment type
      payment = {
        ...createdPayment,
        amount: Number(createdPayment.amount),
        note: createdPayment.note ?? null,
        reference: createdPayment.reference ?? null,
      };

      // Allocate payment based on mode
      if (data.allocationMode === "MANUAL" && data.manualAllocations) {
        _allocationResult = await this.allocatePaymentManual(
          payment.id,
          payment.amount,
          data.clientId,
          data.manualAllocations,
          tx, // Pass transaction client
        );
      } else {
        // Default to FIFO allocation
        _allocationResult = await this.allocatePaymentFIFO(
          payment.id,
          payment.amount,
          data.clientId,
          tx, // Pass transaction client
        );
      }
    });

    // Fetch and return the complete payment with details
    const result = await this.getPaymentById(payment!.id);
    if (!result) {
      throw new Error("Payment created but could not be retrieved");
    }
    return result;
  }

  /**
   * Reverse a payment and all its allocations
   */
  async reversePayment(paymentId: string): Promise<PaymentReversalResult> {
    const _client = await this.getSecureClient();

    let reversalResult: PaymentReversalResult;

    await withSecureTransaction(async (tx) => {
      // Get payment with allocations
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          paymentAllocations: {
            include: {
              credit: true,
            },
          },
        },
      });

      if (!payment) {
        throw new Error("Payment not found");
      }

      const reversedAllocations: any[] = [];
      const creditsRestored: string[] = [];

      // Reverse each allocation
      for (const allocation of payment.paymentAllocations) {
        const allocationAmount = Number(allocation.amount);
        const credit = allocation.credit;

        // Restore credit remaining amount
        const currentRemaining = Number(credit.remainingAmount);
        const restoredAmount = currentRemaining + allocationAmount;

        // Recalculate status
        const newStatus = credit.dueDate && new Date() > credit.dueDate ? "OVERDUE" : "OPEN";

        await tx.credit.update({
          where: { id: credit.id },
          data: {
            remainingAmount: new Decimal(restoredAmount),
            status: newStatus,
          },
        });

        reversedAllocations.push({
          id: allocation.id,
          creditId: credit.id,
          amount: allocationAmount,
        });

        creditsRestored.push(credit.id);
      }

      // Delete all allocations
      await tx.paymentAllocation.deleteMany({
        where: { paymentId: paymentId },
      });

      // Delete the payment
      await tx.payment.delete({
        where: { id: paymentId },
      });

      reversalResult = {
        paymentId,
        reversedAllocations,
        creditsRestored,
        totalReversedAmount: Number(payment.amount),
      };
    });

    return reversalResult!;
  }

  /**
   * Get paginated list of payments with filters
   */
  async getPayments(filters: PaymentFilters): Promise<PaymentListResponse> {
    const client = await this.getSecureClient();

    const { search, method, clientId, dateFrom, dateTo, minAmount, maxAmount, sortBy, sortOrder, page, limit } =
      filters;

    // Build where clause
    const where: any = {
      merchantId: this.merchantId,
    };

    // Add search filter
    if (search.trim()) {
      where.OR = [
        {
          note: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          reference: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          client: {
            OR: [
              {
                firstName: {
                  contains: search.trim(),
                  mode: "insensitive",
                },
              },
              {
                lastName: {
                  contains: search.trim(),
                  mode: "insensitive",
                },
              },
            ],
          },
        },
      ];
    }

    // Add filters
    if (method !== "ALL") {
      where.method = method;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (dateFrom || dateTo) {
      where.paymentDate = {};
      if (dateFrom) where.paymentDate.gte = dateFrom;
      if (dateTo) where.paymentDate.lte = dateTo;
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = new Decimal(minAmount);
      if (maxAmount) where.amount.lte = new Decimal(maxAmount);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === "client") {
      orderBy.client = {
        firstName: sortOrder,
      };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Fetch payments with related data
    const [payments, total] = await Promise.all([
      client.payment.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          paymentAllocations: {
            include: {
              credit: {
                select: {
                  id: true,
                  label: true,
                  totalAmount: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      client.payment.count({ where }),
    ]);

    // Transform payments
    const paymentsWithDetails = payments.map((paymentData) => this.transformPaymentWithDetails(paymentData));

    return {
      payments: paymentsWithDetails,
      total,
      page,
      limit,
      hasMore: skip + paymentsWithDetails.length < total,
    };
  }

  /**
   * Get payment by ID with full details
   */
  async getPaymentById(paymentId: string): Promise<PaymentWithDetails | null> {
    const client = await this.getSecureClient();

    const paymentData = await client.payment.findUnique({
      where: {
        id: paymentId,
        merchantId: this.merchantId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        paymentAllocations: {
          include: {
            credit: {
              select: {
                id: true,
                label: true,
                totalAmount: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!paymentData) return null;

    return this.transformPaymentWithDetails(paymentData);
  }

  /**
   * Calculate client balance
   */
  async calculateClientBalance(clientId: string): Promise<ClientBalance> {
    const client = await this.getSecureClient();

    const [creditStats, paymentStats, lastPayment] = await Promise.all([
      client.credit.aggregate({
        where: {
          clientId: clientId,
          merchantId: this.merchantId,
        },
        _sum: {
          totalAmount: true,
          remainingAmount: true,
        },
        _count: true,
      }),
      client.payment.aggregate({
        where: {
          clientId: clientId,
          merchantId: this.merchantId,
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),
      client.payment.findFirst({
        where: {
          clientId: clientId,
          merchantId: this.merchantId,
        },
        orderBy: {
          paymentDate: "desc",
        },
        select: {
          paymentDate: true,
        },
      }),
    ]);

    // Calculate overdue amount
    const overdueCredits = await client.credit.aggregate({
      where: {
        clientId: clientId,
        merchantId: this.merchantId,
        dueDate: { lt: new Date() },
        remainingAmount: { gt: 0 },
      },
      _sum: {
        remainingAmount: true,
      },
    });

    return {
      clientId,
      totalCredits: Number(creditStats._sum.totalAmount) || 0,
      totalPayments: Number(paymentStats._sum.amount) || 0,
      outstandingAmount: Number(creditStats._sum.remainingAmount) || 0,
      overdueAmount: Number(overdueCredits._sum.remainingAmount) || 0,
      creditCount: creditStats._count,
      paymentCount: paymentStats._count,
      lastPaymentDate: lastPayment?.paymentDate || null,
    };
  }

  /**
   * Get payment summary statistics
   */
  async getPaymentSummary(): Promise<PaymentSummary> {
    const client = await this.getSecureClient();

    const [paymentStats, paymentsByMethod, allocationStats, thisMonthStats] = await Promise.all([
      client.payment.aggregate({
        where: { merchantId: this.merchantId },
        _sum: { amount: true },
        _avg: { amount: true },
        _count: true,
      }),
      client.payment.groupBy({
        by: ["method"],
        where: { merchantId: this.merchantId },
        _sum: { amount: true },
        _count: true,
      }),
      client.paymentAllocation.aggregate({
        where: {
          payment: { merchantId: this.merchantId },
        },
        _sum: { amount: true },
      }),
      client.payment.aggregate({
        where: {
          merchantId: this.merchantId,
          paymentDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const paymentsByMethodRecord = paymentsByMethod.reduce(
      (acc, item) => {
        acc[item.method] = {
          count: item._count,
          amount: Number(item._sum.amount || 0),
        };
        return acc;
      },
      {} as Record<PaymentMethod, { count: number; amount: number }>,
    );

    return {
      totalPayments: paymentStats._count,
      totalAmount: Number(paymentStats._sum.amount) || 0,
      totalAllocated: Number(allocationStats._sum.amount) || 0,
      totalUnallocated: (Number(paymentStats._sum.amount) || 0) - (Number(allocationStats._sum.amount) || 0),
      paymentsByMethod: paymentsByMethodRecord,
      averagePaymentAmount: Number(paymentStats._avg.amount) || 0,
      paymentsThisMonth: thisMonthStats._count,
      amountThisMonth: Number(thisMonthStats._sum.amount) || 0,
    };
  }
}
