import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// DELETE - Excluir backup específico
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Apenas admin pode excluir backups
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const backupId = params.id

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