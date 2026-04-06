import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const verifySchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Check if setup is enabled
    if (process.env.ADMIN_SETUP_MODE !== 'true') {
      return NextResponse.json(
        { error: 'Setup mode is disabled' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { token } = verifySchema.parse(body);

    // Verify token against environment variable
    const expectedToken = process.env.ADMIN_SETUP_TOKEN;

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Setup token not configured' },
        { status: 500 }
      );
    }

    if (token !== expectedToken) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Token verification failed:', error);
    return NextResponse.json(
      { error: 'Token verification failed' },
      { status: 500 }
    );
  }
}