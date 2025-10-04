import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { clearPermissionsCache } from '@/lib/permissions'

/**
 * PUT /api/roles/[id]
 * Atualiza um perfil existente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: userInfo } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userInfo?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const roleId = params.id
    const body = await request.json()
    const { name, display_name, description, permissions, is_system } = body

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    // Buscar role atual
    const { data: existingRole, error: fetchError } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single()

    if (fetchError || !existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Não permitir alteração do is_system para roles do sistema
    if (existingRole.is_system && !is_system) {
      return NextResponse.json({ 
        error: 'Cannot remove is_system flag from system roles' 
      }, { status: 400 })
    }

    // Preparar dados para atualização
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (display_name) updateData.display_name = display_name
    if (description !== undefined) updateData.description = description
    if (permissions) updateData.permissions = permissions

    // Atualizar apenas se não for role do sistema OU se for admin alterando permissões
    if (!existingRole.is_system || (existingRole.is_system && permissions)) {
      // Atualizar role
      const { data: updatedRole, error: updateError } = await supabaseAdmin
        .from('roles')
        .update(updateData)
        .eq('id', roleId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating role:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update role',
          details: updateError.message 
        }, { status: 500 })
      }

      // Limpar cache de permissões
      clearPermissionsCache()

      return NextResponse.json(updatedRole, { status: 200 })
    } else {
      return NextResponse.json({ 
        error: 'Cannot modify system roles structure' 
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error in PUT /api/roles/[id]:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

/**
 * DELETE /api/roles/[id]
 * Deleta um perfil (apenas perfis personalizados)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: userInfo } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userInfo?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const roleId = params.id

    // Buscar role
    const { data: role, error: fetchError } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single()

    if (fetchError || !role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Não permitir deletar roles do sistema
    if (role.is_system) {
      return NextResponse.json({ 
        error: 'Cannot delete system roles' 
      }, { status: 400 })
    }

    // Verificar se há usuários usando este role
    const { count: usersCount } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', role.name)

    if (usersCount && usersCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete role. ${usersCount} user(s) are using this role.`,
        usersCount 
      }, { status: 400 })
    }

    // Deletar role
    console.log('[DELETE ROLE] Tentando deletar:', { roleId, name: role.name, is_system: role.is_system })
    
    // Primeiro, deletar logs de auditoria associados (se existirem)
    try {
      const { error: auditDeleteError } = await supabaseAdmin
        .from('role_audit_log')
        .delete()
        .eq('role_id', roleId)
      
      if (auditDeleteError) {
        console.warn('[DELETE ROLE] ⚠️ Erro ao deletar audit logs (pode não existir tabela):', auditDeleteError.message)
        // Continuar mesmo se falhar, pois tabela pode não existir
      } else {
        console.log('[DELETE ROLE] ✅ Audit logs deletados')
      }
    } catch (auditError) {
      console.warn('[DELETE ROLE] Tabela role_audit_log não existe ou erro ao deletar logs')
    }
    
    // Agora deletar o role
    const { error: deleteError } = await supabaseAdmin
      .from('roles')
      .delete()
      .eq('id', roleId)

    if (deleteError) {
      console.error('[DELETE ROLE] ❌ Erro ao deletar:', deleteError)
      console.error('[DELETE ROLE] Detalhes completos:', {
        message: deleteError.message,
        code: deleteError.code,
        details: deleteError.details,
        hint: deleteError.hint
      })
      
      return NextResponse.json({ 
        error: 'Failed to delete role',
        details: deleteError.message,
        code: deleteError.code,
        hint: deleteError.hint
      }, { status: 500 })
    }
    
    console.log('[DELETE ROLE] ✅ Perfil deletado com sucesso')

    // Limpar cache
    clearPermissionsCache()

    return NextResponse.json({ 
      success: true,
      message: 'Role deleted successfully' 
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error in DELETE /api/roles/[id]:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

/**
 * GET /api/roles/[id]
 * Busca um perfil específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleId = params.id

    // Buscar role
    const { data: role, error } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single()

    if (error || !role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json(role, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/roles/[id]:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
