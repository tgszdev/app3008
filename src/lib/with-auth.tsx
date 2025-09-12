import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

interface WithAuthOptions {
  requireAuth?: boolean
  requireRole?: string[]
  redirectTo?: string
}

export function withAuth(
  Component: React.ComponentType<any>,
  options: WithAuthOptions = {}
) {
  return async function AuthenticatedComponent(props: any) {
    const { requireAuth = true, requireRole, redirectTo = '/login' } = options
    const session = await auth()

    if (requireAuth && !session) {
      redirect(redirectTo)
    }

    if (requireRole && session) {
      const userRole = session.user?.role as string
      if (!requireRole.includes(userRole)) {
        redirect('/dashboard')
      }
    }

    return <Component {...props} session={session} />
  }
}