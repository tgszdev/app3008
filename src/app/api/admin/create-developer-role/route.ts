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
      .eq('name', 'desenvolvedor')
      .single()

    if (existingRole) {
      return NextResponse.json({ 
        message: 'Role desenvolvedor já existe',
        role: existingRole 
      })
    }

    // Criar a role desenvolvedor com permissão de excluir tickets
    const { data: newRole, error } = await supabaseAdmin
      .from('roles')
      .insert([
        {
          name: 'desenvolvedor',
          display_name: 'Desenvolvedor',
          description: 'Desenvolvedor com permissões avançadas',
          permissions: {
            // Tickets - permissões avançadas
            tickets_view: true,
            tickets_create: true,
            tickets_edit_own: true,
            tickets_edit_all: true,
            tickets_delete: true,  // IMPORTANTE: Permissão de excluir
            tickets_assign: true,
            tickets_close: true,
            
            // Knowledge Base - visualização e criação
            kb_view: true,
            kb_create: true,
            kb_edit: true,
            kb_delete: false,
            kb_manage_categories: false,
            
            // Timesheets - permissões básicas
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
      
      // Se a tabela não existir, criar a tabela primeiro
      if (error.code === '42P01') {
        // Criar tabela roles
        await supabaseAdmin.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS roles (
              id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
              name VARCHAR(50) UNIQUE NOT NULL,
              display_name VARCHAR(100) NOT NULL,
              description TEXT,
              permissions JSONB DEFAULT '{}',
              is_system BOOLEAN DEFAULT false,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `
        }).catch(err => console.error('Erro ao criar tabela:', err))

        // Tentar inserir novamente
        const { data: retryRole, error: retryError } = await supabaseAdmin
          .from('roles')
          .insert([
            {
              name: 'desenvolvedor',
              display_name: 'Desenvolvedor',
              description: 'Desenvolvedor com permissões avançadas',
              permissions: {
                tickets_view: true,
                tickets_create: true,
                tickets_edit_own: true,
                tickets_edit_all: true,
                tickets_delete: true,
                tickets_assign: true,
                tickets_close: true,
                kb_view: true,
                kb_create: true,
                kb_edit: true,
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
              },
              is_system: false
            }
          ])
          .select()
          .single()

        if (retryError) {
          return NextResponse.json(
            { error: 'Erro ao criar role desenvolvedor após criar tabela' },
            { status: 500 }
          )
        }

        // Limpar cache
        clearPermissionsCache()

        return NextResponse.json({ 
          success: true,
          message: 'Tabela roles criada e role desenvolvedor inserida com sucesso',
          role: retryRole
        })
      }
      
      return NextResponse.json(
        { error: 'Erro ao criar role desenvolvedor' },
        { status: 500 }
      )
    }

    // Limpar cache de permissões
    clearPermissionsCache()
    
    return NextResponse.json({ 
      success: true,
      message: 'Role desenvolvedor criada com sucesso',
      role: newRole
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}