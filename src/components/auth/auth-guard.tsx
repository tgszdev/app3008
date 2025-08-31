'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireRole?: string[]
}

export function AuthGuard({ 
  children, 
  requireAuth = true,
  requireRole 
}: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Se ainda estiver carregando, não fazer nada
    if (status === 'loading') return

    // Se requer autenticação e não está autenticado
    if (requireAuth && status === 'unauthenticated') {
      // Salvar a URL atual para redirecionar após login
      const callbackUrl = encodeURIComponent(pathname)
      router.push(`/login?callbackUrl=${callbackUrl}`)
      return
    }

    // Se requer um papel específico
    if (requireRole && session) {
      const userRole = (session.user as any)?.role
      if (!requireRole.includes(userRole)) {
        // Usuário não tem permissão
        router.push('/dashboard')
      }
    }
  }, [status, session, requireAuth, requireRole, router, pathname])

  // Mostrar loading enquanto verifica autenticação
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Se não está autenticado e requer autenticação
  if (requireAuth && status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Se passou todas as verificações, renderizar children
  return <>{children}</>
}