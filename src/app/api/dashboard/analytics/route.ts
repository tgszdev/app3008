import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Get all tickets in date range with all relations
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
      .gte('created_at', startDate.toISOString().split('T')[0] + 'T00:00:00')
      .lte('created_at', endDate.toISOString().split('T')[0] + 'T23:59:59.999')

    // Apply multi-tenant filter
    if (userType === 'context') {
      if (userContextId) {
        // Usuários de contexto só veem tickets do seu contexto
        ticketsQuery = ticketsQuery.eq('context_id', userContextId)
      } else {
        // Usuário context SEM context_id: retornar vazio
        ticketsQuery = ticketsQuery.eq('id', '00000000-0000-0000-0000-000000000000')
      }
    } else if (userType === 'matrix') {
      // Para usuários matrix, buscar contextos associados
      const { data: userContexts, error: contextsError } = await supabaseAdmin
        .from('user_contexts')
        .select('context_id')
        .eq('user_id', currentUserId)
      
      if (!contextsError && userContexts && userContexts.length > 0) {
        const associatedContextIds = userContexts.map(uc => uc.context_id)
        ticketsQuery = ticketsQuery.in('context_id', associatedContextIds)
      } else {
        // Se não tem contextos associados, não mostrar nenhum ticket
        ticketsQuery = ticketsQuery.eq('context_id', '00000000-0000-0000-0000-000000000000')
      }
    }

    const { data: tickets, error: ticketsError } = await ticketsQuery

    if (ticketsError) {
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    // Get ticket comments for first response time calculation
    const { data: comments } = await supabaseAdmin
      .from('ticket_comments')
      .select('*')
      .in('ticket_id', tickets?.map(t => t.id) || [])
      .order('created_at', { ascending: true })

    // Get ticket ratings for satisfaction calculation
    const { data: ratings } = await supabaseAdmin
      .from('ticket_ratings')
      .select('*')
      .in('ticket_id', tickets?.map(t => t.id) || [])

    // Calculate previous period for trends
    const previousEndDate = new Date(startDate)
    const previousStartDate = new Date(startDate)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    previousStartDate.setDate(previousStartDate.getDate() - daysDiff)

    // Apply same multi-tenant filter to previous period tickets
    let previousTicketsQuery = supabaseAdmin
      .from('tickets')
      .select('*')
      .gte('created_at', previousStartDate.toISOString().split('T')[0] + 'T00:00:00')
      .lte('created_at', previousEndDate.toISOString().split('T')[0] + 'T23:59:59.999')

    if (userType === 'context') {
      if (userContextId) {
        previousTicketsQuery = previousTicketsQuery.eq('context_id', userContextId)
      } else {
        previousTicketsQuery = previousTicketsQuery.eq('id', '00000000-0000-0000-0000-000000000000')
      }
    } else if (userType === 'matrix') {
      // Para usuários matrix, buscar contextos associados
      const { data: userContexts, error: contextsError } = await supabaseAdmin
        .from('user_contexts')
        .select('context_id')
        .eq('user_id', currentUserId)
      
      if (!contextsError && userContexts && userContexts.length > 0) {
        const associatedContextIds = userContexts.map(uc => uc.context_id)
        previousTicketsQuery = previousTicketsQuery.in('context_id', associatedContextIds)
      } else {
        // Se não tem contextos associados, não mostrar nenhum ticket
        previousTicketsQuery = previousTicketsQuery.eq('context_id', '00000000-0000-0000-0000-000000000000')
      }
    }

    const { data: previousTickets } = await previousTicketsQuery

    const { data: previousRatings } = await supabaseAdmin
      .from('ticket_ratings')
      .select('*')
      .in('ticket_id', previousTickets?.map(t => t.id) || [])

    // Overview metrics
    const totalTickets = tickets?.length || 0
    const previousTotalTickets = previousTickets?.length || 0
    const totalTicketsTrend = previousTotalTickets > 0 
      ? Math.round(((totalTickets - previousTotalTickets) / previousTotalTickets) * 100)
      : 0

    // Calculate average resolution time from real data
    const resolvedTickets = tickets?.filter(t => t.status === 'Resolvido' || t.status === 'Fechado') || []
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
    const previousResolvedTickets = previousTickets?.filter(t => t.status === 'Resolvido' || t.status === 'Fechado') || []
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

    // Real satisfaction rate from ratings
    let satisfactionRate = 0
    if (ratings && ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length
      satisfactionRate = Math.round((avgRating / 5) * 100) // Convert 5-star to percentage
    }

    let previousSatisfactionRate = 0
    if (previousRatings && previousRatings.length > 0) {
      const avgRating = previousRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / previousRatings.length
      previousSatisfactionRate = Math.round((avgRating / 5) * 100)
    }

    const satisfactionTrend = previousSatisfactionRate > 0
      ? Math.round(((satisfactionRate - previousSatisfactionRate) / previousSatisfactionRate) * 100)
      : 0

    // Active users
    const uniqueUsers = new Set(tickets?.map(t => t.created_by).filter(Boolean))
    const activeUsers = uniqueUsers.size
    const previousUniqueUsers = new Set(previousTickets?.map(t => t.created_by).filter(Boolean))
    const previousActiveUsers = previousUniqueUsers.size
    const activeUsersTrend = previousActiveUsers > 0
      ? Math.round(((activeUsers - previousActiveUsers) / previousActiveUsers) * 100)
      : 0

    // Get dynamic status data from ticket_statuses table
    const { data: statuses } = await supabaseAdmin
      .from('ticket_statuses')
      .select('id, name, slug, color, order_index')
      .order('order_index', { ascending: true })

    // Tickets by status - Dynamic from database
    const ticketsByStatusDynamic: Record<string, number> = {}
    const ticketsByStatusDetailed: Array<{
      slug: string
      name: string
      color: string
      count: number
      order_index: number
    }> = []

    // Build dynamic status counts
    if (statuses) {
      statuses.forEach(status => {
        const count = tickets?.filter(t => t.status === status.slug).length || 0
        ticketsByStatusDynamic[status.slug] = count
        ticketsByStatusDetailed.push({
          slug: status.slug,
          name: status.name,
          color: status.color,
          count: count,
          order_index: status.order_index
        })
      })
    }

    // Legacy format for compatibility (hardcoded mapping)
    const ticketsByStatus = {
      open: ticketsByStatusDynamic['aberto'] || ticketsByStatusDynamic['open'] || 0,
      in_progress: (ticketsByStatusDynamic['em-progresso'] || ticketsByStatusDynamic['in_progress'] || 0) +
                   (ticketsByStatusDynamic['aguardando-cliente'] || 0) +
                   (ticketsByStatusDynamic['ag-deploy-em-producao'] || 0),
      resolved: ticketsByStatusDynamic['resolvido'] || ticketsByStatusDynamic['resolved'] || 0,
      cancelled: ticketsByStatusDynamic['cancelled'] || ticketsByStatusDynamic['cancelado'] || 0
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

    // Real performance metrics from comments and ticket history
    const firstResponseTimes: number[] = []
    
    // Calculate real first response times from comments
    tickets?.forEach(ticket => {
      const ticketComments = comments?.filter(c => c.ticket_id === ticket.id) || []
      if (ticketComments.length > 0) {
        // Find first comment that's not from the ticket creator
        const firstResponse = ticketComments.find(c => c.user_id !== ticket.created_by)
        if (firstResponse) {
          const created = new Date(ticket.created_at)
          const responded = new Date(firstResponse.created_at)
          const hours = (responded.getTime() - created.getTime()) / (1000 * 60 * 60)
          if (hours >= 0) { // Only positive values
            firstResponseTimes.push(hours)
          }
        }
      }
    })
    
    const avgFirstResponse = firstResponseTimes.length > 0
      ? firstResponseTimes.reduce((a, b) => a + b, 0) / firstResponseTimes.length
      : 0
    
    // Calculate real reopen rate (tickets that were resolved then reopened)
    let reopenedCount = 0
    tickets?.forEach(ticket => {
      // Check if ticket was reopened (has resolved_at but status is not resolved)
      if (ticket.resolved_at && ticket.status !== 'resolved' && ticket.status !== 'cancelled') {
        reopenedCount++
      }
    })
    const reopenRate = totalTickets > 0 
      ? Math.round((reopenedCount / totalTickets) * 100)
      : 0

    // Calculate escalation rate (high and critical priority tickets)
    const escalatedTickets = tickets?.filter(t => 
      t.priority === 'high' || t.priority === 'critical'
    ).length || 0
    const escalationRate = totalTickets > 0
      ? Math.round((escalatedTickets / totalTickets) * 100)
      : 0
    
    const performanceMetrics = {
      firstResponseTime: avgFirstResponse === 0 
        ? 'N/A'
        : avgFirstResponse < 1 
          ? `${Math.round(avgFirstResponse * 60)}min`
          : `${avgFirstResponse.toFixed(1)}h`,
      resolutionRate: totalTickets > 0 
        ? Math.round((resolvedTickets.length / totalTickets) * 100)
        : 0,
      reopenRate,
      escalationRate
    }

    // User activity with real data
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
            name: ticket.created_by_user.name || ticket.created_by_user.email || 'Unknown',
            ticketsCreated: 0,
            ticketsResolved: 0,
            totalResolutionTime: 0,
            resolvedCount: 0
          })
        }
        userActivityMap.get(userId)!.ticketsCreated++
      }

      // Track resolved tickets (by assigned user or creator if no assignee)
      if (ticket.status === 'resolved') {
        const resolverId = ticket.assigned_to_user?.id || ticket.created_by_user?.id
        const resolverName = ticket.assigned_to_user?.name || ticket.created_by_user?.name || 
                            ticket.assigned_to_user?.email || ticket.created_by_user?.email || 'Unknown'
        
        if (resolverId) {
          if (!userActivityMap.has(resolverId)) {
            userActivityMap.set(resolverId, {
              name: resolverName,
              ticketsCreated: 0,
              ticketsResolved: 0,
              totalResolutionTime: 0,
              resolvedCount: 0
            })
          }
          userActivityMap.get(resolverId)!.ticketsResolved++
          
          if (ticket.resolved_at) {
            const created = new Date(ticket.created_at)
            const resolved = new Date(ticket.resolved_at)
            const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60)
            if (hours >= 0) { // Only positive values
              userActivityMap.get(resolverId)!.totalResolutionTime += hours
              userActivityMap.get(resolverId)!.resolvedCount++
            }
          }
        }
      }
    })

    const userActivity = Array.from(userActivityMap.values())
      .map(user => ({
        name: user.name,
        ticketsCreated: user.ticketsCreated,
        ticketsResolved: user.ticketsResolved,
        avgTime: user.resolvedCount > 0
          ? user.totalResolutionTime / user.resolvedCount < 24
            ? `${Math.round(user.totalResolutionTime / user.resolvedCount)}h`
            : `${Math.round(user.totalResolutionTime / user.resolvedCount / 24)}d`
          : 'N/A'
      }))
      .sort((a, b) => (b.ticketsCreated + b.ticketsResolved) - (a.ticketsCreated + a.ticketsResolved))

    // Peak hours analysis with real data
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

    // Build response with all real data
    const analyticsData = {
      overview: {
        totalTickets,
        totalTicketsTrend,
        avgResolutionTime,
        avgResolutionTrend,
        satisfactionRate: satisfactionRate || 0, // 0 if no ratings yet
        satisfactionTrend,
        activeUsers,
        activeUsersTrend
      },
      ticketsByStatus, // Legacy format for compatibility
      ticketsByStatusDetailed, // New dynamic format
      availableStatuses: statuses || [], // Available status from database
      ticketsByPriority,
      ticketsByCategory,
      ticketsTrend,
      performanceMetrics,
      userActivity,
      peakHours
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}