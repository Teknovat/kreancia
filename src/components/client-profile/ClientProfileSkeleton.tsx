/**
 * Client Profile Skeleton
 * Loading skeleton for client profile page
 */

import { cn } from '@/lib/utils'

/**
 * Skeleton Base Component
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-slate-200',
        className
      )}
      {...props}
    />
  )
}

/**
 * Client Profile Header Skeleton
 */
function ProfileHeaderSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Avatar and basic info */}
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Status and metrics */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-18" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-14" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  )
}

/**
 * Tab Navigation Skeleton
 */
function TabNavigationSkeleton() {
  return (
    <div className="border-b border-slate-200">
      <div className="flex gap-8 px-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="py-4">
            <Skeleton className="h-5 w-16 mb-2" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Tab Content Skeleton
 */
function TabContentSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <Skeleton className="h-5 w-24 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <Skeleton className="h-5 w-28 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Main Client Profile Skeleton
 */
export default function ClientProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <ProfileHeaderSkeleton />
      <TabNavigationSkeleton />
      <TabContentSkeleton />
    </div>
  )
}

/**
 * Compact Skeleton for smaller loading states
 */
export function CompactClientProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg border p-4">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}