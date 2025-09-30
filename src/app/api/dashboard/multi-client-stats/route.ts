import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserContextIds } from '@/lib/context-helpers'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obter dados do usuário
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role, user_type, context_id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const currentUser = {
      id: userData.id,
      email: session.user.email,
      user_type: userData.user_type,
      role: userData.role
    }

    // Obter parâmetros da query
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const userId = searchParams.get('user_id')
    const contextIds = searchParams.get('context_ids') // Lista de IDs separados por vírgula

    // Processar datas
    const now = new Date()
    const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const defaultEndDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    // Processar context_ids se fornecidos
    let targetContextIds: string[] = []
    if (contextIds) {
      targetContextIds = contextIds.split(',').filter(id => id.trim())
      console.log('🎯 API Multi-client recebeu context_ids:', targetContextIds)
    }

    if (targetContextIds.length === 0) {
      targetContextIds = await getUserContextIds(currentUser.id)
    }

    // Construir query base
    let query = supabaseAdmin
      .from('tickets')
      .select('id, status, created_at, updated_at, created_by, is_internal, context_id')
    
    // Aplicar filtro de data
    query = query
      .gte('created_at', `${defaultStartDate}T00:00:00`)
      .lte('created_at', `${defaultEndDate}T23:59:59`)
    
    // Aplicar filtro multi-tenant
    if (currentUser.user_type === 'matrix') {
      // Para usuários matrix, usar contextos fornecidos ou associados
      if (targetContextIds.length > 0) {
        console.log('🎯 Aplicando filtro para contextos:', targetContextIds)
        query = query.in('context_id', targetContextIds)
      } else {
        console.log('⚠️ Nenhum contexto fornecido, buscando contextos do usuário')
        // Se não tem contextos, não mostrar nenhum ticket
        query = query.eq('context_id', '00000000-0000-0000-0000-000000000000')
      }
    } else {
      console.log('⚠️ Usuário não é matrix, não mostrando tickets')
      // Fallback: não mostrar nenhum ticket
      query = query.eq('context_id', '00000000-0000-0000-0000-000000000000')
    }
    
    // Aplicar filtro de usuário se fornecido
    if (userId) {
      query = query.eq('created_by', userId)
    }
    
    const { data: tickets, error: ticketsError } = await query

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    // Filtrar tickets internos para usuários comuns
    let filteredTickets = tickets || []
    if (currentUser.role === 'user') {
      filteredTickets = filteredTickets.filter((ticket: any) => {
        return !ticket.is_internal || ticket.created_by === currentUser.id
      })
    }

    // Calcular estatísticas
    const totalTickets = filteredTickets?.length || 0
    const openTickets = filteredTickets?.filter((t: any) => t.status === 'open').length || 0
    const inProgressTickets = filteredTickets?.filter((t: any) => t.status === 'in_progress').length || 0
    const resolvedTickets = filteredTickets?.filter((t: any) => t.status === 'resolved').length || 0
    const cancelledTickets = filteredTickets?.filter((t: any) => t.status === 'cancelled').length || 0

    // Calcular tendências
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentTickets = filteredTickets?.filter((t: any) => 
      new Date(t.created_at) > thirtyDaysAgo
    ).length || 0
    
    const previousThirtyDays = new Date()
    previousThirtyDays.setDate(previousThirtyDays.getDate() - 60)
    
    const previousTickets = filteredTickets?.filter((t: any) => 
      new Date(t.created_at) > previousThirtyDays && 
      new Date(t.created_at) <= thirtyDaysAgo
    ).length || 0
    
    const ticketsTrend = previousTickets > 0 
      ? `${((recentTickets - previousTickets) / previousTickets * 100).toFixed(0)}%`
      : '+0%'

    // Buscar tickets recentes com informações do usuário
    let recentQuery = supabaseAdmin
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
      .gte('created_at', `${defaultStartDate}T00:00:00`)
      .lte('created_at', `${defaultEndDate}T23:59:59`)
      .order('created_at', { ascending: false })
      .limit(5)
    
    // Aplicar mesmo filtro multi-tenant para tickets recentes
    if (currentUser.user_type === 'matrix') {
      if (targetContextIds.length > 0) {
        console.log('🎯 Aplicando filtro para tickets recentes:', targetContextIds)
        recentQuery = recentQuery.in('context_id', targetContextIds)
      } else {
        console.log('⚠️ Nenhum contexto selecionado - não mostrando tickets recentes')
        // Quando nenhum cliente está selecionado, não mostrar tickets recentes
        recentQuery = recentQuery.eq('context_id', '00000000-0000-0000-0000-000000000000')
      }
    } else {
      console.log('⚠️ Usuário não é matrix para tickets recentes, não mostrando')
      // Fallback: não mostrar nenhum ticket
      recentQuery = recentQuery.eq('context_id', '00000000-0000-0000-0000-000000000000')
    }
    
    // Aplicar filtro de usuário para tickets recentes
    if (userId) {
      recentQuery = recentQuery.eq('created_by', userId)
    }
    
    const { data: recentTicketsList, error: recentError } = await recentQuery

    if (recentError) {
      console.error('Error fetching recent tickets:', recentError)
      return NextResponse.json({ error: 'Failed to fetch recent tickets' }, { status: 500 })
    }

    console.log('🎯 Tickets recentes encontrados:', recentTicketsList?.length || 0)

    // Filtrar tickets recentes para usuários comuns
    let filteredRecentTickets = recentTicketsList || []
    if (currentUser.role === 'user') {
      filteredRecentTickets = filteredRecentTickets.filter((ticket: any) => {
        return !ticket.is_internal || ticket.created_by === currentUser.id
      })
    }

    // Formatar resposta
    const response = {
      total_tickets: totalTickets,
      open_tickets: openTickets,
      in_progress_tickets: inProgressTickets,
      resolved_tickets: resolvedTickets,
      cancelled_tickets: cancelledTickets,
      tickets_trend: ticketsTrend,
      recent_tickets: filteredRecentTickets.map((ticket: any) => ({
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
        user_type: currentUser.user_type,
        context_id: null,
        context_name: null,
        context_type: null
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in multi-client stats API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
