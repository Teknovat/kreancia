-- Initial migration for Kreancia Credit Management System
-- Creates the complete multi-tenant schema with financial precision

-- CreateEnum
CREATE TYPE "CreditStatus" AS ENUM ('OPEN', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHECK', 'CARD', 'MOBILE_PAYMENT', 'OTHER');

-- CreateTable
CREATE TABLE "merchants" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TND',
    "businessName" TEXT,
    "businessAddress" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "businessName" TEXT,
    "taxId" TEXT,
    "creditLimit" DECIMAL(10,2),
    "paymentTermDays" INTEGER NOT NULL DEFAULT 30,
    "merchantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credits" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "remainingAmount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "CreditStatus" NOT NULL,
    "description" TEXT,
    "merchantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "reference" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "merchantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_allocations" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "allocatedAmount" DECIMAL(10,2) NOT NULL,
    "merchantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "creditId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merchants_email_key" ON "merchants"("email");

-- CreateIndex for performance
CREATE INDEX "merchants_email_idx" ON "merchants"("email");

-- CreateIndex for multi-tenant client queries
CREATE INDEX "clients_merchantId_idx" ON "clients"("merchantId");
CREATE INDEX "clients_firstName_lastName_idx" ON "clients"("firstName", "lastName");
CREATE INDEX "clients_email_idx" ON "clients"("email");

-- CreateIndex for multi-tenant credit queries and status filtering
CREATE INDEX "credits_merchantId_idx" ON "credits"("merchantId");
CREATE INDEX "credits_clientId_idx" ON "credits"("clientId");
CREATE INDEX "credits_status_idx" ON "credits"("status");
CREATE INDEX "credits_dueDate_idx" ON "credits"("dueDate");
CREATE INDEX "credits_merchantId_clientId_idx" ON "credits"("merchantId", "clientId");
CREATE INDEX "credits_merchantId_status_idx" ON "credits"("merchantId", "status");

-- CreateIndex for multi-tenant payment queries
CREATE INDEX "payments_merchantId_idx" ON "payments"("merchantId");
CREATE INDEX "payments_clientId_idx" ON "payments"("clientId");
CREATE INDEX "payments_paymentDate_idx" ON "payments"("paymentDate");
CREATE INDEX "payments_merchantId_clientId_idx" ON "payments"("merchantId", "clientId");
CREATE INDEX "payments_merchantId_paymentDate_idx" ON "payments"("merchantId", "paymentDate");

-- CreateIndex for FIFO payment allocation queries
CREATE INDEX "payment_allocations_merchantId_idx" ON "payment_allocations"("merchantId");
CREATE INDEX "payment_allocations_clientId_idx" ON "payment_allocations"("clientId");
CREATE INDEX "payment_allocations_paymentId_idx" ON "payment_allocations"("paymentId");
CREATE INDEX "payment_allocations_creditId_idx" ON "payment_allocations"("creditId");
CREATE INDEX "payment_allocations_merchantId_clientId_idx" ON "payment_allocations"("merchantId", "clientId");
CREATE INDEX "payment_allocations_paymentId_creditId_idx" ON "payment_allocations"("paymentId", "creditId");

-- Add Foreign Key constraints with CASCADE for multi-tenant isolation
ALTER TABLE "clients" ADD CONSTRAINT "clients_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credits" ADD CONSTRAINT "credits_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credits" ADD CONSTRAINT "credits_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "credits"("id") ON DELETE CASCADE ON UPDATE CASCADE;