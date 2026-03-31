import MainLayout from '@/components/layout/MainLayout'
import ClientProfileSkeleton from '@/components/client-profile/ClientProfileSkeleton'

/**
 * Loading UI for client profile page
 * Displayed while fetching client data
 */
export default function ClientProfileLoading() {
  return (
    <MainLayout>
      <ClientProfileSkeleton />
    </MainLayout>
  )
}