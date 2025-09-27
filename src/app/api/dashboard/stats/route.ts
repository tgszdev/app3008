import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Obter contexto selecionado dos parâmetros da URL
    const { searchParams } = new URL(request.url)
    const selectedContextId = searchParams.get('context_id')
    console.log('🔍 Contexto selecionado via parâmetro:', selectedContextId)

    // Obter dados do usuário e contexto multi-tenant
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role, user_type, context_id, context_name, context_type')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const currentUserId = userData.id
    const userRole = userData.role || 'user'
    const userType = userData.user_type
    const userContextId = userData.context_id

    const userId = searchParams.get('user_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    
    // If no dates provided, use current month
    const now = new Date()
    const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const defaultEndDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    // Get ticket statistics
    let query = supabaseAdmin
      .from('tickets')
      .select('id, status, created_at, updated_at, created_by, is_internal, context_id')
    
    // Apply date filter
    query = query
      .gte('created_at', `${defaultStartDate}T00:00:00`)
      .lte('created_at', `${defaultEndDate}T23:59:59`)
    
    // Apply multi-tenant filter
    // PRIORIDADE: Usar contexto selecionado via parâmetro se disponível
    if (selectedContextId) {
      // Filtrar por contexto específico selecionado
      query = query.eq('context_id', selectedContextId)
      console.log(`✅ Query principal filtrada por contexto selecionado: ${selectedContextId}`)
    } else if (userType === 'context' && userContextId) {
      // Usuários de contexto só veem tickets do seu contexto
      query = query.eq('context_id', userContextId)
    } else if (userType === 'matrix') {
      // Para usuários matrix, buscar contextos associados
      const { data: userContexts, error: contextsError } = await supabaseAdmin
        .from('user_contexts')
        .select('context_id')
        .eq('user_id', currentUserId)
      
      if (!contextsError && userContexts && userContexts.length > 0) {
        const associatedContextIds = userContexts.map(uc => uc.context_id)
        query = query.in('context_id', associatedContextIds)
      } else {
        // Se não tem contextos associados, não mostrar nenhum ticket
        query = query.eq('context_id', '00000000-0000-0000-0000-000000000000')
      }
    }
    
    // Apply user filter if provided
    if (userId) {
      query = query.eq('created_by', userId)
    }
    
    const { data: tickets, error: ticketsError } = await query

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    // Usar tickets já filtrados pela query principal
    let filteredTicketsForStats = tickets || []
    console.log(`✅ Usando tickets já filtrados pela query principal: ${filteredTicketsForStats.length} tickets`)

    // Filtrar tickets internos para usuários comuns
    let filteredTickets = tickets || []
    if (userRole === 'user') {
      filteredTickets = filteredTickets.filter((ticket: any) => {
        // Usuários só podem ver tickets não internos ou criados por eles
        return !ticket.is_internal || ticket.created_by === currentUserId
      })
    }

    // Calculate statistics using filtered tickets for stats
    const totalTickets = filteredTicketsForStats?.length || 0
    const openTickets = filteredTicketsForStats?.filter((t: any) => t.status === 'open').length || 0
    const inProgressTickets = filteredTicketsForStats?.filter((t: any) => t.status === 'in_progress').length || 0
    const resolvedTickets = filteredTicketsForStats?.filter((t: any) => t.status === 'resolved').length || 0
    const cancelledTickets = filteredTicketsForStats?.filter((t: any) => t.status === 'cancelled').length || 0

    // Removed average resolution time calculation - not needed anymore

    // Calculate trends (comparing with last 30 days)
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

    // Removed active users, users trend and satisfaction rate - not needed anymore

    // Get recent tickets with user information
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
    
    // Apply multi-tenant filter to recent tickets
    if (userType === 'context' && userContextId) {
      // Usuários de contexto só veem tickets do seu contexto
      recentQuery = recentQuery.eq('context_id', userContextId)
    } else if (userType === 'matrix') {
      // Para usuários matrix, buscar contextos associados
      const { data: userContexts, error: contextsError } = await supabaseAdmin
        .from('user_contexts')
        .select('context_id')
        .eq('user_id', currentUserId)
      
      if (!contextsError && userContexts && userContexts.length > 0) {
        const associatedContextIds = userContexts.map(uc => uc.context_id)
        recentQuery = recentQuery.in('context_id', associatedContextIds)
      } else {
        // Se não tem contextos associados, não mostrar nenhum ticket
        recentQuery = recentQuery.eq('context_id', '00000000-0000-0000-0000-000000000000')
      }
    }
    
    // Apply user filter to recent tickets as well
    if (userId) {
      recentQuery = recentQuery.eq('created_by', userId)
    }
    
    const { data: recentTicketsList, error: recentError } = await recentQuery

    
    if (recentError) {
      console.error('Error fetching recent tickets:', recentError)
      console.log('🔄 Entrando no fallback da query simples...')
      
      // If there's an error with the foreign key, try a simpler query
      let simpleQuery = supabaseAdmin
        .from('tickets')
        .select('*')
        .gte('created_at', `${defaultStartDate}T00:00:00`)
        .lte('created_at', `${defaultEndDate}T23:59:59`)
        .order('created_at', { ascending: false })
      
      // Apply multi-tenant filter to simple query
      // PRIORIDADE: Usar contexto selecionado via parâmetro se disponível
      if (selectedContextId) {
        // Filtrar por contexto específico selecionado
        simpleQuery = simpleQuery.eq('context_id', selectedContextId)
        console.log(`✅ Query simples filtrada por contexto selecionado: ${selectedContextId}`)
      } else if (userType === 'context' && userContextId) {
        simpleQuery = simpleQuery.eq('context_id', userContextId)
      } else if (userType === 'matrix') {
        // Para usuários matrix, buscar contextos associados
        const { data: userContexts, error: contextsError } = await supabaseAdmin
          .from('user_contexts')
          .select('context_id')
          .eq('user_id', currentUserId)
        
        if (!contextsError && userContexts && userContexts.length > 0) {
          const contextIds = userContexts.map(uc => uc.context_id)
          simpleQuery = simpleQuery.in('context_id', contextIds)
        }
      }
      
      if (userId) {
        simpleQuery = simpleQuery.eq('created_by', userId)
      }
      
      const { data: simpleTickets, error: simpleError } = await simpleQuery
        
      if (!simpleError && simpleTickets) {
        // Filtrar tickets internos para usuários comuns
        let filteredSimpleTickets = simpleTickets
        if (userRole === 'user') {
          filteredSimpleTickets = filteredSimpleTickets.filter((ticket: any) => {
            return !ticket.is_internal || ticket.created_by === currentUserId
          })
        }
        
        // Limitar a 5 tickets após filtragem
        filteredSimpleTickets = filteredSimpleTickets.slice(0, 5)
        
        // Fetch users separately
        const userIds = [...new Set(filteredSimpleTickets.map((t: any) => t.created_by).filter(Boolean))]
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id, name, email')
          .in('id', userIds)
          
        const usersMap = new Map(users?.map((u: any) => [u.id, u]) || [])
        
        const formattedRecentTickets = filteredSimpleTickets.map((ticket: any) => ({
          id: ticket.id,
          ticket_number: ticket.ticket_number,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          requester: usersMap.get(ticket.created_by)?.name || 'Desconhecido',
          created_at: ticket.created_at,
          is_internal: ticket.is_internal || false,
          context_id: ticket.context_id
        }))
        
        return NextResponse.json({
          stats: {
            totalTickets,
            openTickets,
            inProgressTickets,
            resolvedTickets,
            cancelledTickets,
            ticketsTrend: ticketsTrend.startsWith('-') ? ticketsTrend : `+${ticketsTrend}`
          },
          recentTickets: formattedRecentTickets
        })
      }
    }

    // Filtrar tickets internos para usuários comuns
    let filteredRecentTickets = recentTicketsList || []
    if (userRole === 'user') {
      filteredRecentTickets = filteredRecentTickets.filter((ticket: any) => {
        // Usuários só podem ver tickets não internos ou criados por eles
        return !ticket.is_internal || ticket.created_by === currentUserId
      })
    }

    // Limitar a 5 tickets após filtragem
    filteredRecentTickets = filteredRecentTickets.slice(0, 5)

    // Format recent tickets (when the join worked)
    const formattedRecentTickets = filteredRecentTickets?.map((ticket: any) => {
      // Handle both array and object responses from Supabase
      const user = Array.isArray(ticket.created_by_user) 
        ? ticket.created_by_user[0] 
        : ticket.created_by_user
      
      return {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        requester: user?.name || 'Desconhecido',
        created_at: ticket.created_at,
        is_internal: ticket.is_internal || false
      }
    }) || []

    return NextResponse.json({
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      cancelledTickets,
      closedTickets: resolvedTickets + cancelledTickets,
      internalTickets: filteredTicketsForStats?.filter((t: any) => t.is_internal).length || 0,
      ticketsTrend: ticketsTrend.startsWith('-') ? ticketsTrend : `+${ticketsTrend}`,
      recentTickets: formattedRecentTickets
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}