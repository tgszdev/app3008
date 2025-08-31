import { requireAuth } from '@/lib/auth-check'
import ClientLayout from './client-layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar autenticação no servidor
  await requireAuth()
  
  // Renderizar o layout client-side apenas se autenticado
  return <ClientLayout>{children}</ClientLayout>
}