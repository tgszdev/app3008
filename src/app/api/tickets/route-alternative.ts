import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// VERSÃO ALTERNATIVA - Funciona sem foreign keys explícitas
// Use este arquivo se o erro persistir após executar o script SQL

// GET - Listar todos os tickets (com JOIN manual)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const userId = searchParams.get('userId')
    const assignedTo = searchParams.get('assignedTo')

    // Buscar tickets primeiro
    let query = supabaseAdmin
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority)
    }
    if (userId) {
      query = query.eq('created_by', userId)
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }

    const { data: tickets, error: ticketsError } = await query

    if (ticketsError) {
      return NextResponse.json({ error: ticketsError.message }, { status: 500 })
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json([])
    }

    // Buscar todos os IDs de usuários únicos
    const userIds = new Set<string>()
    tickets.forEach(ticket => {
      if (ticket.created_by) userIds.add(ticket.created_by)
      if (ticket.assigned_to) userIds.add(ticket.assigned_to)
    })

    // Buscar dados dos usuários
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .in('id', Array.from(userIds))

    if (usersError) {
      // Continuar mesmo com erro, apenas sem dados de usuário
      return NextResponse.json(tickets)
    }

    // Criar mapa de usuários para acesso rápido
    const usersMap = new Map()
    users?.forEach(user => {
      usersMap.set(user.id, user)
    })

    // Combinar dados
    const formattedTickets = tickets.map(ticket => ({
      ...ticket,
      created_by_user: ticket.created_by ? usersMap.get(ticket.created_by) || null : null,
      assigned_to_user: ticket.assigned_to ? usersMap.get(ticket.assigned_to) || null : null,
    }))

    return NextResponse.json(formattedTickets)
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar novo ticket (sem JOIN na resposta)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, priority, category, created_by, assigned_to, due_date } = body

    // Validação básica
    if (!title || !description || !created_by) {
      return NextResponse.json(
        { error: 'Título, descrição e criador são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const { data: creator, error: creatorError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('id', created_by)
      .single()

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Usuário criador não encontrado' },
        { status: 400 }
      )
    }

    // Verificar analista se fornecido
    let assignee = null
    if (assigned_to) {
      const { data: assigneeData } = await supabaseAdmin
        .from('users')
        .select('id, name, email')
        .eq('id', assigned_to)
        .single()
      
      assignee = assigneeData
    }

    // Criar ticket
    const { data: newTicket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .insert({
        title,
        description,
        status: 'open',
        priority: priority || 'medium',
        category: category || 'general',
        created_by,
        assigned_to,
        due_date,
        // created_at gerenciado automaticamente pelo Supabase
        // updated_at gerenciado automaticamente pelo Supabase
      })
      .select('*')
      .single()

    if (ticketError) {
      return NextResponse.json({ error: ticketError.message }, { status: 500 })
    }

    // Adicionar dados dos usuários ao ticket
    const ticketWithUsers = {
      ...newTicket,
      created_by_user: creator,
      assigned_to_user: assignee
    }

    // Criar registro no histórico
    await supabaseAdmin
      .from('ticket_history')
      .insert({
        ticket_id: newTicket.id,
        user_id: created_by,
        action: 'created',
        // created_at gerenciado automaticamente pelo Supabase
      })

    return NextResponse.json(ticketWithUsers)
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar ticket
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, updated_by, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID do ticket é obrigatório' }, { status: 400 })
    }

    // Buscar ticket atual para comparação
    const { data: currentTicket } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single()

    // Atualizar ticket
    const { data: updatedTicket, error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({
        ...updateData,
        // updated_at gerenciado automaticamente pelo Supabase
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Buscar dados dos usuários
    const userIds = []
    if (updatedTicket.created_by) userIds.push(updatedTicket.created_by)
    if (updatedTicket.assigned_to) userIds.push(updatedTicket.assigned_to)

    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .in('id', userIds)

    const usersMap = new Map()
    users?.forEach(user => {
      usersMap.set(user.id, user)
    })

    const ticketWithUsers = {
      ...updatedTicket,
      created_by_user: updatedTicket.created_by ? usersMap.get(updatedTicket.created_by) : null,
      assigned_to_user: updatedTicket.assigned_to ? usersMap.get(updatedTicket.assigned_to) : null,
    }

    // Registrar mudanças no histórico
    if (currentTicket && updated_by) {
      const changes = []
      
      if (currentTicket.status !== updatedTicket.status) {
        changes.push({
          ticket_id: id,
          user_id: updated_by,
          action: 'status_changed',
          field_name: 'status',
          old_value: currentTicket.status,
          new_value: updatedTicket.status,
        })
      }
      
      if (currentTicket.assigned_to !== updatedTicket.assigned_to) {
        changes.push({
          ticket_id: id,
          user_id: updated_by,
          action: 'assigned',
          field_name: 'assigned_to',
          old_value: currentTicket.assigned_to,
          new_value: updatedTicket.assigned_to,
        })
      }

      // Histórico gerenciado automaticamente por TRIGGER no banco
      // Removido insert manual para evitar duplicação
      if (changes.length > 0) {
      }
    }

    return NextResponse.json(ticketWithUsers)
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Excluir ticket
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do ticket é obrigatório' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('tickets')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}