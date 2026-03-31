import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@/generated/client"
import type { DefaultSession } from "next-auth"

const prisma = new PrismaClient()

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      merchantId: string
      businessName?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    merchantId: string
    businessName?: string
  }
}

// JWT type extension for our custom properties

// Validation schema for sign-in
const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
})

export const { handlers, auth, signIn, signOut } = NextAuth({
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

        const user = await prisma.merchant.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
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
          merchantId: user.id, // The user IS the merchant
          businessName: user.businessName || undefined
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
        token.merchantId = user.merchantId
        token.businessName = user.businessName
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      session.user.id = token.id as string
      session.user.merchantId = token.merchantId as string
      session.user.businessName = token.businessName as string
      return session
    }
  },
  trustHost: true,
})