"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface SessionCheckerProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function SessionChecker({
  children,
  requireAuth = false,
  redirectTo = "/login"
}: SessionCheckerProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (requireAuth && !session) {
      router.push(redirectTo)
      return
    }

    if (!requireAuth && session) {
      router.push("/dashboard")
      return
    }
  }, [session, status, requireAuth, redirectTo, router])

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

  // If we need auth but don't have it, or vice versa, don't render children
  if (requireAuth && !session) return null
  if (!requireAuth && session) return null

  return <>{children}</>
}