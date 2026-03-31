# 🔌 API Design Patterns

## Overview

Kreancia follows consistent API design patterns across all endpoints, ensuring predictable behavior, proper error handling, and secure multi-tenant access.

## 🏗️ Core Patterns

### 1. Request/Response Structure

#### Standard Success Response
```typescript
{
  success: true,
  data: any,              // The actual response data
  message?: string,       // Optional success message
  pagination?: {          // For paginated responses
    page: number,
    limit: number,
    total: number,
    totalPages: number,
    hasMore: boolean
  }
}
```

#### Standard Error Response
```typescript
{
  success: false,
  error: string,          // Human-readable error message
  details?: any,          // Additional error context (e.g., validation errors)
  code?: string          // Optional error code for client handling
}
```

### 2. Authentication Pattern

All API routes follow this authentication pattern:

```typescript
export async function GET/POST/PUT/DELETE(request: NextRequest) {
  try {
    // 1. Validate authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. Business logic with automatic RLS
    const result = await someService.operation(data, session)

    // 3. Success response
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    // 4. Error handling
    return handleAPIError(error)
  }
}
```

### 3. Input Validation Pattern

Using Zod for consistent validation:

```typescript
import { z } from 'zod'

// Define validation schema
const createResourceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional(),
  amount: z.number().positive('Amount must be positive')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = createResourceSchema.parse(body)
    
    // Process with validated data
    const result = await service.create(validatedData)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 })
    }
    
    return handleAPIError(error)
  }
}
```

## 🔍 Query Parameter Patterns

### 1. Pagination
```typescript
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
})
```

### 2. Sorting
```typescript
const sortSchema = z.object({
  sortBy: z.enum(['name', 'email', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})
```

### 3. Filtering
```typescript
const filterSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).default('ALL'),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
})
```

### 4. Combined Query Schema
```typescript
const listResourcesSchema = paginationSchema
  .merge(sortSchema)
  .merge(filterSchema)
```

## 🔒 Security Patterns

### 1. RLS Integration
```typescript
// Automatic tenant isolation through SecurePrismaClient
const secureClient = getSecurePrismaClient()
const prisma = await secureClient.withSession({
  merchantId: session.user.merchantId,
  userId: session.user.id
})

// All queries automatically filtered by merchantId
const resources = await prisma.resource.findMany()
```

### 2. Input Sanitization
```typescript
// Sanitize search queries
const sanitizeSearchQuery = (query: string) => {
  return query
    .trim()
    .replace(/[^\w\s@.-]/g, '') // Remove special chars except common ones
    .substring(0, 100)          // Limit length
}
```

### 3. Rate Limiting (Planned)
```typescript
// Rate limiting middleware
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
})
```

## 📊 Data Transformation Patterns

### 1. Response Shaping
```typescript
// Transform database records for API response
const transformClient = (client: Client): ClientResponse => ({
  id: client.id,
  fullName: `${client.firstName} ${client.lastName}`,
  email: client.email,
  status: client.status,
  createdAt: client.createdAt.toISOString(),
  // Exclude sensitive fields like merchantId
})
```

### 2. Aggregated Responses
```typescript
// Include statistics with list responses
const getClientsWithStats = async () => {
  const clients = await prisma.client.findMany({
    include: {
      _count: {
        select: {
          credits: true,
          payments: true
        }
      }
    }
  })

  return {
    clients: clients.map(transformClient),
    stats: {
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === 'ACTIVE').length,
      // ... more stats
    }
  }
}
```

## 🔄 CRUD Operation Patterns

### 1. Create (POST)
```typescript
export async function POST(request: NextRequest) {
  const session = await requireAuth()
  const data = await validateInput(request, createSchema)
  
  const resource = await service.create(data, session)
  
  return NextResponse.json({
    success: true,
    data: resource,
    message: 'Resource created successfully'
  }, { status: 201 })
}
```

### 2. Read (GET)
```typescript
// List resources
export async function GET(request: NextRequest) {
  const session = await requireAuth()
  const params = await validateQuery(request, listSchema)
  
  const result = await service.list(params, session)
  
  return NextResponse.json({
    success: true,
    data: result.items,
    pagination: result.pagination
  })
}
```

### 3. Update (PUT)
```typescript
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAuth()
  const data = await validateInput(request, updateSchema)
  
  const resource = await service.update(params.id, data, session)
  
  return NextResponse.json({
    success: true,
    data: resource,
    message: 'Resource updated successfully'
  })
}
```

### 4. Delete (DELETE)
```typescript
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAuth()
  
  await service.delete(params.id, session)
  
  return NextResponse.json({
    success: true,
    message: 'Resource deleted successfully'
  })
}
```

## 📈 Performance Patterns

### 1. Efficient Queries
```typescript
// Include related data to avoid N+1 queries
const clients = await prisma.client.findMany({
  include: {
    credits: {
      where: { status: 'OPEN' },
      select: { amount: true, remainingAmount: true }
    }
  }
})
```

### 2. Selective Field Loading
```typescript
// Only load needed fields
const clients = await prisma.client.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    status: true
  }
})
```

### 3. Batch Operations
```typescript
// Process multiple operations in a transaction
await prisma.$transaction(async (tx) => {
  const payment = await tx.payment.create({ data: paymentData })
  const allocations = await Promise.all(
    allocationData.map(data => tx.paymentAllocation.create({ data }))
  )
  return { payment, allocations }
})
```

## 🚨 Error Handling Patterns

### 1. Centralized Error Handler
```typescript
const handleAPIError = (error: unknown) => {
  console.error('API Error:', error)

  // Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      success: false,
      error: 'Invalid input data',
      details: error.errors
    }, { status: 400 })
  }

  // Business logic errors
  if (error instanceof BusinessLogicError) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 422 })
  }

  // Not found errors
  if (error instanceof NotFoundError) {
    return NextResponse.json({
      success: false,
      error: 'Resource not found'
    }, { status: 404 })
  }

  // Generic server error
  return NextResponse.json({
    success: false,
    error: 'Internal server error'
  }, { status: 500 })
}
```

### 2. Custom Error Types
```typescript
export class BusinessLogicError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BusinessLogicError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`)
    this.name = 'NotFoundError'
  }
}

export class DuplicateResourceError extends Error {
  constructor(field: string, value: string) {
    super(`${field} '${value}' already exists`)
    this.name = 'DuplicateResourceError'
  }
}
```

## 🔄 Versioning Strategy

### 1. API Version Headers
```typescript
// Check API version (when needed in future)
const apiVersion = request.headers.get('API-Version') || 'v1'

if (apiVersion === 'v2') {
  return handleV2Request(request)
}
```

### 2. Backward Compatibility
```typescript
// Maintain backward compatibility
const transformResponseForVersion = (data: any, version: string) => {
  if (version === 'v1') {
    // Transform for v1 compatibility
    return {
      ...data,
      fullName: data.full_name, // Map snake_case to camelCase for v1
    }
  }
  return data
}
```

## 📝 Documentation Patterns

### 1. API Route Documentation
```typescript
/**
 * GET /api/clients - List clients with pagination and filtering
 * 
 * Query Parameters:
 * - page: number (default: 1) - Page number for pagination
 * - limit: number (default: 20, max: 100) - Items per page
 * - search: string - Search in name, email, business name
 * - status: 'ACTIVE' | 'INACTIVE' | 'ALL' (default: 'ALL') - Filter by status
 * 
 * Response:
 * - success: boolean
 * - data: { clients: Client[], totalCount: number, stats: ClientStats }
 * - pagination: PaginationInfo
 */
```

### 2. Schema Documentation
```typescript
const createClientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional(),
  creditLimit: z.number().positive().optional(),
}).describe('Schema for creating a new client')
```

## 🧪 Testing Patterns

### 1. API Route Testing
```typescript
describe('/api/clients', () => {
  it('should return paginated clients', async () => {
    const response = await request(app)
      .get('/api/clients?page=1&limit=10')
      .set('Cookie', authCookie)
      .expect(200)

    expect(response.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        clients: expect.any(Array)
      })
    })
  })
})
```

### 2. Validation Testing
```typescript
describe('Client validation', () => {
  it('should reject invalid email', async () => {
    const response = await request(app)
      .post('/api/clients')
      .send({ firstName: 'John', lastName: 'Doe', email: 'invalid-email' })
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe('Invalid input data')
  })
})
```

---

> **Related**: [API Reference](./api-reference.md) | [Multi-Tenant Security](../architecture/multi-tenant-rls.md) | [Development Workflow](../development/workflow-guide.md)