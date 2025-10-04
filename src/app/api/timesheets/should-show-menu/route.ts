import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

/**
 * GET - Verifica se o usuário deve ver o menu de apontamentos
 * 
 * Critérios para mostrar o menu:
 * 1. Tem permissão para submeter apontamentos (can_submit), OU
 * 2. Tem permissão para aprovar apontamentos (can_approve), OU
 * 3. Já possui apontamentos registrados
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // 1. Verificar permissões
    const { data: permission } = await supabaseAdmin
      .from('timesheet_permissions')
      .select('can_submit, can_approve')
      .eq('user_id', userId)
      .single()

    // 2. Verificar se é admin (admin sempre tem acesso)
    const { data: userInfo } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    const isAdmin = userInfo?.role === 'admin'

    // 3. Verificar se tem apontamentos
    const { count: timesheetCount } = await supabaseAdmin
      .from('timesheets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const hasTimesheets = timesheetCount && timesheetCount > 0

    // Lógica de decisão
    const shouldShowMenu = 
      isAdmin || // Admin sempre vê
      permission?.can_submit || // Pode submeter
      permission?.can_approve || // Pode aprovar
      hasTimesheets // Tem apontamentos registrados

    return NextResponse.json({
      shouldShowMenu,
      reason: isAdmin 
        ? 'admin'
        : permission?.can_submit
        ? 'can_submit'
        : permission?.can_approve
        ? 'can_approve'
        : hasTimesheets
        ? 'has_timesheets'
        : 'no_access',
      details: {
        isAdmin,
        canSubmit: permission?.can_submit || false,
        canApprove: permission?.can_approve || false,
        hasTimesheets: hasTimesheets || false,
        timesheetCount: timesheetCount || 0
      }
    })
  } catch (error) {
    console.error('[TIMESHEET MENU] Erro ao verificar:', error)
    // Em caso de erro, não mostra o menu (mais seguro)
    return NextResponse.json({
      shouldShowMenu: false,
      reason: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

