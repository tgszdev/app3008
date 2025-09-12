import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ClientLayout from './client-layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar autenticação no servidor
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  // Verificar sessão única no banco (opcional)
  // Podemos adicionar verificação de sessão aqui também
  
  return <ClientLayout>{children}</ClientLayout>
}