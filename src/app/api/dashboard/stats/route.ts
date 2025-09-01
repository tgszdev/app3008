import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
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
      .select('id, status, created_at, updated_at, created_by')
    
    // Apply date filter
    query = query
      .gte('created_at', `${defaultStartDate}T00:00:00`)
      .lte('created_at', `${defaultEndDate}T23:59:59`)
    
    // Apply user filter if provided
    if (userId) {
      query = query.eq('created_by', userId)
    }
    
    const { data: tickets, error: ticketsError } = await query

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    // Calculate statistics
    const totalTickets = tickets?.length || 0
    const openTickets = tickets?.filter(t => t.status === 'open').length || 0
    const inProgressTickets = tickets?.filter(t => t.status === 'in_progress').length || 0
    const resolvedTickets = tickets?.filter(t => t.status === 'resolved').length || 0
    const cancelledTickets = tickets?.filter(t => t.status === 'cancelled').length || 0

    // Removed average resolution time calculation - not needed anymore

    // Calculate trends (comparing with last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentTickets = tickets?.filter(t => 
      new Date(t.created_at) > thirtyDaysAgo
    ).length || 0
    
    const previousThirtyDays = new Date()
    previousThirtyDays.setDate(previousThirtyDays.getDate() - 60)
    
    const previousTickets = tickets?.filter(t => 
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
    
    // Apply user filter to recent tickets as well
    if (userId) {
      recentQuery = recentQuery.eq('created_by', userId)
    }
    
    const { data: recentTicketsList, error: recentError } = await recentQuery

    if (recentError) {
      console.error('Error fetching recent tickets:', recentError)
      
      // If there's an error with the foreign key, try a simpler query
      let simpleQuery = supabaseAdmin
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (userId) {
        simpleQuery = simpleQuery.eq('created_by', userId)
      }
      
      const { data: simpleTickets, error: simpleError } = await simpleQuery
        
      if (!simpleError && simpleTickets) {
        // Fetch users separately
        const userIds = [...new Set(simpleTickets.map(t => t.created_by).filter(Boolean))]
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id, name, email')
          .in('id', userIds)
          
        const usersMap = new Map(users?.map(u => [u.id, u]) || [])
        
        const formattedRecentTickets = simpleTickets.map((ticket: any) => ({
          id: ticket.id,
          ticket_number: ticket.ticket_number,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          requester: usersMap.get(ticket.created_by)?.name || 'Desconhecido',
          created_at: ticket.created_at
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

    // Format recent tickets (when the join worked)
    const formattedRecentTickets = recentTicketsList?.map((ticket: any) => {
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
        created_at: ticket.created_at
      }
    }) || []

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
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}