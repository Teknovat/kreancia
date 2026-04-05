/**
 * Credit Detail Page - Swiss Functional
 * Simple, efficient credit detail view
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, User, DollarSign, Calendar, FileText, Edit, AlertTriangle, Clock, CheckCircle } from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";

interface Credit {
  id: string;
  label: string;
  totalAmount: number;
  remainingAmount: number;
  description?: string;
  status: "OPEN" | "PAID" | "OVERDUE";
  createdAt: string;
  dueDate?: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    businessName?: string;
  };
  allocations?: {
    id: string;
    amount: number;
    paymentId: string;
    payment: {
      id: string;
      amount: number;
      paymentDate: string;
      method: string;
      reference?: string;
    };
  }[];
}

export default function CreditDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [credit, setCredit] = useState<Credit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCredit = async () => {
      try {
        const response = await fetch(`/api/credits/${params?.id}`);
        if (response.ok) {
          const { data } = await response.json();
          setCredit(data);
        } else {
          setError("Crédit non trouvé");
        }
      } catch (err) {
        setError("Erreur lors du chargement");
      } finally {
        setIsLoading(false);
      }
    };

    if (params?.id) {
      fetchCredit();
    }
  }, [params?.id]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "OPEN":
        return { label: "En cours", color: "text-blue-600 bg-blue-50 border-blue-200" };
      case "PAID":
        return { label: "Payé", color: "text-green-600 bg-green-50 border-green-200" };
      case "OVERDUE":
        return { label: "En retard", color: "text-red-600 bg-red-50 border-red-200" };
      default:
        return { label: status, color: "text-gray-600 bg-gray-50 border-gray-200" };
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

  if (error || !credit) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">{error}</h1>
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

  const statusConfig = getStatusConfig(credit.status);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b-2 border-gray-900">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.push("/credits")}
                className="p-2 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex-1">
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">{credit.label}</h1>
                <p className="text-lg text-gray-600 mt-2">Crédit #{credit.id.substring(0, 8)}</p>
              </div>
              <div className="flex gap-2">
                <span
                  className={`px-3 py-1 border-2 font-medium text-sm uppercase tracking-wide ${statusConfig.color}`}
                >
                  {statusConfig.label}
                </span>
                <button
                  onClick={() => router.push(`/credits/${credit.id}/edit`)}
                  className="p-2 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
                >
                  <Edit size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Information */}
            <div className="bg-white border-2 border-gray-900">
              <div className="border-b-2 border-gray-900 p-4">
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <User size={20} />
                  Client
                </h2>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {credit.client.firstName} {credit.client.lastName}
                </h3>
                {credit.client.businessName && <p className="text-gray-600 mb-4">{credit.client.businessName}</p>}
                <button
                  onClick={() => router.push(`/clients/${credit.client.id}`)}
                  className="text-sm font-medium text-gray-900 border-b-2 border-gray-900 hover:text-gray-600 transition-colors"
                >
                  Voir le profil client →
                </button>
              </div>
            </div>

            {/* Credit Details */}
            <div className="bg-white border-2 border-gray-900">
              <div className="border-b-2 border-gray-900 p-4">
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <FileText size={20} />
                  Détails
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Montant total:</span>
                  <span className="font-bold text-gray-900">{credit.totalAmount.toFixed(2)} TND</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Montant restant:</span>
                  <span className="font-bold text-gray-900">{credit.remainingAmount.toFixed(2)} TND</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Date de création:</span>
                  <span className="text-gray-900">{new Date(credit.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
                {credit.dueDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Date d'échéance:</span>
                    <span className="text-gray-900 flex items-center gap-1">
                      <Calendar size={16} />
                      {new Date(credit.dueDate).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {credit.description && (
              <div className="lg:col-span-2 bg-white border-2 border-gray-900">
                <div className="border-b-2 border-gray-900 p-4">
                  <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Description</h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-700">{credit.description}</p>
                </div>
              </div>
            )}

            {/* Payment Progress */}
            <div className="lg:col-span-2 bg-white border-2 border-gray-900">
              <div className="border-b-2 border-gray-900 p-4">
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <DollarSign size={20} />
                  Progression du Paiement
                </h2>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Payé</span>
                    <span>
                      {(((credit.totalAmount - credit.remainingAmount) / credit.totalAmount) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 border-2 border-gray-300 h-4">
                    <div
                      className="bg-gray-900 h-full"
                      style={{
                        width: `${((credit.totalAmount - credit.remainingAmount) / credit.totalAmount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="border-2 border-gray-200 p-3">
                    <p className="text-sm text-gray-600 uppercase tracking-wide">Total</p>
                    <p className="font-bold text-gray-900">{credit.totalAmount.toFixed(2)} TND</p>
                  </div>
                  <div className="border-2 border-gray-200 p-3">
                    <p className="text-sm text-gray-600 uppercase tracking-wide">Payé</p>
                    <p className="font-bold text-green-600">
                      {(credit.totalAmount - credit.remainingAmount).toFixed(2)} TND
                    </p>
                  </div>
                  <div className="border-2 border-gray-200 p-3">
                    <p className="text-sm text-gray-600 uppercase tracking-wide">Restant</p>
                    <p className="font-bold text-red-600">{credit.remainingAmount.toFixed(2)} TND</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payments History */}
          {credit.allocations && credit.allocations.length > 0 && (
            <div className="mt-6">
              <div className="bg-white border-2 border-gray-900">
                <div className="border-b-2 border-gray-900 p-4">
                  <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <DollarSign size={20} />
                    Historique des Paiements
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {credit.allocations.map((allocation) => (
                      <div key={allocation.id} className="border-2 border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-gray-900">
                                Paiement #{allocation.payment.id.substring(0, 8)}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-xs font-medium text-gray-700 rounded">
                                {allocation.payment.method}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex justify-between">
                                <span>Montant total du paiement:</span>
                                <span className="font-medium">{allocation.payment.amount.toFixed(2)} TND</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Alloué à ce crédit:</span>
                                <span className="font-medium text-green-600">{allocation.amount.toFixed(2)} TND</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Date:</span>
                                <span>{new Date(allocation.payment.paymentDate).toLocaleDateString('fr-FR')}</span>
                              </div>
                              {allocation.payment.reference && (
                                <div className="flex justify-between">
                                  <span>Référence:</span>
                                  <span className="font-mono text-xs">{allocation.payment.reference}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => router.push(`/payments/${allocation.payment.id}`)}
                            className="ml-4 text-sm font-medium text-gray-900 border-b-2 border-gray-900 hover:text-gray-600 transition-colors"
                          >
                            Voir →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-gray-500 text-center">
                    {credit.allocations.length} paiement{credit.allocations.length > 1 ? 's' : ''} appliqué{credit.allocations.length > 1 ? 's' : ''} à ce crédit
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex gap-4 justify-end">
            <button
              onClick={() => router.push(`/payments/new?clientId=${credit.client.id}`)}
              className="px-6 py-3 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all font-medium"
            >
              Nouveau Paiement
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
