import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get ticket statistics
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, status, created_at, updated_at')

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

    // Calculate average resolution time (in hours)
    const resolvedTicketsWithTime = tickets?.filter(t => t.status === 'resolved') || []
    let averageResolutionTime = '0h 0m'
    
    if (resolvedTicketsWithTime.length > 0) {
      const totalTime = resolvedTicketsWithTime.reduce((acc, ticket) => {
        const created = new Date(ticket.created_at).getTime()
        const updated = new Date(ticket.updated_at).getTime()
        return acc + (updated - created)
      }, 0)
      
      const avgTimeMs = totalTime / resolvedTicketsWithTime.length
      const hours = Math.floor(avgTimeMs / (1000 * 60 * 60))
      const minutes = Math.floor((avgTimeMs % (1000 * 60 * 60)) / (1000 * 60))
      averageResolutionTime = `${hours}h ${minutes}m`
    }

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

    // Get active users count
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('is_active', true)

    if (usersError) {
      console.error('Error fetching users:', usersError)
    }

    const activeUsers = users?.length || 0

    // Calculate users trend (simplified - would need more data in production)
    const usersTrend = '+5%' // Placeholder for now

    // Calculate satisfaction rate (simplified - would need feedback system in production)
    const satisfactionRate = 94.5 // Placeholder for now

    // Get recent tickets with user information
    const { data: recentTicketsList, error: recentError } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        title,
        status,
        priority,
        created_at,
        created_by_user:users!tickets_created_by_fkey(
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) {
      console.error('Error fetching recent tickets:', recentError)
    }

    // Format recent tickets
    const formattedRecentTickets = recentTicketsList?.map((ticket: any) => {
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
        averageResolutionTime,
        satisfactionRate,
        ticketsTrend: ticketsTrend.startsWith('-') ? ticketsTrend : `+${ticketsTrend}`,
        usersTrend,
        activeUsers
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