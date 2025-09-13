'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useProtectedSession } from '@/hooks/useProtectedSession'
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
  ChevronUp,
  BarChart3,
  MessageSquare,
  FileText,
  Loader2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Shield,
  TrendingUp,
  UserCheck,
  ClipboardList,
  CheckCircle,
  PieChart,
  Lock,
  Gauge,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import NotificationBell from '@/components/notifications/NotificationBell'
import { Tooltip } from '@/components/ui/tooltip'
import { LucideIcon } from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Chamados', href: '/dashboard/tickets', icon: Ticket },
  { name: 'Apontamentos', href: '/dashboard/timesheets', icon: Clock },
  { name: 'Comentários', href: '/dashboard/comments', icon: MessageSquare },
  { name: 'Base de Conhecimento', href: '/dashboard/knowledge-base', icon: BookOpen },
  { name: 'Relatórios', href: '/dashboard/reports', icon: FileText },
  { name: 'Estatísticas', href: '/dashboard/analytics', icon: BarChart3 },
]

const adminNavigation: NavigationItem[] = [
  { name: 'Aprovação de Horas', href: '/dashboard/timesheets/admin', icon: CheckCircle },
  { name: 'Analytics de Horas', href: '/dashboard/timesheets/analytics', icon: PieChart },
  { name: 'Usuários', href: '/dashboard/users', icon: Users },
  { name: 'Permissões', href: '/dashboard/timesheets/permissions', icon: Lock },
  { name: 'SLA', href: '/dashboard/sla', icon: Gauge },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  // Proteção de sessão com notificações
  useProtectedSession({
    showNotifications: true,
    enableSSE: true,
    enablePolling: true,
    pollingInterval: 10000, // Fallback polling a cada 10s
    redirectTo: '/login?reason=session_invalidated'
  })

  
  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved === 'true') {
      setSidebarCollapsed(true)
    }
  }, [])
  
  // Save sidebar collapsed state to localStorage
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', newState.toString())
  }

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
  const allNavigation = isAdmin ? [...navigation, ...adminNavigation] : navigation

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
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800">
          <div className="flex h-16 items-center justify-between px-6">
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              Suporte
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {allNavigation.map((item) => {
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
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300",
        sidebarCollapsed ? "lg:w-16" : "lg:w-64"
      )}>
        <div className="flex flex-1 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className={cn(
            "flex h-16 items-center border-b border-gray-200 dark:border-gray-700",
            sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
          )}>
            {sidebarCollapsed ? (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                S
              </div>
            ) : (
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                Sistema de Suporte
              </span>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Recolher menu"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {/* Toggle button when collapsed */}
          {sidebarCollapsed && (
            <div className="px-2 py-2 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={toggleSidebar}
                className="w-full p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Expandir menu"
              >
                <ChevronRight className="h-5 w-5 mx-auto" />
              </button>
            </div>
          )}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {allNavigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              if (sidebarCollapsed) {
                return (
                  <Tooltip key={item.name} content={item.name} side="right">
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-center px-2.5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                    </Link>
                  </Tooltip>
                )
              } else {
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
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                )
              }
            })}
          </nav>
          
          {/* User section at bottom of sidebar */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            {sidebarCollapsed ? (
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
            ) : (
              <div className="flex items-center rounded-lg p-2">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {userRole === 'admin' ? 'Administrador' : userRole === 'agent' ? 'Agente' : 'Usuário'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
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

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-x-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    {session?.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block">{session?.user?.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {session?.user?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {session?.user?.email}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        setIsLoggingOut(true)
                        setUserMenuOpen(false)
                        
                        try {
                          // Fazer signOut e redirecionar
                          await signOut({ 
                            callbackUrl: '/login'
                          })
                        } catch (error) {
                          console.error('Erro ao fazer logout:', error)
                          // Forçar redirecionamento se houver erro
                          window.location.href = '/login'
                        }
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                      )}
                      {isLoggingOut ? 'Saindo...' : 'Sair'}
                    </button>
                  </div>
                )}
              </div>
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
    </div>
  )
}