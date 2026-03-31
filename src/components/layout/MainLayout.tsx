/**
 * Main Layout Redesigned - Swiss Functional
 * Clean, efficient layout with clear hierarchy
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
  LogOut
} from "lucide-react";
import { useState } from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Crédits', href: '/credits', icon: CreditCard },
  { name: 'Paiements', href: '/payments', icon: DollarSign },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto" />
          <p className="text-lg font-medium text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h1 className="text-4xl font-black uppercase tracking-tight text-gray-900 mb-4">
              Kreancia
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Connexion requise pour accéder à l'application
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-gray-900 text-white font-medium border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r-2 border-gray-900 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="border-b-2 border-gray-900 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
              Kreancia
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-4 py-3 text-base font-medium border-2 transition-all
                  ${isActive
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'text-gray-700 border-transparent hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t-2 border-gray-200 bg-gray-50">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center font-bold text-sm">
                {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name || 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 border-2 border-transparent hover:border-gray-300 hover:bg-white transition-all"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header - Mobile */}
        <div className="lg:hidden bg-white border-b-2 border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100"
            >
              <Menu size={24} />
            </button>

            <h1 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
              Kreancia
            </h1>

            <div className="w-10" /> {/* Spacer for balance */}
          </div>
        </div>

        {/* Page Content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}