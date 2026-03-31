import type { Metadata } from 'next'
import { Inter, Poppins, JetBrains_Mono } from 'next/font/google'
import SessionProvider from '@/components/providers/SessionProvider'
import { auth } from '@/lib/auth'
import './globals.css'

// Font configurations
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | Kreancia',
    default: 'Kreancia - Gestion de Crédits Client',
  },
  description: 'Application de gestion de crédits client pour commerçants. Gérez vos crédits clients, suivez les paiements et optimisez votre trésorerie.',
  keywords: [
    'gestion crédit',
    'crédit client',
    'facturation',
    'paiement',
    'trésorerie',
    'fintech',
    'commerce',
  ],
  authors: [{ name: 'Teknovat' }],
  creator: 'Teknovat',
  publisher: 'Teknovat',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    title: 'Kreancia - Gestion de Crédits Client',
    description: 'Application de gestion de crédits client pour commerçants.',
    siteName: 'Kreancia',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Kreancia - Gestion de Crédits Client',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kreancia - Gestion de Crédits Client',
    description: 'Application de gestion de crédits client pour commerçants.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: false, // Set to true in production
    follow: false, // Set to true in production
    googleBot: {
      index: false,
      follow: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add verification tokens in production
    // google: 'verification-token',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${poppins.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Security headers */}
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      </head>
      <body
        className={`${inter.className} antialiased min-h-screen bg-gray-50 dark:bg-dark-50`}
        suppressHydrationWarning
      >
        {/* App content */}
        <div id="app-root" className="min-h-screen">
          <SessionProvider session={session}>
            {children}
          </SessionProvider>
        </div>

        {/* Portal roots for modals, toasts, etc. */}
        <div id="modal-root" />
        <div id="toast-root" />

        {/* Development helpers */}
        {process.env.NODE_ENV === 'development' && (
          <>
            {/* Screen size indicator */}
            <div className="debug-screens" />
          </>
        )}
      </body>
    </html>
  )
}