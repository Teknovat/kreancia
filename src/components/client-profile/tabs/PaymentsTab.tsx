"use client";

/**
 * Payments Tab
 * Payment history and trend visualization for client management
 */

import { useState, useMemo } from "react";
import {
  Plus,
  Download,
  Search,
  DollarSign,
  Calendar,
  TrendingUp,
  CreditCard,
  Receipt,
  Clock,
  BarChart3,
  Eye,
  MoreHorizontal,
} from "lucide-react";

import { motion } from "framer-motion";
import { TabContentContainer, TabSectionHeader } from "../ClientProfileTabs";
import { generatePaymentTrendData } from "@/lib/client-profile";
import type { PaymentsTabProps, PaymentWithDetails } from "@/types/client-profile";
import { cn } from "@/lib/utils";

/**
 * Payment Method Badge Component
 */
function PaymentMethodBadge({ method }: { method: string }) {
  const methodColors = {
    Virement: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
    Chèque: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
    Espèces: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    Carte: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  };

  const colors = methodColors[method as keyof typeof methodColors] || methodColors["Virement"];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
        colors.bg,
        colors.text,
        colors.border,
      )}
    >
      {method}
    </span>
  );
}

/**
 * Payment Actions Dropdown Component
 */
function PaymentActionsDropdown({
  payment,
  onView,
  onAllocate,
}: {
  payment: PaymentWithDetails;
  onView?: (id: string) => void;
  onAllocate?: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
      >
        <MoreHorizontal size={16} className="text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
          {onView && (
            <button
              onClick={() => {
                onView(payment.id);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Eye size={14} />
              Voir les détails
            </button>
          )}
          {onAllocate && (
            <button
              onClick={() => {
                onAllocate(payment.id);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <CreditCard size={14} />
              Réallouer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Payment Card Component for Mobile View
 */
function PaymentCard({
  payment,
  onView,
  onAllocate,
}: {
  payment: PaymentWithDetails;
  onView?: (id: string) => void;
  onAllocate?: (id: string) => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <PaymentMethodBadge method={payment.method} />
            {payment.reference && <span className="text-xs text-slate-500">#{payment.reference}</span>}
          </div>
          <p className="text-lg font-semibold text-green-600">{payment.amount}</p>
        </div>
        <PaymentActionsDropdown payment={payment} onView={onView} onAllocate={onAllocate} />
      </div>

      {/* Allocation Info */}
      {payment.paymentAllocations && payment.paymentAllocations.length > 0 && (
        <div className="mb-3 p-2 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-600 mb-2">Affecté à :</p>
          <div className="space-y-1">
            {payment.paymentAllocations.slice(0, 2).map((allocation, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-slate-700">Crédit #{allocation.credit?.id || "N/A"}</span>
                <span className="font-medium">{allocation.amount}</span>
              </div>
            ))}
            {payment.paymentAllocations.length > 2 && (
              <p className="text-xs text-slate-500">
                +{payment.paymentAllocations.length - 2} autre{payment.paymentAllocations.length > 3 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          {payment.paymentDate.toLocaleDateString("fr-FR")}
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} />
          Enregistré le {payment.createdAt.toLocaleDateString("fr-FR")}
        </div>
      </div>
    </div>
  );
}

/**
 * Payment Trend Chart Component (Simplified)
 */
function PaymentTrendChart({ data }: { data: any[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-600">Pas assez de données pour afficher les tendances</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <BarChart3 size={16} />
        Tendances des Paiements
      </h3>

      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.month} className="flex items-center gap-4">
            <div className="w-16 text-xs text-slate-600">{item.month}</div>
            <div className="flex-1 bg-slate-200 rounded-full h-2 relative">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" />
            </div>
            <div className="w-20 text-right">
              <p className="text-sm font-medium text-slate-900">{item.amount}</p>
              <p className="text-xs text-slate-500">
                {item.count} paiement{item.count > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Payments Filter Component
 */
function PaymentsFilter({
  searchQuery,
  onSearchChange,
  methodFilter,
  onMethodFilterChange,
  dateRange,
  onDateRangeChange,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  methodFilter: string;
  onMethodFilterChange: (method: string) => void;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
}) {
  const methodOptions = [
    { value: "all", label: "Toutes les méthodes" },
    { value: "Virement", label: "Virement" },
    { value: "Chèque", label: "Chèque" },
    { value: "Espèces", label: "Espèces" },
    { value: "Carte", label: "Carte" },
  ];

  const dateOptions = [
    { value: "all", label: "Toute la période" },
    { value: "month", label: "Ce mois" },
    { value: "quarter", label: "Ce trimestre" },
    { value: "year", label: "Cette année" },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par référence..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          />
        </div>

        {/* Method Filter */}
        <select
          value={methodFilter}
          onChange={(e) => onMethodFilterChange(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
        >
          {methodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Date Range */}
        <select
          value={dateRange}
          onChange={(e) => onDateRangeChange(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
        >
          {dateOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * Payments Tab Component
 */
export default function PaymentsTab({
  client,
  payments: initialPayments,
  onRecordPayment,
  onRefresh: _onRefresh,
}: PaymentsTabProps) {
  // Transform real client payment data to PaymentWithDetails format
  const transformedPayments: PaymentWithDetails[] =
    (client as any).payments?.map((payment: any) => ({
      id: payment.id,
      amount: Number(payment.amount),
      paymentDate: new Date(payment.paymentDate),
      method: payment.method,
      reference: payment.reference,
      createdAt: new Date(payment.createdAt),
      paymentAllocations:
        payment.paymentAllocations?.map((allocation: any) => ({
          id: allocation.id,
          amount: Number(allocation.allocatedAmount),
          credit: {
            id: allocation.credit?.id,
            totalAmount: Number(allocation.credit?.totalAmount || 0),
            description: allocation.credit?.description || "Crédit sans description",
          },
        })) || [],
    })) || [];

  const payments = initialPayments || transformedPayments;

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  // Filter payments
  const filteredPayments = useMemo(() => {
    let filtered = payments;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (payment) =>
          payment.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.id.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply method filter
    if (methodFilter !== "all") {
      filtered = filtered.filter((payment) => payment.method === methodFilter);
    }

    // Apply date filter
    if (dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRange) {
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter((payment) => payment.paymentDate >= filterDate);
    }

    return filtered.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [payments, searchQuery, methodFilter, dateRange]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const thisMonth = payments
      .filter((p) => {
        const paymentMonth = p.paymentDate.getMonth();
        const currentMonth = new Date().getMonth();
        return paymentMonth === currentMonth;
      })
      .reduce((sum, p) => sum + p.amount, 0);
    const avgPayment = totalPayments > 0 ? totalAmount / totalPayments : 0;

    return { totalPayments, totalAmount, thisMonth, avgPayment };
  }, [payments]);

  // Generate trend data
  const trendData = generatePaymentTrendData(payments);

  return (
    <TabContentContainer>
      {/* Header with Actions */}
      <TabSectionHeader
        title="Historique des Paiements"
        description={`${stats.totalPayments} paiement${stats.totalPayments > 1 ? "s" : ""} · ${stats.totalAmount} total reçu`}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => {
                // TODO: Export payments
                console.log("Export payments for", client.id);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <Download size={16} />
              Exporter
            </button>
            <button
              onClick={onRecordPayment || (() => console.log("Record payment for", client.id))}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus size={16} />
              Nouveau Paiement
            </button>
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Total Reçu</p>
              <p className="text-lg font-bold text-green-900">{stats.totalAmount}</p>
            </div>
            <DollarSign className="text-green-500" size={24} />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Ce Mois</p>
              <p className="text-lg font-bold text-blue-900">{stats.thisMonth}</p>
            </div>
            <TrendingUp className="text-blue-500" size={24} />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Nb Paiements</p>
              <p className="text-2xl font-bold text-purple-900">{stats.totalPayments}</p>
            </div>
            <Receipt className="text-purple-500" size={24} />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600">Moyenne</p>
              <p className="text-lg font-bold text-amber-900">{stats.avgPayment}</p>
            </div>
            <BarChart3 className="text-amber-500" size={24} />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payments List */}
        <div className="lg:col-span-2">
          {/* Filters */}
          <PaymentsFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            methodFilter={methodFilter}
            onMethodFilterChange={setMethodFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          {/* Payments List */}
          {filteredPayments.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Paiement</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Méthode</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">Montant</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Affectation</th>
                      <th className="w-12 py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment, index) => (
                      <motion.tr
                        key={payment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-semibold text-slate-900">Paiement #{payment.id}</p>
                            {payment.reference && <p className="text-sm text-slate-500">Réf: {payment.reference}</p>}
                            <p className="text-xs text-slate-400 mt-1">
                              Enregistré le {payment.createdAt.toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <PaymentMethodBadge method={payment.method} />
                        </td>

                        <td className="py-4 px-4 text-right">
                          <p className="font-semibold text-green-600">{payment.amount}</p>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {payment.paymentDate.toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {payment.paymentAllocations && payment.paymentAllocations.length > 0 ? (
                            <div className="space-y-1">
                              {payment.paymentAllocations.slice(0, 2).map((allocation, idx) => (
                                <div key={idx} className="text-xs text-slate-600">
                                  Crédit #{allocation.credit?.id}: {allocation.amount}
                                </div>
                              ))}
                              {payment.paymentAllocations.length > 2 && (
                                <div className="text-xs text-slate-500">
                                  +{payment.paymentAllocations.length - 2} autre
                                  {payment.paymentAllocations.length > 3 ? "s" : ""}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Non affecté</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <PaymentActionsDropdown
                            payment={payment}
                            onView={(id) => console.log("View payment", id)}
                            onAllocate={(id) => console.log("Allocate payment", id)}
                          />
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4">
                {filteredPayments.map((payment) => (
                  <PaymentCard
                    key={payment.id}
                    payment={payment}
                    onView={(id) => console.log("View payment", id)}
                    onAllocate={(id) => console.log("Allocate payment", id)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Receipt size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun paiement trouvé</h3>
              <p className="text-slate-600 mb-6">
                {searchQuery || methodFilter !== "all" || dateRange !== "all"
                  ? "Aucun paiement ne correspond à vos critères."
                  : `Aucun paiement n&apos;a encore été enregistré pour ${client.fullName}.`}
              </p>
              <button
                onClick={onRecordPayment || (() => console.log("Record first payment"))}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus size={16} />
                Premier Paiement
              </button>
            </div>
          )}
        </div>

        {/* Sidebar with Charts */}
        <div className="space-y-6">
          <PaymentTrendChart data={trendData} />

          {/* Payment Methods Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Répartition par Méthode</h3>
            <div className="space-y-3">
              {["Virement", "Chèque", "Espèces", "Carte"].map((method) => {
                const count = payments.filter((p) => p.method === method).length;
                const percentage = payments.length > 0 ? (count / payments.length) * 100 : 0;

                return (
                  <div key={method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PaymentMethodBadge method={method} />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">{count}</p>
                      <p className="text-xs text-slate-500">{percentage.toFixed(0)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </TabContentContainer>
  );
}
