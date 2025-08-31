import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    console.log('Received dates from frontend:', { startDate, endDate })

    // Default to current month if no dates provided
    let filterStartDate: string
    let filterEndDate: string
    
    if (!startDate || !endDate) {
      // Only use defaults if dates are not provided
      const now = new Date()
      const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      filterStartDate = startDate || defaultStartDate
      filterEndDate = endDate || defaultEndDate
    } else {
      // Use exactly the dates provided without any modification
      filterStartDate = startDate
      filterEndDate = endDate
    }

    console.log('Using dates for query:', { filterStartDate, filterEndDate })

    // Get all tickets within the date range with category information
    let query = supabase
      .from('tickets')
      .select(`
        id,
        status,
        created_at,
        category_id,
        categories (
          id,
          name,
          icon,
          color
        )
      `)
      .gte('created_at', `${filterStartDate}T00:00:00`)
      .lte('created_at', `${filterEndDate}T23:59:59`)

    const { data: tickets, error: ticketsError } = await query

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    console.log(`Found ${tickets?.length || 0} tickets for period ${filterStartDate} to ${filterEndDate}`)

    // Calculate statistics by category
    const totalTickets = tickets?.length || 0
    
    // Group tickets by category
    const categoryStats = new Map<string, {
      id: string
      name: string
      icon: string | null
      color: string | null
      count: number
      openCount: number
      inProgressCount: number
      resolvedCount: number
      cancelledCount: number
    }>()

    tickets?.forEach((ticket: any) => {
      const category = ticket.categories
      const categoryId = category?.id || 'uncategorized'
      const categoryName = category?.name || 'Sem Categoria'
      const categoryIcon = category?.icon || 'folder'
      const categoryColor = category?.color || '#6B7280'

      if (!categoryStats.has(categoryId)) {
        categoryStats.set(categoryId, {
          id: categoryId,
          name: categoryName,
          icon: categoryIcon,
          color: categoryColor,
          count: 0,
          openCount: 0,
          inProgressCount: 0,
          resolvedCount: 0,
          cancelledCount: 0
        })
      }

      const stats = categoryStats.get(categoryId)!
      stats.count++
      
      // Count by status
      switch (ticket.status) {
        case 'open':
          stats.openCount++
          break
        case 'in_progress':
          stats.inProgressCount++
          break
        case 'resolved':
          stats.resolvedCount++
          break
        case 'cancelled':
          stats.cancelledCount++
          break
      }
    })

    // Convert to array and calculate percentages
    const categoriesArray = Array.from(categoryStats.values()).map(cat => ({
      id: cat.id,
      nome: cat.name,
      icon: cat.icon,
      color: cat.color,
      quantidade: cat.count,
      percentual: totalTickets > 0 ? parseFloat(((cat.count / totalTickets) * 100).toFixed(2)) : 0,
      status_breakdown: {
        open: cat.openCount,
        in_progress: cat.inProgressCount,
        resolved: cat.resolvedCount,
        cancelled: cat.cancelledCount
      }
    }))

    // Sort by quantity (descending)
    categoriesArray.sort((a, b) => b.quantidade - a.quantidade)

    // Get tickets by status for the period
    const statusCounts = {
      open: tickets?.filter(t => t.status === 'open').length || 0,
      in_progress: tickets?.filter(t => t.status === 'in_progress').length || 0,
      resolved: tickets?.filter(t => t.status === 'resolved').length || 0,
      cancelled: tickets?.filter(t => t.status === 'cancelled').length || 0
    }

    // Calculate average resolution time for resolved tickets in this period
    const resolvedTickets = tickets?.filter(t => t.status === 'resolved') || []
    let averageResolutionTime = '0h 0m'
    
    if (resolvedTickets.length > 0) {
      const { data: resolvedWithUpdated } = await supabase
        .from('tickets')
        .select('created_at, updated_at')
        .eq('status', 'resolved')
        .gte('created_at', `${filterStartDate}T00:00:00`)
        .lte('created_at', `${filterEndDate}T23:59:59`)

      if (resolvedWithUpdated && resolvedWithUpdated.length > 0) {
        const totalTime = resolvedWithUpdated.reduce((acc, ticket) => {
          const created = new Date(ticket.created_at).getTime()
          const updated = new Date(ticket.updated_at).getTime()
          return acc + (updated - created)
        }, 0)
        
        const avgTimeMs = totalTime / resolvedWithUpdated.length
        const hours = Math.floor(avgTimeMs / (1000 * 60 * 60))
        const minutes = Math.floor((avgTimeMs % (1000 * 60 * 60)) / (1000 * 60))
        averageResolutionTime = `${hours}h ${minutes}m`
      }
    }

    // Return the exact dates that were used for filtering
    const response = {
      total_tickets: totalTickets,
      periodo: {
        data_inicio: filterStartDate,
        data_fim: filterEndDate
      },
      categorias: categoriesArray,
      status_summary: statusCounts,
      average_resolution_time: averageResolutionTime
    }

    console.log('Returning period:', response.periodo)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Categories stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}