import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Debug direto da função getUsersWithPermission
export async function GET(request: NextRequest) {
  try {
    
    // Testar conexão com o banco
    const { data: testConnection, error: connectionError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1)
    
    
    // Buscar todos os usuários
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, role_name, is_active')
    
    
    // Buscar apenas usuários ativos
    const { data: activeUsers, error: activeError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, role_name')
      .eq('is_active', true)
    
    
    // Buscar roles customizadas
    const { data: customRoles, error: rolesError } = await supabaseAdmin
      .from('roles')
      .select('name, permissions')
    
    
    // Simular as permissões padrão
    const defaultPermissions = {
      admin: { tickets_assign: true },
      analyst: { tickets_assign: true },
      dev: { tickets_assign: true },
      n2: { tickets_assign: true },
      user: { tickets_assign: false }
    }
    
    // Filtrar usuários manualmente
    const usersWithPermission = activeUsers?.filter(user => {
      const userRole = user.role_name || user.role
      const hasPermission = defaultPermissions[userRole as keyof typeof defaultPermissions]?.tickets_assign
      return hasPermission
    }) || []
    
    return NextResponse.json({
      success: true,
      debug: {
        connectionTest: { data: testConnection, error: connectionError },
        allUsers: { count: users?.length, data: users },
        activeUsers: { count: activeUsers?.length, data: activeUsers },
        customRoles: { count: customRoles?.length, data: customRoles },
        usersWithPermission: { count: usersWithPermission.length, data: usersWithPermission },
        defaultPermissions
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}








