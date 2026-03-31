# Database Migrations

This directory contains the database migrations for the Kreancia Credit Management System.

## Migration 001_init

**Purpose:** Initial schema creation for multi-tenant credit management system

**Features:**
- Complete multi-tenant schema design
- Financial precision using Decimal(10,2) for all amounts
- FIFO payment allocation system through PaymentAllocation model
- Comprehensive indexing for multi-tenant performance
- Proper cascade relationships for data integrity

**Models Created:**
- `merchants` - Merchant accounts (commerçants)
- `clients` - Customer management per merchant
- `credits` - Credit transactions with auto-calculated statuses
- `payments` - Payment tracking
- `payment_allocations` - FIFO payment distribution

**Key Design Decisions:**
1. **Decimal Types**: All financial amounts use DECIMAL(10,2) for precision
2. **Multi-tenant Indexes**: Compound indexes on merchantId for optimal filtering
3. **CASCADE Deletes**: Proper cleanup when merchants are deleted
4. **Status Calculation**: Credit status based on remainingAmount and dueDate
5. **FIFO Support**: PaymentAllocation table enables proper payment distribution

## Usage

To apply migrations:
```bash
npm run db:migrate
```

To reset and reapply (development only):
```bash
npx prisma db push --force-reset
npm run db:seed
```

To view database schema:
```bash
npm run db:studio
```