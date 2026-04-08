/**
 * Individual Client API Route
 *
 * Demonstrates secure client access with automatic tenant isolation.
 * The RLS policies ensure users can only access clients belonging to their merchant.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSecureDatabase } from "@/lib/auth-context";
import { ClientOperations } from "@/utils/database";
import { z } from "zod";

// Validation schema for updating clients
const updateClientSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  businessName: z.string().optional(),
  taxId: z.string().optional(),
  creditLimit: z.number().positive().optional(),
  paymentTermDays: z.number().int().positive().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/clients/[id] - Get a specific client with detailed statistics
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const db = await getSecureDatabase();

    // RLS automatically ensures this only returns the client if it belongs to the current merchant
    const client = await db.client.findUnique({
      where: { id },
      include: {
        credits: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            paymentAllocations: {
              include: {
                payment: {
                  select: {
                    amount: true,
                    paymentDate: true,
                    method: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
          include: {
            paymentAllocations: {
              include: {
                credit: {
                  select: {
                    label: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          error: "Client not found",
        },
        { status: 404 },
      );
    }

    // Calculate derived statistics
    const outstandingAmount = client.credits.reduce((sum, credit) => sum + Number(credit.remainingAmount), 0);

    const overdueAmount = client.credits.reduce((sum, credit) => {
      if (credit.dueDate && credit.dueDate < new Date() && Number(credit.remainingAmount) > 0) {
        return sum + Number(credit.remainingAmount);
      }
      return sum;
    }, 0);

    const totalCreditsAmount = client.credits.reduce((sum, credit) => sum + Number(credit.totalAmount), 0);

    const totalPaymentsAmount = client.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    // Calculate status
    let status: "ACTIVE" | "INACTIVE" | "SUSPENDED" = "ACTIVE";
    if (overdueAmount > 0) {
      status = "SUSPENDED";
    } else if (outstandingAmount === 0 && client.credits.length > 0) {
      status = "ACTIVE";
    }

    // Find last activity date
    const creditDates = client.credits.map((c) => c.createdAt);
    const paymentDates = client.payments.map((p) => p.paymentDate);
    const allDates = [...creditDates, ...paymentDates, client.updatedAt];
    const lastActivity = new Date(Math.max(...allDates.map((d) => d.getTime())));

    // Calculate credit utilization
    const creditUtilization = client.creditLimit
      ? Math.round((outstandingAmount / Number(client.creditLimit)) * 100)
      : 0;

    // Calculate average payment time (days from credit creation to payment)
    const paidCredits = client.credits.filter((c) => c.status === "PAID");

    const avgPaymentDays = paidCredits.length > 0
      ? Math.round(
          paidCredits.reduce((sum, credit) => {
            // Find the earliest payment allocation (first payment applied to this credit)
            if (credit.paymentAllocations.length === 0) {
              return sum; // Skip credits with no payment allocations (data inconsistency)
            }

            // Find the allocation with the earliest payment date
            const firstAllocation = credit.paymentAllocations.reduce((earliest, current) => {
              return current.payment.paymentDate < earliest.payment.paymentDate ? current : earliest;
            }, credit.paymentAllocations[0]);

            // Calculate days between credit creation and first payment
            const msPerDay = 1000 * 60 * 60 * 24;
            const days = Math.round(
              (firstAllocation.payment.paymentDate.getTime() - credit.createdAt.getTime()) / msPerDay
            );

            return sum + Math.max(0, days); // Ensure non-negative days
          }, 0) / paidCredits.length
        )
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...client,
        outstandingAmount,
        overdueAmount,
        totalCreditsAmount,
        totalPaymentsAmount,
        status,
        lastActivity,
        creditUtilization,
        avgPaymentDays,
        creditCount: client.credits.length,
        paymentCount: client.payments.length,
      },
    });
  } catch (error) {
    console.error("Error fetching client:", error);
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
 * PATCH /api/clients/[id] - Update a client
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updateData = updateClientSchema.parse(body);

    // RLS automatically ensures this only updates if the client belongs to the current merchant
    const client = await ClientOperations.update(id, updateData);

    return NextResponse.json({
      success: true,
      data: client,
      message: "Client updated successfully",
    });
  } catch (error) {
    console.error("Error updating client:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid update data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    // Check if client exists (RLS would return null for unauthorized access)
    if (error instanceof Error && error.message.includes("Record to update not found")) {
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

/**
 * DELETE /api/clients/[id] - Delete a client
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if client has any outstanding credits
    const db = await getSecureDatabase();
    const clientWithCredits = await db.client.findUnique({
      where: { id },
      include: {
        credits: {
          where: {
            status: { in: ["OPEN", "OVERDUE"] },
          },
        },
      },
    });

    if (!clientWithCredits) {
      return NextResponse.json(
        {
          success: false,
          error: "Client not found",
        },
        { status: 404 },
      );
    }

    if (clientWithCredits.credits.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete client with outstanding credits",
          details: {
            outstandingCredits: clientWithCredits.credits.length,
          },
        },
        { status: 400 },
      );
    }

    // RLS automatically ensures this only deletes if the client belongs to the current merchant
    await ClientOperations.delete(id);

    return NextResponse.json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting client:", error);

    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
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
