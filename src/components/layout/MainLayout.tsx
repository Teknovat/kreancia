/**
 * Main Layout - Swiss Functional Brutalism
 * Architecturally precise layout with complete navigation system
 */

'use client';

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Users,
  CreditCard,
  DollarSign,
  Menu,
  X,
  LogOut,
  Plus,
  Settings,
  BarChart3
} from "lucide-react";
import { useState } from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: 'Tableau de bord',
    href: '/dashboard',
    icon: Home,
    description: 'Vue d\'ensemble'
  },
  {
    name: 'Clients',
    href: '/clients',
    icon: Users,
    description: 'Gestion clientèle'
  },
  {
    name: 'Crédits',
    href: '/credits',
    icon: CreditCard,
    description: 'Suivi des créances'
  },
  {
    name: 'Paiements',
    href: '/payments',
    icon: DollarSign,
    description: 'Encaissements'
  },
];

const quickActions = [
  {
    name: 'Nouveau Client',
    href: '/clients/new',
    icon: Users
  },
  {
    name: 'Nouveau Crédit',
    href: '/credits/new',
    icon: CreditCard
  },
  {
    name: 'Nouveau Paiement',
    href: '/payments/new',
    icon: DollarSign
  }
];

export default function MainLayout({ children }: MainLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 border-4 border-gray-900 border-t-transparent animate-spin mx-auto" />
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">
              Kreancia
            </h2>
            <p className="text-lg font-medium text-gray-600">Chargement en cours</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-gray-900 text-white flex items-center justify-center mx-auto">
              <span className="text-3xl font-black">K</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
              Kreancia
            </h1>
            <p className="text-xl text-gray-600 font-medium">
              Accès sécurisé requis
            </p>
          </div>

          <div className="border-4 border-gray-900 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-4">
              Authentification
            </h2>
            <p className="text-gray-700 mb-6">
              Connectez-vous pour accéder à votre tableau de bord de gestion de crédits.
            </p>
            <Link
              href="/login"
              className="block w-full py-4 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all font-bold text-lg uppercase tracking-wide"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white border-r-4 border-gray-900 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="border-b-4 border-gray-900 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-900 text-white flex items-center justify-center">
                <span className="text-2xl font-black">K</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                  Kreancia
                </h1>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Credit Management
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden w-10 h-10 border-2 border-gray-900 flex items-center justify-center hover:bg-gray-900 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-8 space-y-2">
          <div className="mb-8">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 border-b-2 border-gray-200 pb-2">
              Navigation
            </h2>
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group block p-4 border-2 transition-all mb-2
                    ${isActive
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-transparent hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center space-x-4">
                    <item.icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'}`} />
                    <div className="flex-1">
                      <p className={`font-bold text-base ${isActive ? 'text-white' : 'text-gray-900'}`}>
                        {item.name}
                      </p>
                      <p className={`text-sm ${isActive ? 'text-gray-200' : 'text-gray-500'}`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 border-b-2 border-gray-200 pb-2">
              Actions Rapides
            </h2>
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="group flex items-center space-x-4 p-3 border-2 border-transparent hover:border-gray-300 hover:bg-gray-50 transition-all mb-2"
                onClick={() => setSidebarOpen(false)}
              >
                <Plus size={16} className="text-gray-600 group-hover:text-gray-900" />
                <action.icon className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
                <span className="font-medium text-gray-900 text-sm">{action.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t-4 border-gray-900 p-8 bg-gray-50">
          <div className="space-y-6">
            {/* User Profile */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-900 text-white flex items-center justify-center font-black text-lg">
                {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">
                  {session?.user?.name || 'Utilisateur'}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {session?.user?.email}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                  Merchant Account
                </p>
              </div>
            </div>

            {/* User Actions */}
            <div className="space-y-2">
              <button className="w-full flex items-center space-x-3 p-3 border-2 border-transparent hover:border-gray-300 hover:bg-white transition-all text-left">
                <Settings className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900 text-sm">Paramètres</span>
              </button>

              <button className="w-full flex items-center space-x-3 p-3 border-2 border-transparent hover:border-gray-300 hover:bg-white transition-all text-left">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900 text-sm">Rapports</span>
              </button>

              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center space-x-3 p-3 border-2 border-gray-900 bg-gray-900 text-white hover:bg-white hover:text-gray-900 transition-all"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-bold text-sm uppercase tracking-wide">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-0 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b-4 border-gray-900 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 border-2 border-gray-900 flex items-center justify-center hover:bg-gray-900 hover:text-white transition-all"
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-900 text-white flex items-center justify-center">
                <span className="text-lg font-black">K</span>
              </div>
              <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                Kreancia
              </h1>
            </div>

            <div className="w-10 h-10" /> {/* Spacer for balance */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}