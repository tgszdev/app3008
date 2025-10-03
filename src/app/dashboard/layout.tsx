import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ClientLayout from './client-layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  
  return <ClientLayout>{children}</ClientLayout>
}