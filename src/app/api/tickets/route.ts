import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'

// GET - Listar todos os tickets
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const userId = searchParams.get('userId')
    const assignedTo = searchParams.get('assignedTo')

    let query = supabaseAdmin
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email),
        assigned_to_user:users!tickets_assigned_to_fkey(id, name, email),
        comments:ticket_comments(count)
      `)
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

    const { data: tickets, error } = await query

    if (error) {
      console.error('Erro ao buscar tickets:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Formatar resposta
    const formattedTickets = tickets?.map(ticket => ({
      ...ticket,
      created_by_user: ticket.created_by_user || null,
      assigned_to_user: ticket.assigned_to_user || null,
      comment_count: ticket.comments?.[0]?.count || 0
    })) || []

    return NextResponse.json(formattedTickets)
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar novo ticket
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { title, description, priority, category, created_by, assigned_to, due_date } = body

    // Validação básica
    if (!title || !description || !created_by) {
      return NextResponse.json(
        { error: 'Título, descrição e criador são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar ticket
    const { data: newTicket, error } = await supabaseAdmin
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email),
        assigned_to_user:users!tickets_assigned_to_fkey(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar ticket:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('=== DEBUG API CREATE TICKET ===')
    console.log('Ticket criado:', newTicket)
    console.log('ID:', newTicket.id)
    console.log('Título:', newTicket.title)

    // Criar registro no histórico (ignorar erros)
    try {
      await supabaseAdmin
        .from('ticket_history')
        .insert({
          ticket_id: newTicket.id,
          user_id: created_by,
          action: 'created',
          created_at: new Date().toISOString()
        })
    } catch (historyError) {
      console.log('Erro ao criar histórico (ignorado):', historyError)
    }

    return NextResponse.json(newTicket, { status: 201 })
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar ticket (mesma funcionalidade que PATCH)
export async function PUT(request: NextRequest) {
  return handleUpdate(request)
}

// PATCH - Atualizar ticket
export async function PATCH(request: NextRequest) {
  return handleUpdate(request)
}

// Função compartilhada para atualização
async function handleUpdate(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const body = await request.json()
    const { id, updated_by, user_id, ...updateData } = body
    
    // Aceitar tanto updated_by quanto user_id
    const userId = updated_by || user_id

    if (!id) {
      return NextResponse.json(
        { error: 'ID do ticket é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar ticket atual para comparar mudanças
    const { data: currentTicket } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single()

    // Remover campos que não devem ser atualizados diretamente
    delete updateData.id
    delete updateData.created_at
    delete updateData.ticket_number

    // Adicionar timestamps de resolução/fechamento se necessário
    if (updateData.status === 'resolved' && currentTicket?.status !== 'resolved') {
      updateData.resolved_at = new Date().toISOString()
    }
    if (updateData.status === 'closed' && currentTicket?.status !== 'closed') {
      updateData.closed_at = new Date().toISOString()
    }

    // Adicionar updated_at
    updateData.updated_at = new Date().toISOString()

    const { data: updatedTicket, error } = await supabaseAdmin
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email),
        assigned_to_user:users!tickets_assigned_to_fkey(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Erro ao atualizar ticket:', error)
      
      // Se for erro de foreign key, tentar atualizar sem as relações
      if (error.message.includes('relationship')) {
        const { data: simpleUpdate, error: simpleError } = await supabaseAdmin
          .from('tickets')
          .update(updateData)
          .eq('id', id)
          .select('*')
          .single()
        
        if (simpleError) {
          console.error('Erro ao atualizar (simples):', simpleError)
          return NextResponse.json({ error: simpleError.message }, { status: 500 })
        }
        
        return NextResponse.json(simpleUpdate)
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar mudanças no histórico
    const changes: any[] = []
    
    if (currentTicket) {
      Object.keys(updateData).forEach(key => {
        if (key !== 'updated_at' && currentTicket[key] !== updateData[key]) {
          changes.push({
            ticket_id: id,
            user_id: userId || currentTicket.created_by,
            action: 'updated',
            field_name: key,
            old_value: String(currentTicket[key] || ''),
            new_value: String(updateData[key] || ''),
            created_at: new Date().toISOString()
          })
        }
      })

      if (changes.length > 0) {
        await supabaseAdmin.from('ticket_history').insert(changes)
      }
    }

    return NextResponse.json(updatedTicket)
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Excluir ticket
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do ticket é obrigatório' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('tickets')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir ticket:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export const runtime = 'nodejs'