import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await request.json()
    const { type, period, filters, includeCharts, includeDetails } = config

    // Fetch tickets based on period and filters
    let ticketsQuery = supabaseAdmin
      .from('tickets')
      .select(`
        *,
        categories (
          id,
          name,
          color
        ),
        created_by_user:users!tickets_created_by_fkey(
          id,
          name,
          email
        ),
        assigned_to_user:users!tickets_assigned_to_fkey(
          id,
          name,
          email
        )
      `)
      .gte('created_at', `${period.start_date}T00:00:00`)
      .lte('created_at', `${period.end_date}T23:59:59`)

    // Apply filters if provided
    if (filters?.status && filters.status.length > 0) {
      ticketsQuery = ticketsQuery.in('status', filters.status)
    }
    if (filters?.priority && filters.priority.length > 0) {
      ticketsQuery = ticketsQuery.in('priority', filters.priority)
    }
    if (filters?.category && filters.category.length > 0) {
      ticketsQuery = ticketsQuery.in('category_id', filters.category)
    }
    if (filters?.user && filters.user.length > 0) {
      ticketsQuery = ticketsQuery.in('created_by', filters.user)
    }

    const { data: tickets, error: ticketsError } = await ticketsQuery

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    // Get ticket comments for response time calculation
    const ticketIds = tickets?.map(t => t.id) || []
    const { data: comments } = await supabaseAdmin
      .from('ticket_comments')
      .select('*')
      .in('ticket_id', ticketIds)
      .order('created_at', { ascending: true })

    // Get ticket ratings for satisfaction
    const { data: ratings } = await supabaseAdmin
      .from('ticket_ratings')
      .select('*')
      .in('ticket_id', ticketIds)

    // Calculate summary metrics
    const totalTickets = tickets?.length || 0
    const openTickets = tickets?.filter(t => t.status === 'open').length || 0
    const inProgressTickets = tickets?.filter(t => t.status === 'in_progress').length || 0
    const resolvedTickets = tickets?.filter(t => t.status === 'resolved').length || 0
    const cancelledTickets = tickets?.filter(t => t.status === 'cancelled').length || 0

    // Calculate average resolution time
    let avgResolutionHours = 0
    const resolvedTicketsList = tickets?.filter(t => t.status === 'resolved' && t.resolved_at) || []
    
    if (resolvedTicketsList.length > 0) {
      const totalHours = resolvedTicketsList.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at)
        const resolved = new Date(ticket.resolved_at!)
        const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60)
        return sum + hours
      }, 0)
      avgResolutionHours = totalHours / resolvedTicketsList.length
    }

    const avgResolutionTime = avgResolutionHours === 0 
      ? 'N/A'
      : avgResolutionHours < 24 
        ? `${Math.round(avgResolutionHours)}h`
        : `${Math.round(avgResolutionHours / 24)}d`

    // Calculate satisfaction rate
    let satisfactionRate = 0
    if (ratings && ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length
      satisfactionRate = Math.round((avgRating / 5) * 100)
    }

    // Calculate performance metrics
    const firstResponseTimes: number[] = []
    
    tickets?.forEach(ticket => {
      const ticketComments = comments?.filter(c => c.ticket_id === ticket.id) || []
      if (ticketComments.length > 0) {
        const firstResponse = ticketComments.find(c => c.user_id !== ticket.created_by)
        if (firstResponse) {
          const created = new Date(ticket.created_at)
          const responded = new Date(firstResponse.created_at)
          const hours = (responded.getTime() - created.getTime()) / (1000 * 60 * 60)
          if (hours >= 0) {
            firstResponseTimes.push(hours)
          }
        }
      }
    })
    
    const avgFirstResponse = firstResponseTimes.length > 0
      ? firstResponseTimes.reduce((a, b) => a + b, 0) / firstResponseTimes.length
      : 0

    // Calculate reopen rate
    let reopenedCount = 0
    tickets?.forEach(ticket => {
      if (ticket.resolved_at && ticket.status !== 'resolved' && ticket.status !== 'cancelled') {
        reopenedCount++
      }
    })
    const reopenRate = totalTickets > 0 
      ? Math.round((reopenedCount / totalTickets) * 100)
      : 0

    // Calculate escalation rate
    const escalatedTickets = tickets?.filter(t => 
      t.priority === 'high' || t.priority === 'critical'
    ).length || 0
    const escalationRate = totalTickets > 0
      ? Math.round((escalatedTickets / totalTickets) * 100)
      : 0

    const resolutionRate = totalTickets > 0 
      ? Math.round((resolvedTickets / totalTickets) * 100)
      : 0

    // Category statistics
    const categoryMap = new Map<string, { name: string; count: number }>()
    tickets?.forEach(ticket => {
      if (ticket.categories) {
        const categoryId = ticket.categories.id
        if (categoryMap.has(categoryId)) {
          categoryMap.get(categoryId)!.count++
        } else {
          categoryMap.set(categoryId, {
            name: ticket.categories.name,
            count: 1
          })
        }
      }
    })

    const categoryStats = Array.from(categoryMap.values())
      .map(cat => ({
        name: cat.name,
        count: cat.count,
        percentage: totalTickets > 0 ? Math.round((cat.count / totalTickets) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)

    // User statistics
    const userMap = new Map<string, {
      name: string
      created: number
      resolved: number
      totalResolutionTime: number
      resolvedCount: number
    }>()

    tickets?.forEach(ticket => {
      // Track created tickets
      if (ticket.created_by_user) {
        const userId = ticket.created_by_user.id
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            name: ticket.created_by_user.name || ticket.created_by_user.email || 'Unknown',
            created: 0,
            resolved: 0,
            totalResolutionTime: 0,
            resolvedCount: 0
          })
        }
        userMap.get(userId)!.created++
      }

      // Track resolved tickets
      if (ticket.status === 'resolved') {
        const resolverId = ticket.assigned_to_user?.id || ticket.created_by_user?.id
        const resolverName = ticket.assigned_to_user?.name || ticket.created_by_user?.name || 
                            ticket.assigned_to_user?.email || ticket.created_by_user?.email || 'Unknown'
        
        if (resolverId) {
          if (!userMap.has(resolverId)) {
            userMap.set(resolverId, {
              name: resolverName,
              created: 0,
              resolved: 0,
              totalResolutionTime: 0,
              resolvedCount: 0
            })
          }
          userMap.get(resolverId)!.resolved++
          
          if (ticket.resolved_at) {
            const created = new Date(ticket.created_at)
            const resolved = new Date(ticket.resolved_at)
            const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60)
            if (hours >= 0) {
              userMap.get(resolverId)!.totalResolutionTime += hours
              userMap.get(resolverId)!.resolvedCount++
            }
          }
        }
      }
    })

    const userStats = Array.from(userMap.values())
      .map(user => ({
        name: user.name,
        created: user.created,
        resolved: user.resolved,
        avgTime: user.resolvedCount > 0
          ? user.totalResolutionTime / user.resolvedCount < 24
            ? `${Math.round(user.totalResolutionTime / user.resolvedCount)}h`
            : `${Math.round(user.totalResolutionTime / user.resolvedCount / 24)}d`
          : 'N/A'
      }))
      .sort((a, b) => (b.created + b.resolved) - (a.created + a.resolved))

    // Format tickets for report
    const formattedTickets = includeDetails 
      ? (tickets || []).map(ticket => ({
          id: ticket.id,
          ticket_number: ticket.ticket_number,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.categories?.name || 'Sem categoria',
          created_at: ticket.created_at,
          resolved_at: ticket.resolved_at,
          requester: ticket.created_by_user?.name || ticket.created_by_user?.email || 'Unknown',
          assignee: ticket.assigned_to_user?.name || ticket.assigned_to_user?.email || null
        }))
      : []

    // Build report data based on type
    const reportData = {
      summary: {
        totalTickets,
        openTickets,
        resolvedTickets,
        avgResolutionTime,
        satisfactionRate
      },
      tickets: formattedTickets,
      performance: {
        resolutionRate,
        firstResponseTime: avgFirstResponse === 0 
          ? 'N/A'
          : avgFirstResponse < 1 
            ? `${Math.round(avgFirstResponse * 60)}min`
            : `${avgFirstResponse.toFixed(1)}h`,
        reopenRate,
        escalationRate
      },
      categoryStats,
      userStats
    }

    // Filter data based on report type
    let filteredData = reportData
    
    if (type === 'tickets') {
      filteredData = {
        ...reportData,
        categoryStats: [],
        userStats: []
      }
    } else if (type === 'performance') {
      filteredData = {
        ...reportData,
        tickets: [],
        categoryStats: [],
        userStats: []
      }
    } else if (type === 'categories') {
      filteredData = {
        ...reportData,
        tickets: includeDetails ? reportData.tickets : [],
        userStats: []
      }
    } else if (type === 'users') {
      filteredData = {
        ...reportData,
        tickets: [],
        categoryStats: []
      }
    }
    // 'summary' type returns all data

    return NextResponse.json(filteredData)
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}