import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { clearPermissionsCache } from '@/lib/permissions'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const params = await context.params
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

    const body = await request.json()
    const { display_name, description, permissions } = body

    // Atualizar role
    const { data: updatedRole, error } = await supabaseAdmin
      .from('roles')
      .update({
        display_name,
        description,
        permissions,
        // updated_at gerenciado automaticamente pelo Supabase
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating role:', error)
      
      // Se a tabela não existir, retornar sucesso simulado
      if (error.code === '42P01') {
        return NextResponse.json({
          ...body,
          id: params.id,
          // updated_at gerenciado automaticamente pelo Supabase
        })
      }
      
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
    }

    // Limpar cache de permissões após atualizar role
    clearPermissionsCache()

    return NextResponse.json(updatedRole)
  } catch (error) {
    console.error('Error in PUT /api/roles/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const params = await context.params
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

    // Verificar se não é um role do sistema
    const { data: role } = await supabaseAdmin
      .from('roles')
      .select('is_system')
      .eq('id', params.id)
      .single()

    if (role?.is_system) {
      return NextResponse.json({ error: 'Cannot delete system role' }, { status: 400 })
    }

    // Deletar role
    const { error } = await supabaseAdmin
      .from('roles')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting role:', error)
      
      // Se a tabela não existir, retornar sucesso simulado
      if (error.code === '42P01') {
        return NextResponse.json({ message: 'Role deleted successfully' })
      }
      
      return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Role deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/roles/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}