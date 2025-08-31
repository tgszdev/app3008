import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Buscar ticket específico
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    console.log('=== DEBUG API TICKET ===')
    console.log('ID recebido:', id)

    if (!id) {
      return NextResponse.json({ error: 'ID do ticket é obrigatório' }, { status: 400 })
    }

    // Buscar ticket com informações relacionadas incluindo categoria
    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email, role),
        assigned_to_user:users!tickets_assigned_to_fkey(id, name, email, role),
        category_info:categories!tickets_category_id_fkey(id, name, slug, color, icon)
      `)
      .eq('id', id)
      .single()

    console.log('Ticket encontrado:', ticket ? 'SIM' : 'NÃO')
    if (ticket) {
      console.log('Título do ticket:', ticket.title)
      console.log('ID do ticket:', ticket.id)
    }
    
    if (error) {
      console.error('Erro ao buscar ticket:', error)
      
      // Se for erro de foreign key, tentar buscar sem as relações
      if (error.message.includes('relationship')) {
        const { data: simpleTicket, error: simpleError } = await supabaseAdmin
          .from('tickets')
          .select('*')
          .eq('id', id)
          .single()

        if (simpleError) {
          return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
        }

        // Buscar usuários manualmente
        let created_by_user = null
        let assigned_to_user = null

        if (simpleTicket.created_by) {
          const { data: creator } = await supabaseAdmin
            .from('users')
            .select('id, name, email, role')
            .eq('id', simpleTicket.created_by)
            .single()
          
          created_by_user = creator
        }

        if (simpleTicket.assigned_to) {
          const { data: assignee } = await supabaseAdmin
            .from('users')
            .select('id, name, email, role')
            .eq('id', simpleTicket.assigned_to)
            .single()
          
          assigned_to_user = assignee
        }

        return NextResponse.json({
          ...simpleTicket,
          created_by_user,
          assigned_to_user
        })
      }

      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
    }

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
    }

    // Buscar comentários do ticket
    const { data: comments } = await supabaseAdmin
      .from('ticket_comments')
      .select(`
        *,
        user:users(id, name, email, role)
      `)
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    // Adicionar comentários ao ticket
    const ticketWithComments = {
      ...ticket,
      comments: comments || []
    }

    return NextResponse.json(ticketWithComments)
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}