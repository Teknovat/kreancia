import Link from 'next/link'
import { ArrowRight, Shield, Users, TrendingUp, Clock } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-dark-50 dark:via-dark-100 dark:to-dark-50">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-dark-900">
                Kreancia
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/signin"
                className="btn btn-secondary"
              >
                Connexion
              </Link>
              <Link
                href="/auth/signup"
                className="btn btn-primary"
              >
                Commencer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="relative py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-dark-900 mb-6">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Gérez vos crédits client
                </span>
                <br />
                en toute simplicité
              </h1>

              <p className="text-xl text-gray-600 dark:text-dark-600 mb-8 max-w-2xl mx-auto">
                Une solution complète pour suivre vos créances, optimiser vos encaissements
                et améliorer votre trésorerie. Conçue spécialement pour les commerçants.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/signup"
                  className="btn btn-primary text-lg px-8 py-3"
                >
                  Démarrer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/demo"
                  className="btn btn-secondary text-lg px-8 py-3"
                >
                  Voir la démo
                </Link>
              </div>
            </div>
          </div>

          {/* Floating elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-primary-200 rounded-full animate-float opacity-20" />
          <div className="absolute top-40 right-20 w-16 h-16 bg-secondary-200 rounded-full animate-float opacity-20" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 left-20 w-12 h-12 bg-accent-200 rounded-full animate-float opacity-20" style={{ animationDelay: '2s' }} />
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white dark:bg-dark-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-dark-900 mb-4">
                Pourquoi choisir Kreancia ?
              </h2>
              <p className="text-lg text-gray-600 dark:text-dark-600 max-w-2xl mx-auto">
                Des outils puissants pour une gestion financière efficace
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="card-elevated p-6 text-center hover:scale-105 transition-transform duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-dark-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-5" />
          <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Prêt à simplifier votre gestion de crédits ?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Rejoignez les commerçants qui font déjà confiance à Kreancia
            </p>
            <Link
              href="/auth/signup"
              className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3"
            >
              Commencer maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-dark-50 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-xl font-bold">Kreancia</span>
          </div>

          <div className="text-center text-gray-400">
            <p className="mb-2">
              © 2026 Kreancia by Teknovat. Tous droits réservés.
            </p>
            <p className="text-sm">
              Gestion de crédits client pour commerçants
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    title: 'Sécurisé',
    description: 'Vos données sont protégées par un chiffrement de niveau bancaire',
    icon: Shield,
  },
  {
    title: 'Multi-clients',
    description: 'Gérez tous vos clients et leurs crédits depuis un seul endroit',
    icon: Users,
  },
  {
    title: 'Analytics',
    description: 'Suivez vos performances avec des tableaux de bord détaillés',
    icon: TrendingUp,
  },
  {
    title: 'Temps réel',
    description: 'Informations mises à jour instantanément pour une prise de décision rapide',
    icon: Clock,
  },
]