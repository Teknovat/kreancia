/**
 * Individual Payment API Route
 *
 * Handles operations on specific payments: GET, PUT, DELETE (reverse)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSessionOrRedirect } from '@/lib/auth-context'
import { PaymentService } from '@/lib/payment-service'
import { z } from 'zod'

// Validation schema for updating payments
const updatePaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  note: z.string().optional().nullable(),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'CARD', 'MOBILE_PAYMENT', 'OTHER']).optional(),
  reference: z.string().optional().nullable(),
  paymentDate: z.string().datetime().optional()
})

/**
 * GET /api/payments/[id] - Get specific payment details
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
        error: 'Payment ID is required'
      }, { status: 400 })
    }

    // Create payment service instance
    const paymentService = new PaymentService(session.merchantId)

    // Get the payment
    const payment = await paymentService.getPaymentById(id)

    if (!payment) {
      return NextResponse.json({
        success: false,
        error: 'Payment not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: payment
    })

  } catch (error) {
    console.error('Error fetching payment:', error)

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * PUT /api/payments/[id] - Update specific payment
 * Note: This only updates payment metadata, not allocations
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
        error: 'Payment ID is required'
      }, { status: 400 })
    }

    const body = await request.json()

    // Parse and validate request body
    const updateData = updatePaymentSchema.parse(body)

    // Convert paymentDate string to Date object if provided
    const formattedUpdateData = {
      ...updateData,
      paymentDate: updateData.paymentDate ? new Date(updateData.paymentDate) : undefined
    }

    // Check if payment exists first
    const paymentService = new PaymentService(session.merchantId)
    const existingPayment = await paymentService.getPaymentById(id)

    if (!existingPayment) {
      return NextResponse.json({
        success: false,
        error: 'Payment not found'
      }, { status: 404 })
    }

    // Note: For now, we don't allow updating payment amounts as it would
    // require recalculating all allocations. This is intentionally simplified.
    if (updateData.amount && updateData.amount !== existingPayment.amountNumber) {
      return NextResponse.json({
        success: false,
        error: 'Cannot update payment amount. Please reverse the payment and create a new one.'
      }, { status: 400 })
    }

    // Update payment metadata only (note, method, reference, paymentDate)
    // This is a simplified implementation - in a more complex system,
    // you might want to implement payment modification with reallocation

    return NextResponse.json({
      success: false,
      error: 'Payment updates not implemented. Please reverse and recreate the payment.'
    }, { status: 501 })

  } catch (error) {
    console.error('Error updating payment:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid payment data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/payments/[id] - Reverse (delete) specific payment
 * This reverses all allocations and deletes the payment
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
        error: 'Payment ID is required'
      }, { status: 400 })
    }

    // Create payment service instance
    const paymentService = new PaymentService(session.merchantId)

    // Check if payment exists
    const payment = await paymentService.getPaymentById(id)

    if (!payment) {
      return NextResponse.json({
        success: false,
        error: 'Payment not found'
      }, { status: 404 })
    }

    // Reverse the payment
    const reversalResult = await paymentService.reversePayment(id)

    return NextResponse.json({
      success: true,
      message: 'Payment reversed successfully',
      data: {
        reversedPaymentId: reversalResult.paymentId,
        totalReversedAmount: reversalResult.totalReversedAmount,
        allocationsReversed: reversalResult.reversedAllocations.length,
        creditsRestored: reversalResult.creditsRestored.length
      }
    })

  } catch (error: unknown) {
    console.error('Error reversing payment:', error)

    if (error instanceof Error && error.message?.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'Payment not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}