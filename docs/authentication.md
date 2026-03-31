# Authentication System - NextAuth.js v5

This document describes the authentication system implemented using NextAuth.js v5 with credentials provider.

## Overview

The authentication system provides:
- **Email/password authentication** with secure credential validation
- **JWT-based sessions** for stateless authentication
- **Multi-tenant support** with tenantId, role, and businessName in sessions
- **Route protection** via middleware
- **Distinctive fintech UI** following the established design system

## Features

### 🔐 Authentication Provider
- **Credentials Provider**: Email and password authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Validation**: Zod schema validation for login credentials
- **Multi-tenant**: Sessions include tenantId for tenant isolation

### 🛡️ Security Features
- **JWT Sessions**: Stateless authentication with custom callbacks
- **Route Protection**: Middleware-based route protection
- **Secure Redirects**: Callback URL handling for post-login redirects
- **Environment Variables**: Secure configuration via environment variables

### 🎨 User Interface
- **Distinctive Design**: Custom fintech-focused login page
- **Responsive Layout**: Mobile-first responsive design
- **Loading States**: Elegant loading indicators during authentication
- **Error Handling**: User-friendly error messages
- **Demo Credentials**: Built-in demo credentials display

## Configuration

### Environment Variables
```bash
# Required for NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Database connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/kreancia_dev"
```

### Session Structure
```typescript
interface AuthSession {
  user: {
    id: string
    email: string
    name?: string
    tenantId: string
    role: "ADMIN" | "MERCHANT" | "EMPLOYEE"
    businessName?: string
  }
}
```

## File Structure

```
src/
├── lib/
│   └── auth.ts              # NextAuth configuration
├── middleware.ts            # Route protection middleware
├── app/
│   ├── api/auth/
│   │   └── [...nextauth]/
│   │       └── route.ts     # NextAuth API routes
│   ├── (auth)/
│   │   ├── layout.tsx       # Auth layout
│   │   └── login/
│   │       └── page.tsx     # Login page
│   └── dashboard/
│       └── page.tsx         # Protected dashboard
├── components/
│   ├── auth/
│   │   ├── LogoutButton.tsx # Logout component
│   │   └── SessionChecker.tsx # Session validation
│   └── providers/
│       └── SessionProvider.tsx # Session context
└── types/
    └── auth.ts              # Auth TypeScript types
```

## Usage

### Protecting Routes
Routes are automatically protected by middleware. Public routes are defined in `middleware.ts`:

```typescript
const publicRoutes = ["/login", "/api/auth", "/favicon.ico", "/_next"]
```

### Using Session Data
```typescript
import { auth } from "@/lib/auth"

export default async function Page() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return <div>Welcome {session.user.name}</div>
}
```

### Client-side Session
```typescript
"use client"
import { useSession } from "next-auth/react"

export default function Component() {
  const { data: session, status } = useSession()

  if (status === "loading") return <p>Loading...</p>
  if (!session) return <p>Not signed in</p>

  return <p>Signed in as {session.user.email}</p>
}
```

## Demo Credentials

For testing purposes, the following demo credentials are available:

- **Email**: demo@merchant.com
- **Password**: merchant123

These credentials are created automatically when running the database seed script.

## Database Schema

The authentication system uses the existing User model from the Prisma schema:

```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  password        String   // Hashed with bcryptjs
  name            String?
  role            UserRole @default(MERCHANT)
  businessName    String?
  tenantId        String
  // ... other fields
}
```

## Security Considerations

1. **Password Hashing**: All passwords are hashed using bcryptjs with a cost factor of 10
2. **JWT Secrets**: Ensure NEXTAUTH_SECRET is a strong, random value in production
3. **HTTPS**: Always use HTTPS in production environments
4. **Environment Variables**: Never commit sensitive environment variables to version control

## Next Steps

The authentication system is now ready for:
- Integration with the multi-tenant architecture
- Role-based access control implementation
- User management features
- Password reset functionality
- OAuth provider integration (if needed)