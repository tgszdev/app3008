import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ClientLayout from './client-layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TEMPORÁRIO: Permitir acesso sem autenticação para debug
  const session = await auth()
  
  // Se não está autenticado, permitir acesso temporariamente
  if (!session) {
    console.log('⚠️ Usuário não autenticado - permitindo acesso temporário')
    // redirect('/login') // COMENTADO TEMPORARIAMENTE
  }
  
  // Renderizar o layout (com ou sem autenticação)
  return <ClientLayout>{children}</ClientLayout>
}