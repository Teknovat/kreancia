/**
 * Navigation and Layout Types for Kreancia
 * Defines the structure for the fintech navigation system
 */

import { LucideIcon } from 'lucide-react'

/**
 * Navigation item structure
 */
export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  badge?: string | number
  children?: NavigationItem[]
  isActive?: boolean
  permissions?: string[]
}

/**
 * Navigation group structure
 */
export interface NavigationGroup {
  id: string
  label: string
  items: NavigationItem[]
  order: number
}

/**
 * Sidebar state management
 */
export interface SidebarState {
  isCollapsed: boolean
  isMobileOpen: boolean
  activeItem: string | null
}

/**
 * Layout configuration
 */
export interface LayoutConfig {
  sidebar: {
    width: {
      expanded: string
      collapsed: string
    }
    breakpoint: string
  }
  header: {
    height: string
  }
  content: {
    padding: string
  }
}

/**
 * User menu item structure
 */
export interface UserMenuItem {
  id: string
  label: string
  href?: string
  icon: LucideIcon
  action?: () => void
  variant?: 'default' | 'danger'
  separator?: boolean
}

/**
 * Breadcrumb item structure
 */
export interface BreadcrumbItem {
  id: string
  label: string
  href?: string
  isCurrentPage?: boolean
}

/**
 * Quick action structure for header
 */
export interface QuickAction {
  id: string
  label: string
  icon: LucideIcon
  href?: string
  action?: () => void
  variant?: 'primary' | 'secondary' | 'success' | 'warning'
  tooltip?: string
}

/**
 * Theme configuration
 */
export type Theme = 'light' | 'dark' | 'system'

/**
 * Navigation context type
 */
export interface NavigationContextType {
  // Sidebar state
  sidebarState: SidebarState
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarMobileOpen: (open: boolean) => void
  setActiveItem: (itemId: string | null) => void

  // Theme
  theme: Theme
  setTheme: (theme: Theme) => void

  // Navigation data
  navigationGroups: NavigationGroup[]
  breadcrumbs: BreadcrumbItem[]
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void

  // Quick actions
  quickActions: QuickAction[]
  setQuickActions: (actions: QuickAction[]) => void
}