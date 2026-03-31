/**
 * Home Page - Swiss Functional
 * Simple, efficient landing page
 */

import Link from 'next/link';
import { ArrowRight, Shield, Users, TrendingUp, Clock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center font-black text-xl">
                K
              </div>
              <span className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                Kreancia
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="px-6 py-3 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all font-medium"
              >
                Connexion
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="bg-white border-b-2 border-gray-900">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-6xl font-black text-gray-900 uppercase tracking-tight mb-8">
                Gestion de Crédits
                <br />
                <span className="text-gray-600">Simple & Efficace</span>
              </h1>

              <p className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed">
                Solution complète pour suivre vos créances, optimiser vos encaissements
                et améliorer votre trésorerie. Conçue pour les commerçants.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link
                  href="/login"
                  className="px-8 py-4 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all font-bold text-lg flex items-center justify-center gap-2"
                >
                  Commencer
                  <ArrowRight size={24} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-4">
                Pourquoi Kreancia
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Des outils efficaces pour une gestion financière brutalement simple
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white border-2 border-gray-900 p-6"
                >
                  <div className="w-16 h-16 bg-gray-900 text-white flex items-center justify-center mb-4">
                    <feature.icon size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-white border-b-2 border-gray-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center border-2 border-gray-200 p-8">
                  <div className="text-5xl font-black text-gray-900 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-lg font-medium text-gray-600 uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-4xl font-black uppercase tracking-tight mb-6">
              Prêt à Simplifier ?
            </h2>
            <p className="text-xl mb-8 text-gray-300">
              Rejoignez les commerçants qui font confiance à Kreancia
            </p>
            <Link
              href="/login"
              className="px-8 py-4 bg-white text-gray-900 border-2 border-white hover:bg-gray-900 hover:text-white transition-all font-bold text-lg inline-flex items-center gap-2"
            >
              Commencer Maintenant
              <ArrowRight size={24} />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 border-t-2 border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white text-gray-900 flex items-center justify-center font-black text-xl">
              K
            </div>
            <span className="text-2xl font-black uppercase tracking-tight">Kreancia</span>
          </div>

          <div className="text-center text-gray-400">
            <p className="mb-2 font-medium">© 2026 Kreancia by Teknovat. Tous droits réservés.</p>
            <p className="text-sm uppercase tracking-wide">Gestion de Crédits Client</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: 'Sécurisé',
    description: 'Protection des données avec chiffrement bancaire et isolation multi-tenant',
    icon: Shield,
  },
  {
    title: 'Multi-Clients',
    description: 'Gestion centralisée de tous vos clients et leurs crédits',
    icon: Users,
  },
  {
    title: 'Analytics',
    description: 'Tableaux de bord clairs pour un suivi efficace de vos performances',
    icon: TrendingUp,
  },
  {
    title: 'Temps Réel',
    description: 'Mise à jour instantanée des informations pour une prise de décision rapide',
    icon: Clock,
  },
];

const stats = [
  {
    value: '100%',
    label: 'Sécurisé'
  },
  {
    value: '0€',
    label: 'Frais Setup'
  },
  {
    value: '24/7',
    label: 'Disponible'
  }
];