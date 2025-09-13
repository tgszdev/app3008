'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import * as Tooltip from '@radix-ui/react-tooltip'
import { 
  Home, 
  Ticket, 
  Clock, 
  MessageSquare, 
  BookOpen, 
  BarChart3, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  CheckCircle,
  PieChart,
  Lock,
  Gauge,
  LogOut,
  User,
  Bell,
  Menu,
  X,
  TrendingUp,
  FileText,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

interface NavigationItem {
  id: string
  name: string
  href: string
  icon: React.ElementType
  badge?: number | string
  color?: string
  adminOnly?: boolean
  subItems?: NavigationItem[]
}

const mainNavigation: NavigationItem[] = [
  { 
    id: 'dashboard',
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home,
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    id: 'tickets',
    name: 'Chamados', 
    href: '/dashboard/tickets', 
    icon: Ticket,
    badge: 'New',
    color: 'from-purple-500 to-pink-500'
  },
  { 
    id: 'timesheets',
    name: 'Apontamentos', 
    href: '/dashboard/timesheets', 
    icon: Clock,
    color: 'from-green-500 to-emerald-500',
    subItems: [
      { 
        id: 'timesheets-list',
        name: 'Meus Apontamentos', 
        href: '/dashboard/timesheets', 
        icon: Clock 
      },
      { 
        id: 'timesheets-admin',
        name: 'Aprovar Horas', 
        href: '/dashboard/timesheets/admin', 
        icon: CheckCircle,
        adminOnly: true,
        badge: 5
      },
      { 
        id: 'timesheets-analytics',
        name: 'Analytics', 
        href: '/dashboard/timesheets/analytics', 
        icon: PieChart,
        adminOnly: true
      },
      { 
        id: 'timesheets-permissions',
        name: 'Permissões', 
        href: '/dashboard/timesheets/permissions', 
        icon: Lock,
        adminOnly: true
      }
    ]
  },
  { 
    id: 'comments',
    name: 'Comentários', 
    href: '/dashboard/comments', 
    icon: MessageSquare,
    color: 'from-orange-500 to-amber-500'
  },
  { 
    id: 'knowledge',
    name: 'Base de Conhecimento', 
    href: '/dashboard/knowledge-base', 
    icon: BookOpen,
    color: 'from-indigo-500 to-purple-500'
  }
]

const analyticsNavigation: NavigationItem[] = [
  { 
    id: 'reports',
    name: 'Relatórios', 
    href: '/dashboard/reports', 
    icon: FileText,
    color: 'from-teal-500 to-green-500'
  },
  { 
    id: 'analytics',
    name: 'Analytics', 
    href: '/dashboard/analytics', 
    icon: TrendingUp,
    color: 'from-rose-500 to-pink-500'
  }
]

const adminNavigation: NavigationItem[] = [
  { 
    id: 'users',
    name: 'Usuários', 
    href: '/dashboard/users', 
    icon: Users,
    color: 'from-violet-500 to-purple-500'
  },
  { 
    id: 'sla',
    name: 'SLA', 
    href: '/dashboard/sla', 
    icon: Gauge,
    color: 'from-red-500 to-orange-500'
  },
  { 
    id: 'settings',
    name: 'Configurações', 
    href: '/dashboard/settings', 
    icon: Settings,
    color: 'from-gray-500 to-gray-600'
  }
]

export function ModernSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  
  const isAdmin = (session?.user as any)?.role === 'admin'
  const userAvatar = (session?.user as any)?.avatar_url
  const userName = session?.user?.name || 'Usuário'
  
  // Persist collapse state
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved === 'true') {
      setCollapsed(true)
    }
  }, [])
  
  const toggleCollapse = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', newState.toString())
  }
  
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }
  
  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }
  
  const isSubItemActive = (items?: NavigationItem[]) => {
    if (!items) return false
    return items.some(item => isActiveRoute(item.href))
  }
  
  const renderNavItem = (item: NavigationItem, isSubItem = false) => {
    const Icon = item.icon
    const isActive = isActiveRoute(item.href)
    const hasSubItems = item.subItems && item.subItems.length > 0
    const isExpanded = expandedItem === item.id
    const isParentActive = hasSubItems && isSubItemActive(item.subItems)
    
    // Filter admin-only items
    if (item.adminOnly && !isAdmin) return null
    
    const itemContent = (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <div
          className={cn(
            "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer",
            isActive || isParentActive ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white shadow-lg shadow-blue-500/10" : "text-gray-400 hover:text-white hover:bg-white/5",
            isSubItem && "ml-6 py-2"
          )}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => {
            if (hasSubItems) {
              setExpandedItem(isExpanded ? null : item.id)
            }
          }}
        >
          {/* Active indicator */}
          {(isActive || isParentActive) && !isSubItem && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-r-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          
          {/* Icon with gradient on hover/active */}
          <div className={cn(
            "relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
            isActive && !isSubItem && `bg-gradient-to-br ${item.color || 'from-blue-500 to-cyan-500'} shadow-lg`,
            !isActive && hoveredItem === item.id && "bg-white/10"
          )}>
            <Icon className={cn(
              "w-5 h-5 transition-all duration-200",
              isActive ? "text-white" : "text-gray-400 group-hover:text-white",
              hoveredItem === item.id && "scale-110"
            )} />
            
            {/* Glow effect on hover */}
            {hoveredItem === item.id && !isActive && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0.3 }}
                exit={{ scale: 0, opacity: 0 }}
                className={cn(
                  "absolute inset-0 rounded-lg bg-gradient-to-br",
                  item.color || "from-blue-500 to-cyan-500"
                )}
              />
            )}
          </div>
          
          {/* Text and badge */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex items-center justify-between overflow-hidden"
              >
                <span className="font-medium whitespace-nowrap">{item.name}</span>
                {item.badge && (
                  <span className={cn(
                    "px-2 py-0.5 text-xs rounded-full font-semibold",
                    typeof item.badge === 'number' 
                      ? "bg-red-500 text-white" 
                      : "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                  )}>
                    {item.badge}
                  </span>
                )}
                {hasSubItems && (
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isExpanded && "rotate-90"
                  )} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Tooltip for collapsed state */}
        {collapsed && !isSubItem && (
          <AnimatePresence>
            {hoveredItem === item.id && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50"
              >
                <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl border border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="font-medium whitespace-nowrap">{item.name}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs bg-red-500 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    )
    
    if (hasSubItems) {
      return (
        <div key={item.id}>
          {itemContent}
          <AnimatePresence>
            {isExpanded && !collapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {item.subItems?.map(subItem => {
                  if (subItem.adminOnly && !isAdmin) return null
                  return (
                    <Link key={subItem.id} href={subItem.href}>
                      {renderNavItem(subItem, true)}
                    </Link>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    }
    
    return (
      <Link key={item.id} href={item.href}>
        {itemContent}
      </Link>
    )
  }
  
  return (
    <Tooltip.Provider delayDuration={0}>
      <motion.aside
        initial={{ width: collapsed ? 80 : 280 }}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black",
          "border-r border-gray-800 shadow-2xl shadow-black/50 z-40",
          "flex flex-col backdrop-blur-xl"
        )}
      >
        {/* Glass effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        {/* Header */}
        <div className="relative p-4 border-b border-gray-800">
          <motion.div 
            className="flex items-center gap-3"
            animate={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  <h2 className="font-bold text-white text-lg">Portal</h2>
                  <p className="text-xs text-gray-400">Sistema de Suporte</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
          {/* Main Navigation */}
          <div className="space-y-1">
            {mainNavigation.map(item => renderNavItem(item))}
          </div>
          
          {/* Analytics Section */}
          <div className="pt-3 mt-3 border-t border-gray-800 space-y-1">
            {!collapsed && (
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Análises
              </p>
            )}
            {analyticsNavigation.map(item => renderNavItem(item))}
          </div>
          
          {/* Admin Section */}
          {isAdmin && (
            <div className="pt-3 mt-3 border-t border-gray-800 space-y-1">
              {!collapsed && (
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Administração
                </p>
              )}
              {adminNavigation.map(item => renderNavItem(item))}
            </div>
          )}
        </nav>
        
        {/* Footer */}
        <div className="relative border-t border-gray-800 p-3 space-y-2">
          {/* User Profile */}
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer",
            collapsed && "justify-center"
          )}>
            <div className="relative">
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt={userName} 
                  className="w-8 h-8 rounded-full border-2 border-gray-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-900" />
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={toggleCollapse}
                  className="flex-1 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  {collapsed ? (
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white mx-auto" />
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-white" />
                  )}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="bg-gray-900 text-white px-2 py-1 rounded text-xs border border-gray-700">
                  {collapsed ? 'Expandir' : 'Colapsar'}
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
            
            {!collapsed && (
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={handleLogout}
                    className="p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors group"
                  >
                    <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="bg-gray-900 text-white px-2 py-1 rounded text-xs border border-gray-700">
                    Sair
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            )}
          </div>
        </div>
      </motion.aside>
    </Tooltip.Provider>
  )
}