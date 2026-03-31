import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import type { DefaultSession, User } from "next-auth"
import type { JWT } from "next-auth/jwt"

const prisma = new PrismaClient()

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      tenantId: string
      role: string
      businessName?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    tenantId: string
    role: string
    businessName?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    tenantId: string
    role: string
    businessName?: string
  }
}

// Validation schema for sign-in
const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "merchant@example.com"
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password"
        }
      },
      async authorize(credentials) {
        const result = signInSchema.safeParse(credentials)
        if (!result.success) {
          throw new Error("Invalid credentials format")
        }

        const { email, password } = result.data

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            tenantId: true,
            businessName: true,
            createdAt: true
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword) {
          return null
        }

        // Return user object without password
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          businessName: user.businessName
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist user data to token when signing in
      if (user) {
        token.id = user.id
        token.tenantId = user.tenantId
        token.role = user.role
        token.businessName = user.businessName
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      session.user.id = token.id as string
      session.user.tenantId = token.tenantId as string
      session.user.role = token.role as string
      session.user.businessName = token.businessName as string
      return session
    }
  },
  trustHost: true,
})