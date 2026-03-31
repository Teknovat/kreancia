/**
 * Individual Client API Route
 *
 * Demonstrates secure client access with automatic tenant isolation.
 * The RLS policies ensure users can only access clients belonging to their merchant.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSecureDatabase } from '@/lib/auth-context'
import { ClientOperations } from '@/utils/database'
import { z } from 'zod'

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
  paymentTermDays: z.number().int().positive().optional()
})

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/clients/[id] - Get a specific client
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // RLS automatically ensures this only returns the client if it belongs to the current merchant
    const client = await ClientOperations.findUnique(id, {
      credits: {
        include: {
          _count: {
            select: { paymentAllocations: true }
          }
        }
      },
      payments: {
        include: {
          _count: {
            select: { paymentAllocations: true }
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Client not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: client
    })
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * PATCH /api/clients/[id] - Update a client
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const updateData = updateClientSchema.parse(body)

    // RLS automatically ensures this only updates if the client belongs to the current merchant
    const client = await ClientOperations.update(id, updateData)

    return NextResponse.json({
      success: true,
      data: client,
      message: 'Client updated successfully'
    })
  } catch (error) {
    console.error('Error updating client:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid update data',
        details: error.errors
      }, { status: 400 })
    }

    // Check if client exists (RLS would return null for unauthorized access)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({
        success: false,
        error: 'Client not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/clients/[id] - Delete a client
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if client has any outstanding credits
    const db = await getSecureDatabase()
    const clientWithCredits = await db.client.findUnique({
      where: { id },
      include: {
        credits: {
          where: {
            status: { in: ['OPEN', 'OVERDUE'] }
          }
        }
      }
    })

    if (!clientWithCredits) {
      return NextResponse.json({
        success: false,
        error: 'Client not found'
      }, { status: 404 })
    }

    if (clientWithCredits.credits.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete client with outstanding credits',
        details: {
          outstandingCredits: clientWithCredits.credits.length
        }
      }, { status: 400 })
    }

    // RLS automatically ensures this only deletes if the client belongs to the current merchant
    await ClientOperations.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting client:', error)

    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({
        success: false,
        error: 'Client not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}