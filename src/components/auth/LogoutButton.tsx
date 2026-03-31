"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { useState } from "react"

interface LogoutButtonProps {
  className?: string
  variant?: "button" | "link"
  showIcon?: boolean
}

export default function LogoutButton({
  className = "",
  variant = "button",
  showIcon = true
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await signOut({
        callbackUrl: "/login",
        redirect: true
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const baseClasses = variant === "button"
    ? "btn btn-secondary"
    : "text-gray-700 hover:text-gray-900 transition-colors"

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`${baseClasses} ${className} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
          Signing out...
        </div>
      ) : (
        <div className="flex items-center">
          {showIcon && <LogOut className="h-4 w-4 mr-2" />}
          Sign out
        </div>
      )}
    </button>
  )
}