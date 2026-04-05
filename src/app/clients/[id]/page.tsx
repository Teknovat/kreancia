import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import MainLayout from '@/components/layout/MainLayout'
import ClientProfileContent from '@/components/client-profile/ClientProfileContent'
import ClientProfileSkeleton from '@/components/client-profile/ClientProfileSkeleton'
import { ClientOperations } from '@/utils/database'
import type { ClientWithStats } from '@/types/client'

interface ClientProfilePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

/**
 * Client Profile Page
 * Dynamic route for detailed client management with tabbed interface
 */
export default async function ClientProfilePage({
  params,
  searchParams
}: ClientProfilePageProps) {
  const { id } = await params
  const { tab = 'overview' } = await searchParams

  try {
    // Fetch client data with related credits and payments
    const client = await ClientOperations.findUnique(id, {
      credits: {
        include: {
          paymentAllocations: {
            include: {
              payment: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      payments: {
        include: {
          paymentAllocations: {
            include: {
              credit: true
            }
          }
        },
        orderBy: {
          paymentDate: 'desc'
        }
      }
    })

    if (!client) {
      notFound()
    }

    // Transform to ClientWithStats format
    const clientWithStats: ClientWithStats = {
      ...client,
      email: client.email ?? undefined, // Convert null to undefined
      phone: client.phone ?? undefined, // Convert null to undefined
      address: client.address ?? undefined, // Convert null to undefined
      businessName: client.businessName ?? undefined, // Convert null to undefined
      taxId: client.taxId ?? undefined, // Convert null to undefined
      creditLimit: client.creditLimit ? Number(client.creditLimit) : undefined, // Convert Decimal to number
      fullName: `${client.firstName} ${client.lastName}`,
      totalCredits: client.credits.length,
      outstandingAmount: client.credits.reduce((sum, credit) => sum + Number(credit.remainingAmount || 0), 0),
      overdueAmount: client.credits
        .filter(credit => credit.status === 'OVERDUE')
        .reduce((sum, credit) => sum + Number(credit.remainingAmount || 0), 0),
      lastActivity: client.credits[0]?.createdAt || client.payments[0]?.paymentDate || client.createdAt,
      creditCount: client.credits.length,
      paymentCount: client.payments.length,
      status: determineClientStatus(client)
    }

    return (
      <MainLayout>
        <Suspense fallback={<ClientProfileSkeleton />}>
          <ClientProfileContent client={clientWithStats} activeTab={tab} />
        </Suspense>
      </MainLayout>
    )
  } catch (error) {
    console.error('Error fetching client:', error)
    notFound()
  }
}

/**
 * Determine client status based on business logic
 */
function determineClientStatus(client: any): 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' {
  const hasOverdue = client.credits.some((credit: any) => credit.status === 'OVERDUE')
  const hasRecentActivity = client.credits.some((credit: any) => {
    const daysSinceCreated = (Date.now() - credit.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceCreated <= 90
  })

  if (hasOverdue) return 'SUSPENDED'
  if (hasRecentActivity) return 'ACTIVE'
  return 'INACTIVE'
}

/**
 * Generate page metadata
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const client = await ClientOperations.findUnique(id)

    if (!client) {
      return {
        title: 'Client non trouvé | Kreancia',
        description: 'Le client demandé n\'existe pas ou n\'est pas accessible.'
      }
    }

    const fullName = `${client.firstName} ${client.lastName}`

    return {
      title: `${fullName} | Profil Client | Kreancia`,
      description: `Profil détaillé de ${fullName} - Gestion des crédits, paiements et activité client.`
    }
  } catch {
    return {
      title: 'Erreur | Kreancia',
      description: 'Une erreur s\'est produite lors du chargement du profil client.'
    }
  }
}