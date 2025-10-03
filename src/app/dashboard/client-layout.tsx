'use client'

import { useState, useEffect } from 'react'
import '@/styles/sticky-sidebar.css'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useProtectedSession } from '@/hooks/useProtectedSession'
import { OrganizationSelector } from '@/components/OrganizationSelector'
import { OrganizationDebug } from '@/components/debug/OrganizationDebug'
import {
  Home,
  Ticket,
  Users,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  ChevronRight,
  BarChart3,
  MessageSquare,
  FileText,
  Loader2,
  BookOpen,
  Building,
  Clock,
  Shield,
  TrendingUp,
  UserCheck,
  ClipboardList,
  CheckCircle,
  PieChart,
  Lock,
  Gauge,
  Star,
  FolderOpen,
  Folder as FolderIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import NotificationBell from '@/components/notifications/NotificationBell'
import { Tooltip } from '@/components/ui/tooltip'
import { LucideIcon } from 'lucide-react'
import { StickySidebar } from '@/components/dashboard/StickySidebar'

interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  adminOnly?: boolean
}

interface NavigationSection {
  title: string
  icon: LucideIcon
  items: NavigationItem[]
  adminOnly?: boolean
}

const navigationSections: NavigationSection[] = [
  {
    title: 'OPERAÇÕES',
    icon: ClipboardList,
    items: [
      { name: 'Chamados', href: '/dashboard/tickets', icon: Ticket },
      { name: 'Comentários', href: '/dashboard/comments', icon: MessageSquare },
    ]
  },
  {
    title: 'ANÁLISES',
    icon: BarChart3,
    items: [
      { name: 'Estatísticas', href: '/dashboard/analytics', icon: BarChart3 },
      { name: 'Multi-Cliente', href: '/dashboard/multi-client', icon: Building, adminOnly: true },
      { name: 'Analytics de Horas', href: '/dashboard/timesheets/analytics', icon: PieChart, adminOnly: true },
      { name: 'Relatórios', href: '/dashboard/reports', icon: FileText },
      { name: 'Satisfação', href: '/dashboard/satisfaction', icon: Star },
    ]
  },
  {
    title: 'RECURSOS',
    icon: BookOpen,
    items: [
      { name: 'Base de Conhecimento', href: '/dashboard/knowledge-base', icon: BookOpen },
    ]
  },
  {
    title: 'ADMINISTRAÇÃO',
    icon: Settings,
    adminOnly: true,
    items: [
      { name: 'Organizações', href: '/dashboard/organizations', icon: Building },
      { name: 'Aprovação de Horas', href: '/dashboard/timesheets/admin', icon: CheckCircle },
      { name: 'Usuários', href: '/dashboard/users', icon: Users },
      { name: 'Permissões', href: '/dashboard/timesheets/permissions', icon: Lock },
      { name: 'SLA', href: '/dashboard/sla', icon: Gauge },
      { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
    ]
  }
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  // Removed section collapse logic - now handled by StickySidebar
  
  // Proteção de sessão com notificações
  useProtectedSession({
    showNotifications: true,
    enableSSE: true,
    enablePolling: true,
    pollingInterval: 10000, // Fallback polling a cada 10s
    redirectTo: '/login?reason=session_invalidated'
  })

  
  // Sidebar is always in sticky mode (64px wide)

  // Verificar autenticação
  useEffect(() => {
    if (status === 'loading') return // Ainda carregando
    
    if (status === 'unauthenticated') {
      console.log('Usuário não autenticado, redirecionando para login')
      router.push('/login')
    }
  }, [status, router])

  const userRole = (session?.user as any)?.role
  const isAdmin = userRole === 'admin'

  // Mostrar loading enquanto verifica autenticação
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Se não estiver autenticado, não mostrar nada (vai redirecionar)
  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        mobileMenuOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setMobileMenuOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800">
          <div className="flex h-16 items-center justify-between px-6">
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              Suporte
            </span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto" style={{ paddingBottom: '180px' }}>
            {/* Dashboard Link */}
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                pathname === '/dashboard'
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="mr-3 h-5 w-5" />
              Dashboard
            </Link>
            
            {/* Apontamentos Link */}
            <Link
              href="/dashboard/timesheets"
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors mb-4",
                pathname.startsWith('/dashboard/timesheets')
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Clock className="mr-3 h-5 w-5" />
              Apontamentos
            </Link>
            
            {/* Navigation Sections */}
            {navigationSections.map((section) => {
              // Skip admin sections for non-admin users
              if (section.adminOnly && !isAdmin) return null
              
              const isSectionCollapsed = false // Always expanded in mobile
              const SectionIcon = section.icon
              
              return (
                <div key={section.title} className="space-y-1">
                  <div className="w-full flex items-center px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <SectionIcon className="mr-2 h-4 w-4" />
                    {section.title}
                  </div>
                  
                  <div className="space-y-1 ml-2">
                      {section.items.map((item) => {
                        // Skip admin items for non-admin users
                        if (item.adminOnly && !isAdmin) return null
                        
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                              isActive
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Icon className="mr-3 h-5 w-5" />
                            {item.name}
                          </Link>
                        )
                      })}
                    </div>
                </div>
              )
            })}
          </nav>
          
          {/* User section at bottom of mobile sidebar */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <div className="space-y-3">
              <div className="flex items-center rounded-lg p-2 bg-gray-50 dark:bg-gray-700/50">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  setIsLoggingOut(true)
                  setMobileMenuOpen(false)
                  try {
                    await signOut({ callbackUrl: '/login' })
                  } catch (error) {
                    console.error('Erro ao fazer logout:', error)
                    window.location.href = '/login'
                  }
                }}
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                <span>{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar - Sticky Mode (Always 64px) */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col lg:w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex flex-1 flex-col">
          {/* Logo/Brand */}
          <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">
              S
            </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto">
            {/* Dashboard Link */}
            <div className="px-2 pt-4 pb-2">
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200",
                  pathname === '/dashboard'
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
                title="Dashboard"
              >
                <Home className="h-5 w-5" />
              </Link>
            </div>
            
            <div className="mx-4 h-px bg-gray-200 dark:bg-gray-700" />
            
            {/* Apontamentos Link */}
            <div className="px-2 pt-2 pb-2">
              <Link
                href="/dashboard/timesheets"
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200",
                  pathname.startsWith('/dashboard/timesheets')
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
                title="Apontamentos"
              >
                <Clock className="h-5 w-5" />
              </Link>
            </div>
            
            <div className="mx-4 h-px bg-gray-200 dark:bg-gray-700" />
            
            {/* Sticky Sections */}
            <StickySidebar sections={navigationSections} isAdmin={isAdmin} />
          </nav>
          
          {/* User section at bottom of sidebar - Sticky Mode */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-2 space-y-2">
            <Tooltip 
              content={`${session?.user?.name} (${userRole === 'admin' ? 'Admin' : userRole === 'agent' ? 'Agente' : 'Usuário'})`} 
              side="right"
            >
              <div className="flex items-center justify-center rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
            </Tooltip>
            <Tooltip content="Sair" side="right">
              <button
                onClick={async () => {
                  setIsLoggingOut(true)
                  try {
                    await signOut({ callbackUrl: '/login' })
                  } catch (error) {
                    console.error('Erro ao fazer logout:', error)
                    window.location.href = '/login'
                  }
                }}
                className="w-full flex items-center justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Main content - Always 64px margin for sticky sidebar */}
      <div className="min-h-screen lg:ml-16">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>

              {/* Notifications */}
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      
      {/* Debug Component - apenas em desenvolvimento */}
      <OrganizationDebug />
    </div>
  )
}