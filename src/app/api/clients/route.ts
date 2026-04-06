/**
 * Clients API Route
 *
 * Demonstrates secure multi-tenant API implementation with automatic
 * tenant isolation using Row Level Security.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSecureDatabase } from "@/lib/auth-context";
import { ClientOperations } from "@/utils/database";
import { z } from "zod";

// Helper function to handle optional strings that can be empty or omitted
const optionalString = z.string().optional().transform(val => val === "" ? undefined : val);

// Helper function for optional email that can be empty or omitted
const optionalEmail = z.string().optional().transform(val => {
  if (!val || val === "") return undefined;
  return val;
}).pipe(z.string().email().optional());

// Validation schema for creating clients
const createClientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: optionalEmail,
  phone: optionalString,
  address: optionalString,
  businessName: optionalString,
  taxId: optionalString,
  creditLimit: z.number().positive().optional().nullable(),
  paymentTermDays: z.number().int().positive().default(30),
});


// Validation schema for pagination and filtering
const listClientsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  orderBy: z.enum(["firstName", "lastName", "email", "createdAt"]).default("firstName"),
  order: z.enum(["asc", "desc"]).default("asc"),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE", "SUSPENDED"]).default("ALL"),
  hasOverdue: z.coerce.boolean().default(false),
  search: z.string().optional(),
});

/**
 * GET /api/clients - List clients with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const { page, limit, orderBy, order, hasOverdue, search } = listClientsSchema.parse(searchParams.entries());

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    // Note: Status filtering is handled at the application level since status is computed
    // Status is based on business logic (activity, outstanding amounts, etc.)

    // Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { businessName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Always include credit information for calculating outstanding amounts
    const include = {
      _count: {
        select: {
          credits: true,
          payments: true,
        },
      },
      credits: {
        select: {
          id: true,
          totalAmount: true,
          remainingAmount: true,
          status: true,
          dueDate: true,
          createdAt: true,
        },
      },
    };

    const clients = await ClientOperations.findMany({
      where,
      take: limit,
      skip,
      orderBy: {
        [orderBy]: order,
      },
      include,
    });

    // Get total count for pagination (with same filters)
    const db = await getSecureDatabase();
    const total = await db.client.count({ where });

    // Calculate stats for all clients (not filtered)
    const allClients = await db.client.findMany({
      include: {
        credits: {
          select: {
            totalAmount: true,
            remainingAmount: true,
            status: true,
            dueDate: true,
          },
        },
      },
    });

    const stats = {
      totalClients: allClients.length,
      activeClients: allClients.filter((client) => {
        const overdueAmount = client.credits.reduce((sum, credit) => {
          return credit.dueDate && credit.dueDate < new Date() && Number(credit.remainingAmount) > 0
            ? sum + Number(credit.remainingAmount)
            : sum;
        }, 0);
        return overdueAmount === 0; // Active = no overdue amounts
      }).length,
      totalOutstanding: allClients.reduce((sum, client) => {
        return (
          sum +
          client.credits.reduce((creditSum, credit) => {
            return creditSum + Number(credit.remainingAmount);
          }, 0)
        );
      }, 0),
      overdueClients: allClients.filter((client) => {
        return client.credits.some((credit) =>
          credit.dueDate && credit.dueDate < new Date() && Number(credit.remainingAmount) > 0
        );
      }).length,
      avgCreditLimit:
        allClients.length > 0 ? allClients.reduce((sum, c) => sum + Number(c.creditLimit || 0), 0) / allClients.length : 0,
    };

    // Filter clients by overdue if requested
    let filteredClients = clients;
    if (hasOverdue) {
      filteredClients = clients.filter((client: any) =>
        client.credits && client.credits.some((credit: any) =>
          credit.status === "OPEN" && credit.dueDate && credit.dueDate < new Date() && Number(credit.remainingAmount) > 0
        )
      );
    }

    // Transform clients to match ClientWithStats interface
    const clientsWithStats = filteredClients.map((client: any) => {
      const totalCreditsAmount = client.credits
        ? client.credits.reduce((sum: number, credit: any) => sum + Number(credit.totalAmount), 0)
        : 0;

      const outstandingAmount = client.credits
        ? client.credits.reduce((sum: number, credit: any) => sum + Number(credit.remainingAmount), 0)
        : 0;

      const overdueAmount = client.credits
        ? client.credits.reduce((sum: number, credit: any) => {
            return credit.dueDate && credit.dueDate < new Date() && Number(credit.remainingAmount) > 0
              ? sum + Number(credit.remainingAmount)
              : sum;
          }, 0)
        : 0;

      const lastActivity = client.credits && client.credits.length > 0
        ? new Date(Math.max(...client.credits.map((c: any) => new Date(c.createdAt).getTime())))
        : client.updatedAt;

      // Calculate status based on outstanding and overdue amounts
      let status: "ACTIVE" | "INACTIVE" | "SUSPENDED" = "ACTIVE";
      if (overdueAmount > 0) {
        status = "SUSPENDED"; // Client has overdue amounts
      } else if (outstandingAmount === 0 && client.credits && client.credits.length > 0) {
        status = "ACTIVE"; // Client has credits but all paid
      }

      return {
        ...client,
        fullName: `${client.firstName} ${client.lastName}`,
        totalCredits: totalCreditsAmount,
        outstandingAmount,
        overdueAmount,
        lastActivity,
        creditCount: client._count?.credits || 0,
        paymentCount: client._count?.payments || 0,
        status,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        clients: clientsWithStats,
        totalCount: hasOverdue ? filteredClients.length : total,
        totalPages: Math.ceil((hasOverdue ? filteredClients.length : total) / limit),
        stats,
      },
    });
  } catch (error) {
    console.error("Error fetching clients:", error);

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
 * POST /api/clients - Create a new client
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientData = createClientSchema.parse(body);

    const client = await ClientOperations.create(clientData);

    return NextResponse.json(
      {
        success: true,
        data: client,
        message: "Client created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating client:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid client data",
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
