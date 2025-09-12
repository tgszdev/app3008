import { useSession } from 'next-auth/react'

export interface UserPermissions {
  // Tickets
  tickets_view: boolean
  tickets_create: boolean
  tickets_edit_own: boolean
  tickets_edit_all: boolean
  tickets_delete: boolean
  tickets_assign: boolean
  tickets_close: boolean
  
  // Knowledge Base
  kb_view: boolean
  kb_create: boolean
  kb_edit: boolean
  kb_delete: boolean
  kb_manage_categories: boolean
  
  // Timesheets
  timesheets_view_own: boolean
  timesheets_view_all: boolean
  timesheets_create: boolean
  timesheets_edit_own: boolean
  timesheets_edit_all: boolean
  timesheets_approve: boolean
  timesheets_analytics: boolean
  timesheets_analytics_full: boolean
  
  // System
  system_settings: boolean
  system_users: boolean
  system_roles: boolean
  system_backup: boolean
  system_logs: boolean
}

export function usePermissions() {
  const { data: session, status } = useSession()
  
  const loading = status === 'loading'
  const userRole = (session?.user as any)?.role || 'user'
  const userPermissions = (session?.user as any)?.permissions || {}
  const userId = (session?.user as any)?.id
  
  // Admin tem todas as permissões
  const isAdmin = userRole === 'admin'
  
  // Função auxiliar para verificar permissão
  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (isAdmin) return true
    return userPermissions[permission] === true
  }
  
  // Permissões específicas de analytics
  const canViewAnalytics = hasPermission('timesheets_analytics')
  const canViewFullAnalytics = hasPermission('timesheets_analytics_full')
  
  return {
    loading,
    userId,
    userRole,
    isAdmin,
    permissions: userPermissions as UserPermissions,
    hasPermission,
    canViewAnalytics,
    canViewFullAnalytics,
  }
}