/**
 * Individual Credit API Route
 *
 * Handles operations on specific credits: GET, PUT, DELETE
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSessionOrRedirect } from '@/lib/auth-context'
import { CreditService } from '@/lib/credit-service'
import { z } from 'zod'

// Validation schema for updating credits
const updateCreditSchema = z.object({
  label: z.string().min(1, 'Credit label is required').optional(),
  totalAmount: z.number().positive('Amount must be positive').optional(),
  dueDate: z.string().datetime().optional().or(z.null()),
  status: z.enum(['OPEN', 'PAID', 'OVERDUE']).optional()
})

/**
 * GET /api/credits/[id] - Get specific credit details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated session
    const session = await getAuthenticatedSessionOrRedirect()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Credit ID is required'
      }, { status: 400 })
    }

    // Create credit service instance
    const creditService = new CreditService(session.merchantId)

    // Get the credit
    const credit = await creditService.getCreditById(id)

    if (!credit) {
      return NextResponse.json({
        success: false,
        error: 'Credit not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: credit
    })

  } catch (error: unknown) {
    console.error('Error fetching credit:', error)

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * PUT /api/credits/[id] - Update specific credit
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated session
    const session = await getAuthenticatedSessionOrRedirect()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Credit ID is required'
      }, { status: 400 })
    }

    const body = await request.json()

    // Parse and validate request body
    const updateData = updateCreditSchema.parse(body)

    // Convert dueDate string to Date object if provided
    const formattedUpdateData = {
      ...updateData,
      dueDate: updateData.dueDate !== undefined
        ? (updateData.dueDate ? new Date(updateData.dueDate) : null)
        : undefined
    }

    // Create credit service instance
    const creditService = new CreditService(session.merchantId)

    // Update the credit
    const credit = await creditService.updateCredit(id, formattedUpdateData)

    return NextResponse.json({
      success: true,
      data: credit,
      message: 'Credit updated successfully'
    })

  } catch (error: unknown) {
    console.error('Error updating credit:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credit data',
        details: error.errors
      }, { status: 400 })
    }

    if (error instanceof Error && error.message?.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'Credit not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/credits/[id] - Delete specific credit
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated session
    const session = await getAuthenticatedSessionOrRedirect()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Credit ID is required'
      }, { status: 400 })
    }

    // Create credit service instance
    const creditService = new CreditService(session.merchantId)

    // Delete the credit
    await creditService.deleteCredit(id)

    return NextResponse.json({
      success: true,
      message: 'Credit deleted successfully'
    })

  } catch (error: unknown) {
    console.error('Error deleting credit:', error)

    if (error instanceof Error && error.message?.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'Credit not found'
      }, { status: 404 })
    }

    if (error instanceof Error && error.message?.includes('Cannot delete credit with existing payment allocations')) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete credit with existing payments. Please reverse all payments first.'
      }, { status: 409 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}