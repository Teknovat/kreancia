"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  User,
  DollarSign,
  Calendar,
  CreditCard,
  AlertTriangle,
  Search,
  Loader2,
  Zap,
  SlidersHorizontal,
  FileText,
  AlertCircle,
} from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";

interface FormData {
  clientId: string;
  amount: string;
  paymentDate: string;
  method: string;
  reference: string;
  note: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  email: string;
}

interface OpenCredit {
  id: string;
  label: string;
  totalAmount: number;
  remainingAmount: number;
  dueDate: string | null;
  status: "OPEN" | "OVERDUE";
}

type AllocationMode = "FIFO" | "MANUAL";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Espèces" },
  { value: "BANK_TRANSFER", label: "Virement bancaire" },
  { value: "CHECK", label: "Chèque" },
  { value: "CARD", label: "Carte bancaire" },
  { value: "MOBILE_PAYMENT", label: "Paiement mobile" },
  { value: "OTHER", label: "Autre" },
];

function fmt(n: number) {
  return n.toLocaleString("fr-TN", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

export default function NewPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Credit allocation state
  const [allocationMode, setAllocationMode] = useState<AllocationMode>("FIFO");
  const [openCredits, setOpenCredits] = useState<OpenCredit[]>([]);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [selectedAllocations, setSelectedAllocations] = useState<Record<string, string>>({});

  const preselectedClientId = searchParams?.get("clientId") || "";
  const isClientLocked = !!preselectedClientId;

  const [formData, setFormData] = useState<FormData>({
    clientId: preselectedClientId,
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    method: "BANK_TRANSFER",
    reference: "",
    note: "",
  });

  // Debounced client search
  useEffect(() => {
    const fetchClients = async (searchQuery: string = "") => {
      setIsLoadingClients(true);
      try {
        const url = searchQuery
          ? `/api/clients?search=${encodeURIComponent(searchQuery)}`
          : "/api/clients?limit=50";
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setClients(data.data?.clients || []);
        }
      } catch {
        // ignore
      } finally {
        setIsLoadingClients(false);
      }
    };

    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    const timer = setTimeout(() => fetchClients(clientSearch), 300);
    setSearchDebounceTimer(timer);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientSearch]);

  useEffect(() => {
    setIsLoadingClients(true);
    fetch("/api/clients?limit=50")
      .then((r) => r.json())
      .then((data) => setClients(data.data?.clients || []))
      .catch(() => {})
      .finally(() => setIsLoadingClients(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    };
  }, [searchDebounceTimer]);

  // Load open/overdue credits when client is selected
  useEffect(() => {
    if (!formData.clientId) {
      setOpenCredits([]);
      setSelectedAllocations({});
      return;
    }
    setIsLoadingCredits(true);
    fetch(`/api/credits?clientId=${formData.clientId}&status=ALL&limit=100&sortBy=createdAt&sortOrder=asc`)
      .then((r) => r.json())
      .then((data) => {
        const credits: OpenCredit[] = (data.data || []).filter(
          (c: OpenCredit) => c.status === "OPEN" || c.status === "OVERDUE"
        );
        setOpenCredits(credits);
        setSelectedAllocations({});
      })
      .catch(() => {})
      .finally(() => setIsLoadingCredits(false));
  }, [formData.clientId]);

  const selectedClient = clients.find((c) => c.id === formData.clientId);
  const paymentAmount = parseFloat(formData.amount) || 0;
  const totalAllocated = Object.entries(selectedAllocations).reduce(
    (sum, [, v]) => sum + (parseFloat(v) || 0),
    0
  );
  const remaining = paymentAmount - totalAllocated;

  const toggleCredit = useCallback(
    (credit: OpenCredit) => {
      setSelectedAllocations((prev) => {
        if (prev[credit.id] !== undefined) {
          const next = { ...prev };
          delete next[credit.id];
          return next;
        }
        const autoAmount = Math.min(
          credit.remainingAmount,
          Math.max(0, paymentAmount - totalAllocated)
        );
        return { ...prev, [credit.id]: fmt(autoAmount).replace(/\s/g, "").replace(",", ".") };
      });
    },
    [paymentAmount, totalAllocated]
  );

  const updateAllocationAmount = (creditId: string, value: string) => {
    setSelectedAllocations((prev) => ({ ...prev, [creditId]: value }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!formData.clientId) newErrors.clientId = "Client requis";
    if (!formData.amount) newErrors.amount = "Montant requis";
    else if (parseFloat(formData.amount) <= 0) newErrors.amount = "Montant doit être positif";
    if (!formData.paymentDate) newErrors.paymentDate = "Date requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const manualAllocations =
        allocationMode === "MANUAL"
          ? Object.entries(selectedAllocations)
              .map(([creditId, amount]) => ({ creditId, amount: parseFloat(amount) || 0 }))
              .filter((a) => a.amount > 0)
          : undefined;

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          paymentDate: new Date(formData.paymentDate).toISOString(),
          allocationMode,
          manualAllocations,
        }),
      });

      if (response.ok) {
        router.push("/payments");
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const selectClient = (client: Client) => {
    handleChange("clientId", client.id);
    setClientSearch(`${client.firstName} ${client.lastName}`);
    setShowClientDropdown(false);
  };

  const allocationProgressPct =
    paymentAmount > 0 ? Math.min((totalAllocated / paymentAmount) * 100, 100) : 0;
  const hasOverallocation = totalAllocated > paymentAmount;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b-2 border-gray-900">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/payments")}
                className="p-2 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
                  Nouveau Paiement
                </h1>
                <p className="text-lg text-gray-600 mt-2">Enregistrer un nouveau paiement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <form onSubmit={handleSubmit} className="bg-white border-2 border-gray-900">
            <div className="border-b-2 border-gray-900 p-6">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                Informations Paiement
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Client Selection */}
              <div className="relative">
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                  <User size={16} className="inline mr-2" />
                  Client *
                  {!isClientLocked && selectedClient && (
                    <span className="text-xs font-normal text-gray-600 ml-2">(cliquer pour changer)</span>
                  )}
                  {isClientLocked && (
                    <span className="text-xs font-normal text-gray-600 ml-2">(pré-sélectionné)</span>
                  )}
                </label>

                {isClientLocked ? (
                  <div className="w-full px-4 py-3 border-2 border-gray-300 bg-gray-100 flex items-center gap-3">
                    <User size={20} className="text-gray-500" />
                    {selectedClient ? (
                      <div>
                        <div className="font-medium text-gray-900">
                          {selectedClient.firstName} {selectedClient.lastName}
                        </div>
                        {selectedClient.businessName && (
                          <div className="text-sm text-gray-600">{selectedClient.businessName}</div>
                        )}
                        <div className="text-xs text-gray-500">{selectedClient.email}</div>
                      </div>
                    ) : (
                      <div className="text-gray-600">Chargement du client...</div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={
                        selectedClient
                          ? `${selectedClient.firstName} ${selectedClient.lastName}`
                          : clientSearch
                      }
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setShowClientDropdown(true);
                        if (!e.target.value) handleChange("clientId", "");
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      className={`w-full pl-10 pr-12 py-3 border-2 ${
                        errors.clientId ? "border-red-500" : "border-gray-200"
                      } focus:border-gray-900 focus:outline-none ${selectedClient ? "bg-gray-50" : ""}`}
                      placeholder="Rechercher un client..."
                      disabled={isSubmitting}
                    />
                    {selectedClient && (
                      <button
                        type="button"
                        onClick={() => {
                          handleChange("clientId", "");
                          setClientSearch("");
                          setShowClientDropdown(true);
                        }}
                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <User size={20} />
                      </button>
                    )}
                    {showClientDropdown && (
                      <div className="absolute top-full left-0 right-0 z-10 border-2 border-gray-900 bg-white max-h-60 overflow-y-auto">
                        {isLoadingClients ? (
                          <div className="px-4 py-8 flex items-center justify-center">
                            <Loader2 size={24} className="animate-spin text-gray-400" />
                            <span className="ml-2 text-gray-600">Recherche en cours...</span>
                          </div>
                        ) : clients.length > 0 ? (
                          clients.map((client) => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => selectClient(client)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                            >
                              <div className="font-medium">
                                {client.firstName} {client.lastName}
                              </div>
                              {client.businessName && (
                                <div className="text-sm text-gray-600">{client.businessName}</div>
                              )}
                              <div className="text-xs text-gray-500">{client.email}</div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-gray-600">
                            Aucun client trouvé
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {errors.clientId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.clientId}
                  </p>
                )}
              </div>

              {/* Payment Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    <DollarSign size={16} className="inline mr-2" />
                    Montant (TND) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => handleChange("amount", e.target.value)}
                    className={`w-full px-4 py-3 border-2 ${
                      errors.amount ? "border-red-500" : "border-gray-200"
                    } focus:border-gray-900 focus:outline-none`}
                    placeholder="0.000"
                    disabled={isSubmitting}
                  />
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      {errors.amount}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    <Calendar size={16} className="inline mr-2" />
                    Date de paiement *
                  </label>
                  <input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => handleChange("paymentDate", e.target.value)}
                    className={`w-full px-4 py-3 border-2 ${
                      errors.paymentDate ? "border-red-500" : "border-gray-200"
                    } focus:border-gray-900 focus:outline-none`}
                    disabled={isSubmitting}
                  />
                  {errors.paymentDate && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      {errors.paymentDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    <CreditCard size={16} className="inline mr-2" />
                    Méthode de paiement
                  </label>
                  <select
                    value={formData.method}
                    onChange={(e) => handleChange("method", e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none"
                    disabled={isSubmitting}
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    Référence
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => handleChange("reference", e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none"
                    placeholder="ex: CHQ001, VIRT123..."
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                  Notes
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => handleChange("note", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none"
                  rows={3}
                  placeholder="Notes sur le paiement..."
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* ── Credit Allocation Section ── */}
            {formData.clientId && (
              <div className="border-t-2 border-gray-900">
                {/* Section header */}
                <div className="px-6 py-4 bg-gray-50 border-b-2 border-gray-900 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                      <FileText size={16} className="inline mr-2" />
                      Répartition du paiement
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Choisissez comment allouer ce paiement aux factures ouvertes
                    </p>
                  </div>

                  {/* Mode toggle */}
                  <div className="flex border-2 border-gray-900 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setAllocationMode("FIFO");
                        setSelectedAllocations({});
                      }}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wide transition-all ${
                        allocationMode === "FIFO"
                          ? "bg-gray-900 text-white"
                          : "bg-white text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <Zap size={14} />
                      Automatique
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllocationMode("MANUAL")}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wide border-l-2 border-gray-900 transition-all ${
                        allocationMode === "MANUAL"
                          ? "bg-gray-900 text-white"
                          : "bg-white text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <SlidersHorizontal size={14} />
                      Manuel
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {isLoadingCredits ? (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                      <Loader2 size={20} className="animate-spin mr-2" />
                      Chargement des factures...
                    </div>
                  ) : openCredits.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300">
                      <FileText size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="font-medium">Aucune facture ouverte</p>
                      <p className="text-sm">Ce client n&apos;a pas de factures en attente</p>
                    </div>
                  ) : allocationMode === "FIFO" ? (
                    /* FIFO mode: preview list */
                    <div className="space-y-2">
                      <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 mb-4">
                        <Zap size={16} className="text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-blue-700">
                          Le paiement sera alloué automatiquement en commençant par les factures les plus anciennes (FIFO).
                        </p>
                      </div>
                      {openCredits.map((credit) => (
                        <div
                          key={credit.id}
                          className={`flex items-center justify-between px-4 py-3 border ${
                            credit.status === "OVERDUE"
                              ? "border-red-200 bg-red-50"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{credit.label}</div>
                              {credit.dueDate && (
                                <div className="text-xs text-gray-500">
                                  Échéance: {new Date(credit.dueDate).toLocaleDateString("fr-TN")}
                                </div>
                              )}
                            </div>
                            <span
                              className={`text-xs font-bold uppercase px-2 py-0.5 ${
                                credit.status === "OVERDUE"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {credit.status === "OVERDUE" ? "En retard" : "Ouvert"}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">
                              {fmt(credit.remainingAmount)} TND
                            </div>
                            <div className="text-xs text-gray-500">
                              restant sur {fmt(credit.totalAmount)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* MANUAL mode: selectable credits */
                    <div className="space-y-3">
                      {openCredits.map((credit) => {
                        const isSelected = selectedAllocations[credit.id] !== undefined;
                        const allocationValue = selectedAllocations[credit.id] ?? "";
                        const allocationNum = parseFloat(allocationValue) || 0;
                        const exceedsRemaining = allocationNum > credit.remainingAmount;

                        return (
                          <div
                            key={credit.id}
                            className={`border-2 transition-all ${
                              isSelected
                                ? credit.status === "OVERDUE"
                                  ? "border-red-600 bg-red-50"
                                  : "border-gray-900 bg-white"
                                : credit.status === "OVERDUE"
                                ? "border-red-200 bg-red-50 opacity-70"
                                : "border-gray-200 bg-white opacity-70"
                            }`}
                          >
                            {/* Credit header row — clickable to toggle */}
                            <button
                              type="button"
                              onClick={() => toggleCredit(credit)}
                              className="w-full flex items-center gap-4 px-4 py-3 text-left"
                            >
                              {/* Checkbox */}
                              <div
                                className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 transition-all ${
                                  isSelected
                                    ? "bg-gray-900 border-gray-900"
                                    : "bg-white border-gray-400"
                                }`}
                              >
                                {isSelected && (
                                  <svg
                                    width="10"
                                    height="8"
                                    viewBox="0 0 10 8"
                                    fill="none"
                                    className="text-white"
                                  >
                                    <path
                                      d="M1 4L3.5 6.5L9 1"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </div>

                              {/* Credit info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-gray-900 text-sm truncate">
                                    {credit.label}
                                  </span>
                                  <span
                                    className={`text-xs font-bold uppercase px-2 py-0.5 shrink-0 ${
                                      credit.status === "OVERDUE"
                                        ? "bg-red-200 text-red-800"
                                        : "bg-gray-200 text-gray-700"
                                    }`}
                                  >
                                    {credit.status === "OVERDUE" ? "En retard" : "Ouvert"}
                                  </span>
                                </div>
                                {credit.dueDate && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    Échéance: {new Date(credit.dueDate).toLocaleDateString("fr-TN")}
                                  </div>
                                )}
                              </div>

                              {/* Amounts */}
                              <div className="text-right shrink-0">
                                <div className="text-sm font-bold text-gray-900">
                                  {fmt(credit.remainingAmount)} TND
                                </div>
                                <div className="text-xs text-gray-500">
                                  / {fmt(credit.totalAmount)} total
                                </div>
                              </div>
                            </button>

                            {/* Amount input — only when selected */}
                            {isSelected && (
                              <div className="px-4 pb-3 pt-0 border-t-2 border-dashed border-gray-200">
                                <div className="flex items-center gap-3 mt-3">
                                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">
                                    Montant alloué
                                  </label>
                                  <div className="flex-1 relative">
                                    <input
                                      type="number"
                                      step="0.001"
                                      min="0.001"
                                      max={credit.remainingAmount}
                                      value={allocationValue}
                                      onChange={(e) =>
                                        updateAllocationAmount(credit.id, e.target.value)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      className={`w-full px-3 py-2 border-2 text-sm font-medium focus:outline-none ${
                                        exceedsRemaining
                                          ? "border-red-500 focus:border-red-500"
                                          : "border-gray-300 focus:border-gray-900"
                                      }`}
                                      placeholder="0.000"
                                    />
                                    <span className="absolute right-3 top-2 text-xs text-gray-500">
                                      TND
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateAllocationAmount(
                                        credit.id,
                                        credit.remainingAmount.toFixed(3)
                                      )
                                    }
                                    className="text-xs font-bold text-gray-600 underline whitespace-nowrap hover:text-gray-900"
                                  >
                                    Max
                                  </button>
                                </div>
                                {exceedsRemaining && (
                                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    Dépasse le restant ({fmt(credit.remainingAmount)} TND)
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Allocation summary bar */}
                      {paymentAmount > 0 && (
                        <div className="mt-4 border-2 border-gray-900 p-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-bold text-gray-900 uppercase tracking-wide">
                              Total alloué
                            </span>
                            <span
                              className={`font-black text-lg ${
                                hasOverallocation
                                  ? "text-red-600"
                                  : totalAllocated === paymentAmount
                                  ? "text-green-700"
                                  : "text-gray-900"
                              }`}
                            >
                              {fmt(totalAllocated)} / {fmt(paymentAmount)} TND
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="h-3 bg-gray-200 w-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                hasOverallocation
                                  ? "bg-red-500"
                                  : allocationProgressPct === 100
                                  ? "bg-green-600"
                                  : "bg-gray-900"
                              }`}
                              style={{ width: `${Math.min(allocationProgressPct, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-500">
                              {Object.keys(selectedAllocations).length} facture
                              {Object.keys(selectedAllocations).length !== 1 ? "s" : ""} sélectionnée
                              {Object.keys(selectedAllocations).length !== 1 ? "s" : ""}
                            </span>
                            {remaining > 0.001 && !hasOverallocation && (
                              <span className="text-xs text-gray-500">
                                Non alloué: {fmt(remaining)} TND
                              </span>
                            )}
                            {hasOverallocation && (
                              <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                                <AlertCircle size={12} />
                                Dépassement: {fmt(totalAllocated - paymentAmount)} TND
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => router.push("/payments")}
                  className="px-6 py-3 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all font-medium"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || hasOverallocation}
                >
                  <Save size={20} />
                  {isSubmitting ? "Enregistrement..." : "Enregistrer Paiement"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Click outside to close dropdown */}
        {showClientDropdown && (
          <div className="fixed inset-0 z-0" onClick={() => setShowClientDropdown(false)} />
        )}
      </div>
    </MainLayout>
  );
}
