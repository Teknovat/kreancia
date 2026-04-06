import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@/generated/client';

const prisma = new PrismaClient();

const createMerchantSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { token, businessName, email, password } = createMerchantSchema.parse(body);

    // Verify setup is enabled
    if (process.env.ADMIN_SETUP_MODE !== 'true') {
      return NextResponse.json(
        { error: 'Setup mode is disabled' },
        { status: 403 }
      );
    }

    // Verify token
    const expectedToken = process.env.ADMIN_SETUP_TOKEN;
    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json(
        { error: 'Invalid setup token' },
        { status: 401 }
      );
    }

    // Check if merchants already exist (double-check for race conditions)
    const existingMerchantCount = await prisma.merchant.count();
    if (existingMerchantCount > 0) {
      return NextResponse.json(
        { error: 'Merchant accounts already exist. Setup is no longer available.' },
        { status: 409 }
      );
    }

    // Check if email is already taken (should be impossible but safety first)
    const existingMerchant = await prisma.merchant.findUnique({
      where: { email },
    });

    if (existingMerchant) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create merchant account
    const merchant = await prisma.merchant.create({
      data: {
        name: businessName, // Use businessName as the main name
        businessName,
        email,
        password: hashedPassword,
        currency: 'EUR', // Default currency - can be made configurable
      },
      select: {
        id: true,
        businessName: true,
        email: true,
        currency: true,
        createdAt: true,
      },
    });

    console.log(`✅ Merchant account created successfully:`, {
      id: merchant.id,
      businessName: merchant.businessName,
      email: merchant.email,
      timestamp: merchant.createdAt,
    });

    return NextResponse.json({
      success: true,
      message: 'Merchant account created successfully',
      merchant: {
        id: merchant.id,
        businessName: merchant.businessName,
        email: merchant.email,
        currency: merchant.currency,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Merchant creation failed:', error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create merchant account. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}