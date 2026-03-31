'use client'

/**
 * Search and Filters Component for Client List
 * Provides search, filtering, and sorting controls
 */

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  X,
  Users,
  AlertTriangle,
  Calendar,
  DollarSign
} from 'lucide-react'

import type { ClientFilters } from '@/types/client'
import { DEFAULT_CLIENT_FILTERS } from '@/types/client'
import { cn } from '@/lib/utils'

interface SearchFiltersProps {
  filters: ClientFilters
  onFiltersChange: (filters: ClientFilters) => void
  totalCount?: number
  className?: string
}

/**
 * Filter Badge Component
 */
function FilterBadge({
  label,
  onRemove,
  variant = 'default'
}: {
  label: string
  onRemove: () => void
  variant?: 'default' | 'warning'
}) {
  const variants = {
    default: 'bg-primary-100 text-primary-800 border-primary-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200'
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border',
        variants[variant]
      )}
    >
      {label}
      <button
        onClick={onRemove}
        className="ml-1 hover:opacity-70 transition-opacity"
      >
        <X size={12} />
      </button>
    </motion.span>
  )
}

/**
 * Sort Button Component
 */
function SortButton({
  children,
  active,
  direction,
  onClick
}: {
  children: React.ReactNode
  active: boolean
  direction: 'asc' | 'desc'
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        active
          ? 'bg-primary-100 text-primary-700 border border-primary-200'
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
      )}
    >
      {children}
      {active && (
        direction === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
      )}
    </button>
  )
}

/**
 * Main Search Filters Component
 */
export default function SearchFilters({
  filters,
  onFiltersChange,
  totalCount,
  className
}: SearchFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [localSearch, setLocalSearch] = useState(filters.search)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFiltersChange({
          ...filters,
          search: localSearch,
          page: 1 // Reset to first page when searching
        })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch, filters, onFiltersChange])

  // Active filters for display
  const activeFilters = useMemo(() => {
    const active = []

    if (filters.status !== 'ALL') {
      active.push({
        key: 'status',
        label: `Status: ${filters.status}`,
        variant: 'default' as const
      })
    }

    if (filters.hasOverdue) {
      active.push({
        key: 'hasOverdue',
        label: 'Has Overdue',
        variant: 'warning' as const
      })
    }

    return active
  }, [filters])

  const handleFilterChange = (key: keyof ClientFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1 // Reset to first page when filtering
    })
  }

  const handleSortChange = (sortBy: ClientFilters['sortBy']) => {
    const newDirection = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    onFiltersChange({
      ...filters,
      sortBy,
      sortOrder: newDirection
    })
  }

  const clearAllFilters = () => {
    setLocalSearch('')
    onFiltersChange(DEFAULT_CLIENT_FILTERS)
  }

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">Clients</h2>
            {totalCount !== undefined && (
              <span className="text-sm text-slate-500">({totalCount})</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
              isFilterOpen
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            <Filter size={16} />
            Filters
            {activeFilters.length > 0 && (
              <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
          </button>

          {activeFilters.length > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search clients by name or email..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
        />
        {localSearch && (
          <button
            onClick={() => setLocalSearch('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Active Filters */}
      <AnimatePresence>
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-wrap gap-2 mb-4"
          >
            {activeFilters.map((filter) => (
              <FilterBadge
                key={filter.key}
                label={filter.label}
                variant={filter.variant}
                onRemove={() => {
                  if (filter.key === 'status') {
                    handleFilterChange('status', 'ALL')
                  } else if (filter.key === 'hasOverdue') {
                    handleFilterChange('hasOverdue', false)
                  }
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-200 pt-4 space-y-4"
          >
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {(['ALL', 'ACTIVE', 'INACTIVE', 'SUSPENDED'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleFilterChange('status', status)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200',
                      filters.status === status
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    )}
                  >
                    {status === 'ALL' ? 'All Status' : status.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Filters */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Additional</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleFilterChange('hasOverdue', !filters.hasOverdue)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200',
                    filters.hasOverdue
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  )}
                >
                  <AlertTriangle size={14} />
                  Has Overdue
                </button>
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
              <div className="flex flex-wrap gap-2">
                <SortButton
                  active={filters.sortBy === 'name'}
                  direction={filters.sortOrder}
                  onClick={() => handleSortChange('name')}
                >
                  <Users size={14} />
                  Name
                </SortButton>
                <SortButton
                  active={filters.sortBy === 'createdAt'}
                  direction={filters.sortOrder}
                  onClick={() => handleSortChange('createdAt')}
                >
                  <Calendar size={14} />
                  Created
                </SortButton>
                <SortButton
                  active={filters.sortBy === 'creditLimit'}
                  direction={filters.sortOrder}
                  onClick={() => handleSortChange('creditLimit')}
                >
                  <DollarSign size={14} />
                  Credit Limit
                </SortButton>
                <SortButton
                  active={filters.sortBy === 'outstandingAmount'}
                  direction={filters.sortOrder}
                  onClick={() => handleSortChange('outstandingAmount')}
                >
                  <DollarSign size={14} />
                  Outstanding
                </SortButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}