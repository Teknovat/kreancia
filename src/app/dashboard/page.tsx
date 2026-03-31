import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import LogoutButton from "@/components/auth/LogoutButton"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-soft p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to your Dashboard
            </h1>
            <LogoutButton />
          </div>

          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-primary-900 mb-4">
              Authentication Successful!
            </h2>
            <div className="space-y-2 text-sm text-primary-800">
              <p><strong>User ID:</strong> {session.user.id}</p>
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>Name:</strong> {session.user.name}</p>
              <p><strong>Role:</strong> {session.user.role}</p>
              <p><strong>Tenant ID:</strong> {session.user.tenantId}</p>
              {session.user.businessName && (
                <p><strong>Business:</strong> {session.user.businessName}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-gray-600">
              Your NextAuth.js v5 authentication is working correctly!
              You can now access protected routes and build your application features.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}