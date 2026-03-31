import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentication | Kreancia",
  description: "Sign in to your Kreancia credit management dashboard"
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}