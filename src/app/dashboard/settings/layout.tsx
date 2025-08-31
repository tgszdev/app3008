import { requireAdmin } from '@/lib/auth-check'

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar se é admin antes de renderizar
  await requireAdmin()
  
  return <>{children}</>
}