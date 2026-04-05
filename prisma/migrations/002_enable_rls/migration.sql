-- Enable Row Level Security for Multi-tenant Isolation
-- This migration enables RLS on all tenant tables and creates security policies

-- Enable Row Level Security on all tenant tables
ALTER TABLE "merchants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "credits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_allocations" ENABLE ROW LEVEL SECURITY;

-- Create a function to get the current merchant ID from session
CREATE OR REPLACE FUNCTION current_merchant_id()
RETURNS TEXT AS $$
BEGIN
  -- Get the merchant ID from the current session
  RETURN COALESCE(current_setting('app.current_merchant_id', true), '');
END;
$$ LANGUAGE plpgsql STABLE;

-- Merchants table: Users can only see their own merchant record
DROP POLICY IF EXISTS "merchants_isolation" ON "merchants";
CREATE POLICY "merchants_isolation" ON "merchants"
  USING (id = current_merchant_id());

-- Clients table: Users can only see clients belonging to their merchant
DROP POLICY IF EXISTS "clients_isolation" ON "clients";
CREATE POLICY "clients_isolation" ON "clients"
  USING ("merchantId" = current_merchant_id());

-- Credits table: Users can only see credits belonging to their merchant
DROP POLICY IF EXISTS "credits_isolation" ON "credits";
CREATE POLICY "credits_isolation" ON "credits"
  USING ("merchantId" = current_merchant_id());

-- Payments table: Users can only see payments belonging to their merchant
DROP POLICY IF EXISTS "payments_isolation" ON "payments";
CREATE POLICY "payments_isolation" ON "payments"
  USING ("merchantId" = current_merchant_id());

-- Payment allocations table: Users can only see allocations belonging to their merchant
DROP POLICY IF EXISTS "payment_allocations_isolation" ON "payment_allocations";
CREATE POLICY "payment_allocations_isolation" ON "payment_allocations"
  USING ("merchantId" = current_merchant_id());

-- Grant necessary permissions for the function
GRANT EXECUTE ON FUNCTION current_merchant_id() TO public;