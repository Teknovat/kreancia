/**
 * Credit Edit Page - Swiss Functional
 * Simple, efficient credit editing form
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, User, DollarSign, Calendar, FileText, AlertTriangle, Eye } from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";

interface FormData {
  label: string;
  totalAmount: string;
  description: string;
  dueDate: string;
}

interface Credit {
  id: string;
  label: string;
  totalAmount: number;
  description?: string;
  dueDate?: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function EditCreditPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [credit, setCredit] = useState<Credit | null>(null);

  const [formData, setFormData] = useState<FormData>({
    label: "",
    totalAmount: "",
    description: "",
    dueDate: "",
  });

  // Load credit data
  useEffect(() => {
    const fetchCredit = async () => {
      if (!params?.id) return;

      try {
        const response = await fetch(`/api/credits/${params.id}`);
        if (response.ok) {
          const { data } = await response.json();
          setCredit(data);
          setFormData({
            label: data.label || "",
            totalAmount: data.totalAmount?.toString() || "",
            description: data.description || "",
            dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split("T")[0] : "",
          });
        } else {
          router.push("/credits");
        }
      } catch (error) {
        console.error("Error loading credit:", error);
        router.push("/credits");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredit();
  }, [params?.id, router]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

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
      const response = await fetch(`/api/credits/${params?.id}`, {
        method: "PUT",
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
        router.push(`/credits/${params?.id}`);
      } else {
        console.error("Error updating credit");
      }
    } catch (error) {
      console.error("Error updating credit:", error);
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du crédit...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!credit) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Crédit non trouvé</h1>
            <button
              onClick={() => router.push("/credits")}
              className="px-4 py-2 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all"
            >
              Retour aux crédits
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b-2 border-gray-900">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/credits/${credit.id}`)}
                className="p-2 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex-1">
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">Modifier Crédit</h1>
                <p className="text-lg text-gray-600 mt-2">
                  {credit.label} - {credit.client?.firstName} {credit.client?.lastName}
                </p>
              </div>
              <button
                onClick={() => router.push(`/credits/${credit.id}`)}
                className="p-2 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
              >
                <Eye size={20} />
              </button>
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
              {/* Client Info (Read-only) */}
              <div className="border-2 border-gray-200 bg-gray-50 p-4">
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                  <User size={16} className="inline mr-2" />
                  Client
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {credit.client?.firstName} {credit.client?.lastName}
                </p>
                <p className="text-sm text-gray-600">Le client ne peut pas être modifié après la création du crédit.</p>
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

              {/* Warning about changes */}
              <div className="border-2 border-orange-200 bg-orange-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={20} className="text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-800">Attention</p>
                    <p className="text-sm text-orange-700 mt-1">
                      Modifier le montant d&apos;un crédit peut affecter les allocations de paiements existantes.
                      Assurez-vous de vérifier les paiements associés après la modification.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => router.push(`/credits/${credit.id}`)}
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
                  {isSubmitting ? "Mise à jour..." : "Mettre à jour"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
