/**
 * Hook para gerenciar permissões do usuário
 */

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getRolePermissions, Permission } from '@/lib/permissions'

export function usePermissions() {
  const { data: session, update } = useSession()
  const [permissions, setPermissions] = useState<Permission | null>(null)
  const [loading, setLoading] = useState(true)
  const [forceReload, setForceReload] = useState(0)

  useEffect(() => {
    async function loadPermissions() {
      if (!session?.user) {
        setPermissions(null)
        setLoading(false)
        return
      }

      try {
        // Obter role do usuário (usar role_name se disponível, senão role)
        const userRole = (session.user as any).role_name || (session.user as any).role || 'user'
        
        console.log('=== usePermissions DEBUG ===')
        console.log('Carregando permissões para role:', userRole)
        console.log('Session user:', session.user)
        
        const rolePermissions = await getRolePermissions(userRole)
        
        console.log('Permissões carregadas:', rolePermissions)
        
        setPermissions(rolePermissions)
      } catch (error) {
        console.error('Erro ao carregar permissões:', error)
        setPermissions(null)
      } finally {
        setLoading(false)
      }
    }

    loadPermissions()
  }, [session, forceReload])

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  const hasPermission = (permission: keyof Permission): boolean => {
    if (!permissions) return false
    return permissions[permission] || false
  }

  /**
   * Verifica se o usuário tem pelo menos uma das permissões
   */
  const hasAnyPermission = (permissionList: (keyof Permission)[]): boolean => {
    if (!permissions) return false
    return permissionList.some(perm => permissions[perm])
  }

  /**
   * Verifica se o usuário tem todas as permissões
   */
  const hasAllPermissions = (permissionList: (keyof Permission)[]): boolean => {
    if (!permissions) return false
    return permissionList.every(perm => permissions[perm])
  }

  /**
   * Força o recarregamento das permissões
   */
  const reloadPermissions = () => {
    setForceReload(prev => prev + 1)
  }

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    reloadPermissions
  }
}