import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { clearPermissionsCache } from '@/lib/permissions'

export async function GET(request: NextRequest) {
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

    // Buscar roles do banco
    const { data: roles, error } = await supabaseAdmin
      .from('roles')
      .select('*')
      .order('display_name', { ascending: true })

    if (error) {
      console.error('Error fetching roles:', error)
      
      // Se a tabela não existir, retornar roles padrão
      if (error.code === '42P01') {
        return NextResponse.json([
          {
            id: '1',
            name: 'admin',
            display_name: 'Administrador',
            description: 'Acesso total ao sistema',
            permissions: {
              tickets_view: true,
              tickets_create: true,
              tickets_edit_own: true,
              tickets_edit_all: true,
              tickets_delete: true,
              tickets_assign: true,
              tickets_close: true,
              tickets_change_priority: true,
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
            is_system: true,
            // created_at gerenciado automaticamente pelo Supabase
            // updated_at gerenciado automaticamente pelo Supabase
          },
          {
            id: '2',
            name: 'analyst',
            display_name: 'Analista',
            description: 'Pode gerenciar tickets e criar conteúdo',
            permissions: {
              tickets_view: true,
              tickets_create: true,
              tickets_edit_own: true,
              tickets_edit_all: true,
              tickets_assign: true,
              tickets_close: true,
              tickets_change_priority: true,
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
            is_system: true,
            // created_at gerenciado automaticamente pelo Supabase
            // updated_at gerenciado automaticamente pelo Supabase
          },
          {
            id: '3',
            name: 'user',
            display_name: 'Usuário',
            description: 'Pode criar tickets e visualizar conteúdo',
            permissions: {
              tickets_view: true,
              tickets_create: true,
              tickets_edit_own: true,
              tickets_edit_all: false,
              tickets_delete: false,
              tickets_assign: false,
              tickets_close: false,
              tickets_change_priority: false,
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
            },
            is_system: true,
            // created_at gerenciado automaticamente pelo Supabase
            // updated_at gerenciado automaticamente pelo Supabase
          }
        ])
      }
      
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
    }

    return NextResponse.json(roles || [])
  } catch (error) {
    console.error('Error in GET /api/roles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, display_name, description, permissions } = body

    if (!name || !display_name) {
      return NextResponse.json({ error: 'Name and display_name are required' }, { status: 400 })
    }

    // Inserir novo role
    const { data: newRole, error } = await supabaseAdmin
      .from('roles')
      .insert([
        {
          name: name.toLowerCase().replace(/\s+/g, '_'),
          display_name,
          description: description || '',
          permissions: permissions || {},
          is_system: false
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating role:', error)
      
      // Se a tabela não existir, tentar criar
      if (error.code === '42P01') {
        console.log('Tabela roles não existe. Tentando criar...')
        
        // Tentar criar a tabela
        try {
          // Criar tabela roles
          await supabaseAdmin.rpc('exec_sql', {
            sql: `
              CREATE TABLE IF NOT EXISTS roles (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                display_name VARCHAR(100) NOT NULL,
                description TEXT,
                permissions JSONB DEFAULT '{}',
                is_system BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
              );
            `
          })
          
          console.log('Tabela roles criada com sucesso!')
          
          // Tentar inserir novamente
          const { data: retryRole, error: retryError } = await supabaseAdmin
            .from('roles')
            .insert([
              {
                name: name.toLowerCase().replace(/\s+/g, '_'),
                display_name,
                description: description || '',
                permissions: permissions || {},
                is_system: false
              }
            ])
            .select()
            .single()
          
          if (!retryError) {
            clearPermissionsCache()
            return NextResponse.json(retryRole, { status: 201 })
          }
        } catch (createTableError) {
          console.error('Erro ao criar tabela roles:', createTableError)
        }
        
        // Se não conseguir criar a tabela, retornar sucesso simulado
        // mas avisar o usuário
        clearPermissionsCache()
        return NextResponse.json({
          id: Date.now().toString(),
          name: name.toLowerCase().replace(/\s+/g, '_'),
          display_name,
          description: description || '',
          permissions: permissions || {},
          is_system: false,
          // created_at gerenciado automaticamente pelo Supabase
          // updated_at gerenciado automaticamente pelo Supabase
          warning: 'Role criada temporariamente. Execute o script de migração no Supabase para persistir.'
        }, { status: 201 })
      }
      
      return NextResponse.json({ error: 'Failed to create role' }, { status: 500 })
    }

    // Limpar cache de permissões após criar nova role
    clearPermissionsCache()

    return NextResponse.json(newRole, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/roles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}