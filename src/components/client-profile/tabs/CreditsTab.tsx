"use client";

/**
 * Credits Tab
 * Credit management interface with list, filtering, and actions
 */

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  CreditCard as CreditCardIcon,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

import { motion } from "framer-motion";
import { TabContentContainer, TabSectionHeader } from "../ClientProfileTabs";
import type { CreditsTabProps, CreditWithDetails } from "@/types/client-profile";
import { cn } from "@/lib/utils";

/**
 * Credit Status Badge Component
 */
function CreditStatusBadge({ status }: { status: "OPEN" | "PAID" | "OVERDUE" }) {
  const variants = {
    OPEN: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-200",
      dot: "bg-blue-500",
      label: "En cours",
    },
    PAID: {
      bg: "bg-green-100",
      text: "text-green-700",
      border: "border-green-200",
      dot: "bg-green-500",
      label: "Payé",
    },
    OVERDUE: {
      bg: "bg-red-100",
      text: "text-red-700",
      border: "border-red-200",
      dot: "bg-red-500",
      label: "En retard",
    },
  };

  const variant = variants[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border",
        variant.bg,
        variant.text,
        variant.border,
      )}
    >
      <div className={cn("w-1.5 h-1.5 rounded-full", variant.dot)} />
      {variant.label}
    </span>
  );
}

/**
 * Credit Actions Dropdown Component
 */
function CreditActionsDropdown({
  credit,
  onView,
  onEdit,
  onDelete,
}: {
  credit: CreditWithDetails;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
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
                onView(credit.id);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Eye size={14} />
              Voir les détails
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => {
                onEdit(credit.id);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Edit size={14} />
              Modifier
            </button>
          )}
          {onDelete && (
            <>
              <div className="h-px bg-slate-100 my-1" />
              <button
                onClick={() => {
                  onDelete(credit.id);
                  setIsOpen(false);
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
  );
}

/**
 * Credit Card Component for Mobile View
 */
function _CreditCard({
  credit,
  onView,
  onEdit,
  onDelete,
}: {
  credit: CreditWithDetails;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const isOverdue = credit.status === "OVERDUE";
  const daysOverdue = isOverdue ? Math.floor((Date.now() - credit.dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditStatusBadge status={credit.status} />
            {isOverdue && (
              <span className="text-xs text-red-600 font-medium">
                {daysOverdue} jour{daysOverdue > 1 ? "s" : ""} de retard
              </span>
            )}
          </div>
          {credit.description && <p className="text-sm text-slate-600">{credit.description}</p>}
        </div>
        <CreditActionsDropdown credit={credit} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-slate-500">Montant Total</p>
          <p className="font-semibold text-slate-900">{credit.totalAmount}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Reste à Payer</p>
          <p className={cn("font-semibold", credit.remainingAmount > 0 ? "text-amber-600" : "text-green-600")}>
            {credit.remainingAmount}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          Échéance : {credit.dueDate.toLocaleDateString("fr-FR")}
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} />
          Créé le {credit.createdAt.toLocaleDateString("fr-FR")}
        </div>
      </div>
    </div>
  );
}

/**
 * Credits Filter Component
 */
function CreditsFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
}) {
  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "OPEN", label: "En cours" },
    { value: "OVERDUE", label: "En retard" },
    { value: "PAID", label: "Payés" },
  ];

  const sortOptions = [
    { value: "dueDate", label: "Date d'échéance" },
    { value: "createdAt", label: "Date de création" },
    { value: "totalAmount", label: "Montant total" },
    { value: "remainingAmount", label: "Montant restant" },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un crédit..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              Trier par {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * Credits Tab Component
 */
export default function CreditsTab({
  client,
  credits: initialCredits,
  onCreateCredit,
  onEditCredit,
  onRefresh: _onRefresh,
}: CreditsTabProps) {
  const credits = initialCredits;

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");

  // Filter and sort credits
  const filteredCredits = useMemo(() => {
    if (!credits) return [];

    let filtered = credits;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (credit) =>
          credit.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          credit.id.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((credit) => credit.status === statusFilter);
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "createdAt":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "totalAmount":
          return b.totalAmount - a.totalAmount;
        case "remainingAmount":
          return b.remainingAmount - a.remainingAmount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [credits, searchQuery, statusFilter, sortBy]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!credits) {
      return {
        totalCredits: 0,
        openCredits: 0,
        overdueCredits: 0,
        totalAmount: 0,
        totalRemaining: 0,
      };
    }

    const totalCredits = credits.length;
    const openCredits = credits.filter((c) => c.status === "OPEN").length;
    const overdueCredits = credits.filter((c) => c.status === "OVERDUE").length;
    const totalAmount = credits.reduce((sum, c) => sum + c.totalAmount, 0);
    const totalRemaining = credits.reduce((sum, c) => sum + c.remainingAmount, 0);

    return {
      totalCredits,
      openCredits,
      overdueCredits,
      totalAmount,
      totalRemaining,
    };
  }, [credits]);

  return (
    <TabContentContainer>
      {/* Header with Actions */}
      <TabSectionHeader
        title="Gestion des Crédits"
        description={`${stats.totalCredits} crédit${stats.totalCredits > 1 ? "s" : ""} · ${stats.totalRemaining} restant à payer`}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => {
                // TODO: Export credits
                console.log("Export credits for", client.id);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <Download size={16} />
              Exporter
            </button>
            <button
              onClick={onCreateCredit || (() => console.log("Create credit for", client.id))}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus size={16} />
              Nouveau Crédit
            </button>
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Crédits Actifs</p>
              <p className="text-2xl font-bold text-blue-900">{stats.openCredits}</p>
            </div>
            <CreditCardIcon className="text-blue-500" size={24} />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">En Retard</p>
              <p className="text-2xl font-bold text-red-900">{stats.overdueCredits}</p>
            </div>
            <AlertTriangle className="text-red-500" size={24} />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600">Montant Total</p>
              <p className="text-lg font-bold text-amber-900">{stats.totalAmount}</p>
            </div>
            <DollarSign className="text-amber-500" size={24} />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Restant</p>
              <p className="text-lg font-bold text-green-900">{stats.totalRemaining}</p>
            </div>
            <Clock className="text-green-500" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <CreditsFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      {/* Credits List */}
      {filteredCredits.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Crédit</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Statut</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Montant Total</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Reste à Payer</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Échéance</th>
                  <th className="w-12 py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredCredits.map((credit, index) => {
                  const isOverdue = credit.status === "OVERDUE";
                  const daysOverdue = isOverdue
                    ? Math.floor((Date.now() - credit.dueDate.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;

                  return (
                    <motion.tr
                      key={credit.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-slate-900">Crédit #{credit.id}</p>
                          {credit.description && <p className="text-sm text-slate-500">{credit.description}</p>}
                          <p className="text-xs text-slate-400 mt-1">
                            Créé le {credit.createdAt.toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <CreditStatusBadge status={credit.status} />
                        {isOverdue && (
                          <div className="text-xs text-red-600 mt-1">
                            {daysOverdue} jour{daysOverdue > 1 ? "s" : ""} de retard
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <p className="font-semibold text-slate-900">{credit.totalAmount}</p>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <p
                          className={cn(
                            "font-semibold",
                            credit.remainingAmount > 0 ? "text-amber-600" : "text-green-600",
                          )}
                        >
                          {credit.remainingAmount}
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          <span className="text-sm text-slate-600">{credit.dueDate.toLocaleDateString("fr-FR")}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <CreditActionsDropdown
                          credit={credit}
                          onView={(id) => console.log("View credit", id)}
                          onEdit={onEditCredit}
                          onDelete={(id) => console.log("Delete credit", id)}
                        />
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {filteredCredits.map((credit) => (
              <_CreditCard
                key={credit.id}
                credit={credit}
                onView={(id) => console.log("View credit", id)}
                onEdit={onEditCredit}
                onDelete={(id) => console.log("Delete credit", id)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <CreditCardIcon size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun crédit trouvé</h3>
          <p className="text-slate-600 mb-6">
            {searchQuery || statusFilter !== "all"
              ? "Aucun crédit ne correspond à vos critères de recherche."
              : `Aucun crédit n'a encore été accordé à ${client.fullName}.`}
          </p>
          <button
            onClick={onCreateCredit || (() => console.log("Create first credit"))}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus size={16} />
            {searchQuery || statusFilter !== "all" ? "Nouveau Crédit" : "Premier Crédit"}
          </button>
        </div>
      )}
    </TabContentContainer>
  );
}
