/**
 * Payments API Route
 *
 * Handles payment CRUD operations with FIFO allocation algorithm
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSessionOrRedirect } from "@/lib/auth-context";
import { PaymentService } from "@/lib/payment-service";
import { z } from "zod";

// Validation schema for creating payments
const createPaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  note: z.string().optional().nullable(),
  method: z.enum(["CASH", "BANK_TRANSFER", "CHECK", "CARD", "MOBILE_PAYMENT", "OTHER"]),
  reference: z.string().optional().nullable(),
  paymentDate: z.string().datetime().optional(),
  clientId: z.string().min(1, "Client ID is required"),
  allocationMode: z.enum(["FIFO", "MANUAL"]).default("FIFO"),
  manualAllocations: z
    .array(
      z.object({
        creditId: z.string().min(1, "Credit ID is required"),
        amount: z.number().positive("Amount must be positive"),
      }),
    )
    .optional(),
});

// Validation schema for payment search and filtering
const paymentFiltersSchema = z.object({
  search: z.string().default(""),
  method: z.enum(["CASH", "BANK_TRANSFER", "CHECK", "CARD", "MOBILE_PAYMENT", "OTHER", "ALL"]).default("ALL"),
  clientId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  isFullyAllocated: z.boolean().optional(),
  sortBy: z.enum(["paymentDate", "amount", "client", "createdAt"]).default("paymentDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * GET /api/payments - List payments with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthenticatedSessionOrRedirect();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    // Parse and validate query parameters
    const filters = paymentFiltersSchema.parse(params);

    // Convert date strings to Date objects
    const processedFilters = {
      ...filters,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
    };

    // Create payment service instance
    const paymentService = new PaymentService(session.merchantId);

    // Get payments with filters
    const result = await paymentService.getPayments(processedFilters);

    return NextResponse.json({
      success: true,
      data: result.payments,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request parameters",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/payments - Create a new payment with automatic FIFO or manual allocation
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthenticatedSessionOrRedirect();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Parse and validate request body
    const paymentData = createPaymentSchema.parse(body);

    // Validate manual allocations if provided
    if (paymentData.allocationMode === "MANUAL") {
      if (!paymentData.manualAllocations || paymentData.manualAllocations.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Manual allocations required for manual allocation mode",
          },
          { status: 400 },
        );
      }

      // Validate that total allocations don't exceed payment amount
      const totalAllocations = paymentData.manualAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);

      if (totalAllocations > paymentData.amount) {
        return NextResponse.json(
          {
            success: false,
            error: `Total allocation amount (${totalAllocations}) exceeds payment amount (${paymentData.amount})`,
          },
          { status: 400 },
        );
      }
    }

    // Convert paymentDate string to Date object if provided
    const formattedPaymentData = {
      ...paymentData,
      paymentDate: paymentData.paymentDate ? new Date(paymentData.paymentDate) : new Date(),
    };

    // Create payment service instance
    const paymentService = new PaymentService(session.merchantId);

    // Create the payment with allocation
    const payment = await paymentService.createPayment(formattedPaymentData);

    // Determine success message based on allocation mode
    let message = "Payment created successfully";
    if (formattedPaymentData.allocationMode === "FIFO") {
      const totalAllocated = payment.totalAllocated;
      const unallocated = payment.unallocatedAmount;

      if (unallocated > 0.01) {
        message += `. ${totalAllocated} allocated automatically, ${unallocated.toFixed(3)} remains unallocated.`;
      } else {
        message += ` and fully allocated using FIFO method.`;
      }
    } else {
      message += ` with manual allocation.`;
    }

    return NextResponse.json(
      {
        success: true,
        data: payment,
        message: message,
        allocation: {
          mode: formattedPaymentData.allocationMode,
          totalAllocated: payment.totalAllocated,
          unallocatedAmount: payment.unallocatedAmount,
          creditsAffected: payment.allocations.length,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Error creating payment:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payment data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message?.includes("Invalid allocation")) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message?.includes("not found")) {
      return NextResponse.json(
        {
          success: false,
          error: "Client not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
