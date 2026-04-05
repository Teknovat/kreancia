/**
 * Clients Page Redesigned - Swiss Functional
 * Clean, efficient client management interface
 */

'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Users,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

import MainLayout from '@/components/layout/MainLayout';
import {
  Heading,
  Text,
  Button,
  Card,
  CardHeader,
  CardContent,
  Input,
  Metric,
  Container,
  Grid
} from '@/components/ui/redesigned';
import { useClients } from '@/hooks/useClients';
import { useMerchantCurrency } from '@/hooks/useMerchantCurrency';
import type { ClientWithStats } from '@/types/client';

/**
 * Client Table - Clean, scannable data presentation
 */
interface ClientTableProps {
  clients: ClientWithStats[];
  loading: boolean;
  onEdit: (client: ClientWithStats) => void;
  onDelete: (client: ClientWithStats) => void;
  formatAmount: (amount: number) => string;
}

function ClientTable({ clients, loading, onEdit, onDelete: _onDelete, formatAmount }: ClientTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Heading level={3} variant="subtitle">Clients</Heading>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-b-0">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-100 rounded w-32"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <Heading level={3} variant="subtitle" className="mb-2">Aucun client trouvé</Heading>
          <Text className="text-gray-500 mb-6">Commencez par créer votre premier client</Text>
          <Button icon={<Plus size={16} />}>
            Nouveau Client
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Heading level={3} variant="subtitle">Clients ({clients.length})</Heading>
          <Button variant="secondary" size="sm">
            <Filter size={16} />
          </Button>
        </div>
      </CardHeader>

      <div className="divide-y divide-gray-100">
        {clients.map((client) => (
          <div key={client.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              {/* Client Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center font-bold text-sm">
                    {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900">
                      {client.firstName} {client.lastName}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {client.email && <span>{client.email}</span>}
                      {client.phone && <span>{client.phone}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Metrics */}
              <div className="flex items-center space-x-8">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Encours</p>
                  <p className="font-bold text-lg text-gray-900">
                    {formatAmount(client.outstandingAmount || 0)}
                  </p>
                </div>

                {client.overdueAmount > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600 uppercase tracking-wide">En Retard</p>
                    <p className="font-bold text-lg text-red-600">
                      {formatAmount(client.overdueAmount)}
                    </p>
                  </div>
                )}

                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Statut</p>
                  <span className={`inline-block px-2 py-1 text-xs font-bold uppercase tracking-wide ${
                    client.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    client.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {client.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(client)}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                  >
                    <MoreHorizontal size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Main Clients Page Component
 */
export default function ClientsPageRedesigned() {
  const {
    clients,
    totalCount: _totalCount,
    totalPages: _totalPages,
    stats,
    loading,
    error,
    refetch,
    deleteClient,
    filters: _filters,
    setFilters: _setFilters
  } = useClients();

  const { formatAmount, isLoading: currencyLoading } = useMerchantCurrency();
  const [searchQuery, setSearchQuery] = useState('');

  const handleEdit = (client: ClientWithStats) => {
    // Navigation logic
    window.location.href = `/clients/${client.id}/edit`;
  };

  const handleDelete = (client: ClientWithStats) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${client.firstName} ${client.lastName} ?`)) {
      deleteClient(client.id);
    }
  };

  const handleNewClient = () => {
    window.location.href = '/clients/new';
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200">
        <Container className="py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Heading level={1} variant="display">Clients</Heading>
              <Text className="text-lg mt-2">
                Gestion de votre base clients
              </Text>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                onClick={refetch}
                icon={<RefreshCw size={16} />}
              >
                Actualiser
              </Button>

              <Button
                onClick={handleNewClient}
                icon={<Plus size={16} />}
              >
                Nouveau Client
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="max-w-md relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Container>
      </div>

      <Container className="py-8">
        {/* Error Message */}
        {error && (
          <Card variant="outlined" className="border-red-500 bg-red-50 mb-8">
            <CardContent>
              <div className="flex items-center space-x-3">
                <AlertTriangle size={24} className="text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Erreur de chargement</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <Grid cols={4} className="mb-8">
          <Metric
            label="Total Clients"
            value={loading ? "..." : stats?.totalClients?.toString() || "0"}
            change={`${stats?.activeClients || 0} actifs`}
            loading={loading}
          />

          <Metric
            label="Clients Actifs"
            value={loading ? "..." : stats?.activeClients?.toString() || "0"}
            change={`${stats?.totalClients > 0 ? Math.round((stats?.activeClients / stats?.totalClients) * 100) : 0}% du total`}
            variant="success"
            loading={loading}
          />

          <Metric
            label="Encours Total"
            value={loading || currencyLoading ? "..." : formatAmount(stats?.totalOutstanding || 0)}
            change="Tous clients confondus"
            loading={loading || currencyLoading}
          />

          <Metric
            label="En Retard"
            value={loading ? "..." : stats?.overdueClients?.toString() || "0"}
            change="Nécessitent attention"
            variant="warning"
            loading={loading}
          />
        </Grid>

        {/* Client Table */}
        <ClientTable
          clients={clients}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          formatAmount={formatAmount}
        />
      </Container>
    </MainLayout>
  );
}