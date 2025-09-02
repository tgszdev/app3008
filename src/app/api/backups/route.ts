import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Listar backups
export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Apenas admin pode acessar backups
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Buscar backups do banco
    const { data: backups, error } = await supabaseAdmin
      .from('system_backups')
      .select(`
        *,
        created_by_user:users!system_backups_created_by_fkey(
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching backups:', error)
      // Se a tabela não existir, retornar array vazio
      if (error.code === '42P01') {
        return NextResponse.json([])
      }
      return NextResponse.json({ error: 'Failed to fetch backups' }, { status: 500 })
    }

    // Formatar resposta
    const formattedBackups = (backups || []).map((backup: any) => ({
      id: backup.id,
      name: backup.name,
      description: backup.description,
      size: formatBytes(backup.size || 0),
      created_at: backup.created_at,
      created_by: backup.created_by_user?.name || 'Sistema',
      type: backup.type || 'manual',
      status: backup.status || 'completed',
      includes: backup.includes || {
        database: true,
        files: true,
        settings: true,
        logs: false
      }
    }))

    return NextResponse.json(formattedBackups)
  } catch (error) {
    console.error('Backups GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir backup
export async function DELETE(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Apenas admin pode excluir backups
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const url = new URL(request.url)
    const backupId = url.pathname.split('/').pop()

    if (!backupId) {
      return NextResponse.json({ error: 'Backup ID required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('system_backups')
      .delete()
      .eq('id', backupId)

    if (error) {
      console.error('Error deleting backup:', error)
      return NextResponse.json({ error: 'Failed to delete backup' }, { status: 500 })
    }

    // Log de auditoria
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: session.user.id,
        action: 'DELETE_BACKUP',
        resource_type: 'system_backups',
        resource_id: backupId,
        details: {
          backup_id: backupId
        }
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Backup DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Função auxiliar para formatar bytes
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}