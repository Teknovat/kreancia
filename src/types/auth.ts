import type { DefaultSession } from "next-auth"

// Authentication types for the application
export interface AuthUser {
  id: string
  email: string
  name?: string | null
  merchantId: string
  businessName?: string | null
}

export interface AuthSession extends DefaultSession {
  user: AuthUser & DefaultSession["user"]
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

// Form validation errors
export interface AuthError {
  type: "CredentialsSignin" | "CallbackRouteError" | "SessionRequired" | "AccessDenied"
  message: string
}

// Route protection types
export interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}