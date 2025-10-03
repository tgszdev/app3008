import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    
    // Obter parâmetros da query
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const contextIds = searchParams.get('context_ids')

    // Processar datas
    const now = new Date()
    const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const defaultEndDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    // Processar context_ids se fornecidos
    let targetContextIds: string[] = []
    if (contextIds) {
      targetContextIds = contextIds.split(',').filter(id => id.trim())
    }

    console.log('📊 Parâmetros recebidos:', {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      contextIds: targetContextIds
    })

    // Se não tem contextos, retornar dados vazios
    if (targetContextIds.length === 0) {
      return NextResponse.json({
        total_tickets: 0,
        open_tickets: 0,
        in_progress_tickets: 0,
        resolved_tickets: 0,
        cancelled_tickets: 0,
        tickets_trend: '+0%',
        recent_tickets: [],
        period: {
          start_date: defaultStartDate,
          end_date: defaultEndDate
        },
        selected_contexts: [],
        user_info: {
          user_type: 'matrix',
          context_id: null,
          context_name: null,
          context_type: null
        }
      })
    }

    // Buscar tickets dos contextos selecionados
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('id, status, created_at, updated_at, created_by, is_internal, context_id')
      .in('context_id', targetContextIds)
      .gte('created_at', `${defaultStartDate}T00:00:00`)
      .lte('created_at', `${defaultEndDate}T23:59:59`)

    if (ticketsError) {
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }


    // Calcular estatísticas
    const totalTickets = tickets?.length || 0
    const openTickets = tickets?.filter((t: any) => t.status === 'open').length || 0
    const inProgressTickets = tickets?.filter((t: any) => t.status === 'in_progress').length || 0
    const resolvedTickets = tickets?.filter((t: any) => t.status === 'resolved').length || 0
    const cancelledTickets = tickets?.filter((t: any) => t.status === 'cancelled').length || 0

    // Buscar tickets recentes
    const { data: recentTicketsList, error: recentError } = await supabaseAdmin
      .from('tickets')
      .select(`
        id,
        ticket_number,
        title,
        status,
        priority,
        created_at,
        created_by,
        is_internal,
        context_id,
        created_by_user:users!tickets_created_by_fkey(
          id,
          name,
          email
        )
      `)
      .in('context_id', targetContextIds)
      .gte('created_at', `${defaultStartDate}T00:00:00`)
      .lte('created_at', `${defaultEndDate}T23:59:59`)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) {
      return NextResponse.json({ error: 'Failed to fetch recent tickets' }, { status: 500 })
    }

    // Formatar resposta
    const response = {
      total_tickets: totalTickets,
      open_tickets: openTickets,
      in_progress_tickets: inProgressTickets,
      resolved_tickets: resolvedTickets,
      cancelled_tickets: cancelledTickets,
      tickets_trend: '+0%',
      recent_tickets: (recentTicketsList || []).map((ticket: any) => ({
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
        created_by: ticket.created_by,
        created_by_user: ticket.created_by_user
      })),
      period: {
        start_date: defaultStartDate,
        end_date: defaultEndDate
      },
      selected_contexts: targetContextIds,
      user_info: {
        user_type: 'matrix',
        context_id: null,
        context_name: null,
        context_type: null
      }
    }

    console.log('✅ Resposta da API:', {
      total_tickets: response.total_tickets,
      recent_tickets: response.recent_tickets.length,
      selected_contexts: response.selected_contexts
    })

    return NextResponse.json(response)

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
