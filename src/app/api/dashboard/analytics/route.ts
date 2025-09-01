import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30days'
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (range) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30days':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90days':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Get all tickets in date range
    const { data: tickets, error: ticketsError } = await supabaseAdmin
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
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    // Calculate previous period for trends
    const previousEndDate = new Date(startDate)
    const previousStartDate = new Date(startDate)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    previousStartDate.setDate(previousStartDate.getDate() - daysDiff)

    const { data: previousTickets } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .gte('created_at', previousStartDate.toISOString())
      .lte('created_at', previousEndDate.toISOString())

    // Overview metrics
    const totalTickets = tickets?.length || 0
    const previousTotalTickets = previousTickets?.length || 0
    const totalTicketsTrend = previousTotalTickets > 0 
      ? Math.round(((totalTickets - previousTotalTickets) / previousTotalTickets) * 100)
      : 0

    // Calculate average resolution time
    const resolvedTickets = tickets?.filter(t => t.status === 'resolved') || []
    let avgResolutionHours = 0
    
    if (resolvedTickets.length > 0) {
      const totalHours = resolvedTickets.reduce((sum, ticket) => {
        if (ticket.resolved_at) {
          const created = new Date(ticket.created_at)
          const resolved = new Date(ticket.resolved_at)
          const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60)
          return sum + hours
        }
        return sum
      }, 0)
      avgResolutionHours = totalHours / resolvedTickets.length
    }

    const avgResolutionTime = avgResolutionHours < 24 
      ? `${Math.round(avgResolutionHours)}h`
      : `${Math.round(avgResolutionHours / 24)}d`

    // Previous period resolution time for trend
    const previousResolvedTickets = previousTickets?.filter(t => t.status === 'resolved') || []
    let previousAvgResolutionHours = 0
    
    if (previousResolvedTickets.length > 0) {
      const totalHours = previousResolvedTickets.reduce((sum, ticket) => {
        if (ticket.resolved_at) {
          const created = new Date(ticket.created_at)
          const resolved = new Date(ticket.resolved_at)
          const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60)
          return sum + hours
        }
        return sum
      }, 0)
      previousAvgResolutionHours = totalHours / previousResolvedTickets.length
    }

    const avgResolutionTrend = previousAvgResolutionHours > 0
      ? Math.round(((avgResolutionHours - previousAvgResolutionHours) / previousAvgResolutionHours) * 100)
      : 0

    // Satisfaction rate (mock data for now - would come from ratings table)
    const satisfactionRate = 92
    const satisfactionTrend = 5

    // Active users
    const uniqueUsers = new Set(tickets?.map(t => t.created_by))
    const activeUsers = uniqueUsers.size
    const previousUniqueUsers = new Set(previousTickets?.map(t => t.created_by))
    const previousActiveUsers = previousUniqueUsers.size
    const activeUsersTrend = previousActiveUsers > 0
      ? Math.round(((activeUsers - previousActiveUsers) / previousActiveUsers) * 100)
      : 0

    // Tickets by status
    const ticketsByStatus = {
      open: tickets?.filter(t => t.status === 'open').length || 0,
      in_progress: tickets?.filter(t => t.status === 'in_progress').length || 0,
      resolved: tickets?.filter(t => t.status === 'resolved').length || 0,
      cancelled: tickets?.filter(t => t.status === 'cancelled').length || 0
    }

    // Tickets by priority
    const ticketsByPriority = {
      low: tickets?.filter(t => t.priority === 'low').length || 0,
      medium: tickets?.filter(t => t.priority === 'medium').length || 0,
      high: tickets?.filter(t => t.priority === 'high').length || 0,
      critical: tickets?.filter(t => t.priority === 'critical').length || 0
    }

    // Tickets by category
    const categoryMap = new Map<string, { name: string; count: number; color: string }>()
    tickets?.forEach(ticket => {
      if (ticket.categories) {
        const categoryId = ticket.categories.id
        if (categoryMap.has(categoryId)) {
          categoryMap.get(categoryId)!.count++
        } else {
          categoryMap.set(categoryId, {
            name: ticket.categories.name,
            count: 1,
            color: ticket.categories.color || '#6b7280'
          })
        }
      }
    })
    const ticketsByCategory = Array.from(categoryMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8) // Top 8 categories

    // Tickets trend (daily for last period)
    const ticketsTrend: Array<{ date: string; count: number }> = []
    const currentDate = new Date(startDate)
    
    // Group by appropriate interval based on range
    let intervalDays = 1
    if (range === '90days') intervalDays = 3
    if (range === '1year') intervalDays = 10
    
    while (currentDate <= endDate) {
      const nextDate = new Date(currentDate)
      nextDate.setDate(nextDate.getDate() + intervalDays)
      
      const count = tickets?.filter(t => {
        const ticketDate = new Date(t.created_at)
        return ticketDate >= currentDate && ticketDate < nextDate
      }).length || 0
      
      ticketsTrend.push({
        date: currentDate.toISOString(),
        count
      })
      
      currentDate.setDate(currentDate.getDate() + intervalDays)
    }

    // Performance metrics
    const firstResponseTimes: number[] = []
    tickets?.forEach(ticket => {
      // Mock first response time (would come from ticket_comments table)
      firstResponseTimes.push(Math.random() * 4 + 0.5) // 0.5 to 4.5 hours
    })
    
    const avgFirstResponse = firstResponseTimes.length > 0
      ? firstResponseTimes.reduce((a, b) => a + b, 0) / firstResponseTimes.length
      : 0
    
    const performanceMetrics = {
      firstResponseTime: avgFirstResponse < 1 
        ? `${Math.round(avgFirstResponse * 60)}min`
        : `${avgFirstResponse.toFixed(1)}h`,
      resolutionRate: totalTickets > 0 
        ? Math.round((resolvedTickets.length / totalTickets) * 100)
        : 0,
      reopenRate: 3, // Mock data
      escalationRate: 8 // Mock data
    }

    // User activity
    const userActivityMap = new Map<string, {
      name: string
      ticketsCreated: number
      ticketsResolved: number
      totalResolutionTime: number
      resolvedCount: number
    }>()

    tickets?.forEach(ticket => {
      // Track created tickets
      if (ticket.created_by_user) {
        const userId = ticket.created_by_user.id
        if (!userActivityMap.has(userId)) {
          userActivityMap.set(userId, {
            name: ticket.created_by_user.name || 'Unknown',
            ticketsCreated: 0,
            ticketsResolved: 0,
            totalResolutionTime: 0,
            resolvedCount: 0
          })
        }
        userActivityMap.get(userId)!.ticketsCreated++
      }

      // Track resolved tickets (by assigned user)
      if (ticket.status === 'resolved' && ticket.assigned_to_user) {
        const userId = ticket.assigned_to_user.id
        if (!userActivityMap.has(userId)) {
          userActivityMap.set(userId, {
            name: ticket.assigned_to_user.name || 'Unknown',
            ticketsCreated: 0,
            ticketsResolved: 0,
            totalResolutionTime: 0,
            resolvedCount: 0
          })
        }
        userActivityMap.get(userId)!.ticketsResolved++
        
        if (ticket.resolved_at) {
          const created = new Date(ticket.created_at)
          const resolved = new Date(ticket.resolved_at)
          const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60)
          userActivityMap.get(userId)!.totalResolutionTime += hours
          userActivityMap.get(userId)!.resolvedCount++
        }
      }
    })

    const userActivity = Array.from(userActivityMap.values())
      .map(user => ({
        name: user.name,
        ticketsCreated: user.ticketsCreated,
        ticketsResolved: user.ticketsResolved,
        avgTime: user.resolvedCount > 0
          ? `${Math.round(user.totalResolutionTime / user.resolvedCount)}h`
          : 'N/A'
      }))
      .sort((a, b) => (b.ticketsCreated + b.ticketsResolved) - (a.ticketsCreated + a.ticketsResolved))

    // Peak hours analysis
    const hourMap = new Map<number, number>()
    for (let i = 0; i < 24; i++) {
      hourMap.set(i, 0)
    }
    
    tickets?.forEach(ticket => {
      const hour = new Date(ticket.created_at).getHours()
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
    })
    
    const peakHours = Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour)

    // Build response
    const analyticsData = {
      overview: {
        totalTickets,
        totalTicketsTrend,
        avgResolutionTime,
        avgResolutionTrend,
        satisfactionRate,
        satisfactionTrend,
        activeUsers,
        activeUsersTrend
      },
      ticketsByStatus,
      ticketsByPriority,
      ticketsByCategory,
      ticketsTrend,
      performanceMetrics,
      userActivity,
      peakHours
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}