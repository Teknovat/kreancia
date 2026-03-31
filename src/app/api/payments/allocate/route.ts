/**
 * Payment Allocation API Route
 *
 * Handles payment allocation operations and validation
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSessionOrRedirect } from "@/lib/auth-context";
import { PaymentService } from "@/lib/payment-service";
import { CreditService } from "@/lib/credit-service";
import { z } from "zod";

// Validation schema for allocation validation
const validateAllocationSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  paymentAmount: z.number().positive("Payment amount must be positive"),
  manualAllocations: z.array(
    z.object({
      creditId: z.string().min(1, "Credit ID is required"),
      amount: z.number().positive("Amount must be positive"),
    }),
  ),
});

// Schema for getting available credits
const availableCreditsSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
});

/**
 * POST /api/payments/allocate/validate - Validate manual allocation
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
    const { clientId, paymentAmount, manualAllocations } = validateAllocationSchema.parse(body);

    // Create payment service instance
    const paymentService = new PaymentService(session.merchantId);

    // Validate the allocation using the private method
    // We'll need to expose this through a public method
    // For now, let's create a simple validation here

    const creditService = new CreditService(session.merchantId);
    const availableCredits = await creditService.getOpenCreditsForClient(clientId);

    if (availableCredits.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No open credits available for this client",
        },
        { status: 400 },
      );
    }

    const errors: string[] = [];
    const warnings: string[] = [];

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

      if (allocation.amount > credit.remainingAmountNumber) {
        errors.push(
          `Allocation amount (${allocation.amount}) exceeds remaining amount (${credit.remainingAmountNumber}) for credit ${credit.label}`,
        );
      }
    }

    // Warn about unallocated amount
    if (totalAllocationAmount < paymentAmount) {
      const unallocated = paymentAmount - totalAllocationAmount;
      warnings.push(`${unallocated.toFixed(2)} will remain unallocated`);
    }

    const validation = {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalAmount: totalAllocationAmount,
      availableCredits: availableCredits.map((credit) => ({
        id: credit.id,
        label: credit.label,
        remainingAmount: credit.remainingAmountNumber,
        maxAllowedAllocation: credit.remainingAmountNumber,
      })),
    };

    return NextResponse.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error("Error validating allocation:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid allocation data",
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
 * GET /api/payments/allocate/credits?clientId={id} - Get available credits for allocation
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
    const { clientId } = availableCreditsSchema.parse(searchParams.entries());

    // Create credit service instance
    const creditService = new CreditService(session.merchantId);

    // Get available credits for allocation
    const credits = await creditService.getOpenCreditsForClient(clientId);

    // Transform for allocation interface
    const availableCredits = credits.map((credit) => ({
      id: credit.id,
      label: credit.label,
      totalAmount: credit.totalAmountNumber,
      remainingAmount: credit.remainingAmountNumber,
      dueDate: credit.dueDate,
      daysOverdue: credit.daysOverdue,
      isOverdue: credit.isOverdue,
      status: credit.status,
      client: credit.client,
      createdAt: credit.createdAt,
    }));

    // Sort by creation date for FIFO preview
    availableCredits.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json({
      success: true,
      data: {
        credits: availableCredits,
        total: availableCredits.length,
        totalRemainingAmount: availableCredits.reduce((sum, credit) => sum + credit.remainingAmount, 0),
        oldestCredit: availableCredits[0] || null,
        newestCredit: availableCredits[availableCredits.length - 1] || null,
      },
    });
  } catch (error) {
    console.error("Error fetching available credits:", error);

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
