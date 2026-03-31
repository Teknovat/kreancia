/**
 * Dashboard - Real Data Version
 * Main dashboard view with real API integration
 */

'use client'

import { useSession } from 'next-auth/react'
import {
  TrendingUp,
  Users,
  CreditCard,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react'

import MainLayout from '@/components/layout/MainLayout'
import { useDashboard } from '@/hooks/useDashboard'
import { useMerchantCurrency } from '@/hooks/useMerchantCurrency'

  const { formatAmount, isLoading: currencyLoading } = useMerchantCurrency()
import { formatCurrency, formatDate } from '@/lib/utils'

/**
 * Stat Card Component
 */
function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color = 'blue',
  loading = false
}: {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ElementType
  color?: 'blue' | 'green' | 'amber' | 'red'
  loading?: boolean
}) {
  const colors = {
    blue: 'bg-blue-500 text-blue-100',
    green: 'bg-green-500 text-green-100',
    amber: 'bg-amber-500 text-amber-100',
    red: 'bg-red-500 text-red-100'
  }

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600'
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          {loading ? (
            <div className="flex items-center gap-2 mt-1">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-lg font-bold text-slate-400">Chargement...</span>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
              <div className={`flex items-center gap-1 mt-2 ${trendColors[trend]}`}>
                {trend === 'up' ? (
                  <ArrowUpRight size={16} />
                ) : (
                  <ArrowDownRight size={16} />
                )}
                <span className="text-sm font-medium">{change}</span>
              </div>
            </>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}

/**
 * Recent Activity Component
 */
function RecentActivityCard({ activities, loading }: {
  activities: any[]
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Activité Récente</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded animate-pulse mb-1" />
                <div className="h-3 bg-slate-200 rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Activité Récente</h3>
      <div className="space-y-3">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${
                activity.type === 'CREDIT_CREATED'
                  ? 'bg-blue-100 text-blue-600'
                  : activity.type === 'PAYMENT_RECEIVED'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
              }`}>
                {activity.type === 'CREDIT_CREATED' ? (
                  <CreditCard size={16} />
                ) : activity.type === 'PAYMENT_RECEIVED' ? (
                  <CheckCircle size={16} />
                ) : (
                  <AlertTriangle size={16} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>{activity.clientName}</span>
                  {activity.amount && (
                    <>
                      <span>•</span>
                      <span className="font-medium">
                        {formatAmount(activity.amount)}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>{formatDate(activity.date, { relative: true })}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-slate-500 py-4">
            Aucune activité récente
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Quick Actions Component
 */
function QuickActionsCard() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Actions Rapides</h3>
      <div className="grid gap-3">
        <button className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group">
          <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
            <Users size={16} className="text-blue-600" />
          </div>
          <span className="font-medium text-blue-900">Ajouter un client</span>
        </button>

        <button className="flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors group">
          <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
            <CreditCard size={16} className="text-green-600" />
          </div>
          <span className="font-medium text-green-900">Créer un crédit</span>
        </button>

        <button className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors group">
          <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
            <DollarSign size={16} className="text-amber-600" />
          </div>
          <span className="font-medium text-amber-900">Enregistrer un paiement</span>
        </button>
      </div>
    </div>
  )
}

/**
 * Credit Status Overview Component
 */
function CreditStatusOverview({ stats, loading }: {
  stats: any
  loading: boolean
}) {
  if (loading || !stats) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Aperçu des Crédits</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 bg-slate-200 rounded animate-pulse w-20" />
              </div>
              <div className="h-4 bg-slate-200 rounded animate-pulse w-12" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const totalCredits = stats.openCredits + stats.paidCredits + stats.overdueCredits

  const statusData = [
    {
      label: 'Payés',
      value: stats.paidCredits,
      percentage: totalCredits > 0 ? Math.round((stats.paidCredits / totalCredits) * 100) : 0,
      color: 'bg-green-500',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    },
    {
      label: 'En cours',
      value: stats.openCredits,
      percentage: totalCredits > 0 ? Math.round((stats.openCredits / totalCredits) * 100) : 0,
      color: 'bg-blue-500',
      icon: Clock,
      iconColor: 'text-blue-600'
    },
    {
      label: 'En retard',
      value: stats.overdueCredits,
      percentage: totalCredits > 0 ? Math.round((stats.overdueCredits / totalCredits) * 100) : 0,
      color: 'bg-red-500',
      icon: AlertTriangle,
      iconColor: 'text-red-600'
    }
  ]

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Aperçu des Crédits</h3>
      <div className="space-y-4">
        {statusData.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded ${item.iconColor === 'text-green-600' ? 'bg-green-100' : item.iconColor === 'text-blue-600' ? 'bg-blue-100' : 'bg-red-100'}`}>
                <item.icon size={16} className={item.iconColor} />
              </div>
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-900">{item.value}</span>
              <span className="text-xs text-slate-500 ml-2">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total Outstanding */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">Montant en attente</span>
          <span className="text-lg font-bold text-blue-600">
            {formatAmount(stats.totalOutstandingAmount)}
          </span>
        </div>
        {stats.totalOverdueAmount > 0 && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-medium text-slate-600">Montant en retard</span>
            <span className="text-lg font-bold text-red-600">
              {formatAmount(stats.totalOverdueAmount)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Main Dashboard Component with Real Data
 */
export default function DashboardReal() {
  const { data: session, status } = useSession()
  const { stats, recentActivity, loading, error, refetch } = useDashboard()

  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="animate-spin" size={24} />
            <span>Chargement du tableau de bord...</span>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-slate-600">Vous devez être connecté pour accéder au tableau de bord.</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Tableau de Bord
            </h1>
            <p className="text-slate-600 mt-1">
              Bienvenue {session?.user?.name}, voici un aperçu de votre activité.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle size={20} />
              <span className="font-medium">Erreur de chargement des données</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Crédits"
            value={loading || currencyLoading ? "..." : formatAmount(stats?.totalCreditsAmount || 0)}
            change={loading || currencyLoading ? "..." : `+${stats?.creditsTrend || 0}%`}
            trend="up"
            icon={CreditCard}
            color="blue"
            loading={loading}
          />
          <StatCard
            title="Clients Actifs"
            value={loading || currencyLoading ? "..." : String(stats?.activeClients || 0)}
            change={loading || currencyLoading ? "..." : `+${stats?.clientsTrend || 0}%`}
            trend="up"
            icon={Users}
            color="green"
            loading={loading}
          />
          <StatCard
            title="Paiements ce mois"
            value={loading || currencyLoading ? "..." : formatAmount(stats?.amountThisMonth || 0)}
            change={loading || currencyLoading ? "..." : `+${stats?.paymentsTrend || 0}%`}
            trend="up"
            icon={DollarSign}
            color="amber"
            loading={loading}
          />
          <StatCard
            title="En Attente"
            value={loading || currencyLoading ? "..." : formatAmount(stats?.totalOutstandingAmount || 0)}
            change={loading || currencyLoading ? "..." : `${stats?.outstandingTrend || 0}%`}
            trend={stats?.outstandingTrend && stats.outstandingTrend > 0 ? "up" : "down"}
            icon={Clock}
            color="red"
            loading={loading}
          />
        </div>

        {/* Secondary Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <RecentActivityCard activities={recentActivity} loading={loading} />
          </div>

          {/* Credit Status Overview */}
          <div>
            <CreditStatusOverview stats={stats} loading={loading} />
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div>
            <QuickActionsCard />
          </div>

          {/* Additional info cards can go here */}
          <div className="lg:col-span-2">
            {/* Placeholder for charts or other components */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Tendances des Paiements
              </h3>
              <div className="text-center py-12 text-slate-500">
                <TrendingUp size={48} className="mx-auto mb-3" />
                <p>Graphiques à venir</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}