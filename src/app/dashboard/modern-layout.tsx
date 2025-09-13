'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ModernSidebar } from '@/components/sidebar/ModernSidebar'
import { useProtectedSession } from '@/hooks/useProtectedSession'
import { Loader2, Menu, X, Bell, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import NotificationBell from '@/components/notifications/NotificationBell'

export default function ModernDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Proteção de sessão com notificações
  useProtectedSession({
    showNotifications: true,
    enableSSE: true,
    enablePolling: true,
    pollingInterval: 10000,
    redirectTo: '/login?reason=session_invalidated'
  })
  
  // Load sidebar state
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    setSidebarCollapsed(saved === 'true')
  }, [])
  
  // Listen for sidebar state changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sidebarCollapsed')
      setSidebarCollapsed(saved === 'true')
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])
  
  // Check authentication
  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      console.log('Usuário não autenticado, redirecionando para login')
      router.push('/login')
    }
  }, [status, router])
  
  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-black">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }
  
  // Don't show anything if not authenticated
  if (status === 'unauthenticated') {
    return null
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Modern Sidebar for Desktop */}
      <div className="hidden lg:block">
        <ModernSidebar />
      </div>
      
      {/* Mobile Sidebar Overlay */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden transition-opacity duration-300",
        mobileSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
          onClick={() => setMobileSidebarOpen(false)} 
        />
        <div className={cn(
          "fixed left-0 top-0 h-full transition-transform duration-300 transform",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <ModernSidebar />
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-[280px]"
      )}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-400" />
            </button>
            
            {/* Page Title */}
            <div className="flex-1 lg:flex-none">
              <h1 className="text-lg font-semibold text-white">
                {session?.user?.name ? `Olá, ${session.user.name}` : 'Dashboard'}
              </h1>
              <p className="text-xs text-gray-400">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <NotificationBell />
              
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors group"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                )}
              </button>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">
            {/* Glass Card Container */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-2xl">
              <div className="p-6">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}