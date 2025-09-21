/**
 * Sistema de Permissões
 * Gerencia as permissões de usuários baseado em suas roles
 */

// Importar o cliente Supabase admin que já está configurado corretamente
import { supabaseAdmin } from '@/lib/supabase'

export interface Permission {
  tickets_view: boolean
  tickets_create: boolean
  tickets_edit_own: boolean
  tickets_edit_all: boolean
  tickets_delete: boolean
  tickets_assign: boolean
  tickets_close: boolean
  tickets_change_priority: boolean
  tickets_view_history: boolean
  kb_view: boolean
  kb_create: boolean
  kb_edit: boolean
  kb_delete: boolean
  kb_manage_categories: boolean
  timesheets_view_own: boolean
  timesheets_view_all: boolean
  timesheets_create: boolean
  timesheets_edit_own: boolean
  timesheets_edit_all: boolean
  timesheets_approve: boolean
  timesheets_analytics: boolean
  system_settings: boolean
  system_users: boolean
  system_roles: boolean
  system_backup: boolean
  system_logs: boolean
}

/**
 * Permissões padrão para roles do sistema
 */
const defaultSystemPermissions: Record<string, Permission> = {
  admin: {
    tickets_view: true,
    tickets_create: true,
    tickets_edit_own: true,
    tickets_edit_all: true,
    tickets_delete: true,
    tickets_assign: true,
    tickets_close: true,
    tickets_change_priority: true,
    tickets_view_history: true,
    kb_view: true,
    kb_create: true,
    kb_edit: true,
    kb_delete: true,
    kb_manage_categories: true,
    timesheets_view_own: true,
    timesheets_view_all: true,
    timesheets_create: true,
    timesheets_edit_own: true,
    timesheets_edit_all: true,
    timesheets_approve: true,
    timesheets_analytics: true,
    system_settings: true,
    system_users: true,
    system_roles: true,
    system_backup: true,
    system_logs: true
  },
  // Adicionando role 'dev' (desenvolvedor) com todas as permissões
  dev: {
    tickets_view: true,
    tickets_create: true,
    tickets_edit_own: true,
    tickets_edit_all: true,
    tickets_delete: true,
    tickets_assign: true,
    tickets_close: true,
    tickets_change_priority: true,
    tickets_view_history: true,
    kb_view: true,
    kb_create: true,
    kb_edit: true,
    kb_delete: true,
    kb_manage_categories: true,
    timesheets_view_own: true,
    timesheets_view_all: true,
    timesheets_create: true,
    timesheets_edit_own: true,
    timesheets_edit_all: true,
    timesheets_approve: true,
    timesheets_analytics: true,
    system_settings: true,
    system_users: true,
    system_roles: true,
    system_backup: true,
    system_logs: true
  },
  analyst: {
    tickets_view: true,
    tickets_create: true,
    tickets_edit_own: true,
    tickets_edit_all: true,
    tickets_delete: false,
    tickets_assign: true,
    tickets_close: true,
    tickets_change_priority: true,
    tickets_view_history: true,
    kb_view: true,
    kb_create: true,
    kb_edit: true,
    kb_delete: false,
    kb_manage_categories: false,
    timesheets_view_own: true,
    timesheets_view_all: true,
    timesheets_create: true,
    timesheets_edit_own: true,
    timesheets_edit_all: false,
    timesheets_approve: true,
    timesheets_analytics: false,
    system_settings: false,
    system_users: false,
    system_roles: false,
    system_backup: false,
    system_logs: false
  },
  // Adicionando role 'n2' (nível 2) com permissões intermediárias
  n2: {
    tickets_view: true,
    tickets_create: true,
    tickets_edit_own: true,
    tickets_edit_all: true,
    tickets_delete: false,
    tickets_assign: true,
    tickets_close: true,
    tickets_change_priority: false,
    tickets_view_history: true,
    kb_view: true,
    kb_create: true,
    kb_edit: true,
    kb_delete: false,
    kb_manage_categories: false,
    timesheets_view_own: true,
    timesheets_view_all: true,
    timesheets_create: true,
    timesheets_edit_own: true,
    timesheets_edit_all: false,
    timesheets_approve: false,
    timesheets_analytics: false,
    system_settings: false,
    system_users: false,
    system_roles: false,
    system_backup: false,
    system_logs: false
  },
  user: {
    tickets_view: true,
    tickets_create: true,
    tickets_edit_own: true,
    tickets_edit_all: false,
    tickets_delete: false,
    tickets_assign: false,
    tickets_close: false,
    tickets_change_priority: false,
    tickets_view_history: false,
    kb_view: true,
    kb_create: false,
    kb_edit: false,
    kb_delete: false,
    kb_manage_categories: false,
    timesheets_view_own: true,
    timesheets_view_all: false,
    timesheets_create: true,
    timesheets_edit_own: true,
    timesheets_edit_all: false,
    timesheets_approve: false,
    timesheets_analytics: false,
    system_settings: false,
    system_users: false,
    system_roles: false,
    system_backup: false,
    system_logs: false
  }
}

/**
 * Cache de permissões de roles customizadas
 */
let rolesCache: Map<string, Permission> = new Map()
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

/**
 * Busca as permissões de uma role
 */
export async function getRolePermissions(roleName: string): Promise<Permission | null> {
  // Se for uma role do sistema, retornar as permissões padrão
  if (defaultSystemPermissions[roleName]) {
    return defaultSystemPermissions[roleName]
  }

  // Verificar cache
  const now = Date.now()
  if (now - cacheTimestamp < CACHE_DURATION && rolesCache.has(roleName)) {
    return rolesCache.get(roleName) || null
  }

  try {
    console.log(`[getRolePermissions] Buscando role: ${roleName}`)
    
    // Buscar role customizada no banco
    const { data: role, error } = await supabaseAdmin
      .from('roles')
      .select('permissions')
      .eq('name', roleName)
      .single()

    if (error) {
      console.error(`[getRolePermissions] Erro ao buscar role ${roleName}:`, error)
      
      // Se o erro for "0 rows", a role não existe no banco
      if (error.code === 'PGRST116') {
        console.warn(`[getRolePermissions] Role "${roleName}" não existe no banco de dados!`)
        console.warn(`[getRolePermissions] Execute no Supabase SQL Editor:`)
        console.warn(`INSERT INTO roles (name, display_name, permissions, is_system) VALUES ('${roleName}', '${roleName.toUpperCase()}', '{}', false);`)
      }
      
      return null
    }
    
    if (!role) {
      console.error(`[getRolePermissions] Role ${roleName} retornou vazio`)
      return null
    }

    console.log(`[getRolePermissions] Role ${roleName} encontrada, permissões:`, role.permissions)
    
    // Atualizar cache
    rolesCache.set(roleName, role.permissions)
    cacheTimestamp = now

    return role.permissions
  } catch (error) {
    console.error('[getRolePermissions] Erro geral ao buscar permissões:', error)
    return null
  }
}

/**
 * Verifica se um usuário tem uma permissão específica
 */
export async function userHasPermission(
  userRole: string,
  permission: keyof Permission
): Promise<boolean> {
  const permissions = await getRolePermissions(userRole)
  return permissions ? permissions[permission] : false
}

/**
 * Busca todos os usuários que têm uma permissão específica
 */
export async function getUsersWithPermission(permission: keyof Permission): Promise<any[]> {
  try {
    console.log(`[getUsersWithPermission] DEBUG: Buscando usuários com permissão "${permission}"`)
    
    // Buscar todos os usuários
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, role_name')
      .eq('is_active', true)

    console.log(`[getUsersWithPermission] DEBUG: Usuários encontrados:`, users?.length || 0)
    console.log(`[getUsersWithPermission] DEBUG: Erro ao buscar usuários:`, usersError)

    if (usersError || !users) {
      console.error('Erro ao buscar usuários:', usersError)
      return []
    }

    // Buscar todas as roles customizadas
    const { data: customRoles, error: rolesError } = await supabaseAdmin
      .from('roles')
      .select('name, permissions')

    console.log(`[getUsersWithPermission] DEBUG: Roles customizadas encontradas:`, customRoles?.length || 0)
    console.log(`[getUsersWithPermission] DEBUG: Erro ao buscar roles:`, rolesError)

    if (rolesError) {
      console.error('Erro ao buscar roles:', rolesError)
    }

    // Criar mapa de permissões incluindo roles customizadas
    const allPermissions: Record<string, Permission> = { ...defaultSystemPermissions }
    
    console.log(`[getUsersWithPermission] DEBUG: Roles padrão disponíveis:`, Object.keys(defaultSystemPermissions))
    
    if (customRoles) {
      customRoles.forEach(role => {
        allPermissions[role.name] = role.permissions
      })
      console.log(`[getUsersWithPermission] DEBUG: Roles customizadas adicionadas:`, customRoles.map(r => r.name))
    }

    console.log(`[getUsersWithPermission] DEBUG: Total de roles disponíveis:`, Object.keys(allPermissions))

    // Filtrar usuários que têm a permissão
    const usersWithPermission = users.filter(user => {
      const userRole = user.role_name || user.role
      const permissions = allPermissions[userRole]
      const hasPermission = permissions && permissions[permission]
      
      console.log(`[getUsersWithPermission] DEBUG: Usuário "${user.name}" (${userRole}):`, {
        roleFound: !!permissions,
        hasPermission,
        permissionValue: permissions?.[permission]
      })
      
      return hasPermission
    })

    console.log(`[getUsersWithPermission] DEBUG: Usuários com permissão "${permission}":`, usersWithPermission.length)
    console.log(`[getUsersWithPermission] DEBUG: Usuários retornados:`, usersWithPermission.map(u => u.name))

    return usersWithPermission
  } catch (error) {
    console.error('Erro ao buscar usuários com permissão:', error)
    return []
  }
}

/**
 * Limpa o cache de permissões
 */
export function clearPermissionsCache() {
  rolesCache.clear()
  cacheTimestamp = 0
}

/**
 * Verifica múltiplas permissões de uma vez
 */
export async function checkMultiplePermissions(
  userRole: string,
  permissions: (keyof Permission)[]
): Promise<Record<keyof Permission, boolean>> {
  const rolePermissions = await getRolePermissions(userRole)
  const result: any = {}

  if (!rolePermissions) {
    permissions.forEach(perm => {
      result[perm] = false
    })
    return result
  }

  permissions.forEach(perm => {
    result[perm] = rolePermissions[perm] || false
  })

  return result
}