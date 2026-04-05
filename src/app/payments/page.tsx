/**
 * Payments Page Redesigned - Swiss Functional
 * Real payment management interface with full functionality
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Plus, Search, RefreshCw, AlertTriangle, Calendar, CreditCard, Eye, Target } from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import { usePayments } from "@/hooks/usePayments";
import { useMerchantCurrency } from "@/hooks/useMerchantCurrency";
import { formatDate } from "@/lib/utils";
import type { PaymentWithDetails } from "@/types/payment";

/**
 * Payment method labels
 */
const PAYMENT_METHOD_LABELS = {
  CASH: "Espèces",
  BANK_TRANSFER: "Virement",
  CHECK: "Chèque",
  CARD: "Carte",
  MOBILE_PAYMENT: "Mobile",
  OTHER: "Autre",
};

/**
 * Payment Table Component - Clean, scannable data presentation
 */
interface PaymentTableProps {
  payments: PaymentWithDetails[];
  loading: boolean;
  formatAmount: (amount: number) => string;
  onView: (payment: PaymentWithDetails) => void;
}

function PaymentTable({ payments, loading, formatAmount, onView }: PaymentTableProps) {
  if (loading) {
    return (
      <div className="border-2 border-gray-200 bg-white">
        <div className="border-b-2 border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Liste des Paiements</h2>
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

  if (payments.length === 0) {
    return (
      <div className="border-2 border-gray-200 bg-white">
        <div className="border-b-2 border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Liste des Paiements</h2>
        </div>
        <div className="p-8 text-center">
          <DollarSign size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun paiement trouvé</h3>
          <p className="text-gray-600 mb-6">Commencez par enregistrer votre premier paiement.</p>
          <button
            onClick={() => (window.location.href = "/payments/new")}
            className="px-6 py-3 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all font-medium inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Enregistrer un Paiement
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
            Liste des Paiements ({payments.length})
          </h2>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {payments.map((payment) => (
          <div key={payment.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="space-y-4">
              {/* Payment Header */}
              <div className="flex items-center justify-between">
                {/* Payment Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center font-bold text-sm">
                      {payment.client?.firstName?.charAt(0) || "P"}
                      {payment.client?.lastName?.charAt(0) || ""}
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-gray-900">
                        Paiement #{payment.id.substring(0, 8)} -{" "}
                        {payment.client ? `${payment.client.firstName} ${payment.client.lastName}` : "Client inconnu"}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatDate(payment.paymentDate)}</span>
                        <span>{PAYMENT_METHOD_LABELS[payment.method] || payment.method}</span>
                        {payment.reference && <span>Réf: {payment.reference}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Metrics */}
                <div className="flex items-center space-x-8">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Montant</p>
                    <p className="font-bold text-lg text-gray-900">{formatAmount(payment.amount || 0)}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Alloué</p>
                    <p
                      className={`font-bold text-lg ${payment.isFullyAllocated ? "text-green-600" : "text-orange-600"}`}
                    >
                      {formatAmount(payment.totalAllocated || 0)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Statut</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-bold uppercase tracking-wide ${
                        payment.isFullyAllocated ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {payment.isFullyAllocated ? "Alloué" : "Partiel"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onView(payment)}
                      className="px-4 py-2 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all font-medium text-sm"
                    >
                      <Eye size={16} className="mr-1 inline" />
                      Voir
                    </button>
                  </div>
                </div>
              </div>

              {/* Credit Allocations */}
              {payment.allocations && payment.allocations.length > 0 && (
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={14} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Appliqué aux crédits ({payment.allocations.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {payment.allocations.map((allocation) => (
                      <div
                        key={allocation.id}
                        className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">{allocation.credit.label}</span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded font-medium ${
                              allocation.credit.status === "PAID"
                                ? "bg-green-100 text-green-700"
                                : allocation.credit.status === "OVERDUE"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {allocation.credit.status === "PAID"
                              ? "Payé"
                              : allocation.credit.status === "OVERDUE"
                                ? "Retard"
                                : "En cours"}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">{formatAmount(allocation.amount || 0)}</div>
                      </div>
                    ))}
                    {!payment.isFullyAllocated && (
                      <div className="flex items-center justify-between bg-orange-50 px-3 py-2 rounded border border-orange-200">
                        <span className="text-sm font-medium text-orange-700">Non alloué</span>
                        <div className="text-sm font-medium text-orange-700">
                          {formatAmount((payment.amount || 0) - (payment.totalAllocated || 0))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Main Payments Page Component
 */
export default function PaymentsPage() {
  const router = useRouter();
  const {
    payments,
    totalCount: _totalCount,
    stats,
    loading,
    error,
    refetch,
    filters: _filters,
    setFilters,
  } = usePayments();

  const { formatAmount, isLoading: currencyLoading } = useMerchantCurrency();
  const [searchQuery, setSearchQuery] = useState("");

  const handleNewPayment = () => {
    router.push("/payments/new");
  };

  const handleViewPayment = (payment: PaymentWithDetails) => {
    router.push(`/payments/${payment.id}`);
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
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">Paiements</h1>
                <p className="text-lg text-gray-600 mt-2">Gestion des paiements client</p>
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
                  onClick={handleNewPayment}
                  className="px-6 py-3 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all font-medium flex items-center gap-2"
                >
                  <Plus size={20} />
                  Nouveau Paiement
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher des paiements..."
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
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Paiements</p>
                    <p className="text-2xl font-black text-gray-900">{loading ? "..." : stats.totalPayments}</p>
                  </div>
                  <DollarSign size={32} className="text-gray-400" />
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Montant Total</p>
                    <p className="text-2xl font-black text-blue-900">
                      {loading || currencyLoading ? "..." : formatAmount(stats.totalAmount)}
                    </p>
                  </div>
                  <CreditCard size={32} className="text-blue-400" />
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 uppercase tracking-wide">Non Alloués</p>
                    <p className="text-2xl font-black text-green-900">{loading ? "..." : stats.unallocatedPayments}</p>
                  </div>
                  <Target size={32} className="text-green-400" />
                </div>
              </div>

              <div className="bg-orange-50 border-2 border-orange-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 uppercase tracking-wide">Montant Moyen</p>
                    <p className="text-2xl font-black text-orange-900">
                      {loading || currencyLoading ? "..." : formatAmount(stats.averagePaymentAmount)}
                    </p>
                  </div>
                  <Calendar size={32} className="text-orange-400" />
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

          {/* Payments Table */}
          <PaymentTable payments={payments} loading={loading} formatAmount={formatAmount} onView={handleViewPayment} />
        </div>
      </div>
    </MainLayout>
  );
}
