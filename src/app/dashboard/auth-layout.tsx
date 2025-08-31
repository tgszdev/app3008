import { requireAuth } from '@/lib/auth-check'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar autenticação antes de renderizar
  await requireAuth()
  
  return <>{children}</>
}