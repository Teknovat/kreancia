/**
 * Client Profile Page - Swiss Functional Design
 * Comprehensive client information with credits and payments history
 */

"use client";

import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building,
  FileText,
  CreditCard,
  Calendar,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Edit,
  Plus,
  Download,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import MainLayout from "@/components/layout/MainLayout";
import { useMerchantCurrency } from "@/hooks/useMerchantCurrency";
import {
  Heading,
  Text,
  Button,
  Card,
  CardHeader,
  CardContent,
  Metric,
  Container,
  Grid,
} from "@/components/ui/redesigned";
import { CreditWithDetails } from "@/types/credit";
import { Client } from "@/types/client";

/**
 * Client Information Section - Basic contact and business details
 */
interface ClientInfoSectionProps {
  client: Client;
  formatAmount: (amount: number) => string;
}

function ClientInfoSection({ client, formatAmount }: ClientInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <Heading level={3} variant="subtitle">
          Informations Client
        </Heading>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-gray-900 text-white flex items-center justify-center font-bold text-2xl">
                {client.firstName.charAt(0)}
                {client.lastName.charAt(0)}
              </div>
              <div>
                <Heading level={2} variant="title">
                  {client.firstName + " " + client.lastName}
                </Heading>
                <Text className="text-gray-600">ID: {client.id}</Text>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.email && (
                <div className="flex items-start space-x-3">
                  <Mail size={20} className="text-gray-500 mt-0.5" />
                  <div>
                    <Text className="text-sm text-gray-600 uppercase tracking-wide">Email</Text>
                    <Text className="font-medium">{client.email}</Text>
                  </div>
                </div>
              )}

              {client.phone && (
                <div className="flex items-start space-x-3">
                  <Phone size={20} className="text-gray-500 mt-0.5" />
                  <div>
                    <Text className="text-sm text-gray-600 uppercase tracking-wide">Téléphone</Text>
                    <Text className="font-medium">{client.phone}</Text>
                  </div>
                </div>
              )}

              {client.address && (
                <div className="flex items-start space-x-3 md:col-span-2">
                  <MapPin size={20} className="text-gray-500 mt-0.5" />
                  <div>
                    <Text className="text-sm text-gray-600 uppercase tracking-wide">Adresse</Text>
                    <Text className="font-medium">{client.address}</Text>
                  </div>
                </div>
              )}

              {client.businessName && (
                <div className="flex items-start space-x-3">
                  <Building size={20} className="text-gray-500 mt-0.5" />
                  <div>
                    <Text className="text-sm text-gray-600 uppercase tracking-wide">Entreprise</Text>
                    <Text className="font-medium">{client.businessName}</Text>
                  </div>
                </div>
              )}

              {client.taxId && (
                <div className="flex items-start space-x-3">
                  <FileText size={20} className="text-gray-500 mt-0.5" />
                  <div>
                    <Text className="text-sm text-gray-600 uppercase tracking-wide">ID Fiscal</Text>
                    <Text className="font-medium">{client.taxId}</Text>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Credit Settings */}
          <div className="border-t-2 border-gray-200 pt-6">
            <Heading level={4} variant="subtitle" className="mb-4">
              Paramètres de Crédit
            </Heading>
            <Grid cols={2} gap={4}>
              <div>
                <Text className="text-sm text-gray-600 uppercase tracking-wide">Limite de Crédit</Text>
                <Text className="font-bold text-lg">
                  {client.creditLimit ? formatAmount(Number(client.creditLimit)) : "Non définie"}
                </Text>
              </div>
              <div>
                <Text className="text-sm text-gray-600 uppercase tracking-wide">Délai de Paiement</Text>
                <Text className="font-bold text-lg">{client.paymentTermDays} jours</Text>
              </div>
            </Grid>
          </div>

          {/* Account Status */}
          <div className="border-t-2 border-gray-200 pt-6">
            <Heading level={4} variant="subtitle" className="mb-4">
              Statut du Compte
            </Heading>
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-sm text-gray-600 uppercase tracking-wide">Statut</Text>
                <span
                  className={`inline-block px-3 py-1 text-sm font-bold uppercase tracking-wide ${
                    client.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : client.status === "INACTIVE"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {client.status === "ACTIVE" ? "Actif" : client.status === "INACTIVE" ? "Inactif" : "Suspendu"}
                </span>
              </div>
              <div>
                <Text className="text-sm text-gray-600 uppercase tracking-wide">Dernière Activité</Text>
                <Text className="font-medium">
                  {client.lastActivity && new Date(client.lastActivity).toLocaleDateString("fr-FR")}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Credits List Section - Detailed credits with payment allocations
 */
interface CreditsListProps {
  credits: CreditWithDetails[];
  formatAmount: (amount: number) => string;
  onCreateCredit: () => void;
}

function CreditsList({ credits, formatAmount, onCreateCredit }: CreditsListProps) {
  const statusColors = {
    OPEN: "bg-blue-100 text-blue-800",
    PAID: "bg-green-100 text-green-800",
    OVERDUE: "bg-red-100 text-red-800",
  };

  const statusLabels = {
    OPEN: "Ouvert",
    PAID: "Payé",
    OVERDUE: "En Retard",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Heading level={3} variant="subtitle">
            Crédits ({credits.length})
          </Heading>
          <Button size="sm" onClick={onCreateCredit} icon={<Plus size={16} />}>
            Nouveau Crédit
          </Button>
        </div>
      </CardHeader>

      {credits.length === 0 ? (
        <CardContent>
          <div className="text-center py-12">
            <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
            <Heading level={4} variant="subtitle" className="mb-2">
              Aucun crédit
            </Heading>
            <Text className="text-gray-500">Ce client n&apos;a pas encore de crédits enregistrés</Text>
          </div>
        </CardContent>
      ) : (
        <div className="divide-y divide-gray-100">
          {credits.map((credit) => (
            <div key={credit.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Heading level={4} variant="subtitle" className="mb-0">
                      {credit.label}
                    </Heading>
                    <span
                      className={`px-2 py-1 text-xs font-bold uppercase tracking-wide ${statusColors[credit.status]}`}
                    >
                      {statusLabels[credit.status]}
                    </span>
                  </div>
                  {credit.description && <Text className="text-sm text-gray-600 mb-2">{credit.description}</Text>}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <Calendar size={16} />
                    <span>Créé le {new Date(credit.createdAt).toLocaleDateString("fr-FR")}</span>
                    {credit.dueDate && (
                      <>
                        <span>•</span>
                        <span>Échéance: {new Date(credit.dueDate).toLocaleDateString("fr-FR")}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right ml-6">
                  <div className="space-y-2">
                    <div>
                      <Text className="text-sm text-gray-600 uppercase tracking-wide">Total</Text>
                      <Text className="font-bold">{formatAmount(credit.totalAmount)}</Text>
                    </div>
                    <div>
                      <Text className="text-sm text-gray-600 uppercase tracking-wide">Restant</Text>
                      <Text className={`font-bold ${credit.remainingAmount > 0 ? "text-gray-900" : "text-green-600"}`}>
                        {formatAmount(credit.remainingAmount)}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Allocations */}
              {credit.paymentAllocations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Text className="text-xs text-gray-500 uppercase tracking-wide mb-2">Affectations de Paiement</Text>
                  <div className="space-y-2">
                    {credit.paymentAllocations.map((allocation: any) => (
                      <div key={allocation.id} className="flex items-center justify-between text-sm bg-gray-50 p-3">
                        <div>
                          <Text className="font-medium">
                            Paiement du {new Date(allocation.payment.paymentDate).toLocaleDateString("fr-FR")}
                          </Text>
                          <Text className="text-gray-600 text-xs">Méthode: {allocation.payment.method}</Text>
                        </div>
                        <Text className="font-bold text-green-600">+{formatAmount(allocation.allocatedAmount)}</Text>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * Payments History Section - Complete payment record
 */
interface PaymentsHistoryProps {
  payments: any[];
  formatAmount: (amount: number) => string;
  onCreatePayment: () => void;
}

function PaymentsHistory({ payments, formatAmount, onCreatePayment }: PaymentsHistoryProps) {
  const methodLabels = {
    CASH: "Espèces",
    BANK_TRANSFER: "Virement Bancaire",
    CHECK: "Chèque",
    CARD: "Carte",
    MOBILE_PAYMENT: "Paiement Mobile",
    OTHER: "Autre",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Heading level={3} variant="subtitle">
            Historique des Paiements ({payments.length})
          </Heading>
          <Button size="sm" onClick={onCreatePayment} icon={<Plus size={16} />}>
            Nouveau Paiement
          </Button>
        </div>
      </CardHeader>

      {payments.length === 0 ? (
        <CardContent>
          <div className="text-center py-12">
            <TrendingUp size={48} className="mx-auto text-gray-300 mb-4" />
            <Heading level={4} variant="subtitle" className="mb-2">
              Aucun paiement
            </Heading>
            <Text className="text-gray-500">Aucun paiement enregistré pour ce client</Text>
          </div>
        </CardContent>
      ) : (
        <div className="divide-y divide-gray-100">
          {payments.map((payment) => (
            <div key={payment.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <TrendingUp size={20} className="text-green-600" />
                    <Text className="font-bold text-lg text-green-600">+{formatAmount(payment.amount)}</Text>
                    <span className="px-2 py-1 text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-800">
                      {methodLabels[payment.method as keyof typeof methodLabels] || payment.method}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                    <Calendar size={16} />
                    <span>Le {new Date(payment.paymentDate).toLocaleDateString("fr-FR")}</span>
                    {payment.reference && (
                      <>
                        <span>•</span>
                        <span>Référence: {payment.reference}</span>
                      </>
                    )}
                  </div>

                  {payment.note && <Text className="text-sm text-gray-600 italic">&quot;{payment.note}&quot;</Text>}

                  {/* Credit Allocations */}
                  {payment.paymentAllocations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Text className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                        Affecté aux crédits ({payment.paymentAllocations.length})
                      </Text>
                      <div className="flex flex-wrap gap-2">
                        {payment.paymentAllocations.map((allocation: any) => (
                          <span
                            key={allocation.id}
                            className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-800 text-xs rounded"
                          >
                            {allocation.credit.label}: {formatAmount(allocation.allocatedAmount)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * Main Client Profile Page Component
 */
export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [clientId, setClientId] = useState<string | null>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { formatAmount, isLoading: currencyLoading } = useMerchantCurrency();

  // Unwrap params using useEffect
  useEffect(() => {
    params.then((resolvedParams) => setClientId(resolvedParams.id));
  }, [params]);

  // Fetch client data
  useEffect(() => {
    async function fetchClient() {
      if (!clientId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/clients/${clientId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Network error" }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch client details");
        }

        // Transform client data to convert date strings to Date objects
        const clientWithDates = {
          ...result.data,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
          lastActivity: new Date(result.data.lastActivity),
          credits: result.data.credits.map((credit: any) => ({
            ...credit,
            createdAt: new Date(credit.createdAt),
            updatedAt: new Date(credit.updatedAt),
            dueDate: credit.dueDate ? new Date(credit.dueDate) : null,
            paymentAllocations: credit.paymentAllocations.map((allocation: any) => ({
              ...allocation,
              createdAt: new Date(allocation.createdAt),
              updatedAt: new Date(allocation.updatedAt),
              payment: {
                ...allocation.payment,
                paymentDate: new Date(allocation.payment.paymentDate),
              },
            })),
          })),
          payments: result.data.payments.map((payment: any) => ({
            ...payment,
            createdAt: new Date(payment.createdAt),
            updatedAt: new Date(payment.updatedAt),
            paymentDate: new Date(payment.paymentDate),
            paymentAllocations: payment.paymentAllocations.map((allocation: any) => ({
              ...allocation,
              createdAt: new Date(allocation.createdAt),
              updatedAt: new Date(allocation.updatedAt),
            })),
          })),
        };

        setClient(clientWithDates);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("Error fetching client details:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchClient();
  }, [clientId]);

  const handleBack = () => {
    router.push("/clients");
  };

  const handleEdit = () => {
    if (client) {
      router.push(`/clients/${client.id}/edit`);
    }
  };

  const handleCreateCredit = () => {
    if (client) {
      router.push(`/credits/new?clientId=${client.id}`);
    }
  };

  const handleCreatePayment = () => {
    if (client) {
      router.push(`/payments/new?clientId=${client.id}`);
    }
  };

  const handleExport = () => {
    // Export functionality could be implemented here
    alert("Export fonctionnalité à venir");
  };

  if (loading || currencyLoading) {
    return (
      <MainLayout>
        <Container className="py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw size={48} className="mx-auto text-gray-300 mb-4 animate-spin" />
              <Text className="text-lg font-medium text-gray-600">Chargement...</Text>
            </div>
          </div>
        </Container>
      </MainLayout>
    );
  }

  if (error && !client) {
    return (
      <MainLayout>
        <Container className="py-8">
          <Card variant="outlined" className="border-red-500 bg-red-50">
            <CardContent>
              <div className="flex items-center space-x-3">
                <AlertTriangle size={24} className="text-red-600" />
                <div>
                  <Heading level={3} variant="subtitle" className="mb-1">
                    Erreur de chargement
                  </Heading>
                  <Text className="text-sm text-red-600">{error}</Text>
                </div>
              </div>
              <div className="mt-4 flex items-center space-x-3">
                <Button onClick={() => window.location.reload()} icon={<RefreshCw size={16} />}>
                  Réessayer
                </Button>
                <Button variant="secondary" onClick={handleBack} icon={<ArrowLeft size={16} />}>
                  Retour
                </Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </MainLayout>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200">
        <Container className="py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Button variant="ghost" size="sm" onClick={handleBack} icon={<ArrowLeft size={16} />}>
                  Retour
                </Button>
              </div>
              <Heading level={1} variant="display">
                Fiche Client
              </Heading>
              <Text className="text-lg mt-2">{client.fullName}</Text>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="secondary" onClick={() => window.location.reload()} icon={<RefreshCw size={16} />}>
                Actualiser
              </Button>
              <Button variant="secondary" onClick={handleExport} icon={<Download size={16} />}>
                Exporter
              </Button>
              <Button onClick={handleEdit} icon={<Edit size={16} />}>
                Modifier
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        {/* Key Metrics */}
        <Grid cols={4} className="mb-8">
          <Metric
            label="Encours Total"
            value={formatAmount(client.outstandingAmount)}
            change={`${client.creditCount} crédit(s)`}
            variant={client.overdueAmount > 0 ? "warning" : "default"}
          />

          <Metric
            label="En Retard"
            value={formatAmount(client.overdueAmount)}
            change={client.overdueAmount > 0 ? "Attention requise" : "À jour"}
            variant={client.overdueAmount > 0 ? "danger" : "success"}
          />

          <Metric
            label="Total Crédits"
            value={formatAmount(client.totalCreditsAmount)}
            change={`${client.creditCount} transaction(s)`}
          />

          <Metric
            label="Total Paiements"
            value={formatAmount(client.totalPaymentsAmount)}
            change={`${client.paymentCount} paiement(s)`}
            variant="success"
          />
        </Grid>

        {/* Client Information */}
        <ClientInfoSection client={client} formatAmount={formatAmount} />

        {/* Additional Stats */}
        {client.creditLimit && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <Heading level={3} variant="subtitle">
                  Analyse de Crédit
                </Heading>
              </CardHeader>
              <CardContent>
                <Grid cols={3} gap={6}>
                  <div>
                    <Text className="text-sm text-gray-600 uppercase tracking-wide">Utilisation du Crédit</Text>
                    <div className="flex items-center space-x-2">
                      <Text className="font-bold text-2xl">{client.creditUtilization}%</Text>
                      <TrendingUp
                        size={20}
                        className={client.creditUtilization > 80 ? "text-red-600" : "text-green-600"}
                      />
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${client.creditUtilization > 80 ? "bg-red-600" : "bg-green-600"}`}
                        style={{ width: `${Math.min(client.creditUtilization, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <Text className="text-sm text-gray-600 uppercase tracking-wide">Délai Moyen de Paiement</Text>
                    <div className="flex items-center space-x-2">
                      <Text className="font-bold text-2xl">{client.avgPaymentDays} jours</Text>
                      <Calendar size={20} className="text-gray-500" />
                    </div>
                    <Text className="text-sm text-gray-500 mt-1">Basé sur les crédits payés</Text>
                  </div>

                  <div>
                    <Text className="text-sm text-gray-600 uppercase tracking-wide">Limite Disponible</Text>
                    <div className="flex items-center space-x-2">
                      <Text className="font-bold text-2xl">
                        {formatAmount(Number(client.creditLimit) - client.outstandingAmount)}
                      </Text>
                      <CreditCard size={20} className="text-gray-500" />
                    </div>
                    <Text className="text-sm text-gray-500 mt-1">Sur {formatAmount(Number(client.creditLimit))}</Text>
                  </div>
                </Grid>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Credits and Payments */}
        <div className="mt-6 space-y-6">
          <CreditsList credits={client.credits} formatAmount={formatAmount} onCreateCredit={handleCreateCredit} />
          <PaymentsHistory
            payments={client.payments}
            formatAmount={formatAmount}
            onCreatePayment={handleCreatePayment}
          />
        </div>
      </Container>
    </MainLayout>
  );
}
