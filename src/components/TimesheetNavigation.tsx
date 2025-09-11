'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/hooks/usePermissions'
import {
  Clock,
  Shield,
  BarChart3,
  Settings,
  Users
} from 'lucide-react'

export default function TimesheetNavigation() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { hasPermission, loading } = usePermissions()
  
  // Fallback para admin para manter compatibilidade enquanto migra
  const isAdmin = (session?.user as any)?.role === 'admin'

  const links = [
    {
      href: '/dashboard/timesheets',
      label: 'Meus Apontamentos',
      icon: Clock,
      show: hasPermission('timesheets_view_own') || true // Sempre mostrar para todos os usuários
    },
    {
      href: '/dashboard/timesheets/admin',
      label: 'Aprovações',
      icon: Shield,
      show: hasPermission('timesheets_approve') || isAdmin
    },
    {
      href: '/dashboard/timesheets/analytics',
      label: 'Analytics',
      icon: BarChart3,
      show: hasPermission('timesheets_analytics') || isAdmin
    },
    {
      href: '/dashboard/timesheets/permissions',
      label: 'Permissões',
      icon: Users,
      show: hasPermission('system_users') || isAdmin // Permissões de sistema para gerenciar usuários
    }
  ]

  // Não renderizar navegação até as permissões carregarem
  if (loading) {
    return (
      <div className="flex gap-2 flex-wrap mb-6">
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 flex-wrap mb-6">
      {links.map((link) => {
        if (!link.show) return null
        
        const Icon = link.icon
        const isActive = pathname === link.href
        
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{link.label}</span>
          </Link>
        )
      })}
    </div>
  )
}