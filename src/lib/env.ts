import { z } from 'zod'

// Simple environment variables - only validate what's needed
export const env = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || '',
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  POSTGRES_DB: process.env.POSTGRES_DB,
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
  POSTGRES_PORT: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : undefined,
}

// Validation schemas for runtime checks
const dbSchema = z.string().url('DATABASE_URL must be a valid URL')
const authSchema = z.object({
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
})

// Validate database URL when needed
export function validateDatabaseUrl() {
  try {
    dbSchema.parse(env.DATABASE_URL)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`❌ Invalid DATABASE_URL: ${error.errors[0]?.message}`)
    }
    throw error
  }
}

// Validate NextAuth variables when needed
export function validateAuthEnv() {
  try {
    return authSchema.parse({
      NEXTAUTH_SECRET: env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: env.NEXTAUTH_URL,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      throw new Error(`❌ Missing NextAuth environment variables:\n${missingVars}`)
    }
    throw error
  }
}

export default env