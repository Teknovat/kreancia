import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check if admin setup mode is enabled
    const setupEnabled = process.env.ADMIN_SETUP_MODE === 'true';

    if (!setupEnabled) {
      return NextResponse.json({ available: false, reason: 'Setup mode disabled' });
    }

    // Check if any merchants already exist
    const merchantCount = await prisma.merchant.count();

    if (merchantCount > 0) {
      return NextResponse.json({ available: false, reason: 'Merchants already exist' });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('Setup check failed:', error);
    return NextResponse.json({ available: false, reason: 'Database error' });
  } finally {
    await prisma.$disconnect();
  }
}