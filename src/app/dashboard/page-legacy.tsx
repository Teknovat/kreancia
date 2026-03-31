/**
 * Dashboard Redesigned - Swiss Functional Design
 * Clean, efficient, brutally functional interface for credit management
 */

"use client";

import { useSession } from "next-auth/react";
import {
  TrendingUp,
  Users,
  CreditCard,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight
} from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import { useDashboard } from "@/hooks/useDashboard";
import { formatDate } from "@/lib/utils";
import { useMerchantCurrency } from "@/hooks/useMerchantCurrency";

/**
 * Clean Metric Card - Zero fluff, maximum information density
 */
interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  variant?: 'default' | 'warning' | 'success';
  loading?: boolean;
}

function MetricCard({ label, value, change, icon: Icon, variant = 'default', loading }: MetricCardProps) {
  const variantStyles = {
    default: 'border-gray-200 bg-white',
    warning: 'border-orange-200 bg-orange-50',
    success: 'border-green-200 bg-green-50'
  };

  const iconStyles = {
    default: 'text-gray-600',
    warning: 'text-orange-600',
    success: 'text-green-600'
  };

  return (
    <div className={`border-2 ${variantStyles[variant]} p-6 h-full`}>
      <div className="flex items-start justify-between mb-4">
        <Icon size={24} className={iconStyles[variant]} />
        {loading && <RefreshCw size={16} className="animate-spin text-gray-400" />}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold text-gray-900 leading-none">
          {loading ? "..." : value}
        </p>
        {change && (
          <p className="text-sm text-gray-500">{change}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Data Table - Clean, scannable, functional
 */
interface DataTableProps {
  title: string;
  data: Array<{
    id: string;
    label: string;
    amount: number;
    date: Date;
    status?: string;
  }>;
  loading: boolean;
  formatAmount: (amount: number) => string;
}

function DataTable({ title, data, loading, formatAmount }: DataTableProps) {
  if (loading) {
    return (
      <div className="border-2 border-gray-200 bg-white">
        <div className="border-b-2 border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">{title}</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-200 bg-white">
      <div className="border-b-2 border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">{title}</h2>
      </div>

      <div className="divide-y-2 divide-gray-100">
        {data.slice(0, 5).map((item) => (
          <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatAmount(item.amount)}</p>
                {item.status && (
                  <span className={`text-xs uppercase tracking-wide font-medium ${
                    item.status === 'OVERDUE' ? 'text-red-600' :
                    item.status === 'PAID' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {item.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.length > 5 && (
        <div className="border-t-2 border-gray-200 p-4 bg-gray-50">
          <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Voir tout ({data.length} éléments) →
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Quick Actions - Essential functions prominently displayed
 */
function QuickActions() {
  const actions = [
    { label: "Nouveau Client", href: "/clients/new", icon: Users },
    { label: "Nouveau Crédit", href: "/credits/new", icon: CreditCard },
    { label: "Nouveau Paiement", href: "/payments/new", icon: DollarSign }
  ];

  return (
    <div className="border-2 border-gray-900 bg-gray-900 text-white">
      <div className="border-b-2 border-gray-700 p-6">
        <h2 className="text-lg font-bold uppercase tracking-wide">Actions</h2>
      </div>

      <div className="p-6 space-y-4">
        {actions.map((action) => (
          <a
            key={action.label}
            href={action.href}
            className="block p-4 border-2 border-gray-700 hover:border-white hover:bg-gray-800 transition-all group"
          >
            <div className="flex items-center space-x-3">
              <action.icon size={20} className="text-gray-300 group-hover:text-white transition-colors" />
              <span className="font-medium">{action.label}</span>
              <ArrowUpRight size={16} className="ml-auto text-gray-500 group-hover:text-white transition-colors" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * Main Dashboard Component
 */
export default function DashboardRedesigned() {
  const { data: session, status } = useSession();
  const { stats, recentActivity, loading, error, refetch } = useDashboard();
  const { formatAmount, isLoading: currencyLoading } = useMerchantCurrency();

  if (status === "loading" || !session) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <RefreshCw size={48} className="animate-spin text-gray-400 mx-auto" />
            <p className="text-lg font-medium text-gray-600">Chargement...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const metrics = [
    {
      label: "Crédits Total",
      value: loading || currencyLoading ? "..." : formatAmount(stats?.totalCreditsAmount || 0),
      change: `${stats?.totalCredits || 0} crédits actifs`,
      icon: CreditCard,
      variant: 'default' as const
    },
    {
      label: "Encours",
      value: loading || currencyLoading ? "..." : formatAmount(stats?.totalOutstandingAmount || 0),
      change: `${stats?.openCredits || 0} crédits en cours`,
      icon: TrendingUp,
      variant: 'default' as const
    },
    {
      label: "En Retard",
      value: loading || currencyLoading ? "..." : formatAmount(stats?.totalOverdueAmount || 0),
      change: `${stats?.overdueCredits || 0} crédits en retard`,
      icon: AlertTriangle,
      variant: 'warning' as const
    },
    {
      label: "Ce Mois",
      value: loading || currencyLoading ? "..." : formatAmount(stats?.amountThisMonth || 0),
      change: `${stats?.paymentsThisMonth || 0} paiements reçus`,
      icon: DollarSign,
      variant: 'success' as const
    }
  ];

  const recentCredits = recentActivity
    ?.filter(activity => activity.type === 'CREDIT_CREATED')
    ?.map(activity => ({
      id: activity.id,
      label: activity.description,
      amount: activity.amount || 0,
      date: activity.date,
      status: 'OPEN'
    })) || [];

  const recentPayments = recentActivity
    ?.filter(activity => activity.type === 'PAYMENT_RECEIVED')
    ?.map(activity => ({
      id: activity.id,
      label: activity.description,
      amount: activity.amount || 0,
      date: activity.date,
      status: 'PAID'
    })) || [];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b-2 border-gray-900">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
                  Tableau de Bord
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  {formatDate(new Date(), {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <button
                onClick={refetch}
                className="p-3 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
                title="Actualiser"
              >
                <RefreshCw size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {error && (
            <div className="border-2 border-red-200 bg-red-50 p-6 mb-8">
              <div className="flex items-center space-x-3">
                <AlertTriangle size={24} className="text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Erreur de chargement</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {metrics.map((metric, index) => (
              <MetricCard
                key={index}
                {...metric}
                loading={loading || currencyLoading}
              />
            ))}
          </div>

          {/* Data Tables and Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DataTable
              title="Crédits Récents"
              data={recentCredits}
              loading={loading}
              formatAmount={formatAmount}
            />

            <DataTable
              title="Paiements Récents"
              data={recentPayments}
              loading={loading}
              formatAmount={formatAmount}
            />

            <QuickActions />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}