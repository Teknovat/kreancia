#!/usr/bin/env tsx

/**
 * Database Initialization Script
 * Applies RLS policies after prisma db push
 */

import { PrismaClient } from '@/generated/client';

const prisma = new PrismaClient();

async function initializeDatabase() {
  try {
    console.log('📊 Initializing database with RLS policies...');

    // Enable Row Level Security on all tables
    await prisma.$executeRaw`ALTER TABLE "merchants" ENABLE ROW LEVEL SECURITY`;
    await prisma.$executeRaw`ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY`;
    await prisma.$executeRaw`ALTER TABLE "credits" ENABLE ROW LEVEL SECURITY`;
    await prisma.$executeRaw`ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY`;
    await prisma.$executeRaw`ALTER TABLE "payment_allocations" ENABLE ROW LEVEL SECURITY`;

    // Create function for current merchant ID
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION current_merchant_id()
      RETURNS TEXT AS $$
      BEGIN
        RETURN COALESCE(current_setting('app.current_merchant_id', true), '');
      END;
      $$ LANGUAGE plpgsql STABLE
    `);

    // Create RLS policies
    await prisma.$executeRaw`DROP POLICY IF EXISTS "merchants_isolation" ON "merchants"`;
    await prisma.$executeRaw`CREATE POLICY "merchants_isolation" ON "merchants" USING (id = current_merchant_id())`;

    await prisma.$executeRaw`DROP POLICY IF EXISTS "clients_isolation" ON "clients"`;
    await prisma.$executeRawUnsafe(`CREATE POLICY "clients_isolation" ON "clients" USING ("merchantId" = current_merchant_id())`);

    await prisma.$executeRaw`DROP POLICY IF EXISTS "credits_isolation" ON "credits"`;
    await prisma.$executeRawUnsafe(`CREATE POLICY "credits_isolation" ON "credits" USING ("merchantId" = current_merchant_id())`);

    await prisma.$executeRaw`DROP POLICY IF EXISTS "payments_isolation" ON "payments"`;
    await prisma.$executeRawUnsafe(`CREATE POLICY "payments_isolation" ON "payments" USING ("merchantId" = current_merchant_id())`);

    await prisma.$executeRaw`DROP POLICY IF EXISTS "payment_allocations_isolation" ON "payment_allocations"`;
    await prisma.$executeRawUnsafe(`CREATE POLICY "payment_allocations_isolation" ON "payment_allocations" USING ("merchantId" = current_merchant_id())`);

    // Grant permissions
    await prisma.$executeRaw`GRANT EXECUTE ON FUNCTION current_merchant_id() TO public`;

    console.log('✅ Database RLS policies applied successfully!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initializeDatabase();