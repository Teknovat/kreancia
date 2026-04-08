/**
 * Credit Creation Page - Swiss Functional
 * Simple, efficient credit creation form
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, User, DollarSign, Calendar, FileText, AlertTriangle, Search, Loader2 } from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";

interface FormData {
  clientId: string;
  label: string;
  totalAmount: string;
  description: string;
  dueDate: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  email: string;
}

export default function NewCreditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<FormData>({
    clientId: searchParams?.get("clientId") || "",
    label: "",
    totalAmount: "",
    description: "",
    dueDate: "",
  });

  // Load clients with debounced search
  useEffect(() => {
    const fetchClients = async (searchQuery: string = "") => {
      setIsLoadingClients(true);
      try {
        const url = searchQuery
          ? `/api/clients?search=${encodeURIComponent(searchQuery)}`
          : "/api/clients?limit=50"; // Load more clients when no search

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setClients(data.data?.clients || []);
        }
      } catch (error) {
        console.error("Error loading clients:", error);
      } finally {
        setIsLoadingClients(false);
      }
    };

    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set new timer for debounced search
    const timer = setTimeout(() => {
      fetchClients(clientSearch);
    }, 300) as unknown as NodeJS.Timeout;

    setSearchDebounceTimer(timer);

    // Cleanup function
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientSearch]);

  // Initial load of clients
  useEffect(() => {
    if (clientSearch === "") {
      setIsLoadingClients(true);
      fetch("/api/clients?limit=50")
        .then(response => response.json())
        .then(data => setClients(data.data?.clients || []))
        .catch(error => console.error("Error loading clients:", error))
        .finally(() => setIsLoadingClients(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedClient = clients.find((c) => c.id === formData.clientId);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.clientId) {
      newErrors.clientId = "Client requis";
    }
    if (!formData.label.trim()) {
      newErrors.label = "Libellé requis";
    }
    if (!formData.totalAmount) {
      newErrors.totalAmount = "Montant requis";
    } else if (parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = "Montant doit être positif";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          totalAmount: parseFloat(formData.totalAmount),
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        }),
      });

      if (response.ok) {
        router.push("/credits");
      } else {
        console.error("Error creating credit");
      }
    } catch (error) {
      console.error("Error creating credit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const selectClient = (client: Client) => {
    handleChange("clientId", client.id);
    setClientSearch(`${client.firstName} ${client.lastName}`);
    setShowClientDropdown(false);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b-2 border-gray-900">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/credits")}
                className="p-2 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">Nouveau Crédit</h1>
                <p className="text-lg text-gray-600 mt-2">Créer un nouveau crédit client</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <form onSubmit={handleSubmit} className="bg-white border-2 border-gray-900">
            <div className="border-b-2 border-gray-900 p-6">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Informations Crédit</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Client Selection */}
              <div className="relative">
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                  <User size={16} className="inline mr-2" />
                  Client *
                </label>
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setShowClientDropdown(true);
                      if (!e.target.value) {
                        handleChange("clientId", "");
                      }
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    className={`w-full pl-10 pr-4 py-3 border-2 ${
                      errors.clientId ? "border-red-500" : "border-gray-200"
                    } focus:border-gray-900 focus:outline-none`}
                    placeholder="Rechercher un client..."
                    disabled={isSubmitting}
                  />

                  {/* Client Dropdown */}
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
                            {client.businessName && <div className="text-sm text-gray-600">{client.businessName}</div>}
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
                {errors.clientId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {errors.clientId}
                  </p>
                )}
              </div>

              {/* Credit Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    <FileText size={16} className="inline mr-2" />
                    Libellé *
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => handleChange("label", e.target.value)}
                    className={`w-full px-4 py-3 border-2 ${
                      errors.label ? "border-red-500" : "border-gray-200"
                    } focus:border-gray-900 focus:outline-none`}
                    placeholder="ex: Facture #001"
                    disabled={isSubmitting}
                  />
                  {errors.label && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      {errors.label}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    <DollarSign size={16} className="inline mr-2" />
                    Montant (TND) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.totalAmount}
                    onChange={(e) => handleChange("totalAmount", e.target.value)}
                    className={`w-full px-4 py-3 border-2 ${
                      errors.totalAmount ? "border-red-500" : "border-gray-200"
                    } focus:border-gray-900 focus:outline-none`}
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                  {errors.totalAmount && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      {errors.totalAmount}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                  <Calendar size={16} className="inline mr-2" />
                  Date d&apos;échéance
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange("dueDate", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none"
                  rows={4}
                  placeholder="Description du crédit..."
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => router.push("/credits")}
                  className="px-6 py-3 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all font-medium"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all font-medium flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  <Save size={20} />
                  {isSubmitting ? "Création..." : "Créer Crédit"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Click outside to close dropdown */}
        {showClientDropdown && <div className="fixed inset-0 z-0" onClick={() => setShowClientDropdown(false)} />}
      </div>
    </MainLayout>
  );
}
