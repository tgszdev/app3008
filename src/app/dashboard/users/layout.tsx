import { requireAdmin } from '@/lib/auth-check'

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar se é admin antes de renderizar
  await requireAdmin()
  
  return <>{children}</>
}