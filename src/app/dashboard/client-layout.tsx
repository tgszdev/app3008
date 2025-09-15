'use client'

import { useState, useEffect } from 'react'
import '@/styles/sidebar.css'
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
  Star,
  FolderOpen,
  Folder as FolderIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import NotificationBell from '@/components/notifications/NotificationBell'
import { Tooltip } from '@/components/ui/tooltip'
import { LucideIcon } from 'lucide-react'
import { EnhancedSidebarSection } from '@/components/dashboard/EnhancedSidebar'

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
      { name: 'Apontamentos', href: '/dashboard/timesheets', icon: Clock },
      { name: 'Comentários', href: '/dashboard/comments', icon: MessageSquare },
    ]
  },
  {
    title: 'ANÁLISES',
    icon: BarChart3,
    items: [
      { name: 'Estatísticas', href: '/dashboard/analytics', icon: BarChart3 },
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<string[]>([])
  
  // Toggle section collapse with localStorage persistence
  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections(prev => {
      const newState = prev.includes(sectionTitle) 
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
      
      localStorage.setItem('collapsedSections', JSON.stringify(newState))
      return newState
    })
  }
  
  // Proteção de sessão com notificações
  useProtectedSession({
    showNotifications: true,
    enableSSE: true,
    enablePolling: true,
    pollingInterval: 10000, // Fallback polling a cada 10s
    redirectTo: '/login?reason=session_invalidated'
  })

  
  // Load sidebar and sections collapsed state from localStorage
  useEffect(() => {
    const savedSidebar = localStorage.getItem('sidebarCollapsed')
    if (savedSidebar === 'true') {
      setSidebarCollapsed(true)
    }
    
    const savedSections = localStorage.getItem('collapsedSections')
    if (savedSections) {
      try {
        setCollapsedSections(JSON.parse(savedSections))
      } catch (e) {
        console.error('Error parsing collapsed sections:', e)
      }
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
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {/* Dashboard Link */}
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors mb-4",
                pathname === '/dashboard'
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <Home className="mr-3 h-5 w-5" />
              Dashboard
            </Link>
            
            {/* Navigation Sections */}
            {navigationSections.map((section) => {
              // Skip admin sections for non-admin users
              if (section.adminOnly && !isAdmin) return null
              
              const isSectionCollapsed = collapsedSections.includes(section.title)
              const SectionIcon = section.icon
              
              return (
                <div key={section.title} className="space-y-1">
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <SectionIcon className="mr-2 h-4 w-4" />
                      {section.title}
                    </div>
                    {isSectionCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  
                  {!isSectionCollapsed && (
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
                            onClick={() => setSidebarOpen(false)}
                          >
                            <Icon className="mr-3 h-5 w-5" />
                            {item.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
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
                  setSidebarOpen(false)
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

      {/* Desktop sidebar */}
      <div className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col",
        sidebarCollapsed ? "sidebar-collapsed-enhanced" : "lg:w-64 transition-all duration-300"
      )}>
        <div className="flex flex-1 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 relative">
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
          <nav className="flex-1 space-y-2 px-2 py-4 overflow-y-auto">
            {/* Dashboard Link */}
            <Link
              href="/dashboard"
              data-sidebar-tooltip="Dashboard"
              className={cn(
                "sidebar-item flex items-center text-sm font-medium rounded-lg transition-all duration-200 mb-3",
                pathname === '/dashboard'
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                sidebarCollapsed ? "justify-center px-2.5 py-2.5" : "px-3 py-2"
              )}
            >
              <Home className={cn("h-5 w-5 flex-shrink-0", !sidebarCollapsed && "mr-3")} />
              <span className={cn("sidebar-label", sidebarCollapsed && "hidden")}>Dashboard</span>
            </Link>
            
            <div className="sidebar-section-divider" />
            
            {/* Navigation Sections with Enhanced Design */}
            {navigationSections.map((section) => (
              <EnhancedSidebarSection
                key={section.title}
                section={section}
                isAdmin={isAdmin}
                pathname={pathname}
                sidebarCollapsed={sidebarCollapsed}
                isSectionCollapsed={collapsedSections.includes(section.title)}
                onToggleSection={() => toggleSection(section.title)}
              />
            ))}
          </nav>
          
          {/* User section at bottom of sidebar */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2">
            {sidebarCollapsed ? (
              <>
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
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center rounded-lg p-2 bg-gray-50 dark:bg-gray-700/50">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
                    {session?.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>
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
                  className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:pl-[64px]" : "lg:pl-64"
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