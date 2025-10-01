import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST - Criar backup
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Apenas admin pode criar backups
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const { name, description, includes } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Backup name required' }, { status: 400 })
    }

    // Simular criação de backup
    // Em produção, você faria backup real dos dados
    const backupData: any = {
      metadata: {
        version: '1.0.0',
        // created_at gerenciado automaticamente pelo Supabase
        created_by: session.user.id,
        includes
      }
    }

    // Simular backup de cada componente selecionado
    if (includes.database) {
      // Backup do banco de dados
      const tables = ['users', 'tickets', 'categories', 'comments', 'attachments']
      for (const table of tables) {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
        
        if (!error && data) {
          backupData[table] = data
        }
      }
    }

    if (includes.settings) {
      // Backup das configurações
      const { data: settings } = await supabaseAdmin
        .from('system_settings')
        .select('*')
      
      if (settings) {
        backupData.settings = settings
      }
    }

    if (includes.users) {
      // Backup específico de usuários
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('*')
      
      if (users) {
        backupData.users = users
      }
    }

    if (includes.tickets) {
      // Backup específico de tickets
      const { data: tickets } = await supabaseAdmin
        .from('tickets')
        .select('*')
      
      if (tickets) {
        backupData.tickets = tickets
      }
    }

    if (includes.categories) {
      // Backup específico de categorias
      const { data: categories } = await supabaseAdmin
        .from('categories')
        .select('*')
      
      if (categories) {
        backupData.categories = categories
      }
    }

    // Calcular tamanho aproximado do backup
    const backupSize = new Blob([JSON.stringify(backupData)]).size

    // Salvar registro do backup no banco
    const { data: newBackup, error: insertError } = await supabaseAdmin
      .from('system_backups')
      .insert({
        name,
        description,
        size: backupSize,
        type: 'manual',
        status: 'completed',
        includes,
        created_by: session.user.id,
        backup_data: backupData // Em produção, seria armazenado em storage externo
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating backup:', insertError)
      
      // Se a tabela não existir, retornar erro apropriado
      if (insertError.code === '42P01') {
        return NextResponse.json({ 
          error: 'Backup table not configured. Please contact system administrator.',
          details: 'Table system_backups does not exist'
        }, { status: 500 })
      }
      
      return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 })
    }

    // Log de auditoria
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: session.user.id,
        action: 'CREATE_BACKUP',
        resource_type: 'system_backups',
        resource_id: newBackup?.id,
        details: {
          backup_name: name,
          includes
        }
      })

    return NextResponse.json({
      id: newBackup?.id,
      message: 'Backup created successfully'
    })
  } catch (error) {
    console.error('Backup creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}