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

// Validation schema for creating clients
const createClientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  businessName: z.string().optional(),
  taxId: z.string().optional(),
  creditLimit: z.number().positive().optional(),
  paymentTermDays: z.number().int().positive().default(30),
});

// Validation schema for client search
const searchSchema = z.object({
  q: z.string().min(1, "Search query is required"),
  limit: z.coerce.number().int().positive().max(100).default(10),
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

    const { page, limit, orderBy, order, status, hasOverdue, search } = listClientsSchema.parse(searchParams.entries());

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    // Status filter
    if (status !== "ALL") {
      where.status = status;
    }

    // Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { businessName: { contains: search, mode: "insensitive" } },
      ];
    }

    // For overdue filter, we need to include credit information
    const include = {
      _count: {
        select: {
          credits: true,
          payments: true,
        },
      },
      credits: hasOverdue
        ? {
            where: {
              status: "OPEN",
              dueDate: { lt: new Date() },
            },
          }
        : false,
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
          where: { status: "OPEN" },
        },
      },
    });

    const stats = {
      totalClients: allClients.length,
      activeClients: allClients.filter((c) => c.status === "ACTIVE").length,
      totalOutstanding: allClients.reduce((sum, client) => {
        return (
          sum +
          client.credits.reduce((creditSum, credit) => {
            return creditSum + Number(credit.remainingAmount);
          }, 0)
        );
      }, 0),
      overdueClients: allClients.filter((client) => {
        return client.credits.some((credit) => credit.status === "OPEN" && credit.dueDate < new Date());
      }).length,
      avgCreditLimit:
        allClients.length > 0 ? allClients.reduce((sum, c) => sum + Number(c.creditLimit), 0) / allClients.length : 0,
    };

    // Filter clients by overdue if requested
    let filteredClients = clients;
    if (hasOverdue) {
      filteredClients = clients.filter((client: any) => client.credits && client.credits.length > 0);
    }

    // Transform clients to match ClientWithStats interface
    const clientsWithStats = filteredClients.map((client: any) => ({
      ...client,
      fullName: `${client.firstName} ${client.lastName}`,
      totalCredits: 0, // TODO: Calculate from actual credits
      outstandingAmount: client.credits
        ? client.credits.reduce((sum: number, credit: any) => sum + Number(credit.remainingAmount), 0)
        : 0,
      overdueAmount: client.credits
        ? client.credits.reduce((sum: number, credit: any) => {
            return credit.dueDate < new Date() ? sum + Number(credit.remainingAmount) : sum;
          }, 0)
        : 0,
      lastActivity: client.updatedAt,
      creditCount: client._count?.credits || 0,
      paymentCount: client._count?.payments || 0,
    }));

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
