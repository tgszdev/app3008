import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7days' // 7days, 30days, 90days, 1year

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30days':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90days':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '1year':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    // Get tickets within date range
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    // Group tickets by day for chart data
    const ticketsByDay: Record<string, number> = {}
    const statusByDay: Record<string, Record<string, number>> = {}
    const priorityCount: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }
    const categoryCount: Record<string, number> = {}

    tickets?.forEach(ticket => {
      // Count by day
      const day = new Date(ticket.created_at).toLocaleDateString('pt-BR')
      ticketsByDay[day] = (ticketsByDay[day] || 0) + 1

      // Count by status per day
      if (!statusByDay[day]) {
        statusByDay[day] = {
          open: 0,
          in_progress: 0,
          resolved: 0,
          cancelled: 0
        }
      }
      statusByDay[day][ticket.status] = (statusByDay[day][ticket.status] || 0) + 1

      // Count by priority
      if (ticket.priority in priorityCount) {
        priorityCount[ticket.priority]++
      }

      // Count by category
      categoryCount[ticket.category] = (categoryCount[ticket.category] || 0) + 1
    })

    // Calculate performance metrics
    const totalTickets = tickets?.length || 0
    const resolvedTickets = tickets?.filter(t => t.status === 'resolved').length || 0
    const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets * 100).toFixed(1) : '0'

    // Calculate average response time (time to first assignment)
    const assignedTickets = tickets?.filter(t => t.assigned_to) || []
    let avgResponseTime = '0h'
    
    if (assignedTickets.length > 0) {
      const totalResponseTime = assignedTickets.reduce((acc, ticket) => {
        const created = new Date(ticket.created_at).getTime()
        const assigned = new Date(ticket.updated_at).getTime() // Simplified - would need assignment history
        return acc + (assigned - created)
      }, 0)
      
      const avgTimeMs = totalResponseTime / assignedTickets.length
      const hours = Math.floor(avgTimeMs / (1000 * 60 * 60))
      avgResponseTime = `${hours}h`
    }

    // Get top performers (analysts with most resolved tickets)
    const { data: topPerformers, error: performersError } = await supabase
      .from('tickets')
      .select(`
        assigned_to,
        assigned_to_user:users!tickets_assigned_to_fkey(
          id,
          name,
          email
        )
      `)
      .eq('status', 'resolved')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (performersError) {
      console.error('Error fetching performers:', performersError)
    }

    // Count resolved tickets per analyst
    const performerStats: Record<string, { name: string; count: number }> = {}
    
    topPerformers?.forEach((ticket: any) => {
      if (ticket.assigned_to_user && Array.isArray(ticket.assigned_to_user) && ticket.assigned_to_user[0]) {
        const user = ticket.assigned_to_user[0]
        const userId = user.id
        if (!performerStats[userId]) {
          performerStats[userId] = {
            name: user.name || 'Unknown',
            count: 0
          }
        }
        performerStats[userId].count++
      } else if (ticket.assigned_to_user && !Array.isArray(ticket.assigned_to_user)) {
        const userId = ticket.assigned_to_user.id
        if (!performerStats[userId]) {
          performerStats[userId] = {
            name: ticket.assigned_to_user.name || 'Unknown',
            count: 0
          }
        }
        performerStats[userId].count++
      }
    })

    // Sort and get top 5 performers
    const topPerformersList = Object.values(performerStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Format chart data
    const chartData = {
      labels: Object.keys(ticketsByDay),
      datasets: [
        {
          label: 'Total de Chamados',
          data: Object.values(ticketsByDay)
        }
      ]
    }

    const statusChartData = {
      labels: Object.keys(statusByDay),
      datasets: [
        {
          label: 'Abertos',
          data: Object.keys(statusByDay).map(day => statusByDay[day].open || 0)
        },
        {
          label: 'Em Progresso',
          data: Object.keys(statusByDay).map(day => statusByDay[day].in_progress || 0)
        },
        {
          label: 'Resolvidos',
          data: Object.keys(statusByDay).map(day => statusByDay[day].resolved || 0)
        },
        {
          label: 'Cancelados',
          data: Object.keys(statusByDay).map(day => statusByDay[day].cancelled || 0)
        }
      ]
    }

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        totalTickets,
        resolvedTickets,
        resolutionRate,
        avgResponseTime
      },
      charts: {
        ticketsByDay: chartData,
        statusByDay: statusChartData,
        priorityDistribution: priorityCount,
        categoryDistribution: categoryCount
      },
      topPerformers: topPerformersList
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}