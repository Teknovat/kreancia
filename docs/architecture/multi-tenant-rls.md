# 🛡️ Multi-Tenant Security with Row Level Security (RLS)

## Overview

Kreancia implements multi-tenancy using PostgreSQL Row Level Security (RLS), providing database-level data isolation that cannot be bypassed at the application level.

## 🎯 RLS Strategy

### Why RLS Over Other Approaches?

| Approach | Pros | Cons | Kreancia Decision |
|----------|------|------|-------------------|
| **Database per Tenant** | Complete isolation | High infrastructure cost, maintenance complexity | ❌ Too expensive |
| **Schema per Tenant** | Good isolation | Schema proliferation, backup complexity | ❌ Maintenance overhead |
| **Row Level Security** | Secure, cost-effective, performant | Requires careful implementation | ✅ **Chosen** |
| **Application-level Filtering** | Simple implementation | Can be bypassed, error-prone | ❌ Security risk |

## 🔧 RLS Implementation

### 1. Database Policies

RLS policies are defined in Prisma migrations:

```sql
-- Enable RLS on all tenant-aware tables
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Credit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentAllocation" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for each table
CREATE POLICY client_tenant_policy ON "Client"
  USING (merchant_id = current_setting('app.current_merchant_id')::text);

CREATE POLICY credit_tenant_policy ON "Credit"
  USING (merchant_id = current_setting('app.current_merchant_id')::text);

CREATE POLICY payment_tenant_policy ON "Payment"
  USING (merchant_id = current_setting('app.current_merchant_id')::text);

CREATE POLICY payment_allocation_tenant_policy ON "PaymentAllocation"
  USING (EXISTS (
    SELECT 1 FROM "Payment" p
    WHERE p.id = payment_id 
    AND p.merchant_id = current_setting('app.current_merchant_id')::text
  ));
```

### 2. Secure Prisma Client

The `SecurePrismaClient` wrapper automatically injects tenant context:

```typescript
// src/lib/prisma-rls.ts
import { PrismaClient } from '@prisma/client'

interface SessionContext {
  merchantId: string
  userId: string
}

export class SecurePrismaClient {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async withSession(context: SessionContext) {
    // Set PostgreSQL session variable for RLS
    await this.prisma.$executeRaw`
      SELECT set_config('app.current_merchant_id', ${context.merchantId}, true)
    `
    
    return this.prisma
  }
}

export function getSecurePrismaClient() {
  return new SecurePrismaClient()
}
```

### 3. Usage Pattern

Every database operation requires session context:

```typescript
// In API routes or Server Components
export async function getClients() {
  const session = await getServerSession()
  if (!session) throw new Error('Unauthorized')

  const secureClient = getSecurePrismaClient()
  const prisma = await secureClient.withSession({
    merchantId: session.user.merchantId,
    userId: session.user.id
  })

  // This query automatically filters by merchant_id
  const clients = await prisma.client.findMany()
  return clients
}
```

## 🔒 Security Benefits

### 1. Defense in Depth
- **Database Level**: Cannot be bypassed even with SQL injection
- **Application Level**: Additional validation in service layer
- **Session Level**: NextAuth.js session validation

### 2. Automatic Enforcement
```typescript
// These operations are automatically filtered:
prisma.client.findMany()      // Only returns current merchant's clients
prisma.credit.create(data)    // Automatically includes merchant_id
prisma.payment.update(...)    // Only updates if merchant owns the payment
```

### 3. Cross-Table Relationships
```sql
-- PaymentAllocation policy ensures payments belong to current merchant
CREATE POLICY payment_allocation_tenant_policy ON "PaymentAllocation"
  USING (EXISTS (
    SELECT 1 FROM "Payment" p, "Credit" c
    WHERE p.id = payment_id 
    AND c.id = credit_id
    AND p.merchant_id = current_setting('app.current_merchant_id')::text
    AND c.merchant_id = current_setting('app.current_merchant_id')::text
  ));
```

## ⚡ Performance Optimization

### 1. Index Strategy
```sql
-- Merchant-aware indexes for efficient RLS queries
CREATE INDEX idx_client_merchant_id ON "Client"(merchant_id);
CREATE INDEX idx_credit_merchant_id ON "Credit"(merchant_id);
CREATE INDEX idx_payment_merchant_id ON "Payment"(merchant_id);

-- Composite indexes for common queries
CREATE INDEX idx_client_merchant_email ON "Client"(merchant_id, email);
CREATE INDEX idx_credit_merchant_status ON "Credit"(merchant_id, status);
```

### 2. Query Performance
- **Policy Efficiency**: RLS policies use indexed columns
- **Connection Reuse**: Single connection pool across all tenants
- **Query Planning**: PostgreSQL optimizes RLS-aware queries

### 3. Monitoring
```sql
-- Monitor RLS performance with query plans
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM "Client" WHERE email = 'client@example.com';
```

## 🛠️ Development Patterns

### 1. Service Layer Integration

Services automatically use secure client:

```typescript
// src/lib/client-service.ts
export class ClientService {
  private async getSecurePrisma(session: Session) {
    const secureClient = getSecurePrismaClient()
    return secureClient.withSession({
      merchantId: session.user.merchantId,
      userId: session.user.id
    })
  }

  async getClients(session: Session) {
    const prisma = await this.getSecurePrisma(session)
    return prisma.client.findMany({
      orderBy: { createdAt: 'desc' }
    })
  }
}
```

### 2. API Route Pattern

Consistent pattern across all API routes:

```typescript
// src/app/api/clients/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clientService = new ClientService()
    const clients = await clientService.getClients(session)
    
    return NextResponse.json(clients)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    )
  }
}
```

### 3. Testing RLS

Unit tests verify tenant isolation:

```typescript
// src/tests/rls.test.ts
describe('RLS Isolation', () => {
  it('should isolate clients by merchant', async () => {
    // Create clients for different merchants
    const merchant1Client = await createTestClient('merchant-1')
    const merchant2Client = await createTestClient('merchant-2')

    // Query as merchant-1
    const merchant1Session = { user: { merchantId: 'merchant-1' } }
    const clients1 = await clientService.getClients(merchant1Session)
    
    expect(clients1).toHaveLength(1)
    expect(clients1[0].id).toBe(merchant1Client.id)
  })
})
```

## 🚨 Security Considerations

### 1. Session Variable Security
```typescript
// Session variables are connection-specific and temporary
await prisma.$executeRaw`
  SELECT set_config('app.current_merchant_id', ${merchantId}, true)
`
// The 'true' parameter makes it transaction-local only
```

### 2. Policy Bypass Prevention
```sql
-- RLS policies cannot be disabled by application code
-- Only superusers can disable RLS (not application user)
REVOKE ALL ON "Client" FROM application_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Client" TO application_user;
```

### 3. Error Handling
```typescript
try {
  const result = await prisma.client.findUnique({ where: { id } })
  if (!result) {
    // Could be not found OR belongs to different merchant
    throw new Error('Client not found')
  }
} catch (error) {
  // Never expose RLS policy violations
  throw new Error('Access denied')
}
```

## 📊 Monitoring & Debugging

### 1. RLS Policy Debugging
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- View current session variables
SELECT current_setting('app.current_merchant_id', true);

-- Test policy behavior
SET app.current_merchant_id = 'test-merchant-id';
SELECT * FROM "Client"; -- Should only show test merchant's clients
```

### 2. Performance Monitoring
```typescript
// Log slow queries with merchant context
import { performance } from 'perf_hooks'

const start = performance.now()
const result = await prisma.client.findMany()
const duration = performance.now() - start

console.log(`Query took ${duration}ms for merchant ${merchantId}`)
```

### 3. Security Auditing
```sql
-- Audit trail for RLS policy access
CREATE TABLE rls_audit_log (
  id SERIAL PRIMARY KEY,
  merchant_id TEXT,
  table_name TEXT,
  operation TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Troubleshooting

### Common Issues

1. **"Row Level Security policy violation"**
   - Session variable not set
   - Wrong merchant ID in session
   - Missing RLS policy for table

2. **Empty result sets**
   - Verify session context is properly set
   - Check RLS policies are correctly defined
   - Ensure merchant ID exists in session

3. **Performance issues**
   - Add indexes on merchant_id columns
   - Optimize RLS policy conditions
   - Monitor query execution plans

### Debug Tools
```typescript
// Debug session context
export async function debugRLSContext() {
  const result = await prisma.$queryRaw`
    SELECT current_setting('app.current_merchant_id', true) as merchant_id
  `
  console.log('Current merchant context:', result)
}
```

---

> **Next**: [Database Schema Design](./database-schema.md)
> 
> **Related**: [Authentication System](../authentication.md) | [API Security](../api/api-patterns.md)