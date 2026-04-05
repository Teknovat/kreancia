/**
 * Credits Page Redesigned - Swiss Functional
 * Real credit management interface with full functionality
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Plus, Search, RefreshCw, AlertTriangle, Clock, DollarSign, Eye } from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import { useCredits } from "@/hooks/useCredits";
import { useMerchantCurrency } from "@/hooks/useMerchantCurrency";
import { formatDate } from "@/lib/utils";
import type { CreditWithDetails } from "@/types/credit";

/**
 * Credit Table Component - Clean, scannable data presentation
 */
interface CreditTableProps {
  credits: CreditWithDetails[];
  loading: boolean;
  formatAmount: (amount: number) => string;
  onView: (credit: CreditWithDetails) => void;
}

function CreditTable({ credits, loading, formatAmount, onView }: CreditTableProps) {
  if (loading) {
    return (
      <div className="border-2 border-gray-200 bg-white">
        <div className="border-b-2 border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Liste des Crédits</h2>
        </div>
        <div className="space-y-4 p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-b-0">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="h-3 bg-gray-100 rounded w-32"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (credits.length === 0) {
    return (
      <div className="border-2 border-gray-200 bg-white">
        <div className="border-b-2 border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Liste des Crédits</h2>
        </div>
        <div className="p-8 text-center">
          <CreditCard size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun crédit trouvé</h3>
          <p className="text-gray-600 mb-6">Commencez par créer votre premier crédit client.</p>
          <button
            onClick={() => (window.location.href = "/credits/new")}
            className="px-6 py-3 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all font-medium inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Créer un Crédit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-200 bg-white">
      <div className="border-b-2 border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            Liste des Crédits ({credits.length})
          </h2>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {credits.map((credit) => (
          <div key={credit.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              {/* Credit Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center font-bold text-sm">
                    {credit.client.firstName.charAt(0)}
                    {credit.client.lastName.charAt(0)}
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900">{credit.label}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        {credit.client.firstName} {credit.client.lastName}
                      </span>
                      {credit.dueDate && <span>Échéance: {formatDate(credit.dueDate)}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Credit Metrics */}
              <div className="flex items-center space-x-8">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total</p>
                  <p className="font-bold text-lg text-gray-900">{formatAmount(credit.totalAmount || 0)}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Restant</p>
                  <p className="font-bold text-lg text-gray-900">{formatAmount(credit.remainingAmount || 0)}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Statut</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-bold uppercase tracking-wide ${
                      credit.status === "OPEN"
                        ? "bg-blue-100 text-blue-800"
                        : credit.status === "PAID"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {credit.status === "OPEN" ? "Ouvert" : credit.status === "PAID" ? "Payé" : "En retard"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onView(credit)}
                    className="px-4 py-2 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all font-medium text-sm"
                  >
                    <Eye size={16} className="mr-1 inline" />
                    Voir
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Main Credits Page Component
 */
export default function CreditsPage() {
  const router = useRouter();
  const {
    credits,
    totalCount: _totalCount,
    stats,
    loading,
    error,
    refetch,
    filters: _filters,
    setFilters,
  } = useCredits();

  const { formatAmount, isLoading: currencyLoading } = useMerchantCurrency();
  const [searchQuery, setSearchQuery] = useState("");

  const handleNewCredit = () => {
    router.push("/credits/new");
  };

  const handleViewCredit = (credit: CreditWithDetails) => {
    router.push(`/credits/${credit.id}`);
  };

  const handleRefresh = () => {
    refetch();
  };

  // Update search filter
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b-2 border-gray-900">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">Crédits</h1>
                <p className="text-lg text-gray-600 mt-2">Gestion des crédits client</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-3 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all disabled:opacity-50"
                >
                  <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
                </button>
                <button
                  onClick={handleNewCredit}
                  className="px-6 py-3 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all font-medium flex items-center gap-2"
                >
                  <Plus size={20} />
                  Nouveau Crédit
                </button>
              </div>
            </div>

            {/* Search and Stats */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher des crédits..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 border-2 border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Crédits</p>
                    <p className="text-2xl font-black text-gray-900">{loading ? "..." : stats.totalCredits}</p>
                  </div>
                  <CreditCard size={32} className="text-gray-400" />
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Ouverts</p>
                    <p className="text-2xl font-black text-blue-900">{loading ? "..." : stats.openCredits}</p>
                  </div>
                  <Clock size={32} className="text-blue-400" />
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 uppercase tracking-wide">Montant Total</p>
                    <p className="text-2xl font-black text-green-900">
                      {loading || currencyLoading ? "..." : formatAmount(stats.totalOutstanding)}
                    </p>
                  </div>
                  <DollarSign size={32} className="text-green-400" />
                </div>
              </div>

              <div className="bg-red-50 border-2 border-red-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600 uppercase tracking-wide">En retard</p>
                    <p className="text-2xl font-black text-red-900">{loading ? "..." : stats.overdueCredits}</p>
                  </div>
                  <AlertTriangle size={32} className="text-red-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Error Message */}
          {error && (
            <div className="border-2 border-red-500 bg-red-50 mb-8 p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle size={24} className="text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Erreur de chargement</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Credits Table */}
          <CreditTable credits={credits} loading={loading} formatAmount={formatAmount} onView={handleViewCredit} />
        </div>
      </div>
    </MainLayout>
  );
}
