import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

interface AuthWrapperProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireRole?: string[]
  redirectTo?: string
}

export async function AuthWrapper({
  children,
  requireAuth = true,
  requireRole,
  redirectTo = '/login'
}: AuthWrapperProps) {
  const session = await auth()

  // Se requer autenticação e não está autenticado
  if (requireAuth && !session) {
    redirect(redirectTo)
  }

  // Se requer role específica
  if (requireRole && session) {
    const userRole = session.user?.role as string
    if (!requireRole.includes(userRole)) {
      redirect('/dashboard')
    }
  }

  // Se está autenticado e tenta acessar página de login
  if (session && redirectTo === '/login') {
    redirect('/dashboard')
  }

  return <>{children}</>
}