/**
 * Payments Page Redesigned - Swiss Functional
 * Simple, efficient payment management interface
 */

'use client';

import { useState } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

import MainLayout from '@/components/layout/MainLayout';

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b-2 border-gray-900">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
                  Paiements
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Gestion des paiements client
                </p>
              </div>

              <div className="flex gap-4">
                <button className="p-3 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all">
                  <RefreshCw size={24} />
                </button>
                <button className="px-6 py-3 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all font-medium flex items-center gap-2">
                  <Plus size={20} />
                  Nouveau Paiement
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Search and Filters */}
          <div className="flex gap-4 mb-8">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher des paiements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none"
              />
            </div>
            <button className="px-6 py-3 border-2 border-gray-200 hover:border-gray-900 transition-all flex items-center gap-2">
              <Filter size={20} />
              Filtres
            </button>
          </div>

          {/* Payments Grid - Placeholder */}
          <div className="border-2 border-gray-200 bg-white">
            <div className="border-b-2 border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Liste des Paiements</h2>
            </div>

            <div className="p-8 text-center">
              <DollarSign size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun paiement trouvé</h3>
              <p className="text-gray-600 mb-6">
                Commencez par enregistrer votre premier paiement.
              </p>
              <button className="px-6 py-3 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all font-medium inline-flex items-center gap-2">
                <Plus size={20} />
                Enregistrer un Paiement
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}