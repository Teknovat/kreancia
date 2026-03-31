# 📋 Kreancia - Complete Project Documentation Index

## 🏗️ Project Overview

**Kreancia** is a multi-tenant credit management system for merchants built with modern web technologies. This documentation provides comprehensive coverage of the entire system architecture, implementation, and usage.

### 🚀 Quick Start
- [README (French)](../README.md) - Basic project setup
- [CLAUDE.md](../CLAUDE.md) - Development guidelines and patterns
- [Project Setup](./setup-guide.md) - Detailed setup instructions

## 📁 Documentation Structure

### 🏛️ Architecture & Design
- [System Architecture](./architecture/system-overview.md) - High-level system design
- [Multi-Tenant Security](./architecture/multi-tenant-rls.md) - Row Level Security implementation
- [Authentication System](./authentication.md) - NextAuth.js v5 integration
- [Database Design](./architecture/database-schema.md) - Entity relationships and constraints
- [API Design Patterns](./api/api-patterns.md) - REST API conventions

### 💾 Database & Data Management
- [Merchant Management](./merchant-management.md) ✅ - CLI tools and account management
- [Schema Documentation](./database/schema-reference.md) - Complete schema reference
- [Migration Guide](./database/migration-guide.md) - Database migration strategies
- [Seed Data](./database/seed-data-guide.md) - Development data setup

### 🔌 API Documentation
- [API Reference](./api/api-reference.md) - Complete API endpoint documentation
- [Client Management API](./api/clients-api.md) - Client CRUD operations
- [Credit Management API](./api/credits-api.md) - Credit tracking endpoints
- [Payment Processing API](./api/payments-api.md) - Payment and allocation system
- [Authentication API](./api/auth-api.md) - Auth endpoints and flows

### 🎨 Frontend Documentation
- [Component Library](./frontend/component-library.md) - Reusable component catalog
- [Page Structure](./frontend/page-architecture.md) - App Router patterns
- [UI/UX Patterns](./frontend/ui-patterns.md) - Design system documentation
- [Hook Documentation](./frontend/hooks-reference.md) - Custom React hooks

### 🔧 Development Guides
- [Development Workflow](./development/workflow-guide.md) - Best practices and patterns
- [Testing Strategy](./development/testing-guide.md) - Testing approaches and tools
- [Deployment Guide](./deployment/deployment-guide.md) - Production deployment
- [Troubleshooting](./development/troubleshooting.md) - Common issues and solutions

### 📊 Business Logic
- [Credit System](./business/credit-system.md) - Credit tracking and management
- [Payment Allocation](./business/payment-allocation.md) - FIFO payment system
- [Multi-Currency Support](./business/currency-support.md) - Currency handling
- [Business Rules](./business/business-rules.md) - Core business logic

## 🗺️ Project Structure Reference

```
kreancia/
├── 📁 src/
│   ├── 📁 app/                 # Next.js App Router
│   │   ├── 📁 (auth)/         # Authentication pages
│   │   ├── 📁 api/            # API endpoints
│   │   ├── 📁 clients/        # Client management pages
│   │   ├── 📁 credits/        # Credit tracking pages
│   │   ├── 📁 dashboard/      # Dashboard interface
│   │   └── 📁 payments/       # Payment management pages
│   ├── 📁 components/         # React components
│   │   ├── 📁 auth/           # Authentication components
│   │   ├── 📁 client-profile/ # Client detail views
│   │   ├── 📁 clients/        # Client list components
│   │   ├── 📁 layout/         # Layout components
│   │   ├── 📁 providers/      # Context providers
│   │   └── 📁 ui/             # Base UI components
│   ├── 📁 hooks/              # Custom React hooks
│   ├── 📁 lib/                # Business logic and utilities
│   ├── 📁 middleware/         # Request middleware
│   ├── 📁 types/              # TypeScript definitions
│   └── 📁 utils/              # Utility functions
├── 📁 prisma/                 # Database schema and migrations
├── 📁 scripts/                # CLI tools for merchant management
├── 📁 docs/                   # Project documentation
└── 📋 Configuration files     # Package.json, configs, etc.
```

## 🔍 Key Technologies

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 15.x | Full-stack React framework |
| **Language** | TypeScript | 5.6+ | Type-safe development |
| **Database** | PostgreSQL | 16+ | Primary data store |
| **ORM** | Prisma | 5.19+ | Database access layer |
| **Authentication** | NextAuth.js | 5.0-beta | Session management |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first CSS |
| **Animation** | Framer Motion | 11.11+ | UI animations |
| **Validation** | Zod | 3.23+ | Schema validation |
| **Forms** | React Hook Form | 7.66+ | Form management |

## 📋 Development Commands Quick Reference

```bash
# 🏃‍♂️ Development
npm run dev              # Start development server
npm run build            # Production build
npm run type-check       # TypeScript validation
npm run lint             # ESLint validation

# 🗄️ Database Operations
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed development data
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database with fresh seed

# 👥 Merchant Management
npm run create-merchant  # Create new merchant account
npm run merchants:list   # List all merchants
npm run merchants:manage # Interactive merchant management
```

## 🔐 Security Features

- **🛡️ Row Level Security (RLS)**: PostgreSQL-based tenant isolation
- **🔒 bcrypt Password Hashing**: Secure password storage
- **🎫 JWT Session Management**: NextAuth.js v5 implementation
- **✅ Input Validation**: Zod schemas for all user input
- **🚫 No Public Registration**: Admin-controlled merchant creation

## 🎯 Core Features

- **👥 Multi-Tenant Architecture**: Complete data isolation per merchant
- **💰 Credit Management**: Track client credits and debts
- **💳 Payment Processing**: FIFO allocation system
- **🌍 Multi-Currency Support**: TND, EUR, USD, and more
- **📊 Dashboard Analytics**: Real-time business insights
- **📱 Responsive Design**: Mobile-first UI/UX

## 📚 Additional Resources

### 🔗 External Documentation
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://prisma.io/docs)
- [NextAuth.js v5 Documentation](https://authjs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### 🐛 Support & Issues
- **Code Issues**: Check [troubleshooting guide](./development/troubleshooting.md)
- **Development Questions**: Refer to [CLAUDE.md](../CLAUDE.md) patterns
- **Business Logic**: Review [business rules](./business/business-rules.md)

---

## 🗂️ Documentation Status

| Section | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| Architecture | ✅ Complete | 2026-04-02 | System overview and RLS implementation |
| API Reference | ✅ Complete | 2026-04-02 | Comprehensive REST API documentation |
| Components | ✅ Complete | 2026-04-02 | Component library catalog |
| Business Logic | ✅ Complete | 2026-04-02 | FIFO payment allocation system |
| Development | ✅ Complete | 2026-04-02 | Workflow and best practices |
| Database | 📝 Planned | - | Schema reference guide |
| Merchant Management | ✅ Complete | 2026-04-02 | Comprehensive CLI guide |
| Authentication | ✅ Complete | 2026-04-02 | NextAuth.js integration |

---

> 📝 **Note**: This documentation index is automatically maintained. Links marked with 📝 indicate planned documentation that will be generated based on code analysis.

> 🔄 **Last Updated**: April 2, 2026 | **Version**: 1.0.0