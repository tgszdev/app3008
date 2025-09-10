/**
 * Componente para controlar acesso baseado em permissões
 */

import { ReactNode } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/lib/permissions'

interface PermissionGateProps {
  permission?: keyof Permission
  permissions?: (keyof Permission)[]
  requireAll?: boolean
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions()

  if (loading) {
    return <div className="animate-pulse">Carregando...</div>
  }

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}