import Link from 'next/link'
import { User, ArrowLeft, Search } from 'lucide-react'

import MainLayout from '@/components/layout/MainLayout'

/**
 * Not Found page for client profiles
 * Displayed when client ID doesn't exist or user doesn't have access
 */
export default function ClientNotFound() {
  return (
    <MainLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          {/* Icon */}
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={40} className="text-slate-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            Client non trouvé
          </h1>

          {/* Description */}
          <p className="text-slate-600 mb-8 leading-relaxed">
            Le client que vous recherchez n'existe pas ou vous n'avez pas les autorisations pour y accéder.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/clients"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              <ArrowLeft size={16} />
              Retour à la liste
            </Link>

            <Link
              href="/clients"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors duration-200"
            >
              <Search size={16} />
              Rechercher un client
            </Link>
          </div>

          {/* Additional help */}
          <p className="text-sm text-slate-500 mt-6">
            Si vous pensez qu'il s'agit d'une erreur, veuillez vérifier l'URL ou contacter le support.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}