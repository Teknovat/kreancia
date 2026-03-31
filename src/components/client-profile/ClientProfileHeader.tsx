'use client'

/**
 * Client Profile Header
 * Header component displaying client information and quick actions
 */

import { useState } from 'react'
import {
  Edit,
  Trash2,
  Phone,
  Mail,
  Building2,
  MapPin,
  CreditCard,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react'

import { formatClientStatus, calculateClientMetrics } from '@/lib/client-profile'
import { CLIENT_STATUS_COLORS } from '@/types/client'
import type { ClientProfileHeaderProps } from '@/types/client-profile'
import { cn } from '@/lib/utils'

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' }) {
  const colors = CLIENT_STATUS_COLORS[status]
  const { label, variant } = formatClientStatus(status)

  return (
    <span
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border',
        colors.bg,
        colors.text,
        colors.border
      )}
    >
      <div className={cn('w-2 h-2 rounded-full', colors.dot)} />
      {label}
    </span>
  )
}

/**
 * Quick Action Button Component
 */
function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'secondary',
  disabled = false,
  className
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  className?: string
}) {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400',
    danger: 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-400'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
      title={label}
    >
      <Icon size={16} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

/**
 * Metric Card Component
 */
function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  color = 'slate'
}: {
  label: string
  value: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  trend?: 'up' | 'down' | 'neutral'
  color?: 'slate' | 'blue' | 'green' | 'amber' | 'red'
}) {
  const colors = {
    slate: 'text-slate-600 bg-slate-50',
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    amber: 'text-amber-600 bg-amber-50',
    red: 'text-red-600 bg-red-50'
  }

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: null
  }

  const TrendIcon = trend ? trendIcons[trend] : null

  return (
    <div className="text-center">
      <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-lg', colors[color])}>
        <Icon size={16} />
        {TrendIcon && <TrendIcon size={12} />}
      </div>
      <div className="mt-2">
        <p className="text-lg font-semibold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  )
}

/**
 * Actions Dropdown Component
 */
function ActionsDropdown({
  onEdit,
  onDelete,
  onCall,
  onEmail,
  client
}: {
  onEdit?: () => void
  onDelete?: () => void
  onCall?: () => void
  onEmail?: () => void
  client: { phone?: string; email?: string }
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors duration-200"
      >
        <MoreHorizontal size={16} />
      </button>

      {isOpen && (
        <div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10"
        >
          {onEdit && (
            <button
              onClick={() => {
                onEdit()
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Edit size={14} />
              Modifier le client
            </button>
          )}

          {client.phone && onCall && (
            <button
              onClick={() => {
                onCall()
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Phone size={14} />
              Appeler
            </button>
          )}

          {client.email && onEmail && (
            <button
              onClick={() => {
                onEmail()
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Mail size={14} />
              Envoyer un email
            </button>
          )}

          {onDelete && (
            <>
              <div className="h-px bg-slate-100 my-1" />
              <button
                onClick={() => {
                  onDelete()
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Client Profile Header Component
 */
export default function ClientProfileHeader({
  client,
  onEdit,
  onDelete,
  onCall,
  onEmail,
  className
}: ClientProfileHeaderProps) {
  const metrics = calculateClientMetrics(client)

  return (
    <div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white rounded-xl border border-slate-200 overflow-hidden',
        className
      )}
    >
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Client Avatar and Basic Info */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {client.firstName.charAt(0)}{client.lastName.charAt(0)}
            </div>

            {/* Basic Info */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-900">{client.fullName}</h1>
              <div className="flex items-center gap-2">
                <StatusBadge status={client.status} />
              </div>
              <p className="text-sm text-slate-500">
                Client depuis le {client.createdAt.toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="flex-1 space-y-2">
            {client.email && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail size={14} />
                <a href={`mailto:${client.email}`} className="hover:text-primary-600">
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone size={14} />
                <a href={`tel:${client.phone}`} className="hover:text-primary-600">
                  {client.phone}
                </a>
              </div>
            )}
            {client.businessName && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Building2 size={14} />
                <span>{client.businessName}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin size={14} />
                <span className="truncate max-w-48">{client.address}</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {onEdit && (
              <QuickActionButton
                icon={Edit}
                label="Modifier"
                onClick={onEdit}
                variant="secondary"
              />
            )}

            {client.phone && onCall && (
              <QuickActionButton
                icon={Phone}
                label="Appeler"
                onClick={onCall}
                variant="secondary"
                className="hidden sm:flex"
              />
            )}

            {client.email && onEmail && (
              <QuickActionButton
                icon={Mail}
                label="Email"
                onClick={onEmail}
                variant="secondary"
                className="hidden sm:flex"
              />
            )}

            <ActionsDropdown
              onEdit={onEdit}
              onDelete={onDelete}
              onCall={onCall}
              onEmail={onEmail}
              client={client}
            />
          </div>
        </div>
      </div>

      {/* Key Metrics Bar */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Limite de crédit"
            value={client.creditLimit || '0 €'}
            icon={CreditCard}
            color="blue"
          />

          <MetricCard
            label="Solde en cours"
            value={String(client.outstandingAmount || 0)}
            icon={TrendingUp}
            color={client.outstandingAmount && client.outstandingAmount > 0 ? 'amber' : 'green'}
            trend={client.outstandingAmount && client.outstandingAmount > 0 ? 'up' : 'neutral'}
          />

          <MetricCard
            label="En retard"
            value={String(client.overdueAmount || 0)}
            icon={AlertTriangle}
            color={client.overdueAmount && client.overdueAmount > 0 ? 'red' : 'slate'}
            trend={client.overdueAmount && client.overdueAmount > 0 ? 'down' : 'neutral'}
          />

          <MetricCard
            label="Dernière activité"
            value={client.lastActivity ? `${Math.floor((Date.now() - client.lastActivity.getTime()) / (1000 * 60 * 60 * 24))}j` : 'Aucune'}
            icon={Calendar}
            color="slate"
          />
        </div>
      </div>
    </div>
  )
}