import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { clearPermissionsCache } from '@/lib/permissions'

export async function POST() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se a role já existe
    const { data: existingRole } = await supabaseAdmin
      .from('roles')
      .select('id, name')
      .eq('name', 'n1')
      .single()

    if (existingRole) {
      return NextResponse.json({ 
        message: 'Role N1 já existe',
        role: existingRole 
      })
    }

    // Criar a role N1
    const { data: newRole, error } = await supabaseAdmin
      .from('roles')
      .insert([
        {
          name: 'n1',
          display_name: 'Suporte N1',
          description: 'Suporte de primeiro nível - atendimento inicial',
          permissions: {
            // Tickets - permissões básicas de suporte
            tickets_view: true,
            tickets_create: true,
            tickets_edit_own: true,
            tickets_edit_all: false,
            tickets_delete: true,  // Permissão de excluir conforme solicitado
            tickets_assign: true,   // Pode atribuir tickets
            tickets_close: false,   // Não pode fechar tickets
            
            // Knowledge Base - apenas visualização
            kb_view: true,
            kb_create: false,
            kb_edit: false,
            kb_delete: false,
            kb_manage_categories: false,
            
            // Timesheets - permissões próprias
            timesheets_view_own: true,
            timesheets_view_all: false,
            timesheets_create: true,
            timesheets_edit_own: true,
            timesheets_edit_all: false,
            timesheets_approve: false,
            timesheets_analytics: false,
            
            // System - sem acesso administrativo
            system_settings: false,
            system_users: false,
            system_roles: false,
            system_backup: false,
            system_logs: false
          },
          is_system: false
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar role N1:', error)
      return NextResponse.json(
        { error: 'Erro ao criar role N1', details: error.message },
        { status: 500 }
      )
    }

    // Limpar cache de permissões
    clearPermissionsCache()
    
    return NextResponse.json({ 
      success: true,
      message: 'Role N1 criada com sucesso!',
      role: newRole
    })
  } catch (error) {
    console.error('Erro ao criar role N1:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}