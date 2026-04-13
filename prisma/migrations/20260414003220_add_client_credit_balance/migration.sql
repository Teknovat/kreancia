-- Migration: Add Client Credit Balance Table for Surplus Payment Management
-- Date: 2026-04-14
-- Description: Adds support for storing client credit balance (surplus from overpayments)

-- CreateTable: client_credit_balances
CREATE TABLE "client_credit_balances" (
    "id" TEXT NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "merchantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_credit_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint on clientId (one balance per client)
CREATE UNIQUE INDEX "client_credit_balances_clientId_key" ON "client_credit_balances"("clientId");

-- CreateIndex: Performance indexes
CREATE INDEX "client_credit_balances_merchantId_idx" ON "client_credit_balances"("merchantId");
CREATE INDEX "client_credit_balances_clientId_idx" ON "client_credit_balances"("clientId");

-- AddForeignKey: Link to merchants table
ALTER TABLE "client_credit_balances" ADD CONSTRAINT "client_credit_balances_merchantId_fkey"
FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Link to clients table
ALTER TABLE "client_credit_balances" ADD CONSTRAINT "client_credit_balances_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row Level Security for multi-tenant isolation
ALTER TABLE "client_credit_balances" ENABLE ROW LEVEL SECURITY;

-- Create RLS Policy: Users can only see balances belonging to their merchant
DROP POLICY IF EXISTS "client_credit_balances_isolation" ON "client_credit_balances";
CREATE POLICY "client_credit_balances_isolation" ON "client_credit_balances"
  USING ("merchantId" = current_merchant_id());