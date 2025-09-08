import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, action, rejection_reason } = body

    if (!id || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: id, action' 
      }, { status: 400 })
    }

    // Verificar permissão de aprovação
    const { data: userInfo } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const { data: permission } = await supabase
      .from('timesheet_permissions')
      .select('can_approve')
      .eq('user_id', session.user.id)
      .single()

    const canApprove = userInfo?.role === 'admin' || permission?.can_approve

    if (!canApprove) {
      return NextResponse.json({ 
        error: 'You do not have permission to approve/reject timesheets' 
      }, { status: 403 })
    }

    // Preparar dados de atualização
    const updateData: any = {
      approved_by: session.user.id,
      approval_date: new Date().toISOString()
    }

    if (action === 'approve') {
      updateData.status = 'approved'
    } else if (action === 'reject') {
      updateData.status = 'rejected'
      if (rejection_reason) {
        updateData.rejection_reason = rejection_reason
      }
    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use "approve" or "reject"' 
      }, { status: 400 })
    }

    // Atualizar apontamento
    const { data, error } = await supabase
      .from('timesheets')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        user:users!timesheets_user_id_fkey(id, name, email),
        ticket:tickets!timesheets_ticket_id_fkey(id, ticket_number, title),
        approver:users!timesheets_approved_by_fkey(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Error updating timesheet:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}