/**
 * Navigation Configuration for Kreancia
 * Defines the navigation structure and menu items
 */

import {
  LayoutDashboard,
  Users,
  CreditCard,
  Banknote,
  Settings,
  FileText,
  Bell,
  User,
  LogOut,
  HelpCircle,
  BarChart3,
  Wallet,
  Receipt,
  UserCheck,
  AlertTriangle
} from 'lucide-react'

import type {
  NavigationGroup,
  UserMenuItem,
  QuickAction,
  LayoutConfig
} from '@/types/navigation'

/**
 * Main navigation groups for the sidebar
 */
export const navigationGroups: NavigationGroup[] = [
  {
    id: 'dashboard',
    label: 'Overview',
    order: 1,
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        id: 'analytics',
        label: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        badge: 'Soon'
      }
    ]
  },
  {
    id: 'customers',
    label: 'Customer Management',
    order: 2,
    items: [
      {
        id: 'clients',
        label: 'Clients',
        href: '/clients',
        icon: Users,
      },
      {
        id: 'client-new',
        label: 'Add Client',
        href: '/clients/new',
        icon: UserCheck,
      }
    ]
  },
  {
    id: 'credit-management',
    label: 'Credit & Payments',
    order: 3,
    items: [
      {
        id: 'credits',
        label: 'Credits',
        href: '/credits',
        icon: CreditCard,
      },
      {
        id: 'payments',
        label: 'Payments',
        href: '/payments',
        icon: Banknote,
      },
      {
        id: 'overdue',
        label: 'Overdue',
        href: '/credits/overdue',
        icon: AlertTriangle,
        badge: '3' // This would be dynamic based on actual overdue credits
      }
    ]
  },
  {
    id: 'financial',
    label: 'Financial',
    order: 4,
    items: [
      {
        id: 'transactions',
        label: 'Transactions',
        href: '/transactions',
        icon: Receipt,
      },
      {
        id: 'wallet',
        label: 'Wallet',
        href: '/wallet',
        icon: Wallet,
      },
      {
        id: 'reports',
        label: 'Reports',
        href: '/reports',
        icon: FileText,
      }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    order: 5,
    items: [
      {
        id: 'account-settings',
        label: 'Account',
        href: '/settings/account',
        icon: User,
      },
      {
        id: 'business-settings',
        label: 'Business',
        href: '/settings/business',
        icon: Settings,
      },
      {
        id: 'notifications',
        label: 'Notifications',
        href: '/settings/notifications',
        icon: Bell,
      }
    ]
  }
]

/**
 * User menu items for the header dropdown
 */
export const userMenuItems: UserMenuItem[] = [
  {
    id: 'profile',
    label: 'Profile Settings',
    href: '/settings/profile',
    icon: User,
  },
  {
    id: 'account',
    label: 'Account Settings',
    href: '/settings/account',
    icon: Settings,
  },
  {
    id: 'help',
    label: 'Help & Support',
    href: '/help',
    icon: HelpCircle,
  },
  {
    id: 'separator-1',
    label: '',
    icon: User, // Not used for separators
    separator: true,
  },
  {
    id: 'logout',
    label: 'Sign Out',
    icon: LogOut,
    variant: 'danger',
    action: () => {
      // This will be handled by the component
    }
  }
]

/**
 * Quick actions for the header
 */
export const quickActions: QuickAction[] = [
  {
    id: 'new-client',
    label: 'New Client',
    icon: UserCheck,
    href: '/clients/new',
    variant: 'primary',
    tooltip: 'Add a new client'
  },
  {
    id: 'new-credit',
    label: 'New Credit',
    icon: CreditCard,
    href: '/credits/new',
    variant: 'secondary',
    tooltip: 'Create a new credit'
  },
  {
    id: 'record-payment',
    label: 'Record Payment',
    icon: Banknote,
    href: '/payments/new',
    variant: 'success',
    tooltip: 'Record a new payment'
  }
]

/**
 * Layout configuration constants
 */
export const layoutConfig: LayoutConfig = {
  sidebar: {
    width: {
      expanded: '280px',
      collapsed: '80px'
    },
    breakpoint: '1024px' // lg breakpoint
  },
  header: {
    height: '80px'
  },
  content: {
    padding: '24px'
  }
}

/**
 * Navigation utilities
 */
export class NavigationUtils {
  /**
   * Find a navigation item by ID across all groups
   */
  static findItemById(id: string): any {
    for (const group of navigationGroups) {
      for (const item of group.items) {
        if (item.id === id) {
          return item
        }
        // Check children if they exist
        if (item.children) {
          const child = item.children.find(child => child.id === id)
          if (child) return child
        }
      }
    }
    return null
  }

  /**
   * Get active navigation item based on current path
   */
  static getActiveItem(pathname: string): string | null {
    // Direct path matches
    for (const group of navigationGroups) {
      for (const item of group.items) {
        if (item.href === pathname) {
          return item.id
        }
        // Check if pathname starts with item href (for sub-pages)
        if (pathname.startsWith(item.href) && item.href !== '/') {
          return item.id
        }
      }
    }

    // Fallback to dashboard for root path
    if (pathname === '/' || pathname === '') {
      return 'dashboard'
    }

    return null
  }

  /**
   * Generate breadcrumbs for a given path
   */
  static generateBreadcrumbs(pathname: string) {
    const breadcrumbs = [
      { id: 'dashboard', label: 'Dashboard', href: '/dashboard' }
    ]

    // Add specific breadcrumbs based on path
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length > 1) {
      // Find the matching navigation item
      const activeItem = this.getActiveItem(pathname)
      const item = activeItem ? this.findItemById(activeItem) : null

      if (item && item.href !== '/dashboard') {
        breadcrumbs.push({
          id: item.id,
          label: item.label,
          href: item.href
        })
      }
    }

    return breadcrumbs
  }
}