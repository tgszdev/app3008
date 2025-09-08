'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
  const isAdmin = (session?.user as any)?.role === 'admin'

  const links = [
    {
      href: '/dashboard/timesheets',
      label: 'Meus Apontamentos',
      icon: Clock,
      show: true
    },
    {
      href: '/dashboard/timesheets/admin',
      label: 'Aprovações',
      icon: Shield,
      show: isAdmin
    },
    {
      href: '/dashboard/timesheets/analytics',
      label: 'Analytics',
      icon: BarChart3,
      show: isAdmin
    },
    {
      href: '/dashboard/timesheets/permissions',
      label: 'Permissões',
      icon: Users,
      show: isAdmin
    }
  ]

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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{link.label}</span>
          </Link>
        )
      })}
    </div>
  )
}