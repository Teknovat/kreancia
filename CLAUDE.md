# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kreancia is a multi-tenant credit management system for merchants. Merchants can manage their clients, track credits/debts, record payments, and automatically allocate payments using FIFO (First In, First Out) methodology.

**Key Technologies:** Next.js 15, TypeScript, Prisma ORM, PostgreSQL, NextAuth.js v5, Tailwind CSS, Framer Motion

## Development Commands

### Database Operations
```bash
# Start PostgreSQL with Docker Compose
docker compose up -d

# Install dependencies and setup
npm install
npm run db:generate        # Generate Prisma client
npm run db:migrate         # Run migrations  
npm run db:seed           # Seed development data

# Development workflow
npm run dev               # Start development server
npm run build            # Production build
npm run type-check       # TypeScript validation
npm run lint             # ESLint validation

# Database management
npm run db:studio        # Open Prisma Studio
npm run db:push          # Push schema changes (dev only)
npm run db:reset         # Reset DB with fresh seed data
```

### Merchant Management (CLI)
```bash
# Create merchant accounts (admin task)
npm run create-merchant           # Interactive mode
npm run merchants:create         # Alias

# Manage existing merchants  
npm run merchants:list           # List all merchants
npm run merchants:manage         # Interactive management
npm run manage-merchants -- --details merchant@email.com
```

## Architecture & Patterns

### Multi-Tenant Security (Row Level Security)

The application uses PostgreSQL RLS for strict tenant isolation:

- **SecurePrismaClient** (`src/lib/prisma-rls.ts`): Wrapper that automatically injects `merchantId` filtering
- **Session Context**: Every database operation requires valid merchant session
- **RLS Enforcement**: PostgreSQL session variable `app.current_merchant_id` controls access

```typescript
// Always use secure client for database operations
const secureClient = getSecurePrismaClient()
const client = await secureClient.withSession({
  merchantId: session.user.merchantId,
  userId: session.user.id
})
```

### Authentication Flow (NextAuth.js v5)

- **Credential Provider**: Email/password authentication against `Merchant` table
- **bcrypt Hashing**: Passwords hashed with 10 salt rounds
- **JWT Strategy**: Session data stored in JWT tokens
- **Protected Routes**: Middleware enforces authentication (`src/middleware.ts`)

### Data Model Relationships

```
Merchant (1) ──── (N) Client
    │                 │
    │                 │
    └─── (N) Credit ──┘
             │
             │
         Payment ────── PaymentAllocation (FIFO system)
```

### Business Logic Patterns

- **Service Layer**: Business logic in `src/lib/*-service.ts` files
- **Type Safety**: Comprehensive TypeScript types in `src/types/`
- **Validation**: Zod schemas for form validation and API input
- **FIFO Payment Allocation**: Automatic payment distribution to oldest credits first

## File Structure & Key Areas

### Core Application
- `src/app/` - Next.js App Router pages and API routes
- `src/lib/` - Services, utilities, and configuration  
- `src/components/` - Reusable UI components
- `src/types/` - TypeScript type definitions

### Authentication & Security
- `src/lib/auth.ts` - NextAuth.js configuration
- `src/lib/prisma-rls.ts` - Row Level Security wrapper
- `src/middleware.ts` - Route protection middleware

### Business Logic
- `src/lib/client-service.ts` - Client management operations
- `src/lib/credit-service.ts` - Credit/debt tracking operations
- `src/lib/payment-service.ts` - Payment processing and FIFO allocation

### Database
- `prisma/schema.prisma` - Database schema with RLS support
- `prisma/seed.ts` - Development data seeding
- `scripts/` - CLI tools for merchant account management

## API Structure

REST API following `/api/[resource]/[id]` pattern:

- **Clients**: `/api/clients` (CRUD operations)
- **Credits**: `/api/credits` (Create, read, update credit records)  
- **Payments**: `/api/payments` (Record payments, automatic allocation)
- **Payment Allocation**: `/api/payments/allocate` (FIFO allocation logic)

All API routes automatically enforce tenant isolation through RLS.

## Development Guidelines

### Multi-Tenant Considerations
- Always use `SecurePrismaClient` for database operations
- Never bypass RLS - each operation requires merchant session context
- Test with multiple merchant accounts to verify isolation

### Payment Processing
- Payments use FIFO allocation to credits automatically
- `PaymentAllocation` table tracks which payments apply to which credits
- Credit `remainingAmount` and `status` update automatically

### Database Migrations
- Use `npm run db:migrate` for schema changes
- Test migrations with existing data
- Update seed data (`prisma/seed.ts`) when schema changes

### CLI Tools Usage
- Merchant accounts created via CLI scripts only (no public registration)
- Use interactive mode for manual account creation
- Scripts include comprehensive validation and security checks

## Common Development Tasks

### Adding New Features
1. Define TypeScript types in `src/types/`
2. Add database fields to `prisma/schema.prisma`  
3. Create/update migrations with `npm run db:migrate`
4. Implement business logic in service files
5. Create API routes with proper RLS integration
6. Build UI components with proper authentication

### Testing Multi-Tenancy
1. Create test merchants: `npm run create-merchant`
2. Seed data for each merchant via Prisma Studio or scripts
3. Verify data isolation by switching between merchant sessions
4. Test API endpoints with different merchant credentials

## Frontend Development Guidelines

### Using Skills and Documentation
- **ALWAYS use `frontend-design` skill** when implementing any frontend components, pages, or UI features
- **ALWAYS use `context7` skill** before installing new libraries or when needing documentation for existing ones
- Check context7 for current documentation on React, Next.js, Tailwind, Framer Motion, and other dependencies

### Component Development Strategy
- **Check existing components first** - Review `src/components/` before creating new components
- **Reuse patterns** - Look for similar functionality in existing pages and components
- **Component hierarchy**: Follow existing patterns in `src/components/[feature]/` organization

### Standard Implementation Patterns
- **Client-side data fetching**: Use `useClient` hook pattern for API calls
- **Form handling**: Use `react-hook-form` with Zod validation (existing pattern)
- **State management**: Use React state and context patterns already established
- **API integration**: Follow existing service layer patterns (`src/lib/*-service.ts`)
- **Authentication**: Use `useSession` from NextAuth.js for user context
- **Navigation**: Use existing navigation patterns from `src/lib/navigation.ts`

### UI Development Standards
- **Styling**: Use Tailwind CSS classes following existing component patterns
- **Animations**: Use Framer Motion following existing animation patterns
- **Icons**: Use Lucide React icons (already installed)
- **Forms**: Follow existing form validation patterns with Zod schemas
- **Loading states**: Implement loading and error states for all async operations
- **Responsive design**: Ensure mobile-first responsive design patterns

## Security Notes

- **No Public Registration**: Merchant accounts created only via admin CLI
- **Password Requirements**: 8+ chars with uppercase, lowercase, numbers, symbols
- **Session Management**: JWT with merchant context injection
- **Data Isolation**: Automatic via PostgreSQL RLS - cannot be bypassed
- **Input Validation**: Zod schemas on all user inputs and API endpoints