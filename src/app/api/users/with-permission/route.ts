import { NextRequest, NextResponse } from 'next/server'
import { getUsersWithPermission } from '@/lib/permissions'

/**
 * GET /api/users/with-permission?permission=tickets_assign
 * Retorna todos os usuários que têm uma permissão específica
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const permission = searchParams.get('permission')

    if (!permission) {
      return NextResponse.json(
        { error: 'Permission parameter is required' },
        { status: 400 }
      )
    }

    // Validar se é uma permissão válida
    const validPermissions = [
      'tickets_view',
      'tickets_create',
      'tickets_edit_own',
      'tickets_edit_all',
      'tickets_delete',
      'tickets_assign',
      'tickets_close',
      'tickets_change_priority',
      'tickets_view_history',
      'kb_view',
      'kb_create',
      'kb_edit',
      'kb_delete',
      'kb_manage_categories',
      'timesheets_view_own',
      'timesheets_view_all',
      'timesheets_create',
      'timesheets_edit_own',
      'timesheets_edit_all',
      'timesheets_approve',
      'timesheets_analytics',
      'system_settings',
      'system_users',
      'system_roles',
      'system_backup',
      'system_logs'
    ]

    if (!validPermissions.includes(permission)) {
      return NextResponse.json(
        { error: 'Invalid permission' },
        { status: 400 }
      )
    }

    const users = await getUsersWithPermission(permission as any)

    return NextResponse.json(users)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}