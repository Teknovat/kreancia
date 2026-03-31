/**
 * Credits Tab - Real Data Version
 * Credit management interface with real API integration
 */

'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Filter,
  Download,
  Search,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Loader2
} from 'lucide-react'

import { TabContentContainer, TabSectionHeader } from '../ClientProfileTabs'
import { useCredits } from '@/hooks/useCredits'
import { cn, formatDate } from '@/lib/utils'
import { useMerchantCurrency } from '@/hooks/useMerchantCurrency'
import type { CreditWithDetails } from '@/types/credit'
import type { ClientWithStats } from '@/types/client'

/**
 * Credit Status Badge Component
 */
function CreditStatusBadge({ status }: { status: 'OPEN' | 'PAID' | 'OVERDUE' }) {
  const variants = {
    OPEN: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      label: 'En cours'
    },
    PAID: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      dot: 'bg-green-500',
      label: 'Payé'
    },
    OVERDUE: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
      label: 'En retard'
    }
  }

  const variant = variants[status]

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border',
      variant.bg,
      variant.text,
      variant.border
    )}>
      <div className={cn('w-1.5 h-1.5 rounded-full', variant.dot)} />
      {variant.label}
    </span>
  )
}

/**
 * Credit Actions Dropdown Component
 */
function CreditActionsDropdown({
  credit,
  onView,
  onEdit,
  onDelete
}: {
  credit: CreditWithDetails
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
      >
        <MoreHorizontal size={16} className="text-slate-500" />
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute right-0 z-10 w-48 mt-1 bg-white rounded-lg shadow-lg border border-slate-200"
        >
          <div className="py-1">
            <button
              onClick={() => {
                onView?.(credit.id)
                setIsOpen(false)
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Eye size={14} />
              Voir les détails
            </button>
            <button
              onClick={() => {
                onEdit?.(credit.id)
                setIsOpen(false)
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Edit size={14} />
              Modifier
            </button>
            {credit.status !== 'PAID' && (
              <button
                onClick={() => {
                  onDelete?.(credit.id)
                  setIsOpen(false)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

/**
 * Credit Card Component
 */
function CreditCard({
  credit,
  onView,
  onEdit,
  onDelete
}: {
  credit: CreditWithDetails
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const progressPercentage = ((credit.totalAmountNumber - credit.remainingAmountNumber) / credit.totalAmountNumber) * 100

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1">{credit.label}</h3>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">{credit.client.fullName}</span>
            <span>•</span>
            <span>Créé le {formatDate(credit.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CreditStatusBadge status={credit.status} />
          <CreditActionsDropdown
            credit={credit}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>

      {/* Amount and Progress */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Montant total</span>
          <span className="font-semibold text-slate-900">
            {formatAmount(credit.totalAmountNumber)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Payé</span>
          <span className="font-semibold text-green-600">
            {formatAmount(credit.paidAmount)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Restant</span>
          <span className="font-semibold text-blue-600">
            {formatAmount(credit.remainingAmountNumber)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Due Date and Overdue Info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Calendar size={14} />
          {credit.dueDate ? (
            <span>
              Échéance: {formatDate(credit.dueDate)}
            </span>
          ) : (
            <span>Pas d'échéance</span>
          )}
        </div>
        {credit.isOverdue && credit.daysOverdue && (
          <div className="flex items-center gap-1.5 text-red-600">
            <Clock size={14} />
            <span className="font-medium">
              {credit.daysOverdue} jour{credit.daysOverdue > 1 ? 's' : ''} de retard
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/**
 * Credits Statistics Summary
 */
function CreditsSummary({ credits }: { credits: CreditWithDetails[] }) {
  const stats = useMemo(() => {
    const total = credits.length
    const open = credits.filter(c => c.status === 'OPEN').length
    const paid = credits.filter(c => c.status === 'PAID').length
    const overdue = credits.filter(c => c.status === 'OVERDUE').length
    const totalAmount = credits.reduce((sum, c) => sum + c.totalAmountNumber, 0)
    const remainingAmount = credits.reduce((sum, c) => sum + c.remainingAmountNumber, 0)
    const overdueAmount = credits
      .filter(c => c.status === 'OVERDUE')
      .reduce((sum, c) => sum + c.remainingAmountNumber, 0)

    return { total, open, paid, overdue, totalAmount, remainingAmount, overdueAmount }
  }, [credits])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-blue-100 rounded">
            <DollarSign size={16} className="text-blue-600" />
          </div>
          <span className="text-sm font-medium text-blue-900">Total Crédits</span>
        </div>
        <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
        <div className="text-xs text-blue-600">
          {formatAmount(stats.totalAmount)} total
        </div>
      </div>

      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-green-100 rounded">
            <CheckCircle size={16} className="text-green-600" />
          </div>
          <span className="text-sm font-medium text-green-900">Payés</span>
        </div>
        <div className="text-2xl font-bold text-green-900">{stats.paid}</div>
        <div className="text-xs text-green-600">
          {stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}% du total
        </div>
      </div>

      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-amber-100 rounded">
            <Clock size={16} className="text-amber-600" />
          </div>
          <span className="text-sm font-medium text-amber-900">En cours</span>
        </div>
        <div className="text-2xl font-bold text-amber-900">{stats.open}</div>
        <div className="text-xs text-amber-600">
          {formatAmount(stats.remainingAmount)} restant
        </div>
      </div>

      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-red-100 rounded">
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <span className="text-sm font-medium text-red-900">En retard</span>
        </div>
        <div className="text-2xl font-bold text-red-900">{stats.overdue}</div>
        <div className="text-xs text-red-600">
          {formatAmount(stats.overdueAmount)} en retard
        </div>
      </div>
    </div>
  )
}

/**
 * Main Credits Tab Component with Real Data
 */
interface CreditsTabRealProps {
  client: ClientWithStats
}

export default function CreditsTabReal({ client }: CreditsTabRealProps) {
  // Real data from API
  const {
    credits,
    loading,
    error,
    refetch,
    createCredit,
    updateCredit,
    deleteCredit
  } = useCredits({
    clientId: client.id,
    filters: {
      search: '',
      status: 'ALL',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 100
    }
  })

  const { formatAmount, isLoading: currencyLoading } = useMerchantCurrency()

  // Local state for filters and UI
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('dueDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Filtered and sorted credits
  const filteredCredits = useMemo(() => {
    let filtered = credits

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(credit =>
        credit.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        credit.client.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      const statusMap = {
        'open': 'OPEN',
        'paid': 'PAID',
        'overdue': 'OVERDUE'
      }
      filtered = filtered.filter(credit => credit.status === statusMap[statusFilter as keyof typeof statusMap])
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          break
        case 'amount':
          aValue = a.totalAmountNumber
          bValue = b.totalAmountNumber
          break
        case 'remaining':
          aValue = a.remainingAmountNumber
          bValue = b.remainingAmountNumber
          break
        case 'created':
        default:
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
      }

      if (sortOrder === 'desc') {
        return bValue - aValue
      }
      return aValue - bValue
    })

    return filtered
  }, [credits, searchQuery, statusFilter, sortBy, sortOrder])

  // Event handlers
  const handleCreateCredit = async (creditData: any) => {
    try {
      await createCredit({
        ...creditData,
        clientId: client.id
      })
      setShowCreateForm(false)
    } catch (error) {
      console.error('Failed to create credit:', error)
      // Could add toast notification here
    }
  }

  const handleEditCredit = async (creditId: string) => {
    // Implementation for edit modal
    console.log('Edit credit:', creditId)
  }

  const handleDeleteCredit = async (creditId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce crédit ?')) {
      try {
        await deleteCredit(creditId)
      } catch (error) {
        console.error('Failed to delete credit:', error)
        // Could add toast notification here
      }
    }
  }

  const handleViewCredit = (creditId: string) => {
    // Implementation for view modal
    console.log('View credit:', creditId)
  }

  // Loading state
  if (loading) {
    return (
      <TabContentContainer>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="animate-spin" size={20} />
            <span>Chargement des crédits...</span>
          </div>
        </div>
      </TabContentContainer>
    )
  }

  // Error state
  if (error) {
    return (
      <TabContentContainer>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <AlertTriangle size={48} className="mx-auto mb-3" />
            <p className="text-lg font-semibold">Erreur de chargement</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </TabContentContainer>
    )
  }

  return (
    <TabContentContainer>
      {/* Header with actions */}
      <TabSectionHeader
        title="Gestion des Crédits"
        subtitle={`${credits.length} crédit${credits.length > 1 ? 's' : ''} au total`}
      />

      {/* Statistics Summary */}
      <CreditsSummary credits={credits} />

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par libellé ou client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="open">En cours</option>
            <option value="paid">Payé</option>
            <option value="overdue">En retard</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              setSortBy(field)
              setSortOrder(order as 'asc' | 'desc')
            }}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="dueDate-asc">Échéance (Plus proche)</option>
            <option value="dueDate-desc">Échéance (Plus lointaine)</option>
            <option value="created-desc">Date création (Plus récent)</option>
            <option value="created-asc">Date création (Plus ancien)</option>
            <option value="amount-desc">Montant (Plus élevé)</option>
            <option value="amount-asc">Montant (Plus faible)</option>
            <option value="remaining-desc">Restant (Plus élevé)</option>
            <option value="remaining-asc">Restant (Plus faible)</option>
          </select>

          <button
            onClick={() => refetch()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Actualiser"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Nouveau crédit
          </button>
        </div>
      </div>

      {/* Credits Grid */}
      {filteredCredits.length > 0 ? (
        <div className="grid gap-4">
          {filteredCredits.map((credit) => (
            <CreditCard
              key={credit.id}
              credit={credit}
              onView={handleViewCredit}
              onEdit={handleEditCredit}
              onDelete={handleDeleteCredit}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <DollarSign size={48} className="mx-auto mb-3 text-slate-400" />
          <p className="text-slate-600 mb-2">
            {searchQuery || statusFilter !== 'all'
              ? 'Aucun crédit ne correspond à vos critères'
              : 'Aucun crédit enregistré'
            }
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Créer le premier crédit
            </button>
          )}
        </div>
      )}

      {/* Create Credit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Nouveau crédit</h3>
            {/* Simple form for now */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Libellé</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Facture #2024-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Montant (TND)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date d'échéance (optionnel)</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    // Handle form submission here
                    setShowCreateForm(false)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TabContentContainer>
  )
}