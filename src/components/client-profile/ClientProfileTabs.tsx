'use client'

/**
 * Client Profile Tabs
 * Animated tab navigation component for client profile sections
 */

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  CreditCard,
  DollarSign,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

import type { ClientProfileTabsProps, ClientProfileTab } from '@/types/client-profile'
import { cn } from '@/lib/utils'

/**
 * Tab Icons Mapping
 */
const TAB_ICONS = {
  overview: BarChart3,
  credits: CreditCard,
  payments: DollarSign,
  activity: Activity,
  settings: Settings
} as const

/**
 * Tab Badge Component
 */
function TabBadge({ badge }: { badge?: number | string }) {
  if (!badge) return null

  return (
    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-primary-600 rounded-full">
      {typeof badge === 'number' && badge > 99 ? '99+' : badge}
    </span>
  )
}

/**
 * Tab Item Component
 */
function TabItem({
  tab,
  isActive,
  onClick,
  badge
}: {
  tab: { id: ClientProfileTab; label: string; description?: string }
  isActive: boolean
  onClick: () => void
  badge?: number | string
}) {
  const Icon = TAB_ICONS[tab.id]

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2',
        'whitespace-nowrap',
        isActive
          ? 'text-primary-600'
          : 'text-slate-600 hover:text-slate-900'
      )}
      title={tab.description}
    >
      {/* Icon */}
      <Icon size={16} className="flex-shrink-0" />

      {/* Label */}
      <span>{tab.label}</span>

      {/* Badge */}
      <TabBadge badge={badge} />

      {/* Active Indicator */}
      {isActive && (
        <motion.div
          layoutId="clientTabIndicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-purple-500 rounded-t-full"
          transition={{
            type: "spring",
            bounce: 0.2,
            duration: 0.6
          }}
        />
      )}
    </button>
  )
}

/**
 * Scroll Button Component
 */
function ScrollButton({
  direction,
  onClick,
  disabled
}: {
  direction: 'left' | 'right'
  onClick: () => void
  disabled: boolean
}) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full',
        'bg-white border border-slate-200 text-slate-600',
        'hover:bg-slate-50 hover:border-slate-300 transition-colors duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-primary-400'
      )}
    >
      <Icon size={16} />
    </button>
  )
}

/**
 * Client Profile Tabs Component
 */
export default function ClientProfileTabs({
  activeTab,
  onTabChange,
  tabs,
  className
}: ClientProfileTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to active tab on change
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const activeButton = container.querySelector(`button[data-tab="${activeTab}"]`) as HTMLElement
    if (activeButton) {
      const containerRect = container.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()

      if (buttonRect.left < containerRect.left || buttonRect.right > containerRect.right) {
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        })
      }
    }
  }, [activeTab])

  // Scroll functions
  const scrollLeft = () => {
    const container = scrollContainerRef.current
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    const container = scrollContainerRef.current
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }

  // Check if scrolling is needed and available
  const [canScrollLeft, setCanScrollLeft] = useRef(false)
  const [canScrollRight, setCanScrollRight] = useRef(false)

  const updateScrollButtons = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setCanScrollLeft.current = container.scrollLeft > 0
    setCanScrollRight.current = container.scrollLeft < (container.scrollWidth - container.clientWidth)
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    updateScrollButtons()
    container.addEventListener('scroll', updateScrollButtons)
    window.addEventListener('resize', updateScrollButtons)

    return () => {
      container.removeEventListener('scroll', updateScrollButtons)
      window.removeEventListener('resize', updateScrollButtons)
    }
  }, [])

  return (
    <div className={cn('border-b border-slate-200', className)}>
      <div className="flex items-center gap-2 px-1">
        {/* Left Scroll Button (Mobile) */}
        <div className="lg:hidden">
          <ScrollButton
            direction="left"
            onClick={scrollLeft}
            disabled={!canScrollLeft.current}
          />
        </div>

        {/* Tabs Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <div key={tab.id} data-tab={tab.id}>
                <TabItem
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onClick={() => onTabChange(tab.id)}
                  badge={tab.badge}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Scroll Button (Mobile) */}
        <div className="lg:hidden">
          <ScrollButton
            direction="right"
            onClick={scrollRight}
            disabled={!canScrollRight.current}
          />
        </div>
      </div>

      {/* Tab Descriptions (Desktop Only) */}
      <div className="hidden lg:block px-4 pb-2">
        {tabs.map((tab) => (
          activeTab === tab.id && tab.description && (
            <motion.p
              key={tab.id}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-slate-500"
            >
              {tab.description}
            </motion.p>
          )
        ))}
      </div>
    </div>
  )
}

/**
 * Tab Content Container
 * Wrapper for consistent tab content styling
 */
export function TabContentContainer({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('py-6', className)}>
      {children}
    </div>
  )
}

/**
 * Tab Section Header
 * Consistent header styling for tab sections
 */
export function TabSectionHeader({
  title,
  description,
  action,
  className
}: {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between mb-6', className)}>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="text-sm text-slate-600 mt-1">{description}</p>
        )}
      </div>
      {action && (
        <div>{action}</div>
      )}
    </div>
  )
}