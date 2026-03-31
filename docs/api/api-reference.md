# 🔌 Kreancia API Reference

## Overview

The Kreancia API follows REST conventions with consistent patterns for authentication, error handling, and data validation. All endpoints are secured with NextAuth.js sessions and Row Level Security (RLS).

## 🔐 Authentication

All API endpoints require authentication via NextAuth.js session cookies. Unauthenticated requests return `401 Unauthorized`.

### Session Information
```typescript
interface Session {
  user: {
    id: string
    email: string
    merchantId: string
    name: string
  }
}
```

## 📊 Response Format

### Success Response
```typescript
{
  success: true,
  data: any,           // Response data
  message?: string,    // Optional success message
  pagination?: {       // For paginated endpoints
    page: number,
    limit: number,
    total: number,
    totalPages: number,
    hasMore: boolean
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: string,       // Error message
  details?: any        // Additional error details (validation errors)
}
```

## 👥 Clients API

Base URL: `/api/clients`

### List Clients
```http
GET /api/clients
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Items per page (max 100) |
| `orderBy` | enum | "firstName" | Sort field: firstName, lastName, email, createdAt |
| `order` | enum | "asc" | Sort order: asc, desc |
| `status` | enum | "ALL" | Filter: ALL, ACTIVE, INACTIVE, SUSPENDED |
| `hasOverdue` | boolean | false | Filter clients with overdue credits |
| `search` | string | - | Search in name, email, business name |

**Response:**
```typescript
{
  success: true,
  data: {
    clients: ClientWithStats[],
    totalCount: number,
    totalPages: number,
    stats: {
      totalClients: number,
      activeClients: number,
      totalOutstanding: number,
      overdueClients: number,
      avgCreditLimit: number
    }
  }
}
```

### Create Client
```http
POST /api/clients
```

**Request Body:**
```typescript
{
  firstName: string,           // Required
  lastName: string,            // Required
  email?: string,              // Optional, must be valid email
  phone?: string,              // Optional
  address?: string,            // Optional
  businessName?: string,       // Optional
  taxId?: string,              // Optional
  creditLimit?: number,        // Optional, must be positive
  paymentTermDays?: number     // Default: 30, must be positive integer
}
```

**Response:**
```typescript
{
  success: true,
  data: Client,
  message: "Client created successfully"
}
```

### Get Client
```http
GET /api/clients/{id}
```

**Response:**
```typescript
{
  success: true,
  data: ClientWithStats & {
    credits: Credit[],
    payments: Payment[],
    paymentHistory: PaymentAllocation[]
  }
}
```

### Update Client
```http
PUT /api/clients/{id}
```

**Request Body:** Same as Create Client (all fields optional)

### Delete Client
```http
DELETE /api/clients/{id}
```

## 💰 Credits API

Base URL: `/api/credits`

### List Credits
```http
GET /api/credits
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `status` | enum | "ALL" | OPEN, PAID, CANCELLED, OVERDUE, ALL |
| `clientId` | string | - | Filter by specific client |
| `dueDateFrom` | ISO date | - | Filter by due date range start |
| `dueDateTo` | ISO date | - | Filter by due date range end |
| `minAmount` | number | - | Minimum credit amount |
| `maxAmount` | number | - | Maximum credit amount |
| `sortBy` | enum | "dueDate" | Sort field: amount, dueDate, createdAt |
| `sortOrder` | enum | "desc" | Sort order: asc, desc |

**Response:**
```typescript
{
  success: true,
  data: {
    credits: Credit[],
    pagination: PaginationInfo,
    summary: {
      totalCredits: number,
      totalAmount: number,
      totalRemaining: number,
      overdueCredits: number,
      overdueAmount: number
    }
  }
}
```

### Create Credit
```http
POST /api/credits
```

**Request Body:**
```typescript
{
  amount: number,              // Required, positive
  description: string,         // Required
  dueDate: string,            // Required, ISO date
  clientId: string,           // Required
  reference?: string,          // Optional invoice/reference number
  currency?: string           // Optional, defaults to merchant currency
}
```

### Get Credit
```http
GET /api/credits/{id}
```

### Update Credit
```http
PUT /api/credits/{id}
```

### Delete Credit
```http
DELETE /api/credits/{id}
```

## 💳 Payments API

Base URL: `/api/payments`

### List Payments
```http
GET /api/payments
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | "" | Search in note, reference, client name |
| `method` | enum | "ALL" | Payment method filter |
| `clientId` | string | - | Filter by client |
| `dateFrom` | ISO datetime | - | Date range start |
| `dateTo` | ISO datetime | - | Date range end |
| `minAmount` | number | - | Minimum amount |
| `maxAmount` | number | - | Maximum amount |
| `sortBy` | enum | "paymentDate" | Sort field |
| `sortOrder` | enum | "desc" | Sort order |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

### Create Payment
```http
POST /api/payments
```

**Request Body:**
```typescript
{
  amount: number,                    // Required, positive
  note?: string,                     // Optional payment note
  method: PaymentMethod,             // Required: CASH, BANK_TRANSFER, etc.
  reference?: string,                // Optional payment reference
  paymentDate?: string,              // Optional ISO datetime, defaults to now
  clientId: string,                  // Required
  allocationMode: "FIFO" | "MANUAL", // Default: FIFO
  manualAllocations?: Array<{        // Required if allocationMode = MANUAL
    creditId: string,
    amount: number
  }>
}
```

**Payment Methods:**
- `CASH`
- `BANK_TRANSFER`
- `CHECK`
- `CARD`
- `MOBILE_PAYMENT`
- `OTHER`

**Response:**
```typescript
{
  success: true,
  data: Payment & {
    allocations: PaymentAllocation[],
    totalAllocated: number,
    unallocatedAmount: number
  },
  message: string,
  allocation: {
    mode: "FIFO" | "MANUAL",
    totalAllocated: number,
    unallocatedAmount: number,
    creditsAffected: number
  }
}
```

### Get Payment
```http
GET /api/payments/{id}
```

### Update Payment
```http
PUT /api/payments/{id}
```

### Delete Payment
```http
DELETE /api/payments/{id}
```

### Allocate Payment
```http
POST /api/payments/allocate
```

**Request Body:**
```typescript
{
  paymentId: string,
  allocations: Array<{
    creditId: string,
    amount: number
  }>,
  mode: "FIFO" | "MANUAL"
}
```

## 🏥 Health Check API

### Health Check
```http
GET /api/health
```

**Response:**
```typescript
{
  status: "ok",
  timestamp: string,
  uptime: number,
  database: "connected" | "error",
  version: string
}
```

## 🔒 Authentication API

Base URL: `/api/auth`

Uses NextAuth.js endpoints:
- `POST /api/auth/signin` - Sign in with credentials
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session
- `GET /api/auth/csrf` - Get CSRF token

## 📝 Data Types

### Client
```typescript
interface Client {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  address?: string
  businessName?: string
  taxId?: string
  creditLimit: number
  paymentTermDays: number
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  merchantId: string
  createdAt: string
  updatedAt: string
}

interface ClientWithStats extends Client {
  fullName: string
  totalCredits: number
  outstandingAmount: number
  overdueAmount: number
  lastActivity: string
  creditCount: number
  paymentCount: number
}
```

### Credit
```typescript
interface Credit {
  id: string
  amount: number
  description: string
  dueDate: string
  reference?: string
  currency: string
  remainingAmount: number
  status: "OPEN" | "PAID" | "CANCELLED" | "OVERDUE"
  clientId: string
  merchantId: string
  createdAt: string
  updatedAt: string
}
```

### Payment
```typescript
interface Payment {
  id: string
  amount: number
  note?: string
  method: PaymentMethod
  reference?: string
  paymentDate: string
  clientId: string
  merchantId: string
  createdAt: string
  updatedAt: string
}
```

### PaymentAllocation
```typescript
interface PaymentAllocation {
  id: string
  paymentId: string
  creditId: string
  amount: number
  createdAt: string
}
```

## 🔄 FIFO Payment Allocation

The FIFO (First In, First Out) allocation system automatically applies payments to the oldest unpaid credits first.

### Algorithm
1. Get all open credits for the client, ordered by due date (oldest first)
2. For each credit, allocate payment amount until credit is fully paid or payment is exhausted
3. Create `PaymentAllocation` records for each allocation
4. Update credit `remainingAmount` and `status` accordingly

### Example FIFO Flow
```
Payment: $100 for Client A

Open Credits:
- Credit 1: $30 remaining (due 2024-01-01)
- Credit 2: $80 remaining (due 2024-02-01)

After FIFO Allocation:
- Credit 1: $0 remaining (status: PAID) - allocated $30
- Credit 2: $10 remaining (status: OPEN) - allocated $70
- Payment: $100 total, $100 allocated, $0 unallocated
```

## ⚠️ Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | Bad Request | Invalid input data or parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Access denied (RLS policy) |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (duplicate email) |
| 422 | Unprocessable Entity | Business logic validation failed |
| 500 | Internal Server Error | Server error |

## 🧪 Example Requests

### Create Client with cURL
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john@example.com",
    "creditLimit": 1000,
    "paymentTermDays": 30
  }'
```

### Create Payment with FIFO Allocation
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "method": "BANK_TRANSFER",
    "reference": "TXN-001",
    "clientId": "client-id-here",
    "allocationMode": "FIFO"
  }'
```

### List Clients with Search
```bash
curl "http://localhost:3000/api/clients?search=john&page=1&limit=10&orderBy=firstName"
```

---

> **Related**: [API Patterns](./api-patterns.md) | [Authentication](../authentication.md) | [Multi-Tenant Security](../architecture/multi-tenant-rls.md)