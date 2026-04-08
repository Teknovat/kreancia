/**
 * Credits API Route
 *
 * Handles credit CRUD operations with automatic tenant isolation
 * and credit status management.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSessionOrRedirect } from "@/lib/auth-context";
import { CreditService } from "@/lib/credit-service";
import { z } from "zod";

// Validation schema for creating credits
const createCreditSchema = z.object({
  label: z.string().min(1, "Credit label is required"),
  totalAmount: z.number().positive("Amount must be positive"),
  dueDate: z.string().datetime().optional().or(z.null()),
  clientId: z.string().min(1, "Client ID is required"),
});

// Validation schema for credit search and filtering
const creditFiltersSchema = z.object({
  search: z.string().default(""),
  status: z.enum(["OPEN", "PAID", "OVERDUE", "ALL"]).default("ALL"),
  clientId: z.string().optional(),
  dueAfter: z.string().datetime().optional(),
  dueBefore: z.string().datetime().optional(),
  sortBy: z.enum(["createdAt", "dueDate", "totalAmount", "remainingAmount", "client"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * GET /api/credits - List credits with filters and pagination
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
    const filters = creditFiltersSchema.parse(params);

    // Convert date strings to Date objects
    const processedFilters = {
      ...filters,
      dueAfter: filters.dueAfter ? new Date(filters.dueAfter) : undefined,
      dueBefore: filters.dueBefore ? new Date(filters.dueBefore) : undefined,
    };

    // Create credit service instance
    const creditService = new CreditService(session.merchantId);

    // Get credits with filters
    const result = await creditService.getCredits(processedFilters);

    return NextResponse.json({
      success: true,
      data: result.credits,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
        hasMore: result.hasMore,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching credits:", error);

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
 * POST /api/credits - Create a new credit
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
    const creditData = createCreditSchema.parse(body);

    // Convert dueDate string to Date object if provided
    const formattedCreditData = {
      ...creditData,
      dueDate: creditData.dueDate ? new Date(creditData.dueDate) : null,
    };

    // Create credit service instance
    const creditService = new CreditService(session.merchantId);

    // Create the credit
    const credit = await creditService.createCredit(formattedCreditData);

    return NextResponse.json(
      {
        success: true,
        data: credit,
        message: "Credit created successfully",
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Error creating credit:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid credit data",
          details: error.errors,
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
