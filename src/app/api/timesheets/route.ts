import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Força o runtime do Node.js para evitar erros 404 em produção
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação com NextAuth
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const ticketId = searchParams.get('ticket_id')
    const userId = searchParams.get('user_id')
    const status = searchParams.get('status')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Query base usando supabaseAdmin
    let query = supabaseAdmin
      .from('timesheets')
      .select(`
        *,
        user:users!timesheets_user_id_fkey(id, name, email),
        ticket:tickets!timesheets_ticket_id_fkey(id, ticket_number, title),
        approver:users!timesheets_approved_by_fkey(id, name, email)
      `)
      .order('work_date', { ascending: false })

    // Aplicar filtros
    if (ticketId) {
      query = query.eq('ticket_id', ticketId)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (startDate) {
      query = query.gte('work_date', startDate)
    }
    if (endDate) {
      query = query.lte('work_date', endDate)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mapear activity_description para description para compatibilidade
    const mappedData = (data || []).map(item => ({
      ...item,
      description: item.activity_description || item.description || ''
    }))

    return NextResponse.json(mappedData)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação com NextAuth
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ticket_id, hours_worked, description, work_date } = body

    // Validações
    if (!ticket_id || !hours_worked || !description) {
      return NextResponse.json({ 
        error: 'Missing required fields: ticket_id, hours_worked, description' 
      }, { status: 400 })
    }

    // Verificar se o ticket existe usando supabaseAdmin
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('id')
      .eq('id', ticket_id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Verificar permissão de submissão
    const { data: permission } = await supabaseAdmin
      .from('timesheet_permissions')
      .select('can_submit')
      .eq('user_id', session.user.id)
      .single()

    // Se não houver registro de permissão, criar um com permissão padrão
    if (!permission) {
      await supabaseAdmin
        .from('timesheet_permissions')
        .insert({
          user_id: session.user.id,
          can_submit: true,
          can_approve: false
        })
    } else if (!permission.can_submit) {
      return NextResponse.json({ 
        error: 'You do not have permission to submit timesheets' 
      }, { status: 403 })
    }

    // Inserir apontamento - usando activity_description como nome da coluna
    const { data, error } = await supabaseAdmin
      .from('timesheets')
      .insert({
        ticket_id,
        user_id: session.user.id,
        hours_worked: parseFloat(hours_worked),
        activity_description: description, // Usando o nome correto da coluna
        work_date: work_date || new Date().toISOString().split('T')[0],
        status: 'pending'
      })
      .select(`
        *,
        user:users!timesheets_user_id_fkey(id, name, email),
        ticket:tickets!timesheets_ticket_id_fkey(id, ticket_number, title)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mapear activity_description para description para compatibilidade
    const mappedData = {
      ...data,
      description: data.activity_description || data.description || ''
    }

    return NextResponse.json(mappedData, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação com NextAuth
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, rejection_reason } = body

    if (!id || !status) {
      return NextResponse.json({ 
        error: 'Missing required fields: id, status' 
      }, { status: 400 })
    }

    // Verificar permissão de aprovação
    const { data: userInfo } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const { data: permission } = await supabaseAdmin
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

    // Atualizar apontamento
    const updateData: any = {
      status,
      approved_by: session.user.id,
      approval_date: new Date().toISOString()
    }

    if (status === 'rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason
    }

    const { data, error } = await supabaseAdmin
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação com NextAuth
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing timesheet ID' }, { status: 400 })
    }

    // Verificar se o usuário é o dono do apontamento e está pendente
    const { data: timesheet } = await supabaseAdmin
      .from('timesheets')
      .select('user_id, status')
      .eq('id', id)
      .single()

    if (!timesheet) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 })
    }

    if (timesheet.user_id !== session.user.id) {
      return NextResponse.json({ 
        error: 'You can only delete your own timesheets' 
      }, { status: 403 })
    }

    if (timesheet.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Only pending timesheets can be deleted' 
      }, { status: 400 })
    }

    // Deletar apontamento
    const { error } = await supabaseAdmin
      .from('timesheets')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}