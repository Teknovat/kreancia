'use client'

/**
 * Client Profile Content
 * Main orchestrator component for client profile page with tabbed interface
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import ClientProfileHeader from './ClientProfileHeader'
import ClientProfileTabs from './ClientProfileTabs'
import OverviewTab from './tabs/OverviewTab'
import CreditsTabReal from './tabs/CreditsTabReal'
import PaymentsTab from './tabs/PaymentsTab'
import ActivityTab from './tabs/ActivityTab'
import SettingsTab from './tabs/SettingsTab'

import { getTabConfiguration, isValidTab, getDefaultTab } from '@/lib/client-profile'
import type { ClientProfileContentProps, ClientProfileTab } from '@/types/client-profile'
import { cn } from '@/lib/utils'

/**
 * Client Profile Content Component
 */
export default function ClientProfileContent({
  client,
  activeTab: initialTab
}: ClientProfileContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Tab state management
  const [activeTab, setActiveTab] = useState<ClientProfileTab>(
    isValidTab(initialTab) ? (initialTab as ClientProfileTab) : getDefaultTab()
  )

  // Get tab configuration with dynamic badges
  const tabs = getTabConfiguration(client)

  // Handle tab change with URL synchronization
  const handleTabChange = (tab: ClientProfileTab) => {
    setActiveTab(tab)

    // Update URL with new tab parameter
    const params = new URLSearchParams(searchParams)
    params.set('tab', tab)
    router.replace(`/clients/${client.id}?${params.toString()}`, { scroll: false })

    // Store user preference in localStorage
    try {
      localStorage.setItem('client-profile-last-tab', tab)
    } catch {
      // Ignore localStorage errors (e.g., in private mode)
    }
  }

  // Sync state with URL changes (browser back/forward)
  useEffect(() => {
    const urlTab = searchParams.get('tab')
    if (urlTab && isValidTab(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab as ClientProfileTab)
    }
  }, [searchParams, activeTab])

  // Load user preference on mount
  useEffect(() => {
    try {
      const savedTab = localStorage.getItem('client-profile-last-tab')
      if (savedTab && isValidTab(savedTab) && !searchParams.get('tab')) {
        setActiveTab(savedTab as ClientProfileTab)
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [searchParams])

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab client={client} />
      case 'credits':
        return <CreditsTabReal client={client} />
      case 'payments':
        return <PaymentsTab client={client} />
      case 'activity':
        return <ActivityTab client={client} />
      case 'settings':
        return <SettingsTab client={client} />
      default:
        return <OverviewTab client={client} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Client Profile Header */}
      <ClientProfileHeader
        client={client}
        onEdit={() => {
          // TODO: Implement edit modal
          console.log('Edit client:', client.id)
        }}
        onDelete={() => {
          // TODO: Implement delete confirmation
          console.log('Delete client:', client.id)
        }}
        onCall={() => {
          if (client.phone) {
            window.open(`tel:${client.phone}`, '_self')
          }
        }}
        onEmail={() => {
          if (client.email) {
            window.open(`mailto:${client.email}`, '_self')
          }
        }}
      />

      {/* Tab Navigation */}
      <ClientProfileTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={tabs}
      />

      {/* Tab Content */}
      <div className="min-h-[400px]">
        <div className="w-full">
          {renderTabContent()}
        </div>
      </div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-slate-50 rounded-lg border text-xs text-slate-600">
          <strong>Debug Info:</strong><br />
          Client ID: {client.id}<br />
          Active Tab: {activeTab}<br />
          Credits: {client.creditCount}<br />
          Payments: {client.paymentCount}<br />
          Outstanding: {client.outstandingAmount}<br />
          Status: {client.status}
        </div>
      )}
    </div>
  )
}

/**
 * Tab Content Wrapper
 * Provides consistent spacing and animation for tab content
 */
export function TabContentWrapper({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {children}
    </div>
  )
}