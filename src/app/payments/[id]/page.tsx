/**
 * Payment Detail Page - Swiss Functional
 * Simple, efficient payment detail view
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, User, DollarSign, Calendar, CreditCard, FileText, AlertTriangle, CheckCircle } from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  method: string;
  reference?: string;
  note?: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    businessName?: string;
  };
  allocations?: Array<{
    id: string;
    allocatedAmount: number;
    credit: {
      id: string;
      label: string;
      totalAmount: number;
      remainingAmount: number;
    };
  }>;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Espèces",
  BANK_TRANSFER: "Virement bancaire",
  CHECK: "Chèque",
  CARD: "Carte bancaire",
  MOBILE_PAYMENT: "Paiement mobile",
  OTHER: "Autre",
};

export default function PaymentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const response = await fetch(`/api/payments/${params?.id}`);
        if (response.ok) {
          const { data } = await response.json();
          setPayment(data);
        } else {
          setError("Paiement non trouvé");
        }
      } catch {
        setError("Erreur lors du chargement");
      } finally {
        setIsLoading(false);
      }
    };

    if (params?.id) {
      fetchPayment();
    }
  }, [params?.id]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du paiement...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !payment) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">{error}</h1>
            <button
              onClick={() => router.push("/payments")}
              className="px-4 py-2 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all"
            >
              Retour aux paiements
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const totalAllocated = payment.allocations?.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0) || 0;
  const unallocated = payment.amount - totalAllocated;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b-2 border-gray-900">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.push("/payments")}
                className="p-2 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex-1">
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">Paiement</h1>
                <p className="text-lg text-gray-600 mt-2">#{payment.id.substring(0, 8)}</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 border-2 border-green-200 bg-green-50 text-green-600 font-medium text-sm uppercase tracking-wide">
                  <CheckCircle size={16} className="inline mr-1" />
                  Reçu
                </span>
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
                  {payment.client.firstName} {payment.client.lastName}
                </h3>
                {payment.client.businessName && <p className="text-gray-600 mb-4">{payment.client.businessName}</p>}
                <button
                  onClick={() => router.push(`/clients/${payment.client.id}`)}
                  className="text-sm font-medium text-gray-900 border-b-2 border-gray-900 hover:text-gray-600 transition-colors"
                >
                  Voir le profil client →
                </button>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white border-2 border-gray-900">
              <div className="border-b-2 border-gray-900 p-4">
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <DollarSign size={20} />
                  Détails
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Montant:</span>
                  <span className="font-bold text-gray-900 text-xl">{payment.amount.toFixed(3)} TND</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Date de paiement:</span>
                  <span className="text-gray-900 flex items-center gap-1">
                    <Calendar size={16} />
                    {new Date(payment.paymentDate).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Méthode:</span>
                  <span className="text-gray-900 flex items-center gap-1">
                    <CreditCard size={16} />
                    {PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                  </span>
                </div>
                {payment.reference && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Référence:</span>
                    <span className="text-gray-900">{payment.reference}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {payment.note && (
              <div className="lg:col-span-2 bg-white border-2 border-gray-900">
                <div className="border-b-2 border-gray-900 p-4">
                  <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <FileText size={20} />
                    Notes
                  </h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-700">{payment.note}</p>
                </div>
              </div>
            )}

            {/* Allocation Summary */}
            <div className="lg:col-span-2 bg-white border-2 border-gray-900">
              <div className="border-b-2 border-gray-900 p-4">
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Répartition du Paiement</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 text-center mb-6">
                  <div className="border-2 border-gray-200 p-4">
                    <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">Total Reçu</p>
                    <p className="font-bold text-gray-900 text-xl">{payment.amount.toFixed(3)} TND</p>
                  </div>
                  <div className="border-2 border-gray-200 p-4">
                    <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">Alloué</p>
                    <p className="font-bold text-green-600 text-xl">{totalAllocated.toFixed(3)} TND</p>
                  </div>
                  <div className="border-2 border-gray-200 p-4">
                    <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">Non Alloué</p>
                    <p className="font-bold text-blue-600 text-xl">{unallocated.toFixed(3)} TND</p>
                  </div>
                </div>

                {/* Allocations Detail */}
                {payment.allocations && payment.allocations.length > 0 && (
                  <div>
                    <h3 className="text-md font-bold text-gray-900 mb-4 uppercase tracking-wide">Crédits Payés</h3>
                    <div className="space-y-3">
                      {payment.allocations.map((allocation) => (
                        <div
                          key={allocation.id}
                          className="border-2 border-gray-200 p-4 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{allocation.credit.label}</p>
                            <p className="text-sm text-gray-600">
                              Crédit: {allocation.credit.totalAmount.toFixed(3)} TND
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{allocation.allocatedAmount.toFixed(3)} TND</p>
                            <button
                              onClick={() => router.push(`/credits/${allocation.credit.id}`)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              Voir le crédit →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {unallocated > 0 && (
                  <div className="mt-6 p-4 border-2 border-blue-200 bg-blue-50">
                    <p className="text-blue-800 font-medium">
                      {unallocated.toFixed(3)} TND n&apos;est pas encore alloué à un crédit spécifique.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-4 justify-end">
            <button
              onClick={() => router.push(`/credits/new?clientId=${payment.client.id}`)}
              className="px-6 py-3 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all font-medium"
            >
              Nouveau Crédit
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
