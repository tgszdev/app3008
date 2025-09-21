import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface StatusInfo {
  id: string
  name: string
  slug: string
  color: string
  order_index: number
}

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
    const userId = searchParams.get('user_id')

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

    // First, get all available status from ticket_statuses table
    const { data: statusData, error: statusError } = await supabaseAdmin
      .from('ticket_statuses')
      .select('id, name, slug, color, order_index')
      .order('order_index', { ascending: true })

    if (statusError) {
      console.error('Error fetching status:', statusError)
      return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
    }

    // Create status mapping for easy lookup
    const statusMap = new Map<string, StatusInfo>()
    const statusList: StatusInfo[] = statusData || []
    
    statusList.forEach(status => {
      statusMap.set(status.slug, {
        id: status.id,
        name: status.name,
        slug: status.slug,
        color: status.color || '#6b7280',
        order_index: status.order_index || 0
      })
    })

    console.log(`Found ${statusList.length} status: ${statusList.map(s => s.slug).join(', ')}`)

    // Get all categories first to ensure all are shown even with 0 tickets
    const { data: allCategories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('id, name, icon, color')
      .order('name', { ascending: true })

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    console.log(`Found ${allCategories?.length || 0} categories`)

    // Get all tickets within the date range with category information
    let query = supabaseAdmin
      .from('tickets')
      .select(`
        id,
        status,
        created_at,
        created_by,
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
    
    // Apply user filter if provided
    if (userId) {
      query = query.eq('created_by', userId)
    }

    const { data: tickets, error: ticketsError } = await query

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    console.log(`Found ${tickets?.length || 0} tickets for period ${filterStartDate} to ${filterEndDate}`)

    // Calculate statistics by category
    const totalTickets = tickets?.length || 0
    
    // Initialize all categories with zero counts
    const categoryStats = new Map<string, {
      id: string
      name: string
      icon: string | null
      color: string | null
      count: number
      statusCounts: Map<string, number>
    }>()

    // Initialize all categories (even those with 0 tickets)
    allCategories?.forEach(category => {
      categoryStats.set(category.id, {
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        count: 0,
        statusCounts: new Map<string, number>()
      })
    })

    // Process tickets and update counts
    tickets?.forEach((ticket: any) => {
      const category = ticket.categories
      const categoryId = category?.id || 'uncategorized'
      
      // Handle uncategorized tickets
      if (categoryId === 'uncategorized' && !categoryStats.has('uncategorized')) {
        categoryStats.set('uncategorized', {
          id: 'uncategorized',
          name: 'Sem Categoria',
          icon: 'folder',
          color: '#6B7280',
          count: 0,
          statusCounts: new Map<string, number>()
        })
      }

      const stats = categoryStats.get(categoryId)
      if (stats) {
        stats.count++
        
        // Count by status (dynamic)
        const ticketStatus = ticket.status
        const currentCount = stats.statusCounts.get(ticketStatus) || 0
        stats.statusCounts.set(ticketStatus, currentCount + 1)
      }
    })

    // Convert to array and calculate percentages
    const categoriesArray = Array.from(categoryStats.values()).map(cat => {
      // Create status breakdown with all available status
      const statusBreakdown: Record<string, number> = {}
      const statusBreakdownDetailed: Array<{
        slug: string
        name: string
        color: string
        count: number
        order_index: number
      }> = []
      
      // Initialize all status with 0 count
      statusList.forEach(status => {
        const count = cat.statusCounts.get(status.slug) || 0
        statusBreakdown[status.slug] = count
        statusBreakdownDetailed.push({
          slug: status.slug,
          name: status.name,
          color: status.color,
          count: count,
          order_index: status.order_index
        })
      })
      
      // Sort status by order_index
      statusBreakdownDetailed.sort((a, b) => a.order_index - b.order_index)
      
      return {
        id: cat.id,
        nome: cat.name,
        icon: cat.icon,
        color: cat.color,
        quantidade: cat.count,
        percentual: totalTickets > 0 ? parseFloat(((cat.count / totalTickets) * 100).toFixed(2)) : 0,
        status_breakdown: statusBreakdown,
        status_breakdown_detailed: statusBreakdownDetailed
      }
    })

    // Sort by quantity (descending)
    categoriesArray.sort((a, b) => b.quantidade - a.quantidade)

    // Get tickets by status for the period (dynamic)
    const statusCounts: Record<string, number> = {}
    const statusCountsDetailed: Array<{
      slug: string
      name: string
      color: string
      count: number
      order_index: number
    }> = []
    
    statusList.forEach(status => {
      const count = tickets?.filter(t => t.status === status.slug).length || 0
      statusCounts[status.slug] = count
      statusCountsDetailed.push({
        slug: status.slug,
        name: status.name,
        color: status.color,
        count: count,
        order_index: status.order_index
      })
    })
    
    // Sort status by order_index
    statusCountsDetailed.sort((a, b) => a.order_index - b.order_index)

    // Calculate average resolution time for resolved tickets in this period
    const resolvedTickets = tickets?.filter(t => t.status === 'resolved') || []
    let averageResolutionTime = '0h 0m'
    
    if (resolvedTickets.length > 0) {
      let resolvedQuery = supabaseAdmin
        .from('tickets')
        .select('created_at, updated_at')
        .eq('status', 'resolved')
        .gte('created_at', `${filterStartDate}T00:00:00`)
        .lte('created_at', `${filterEndDate}T23:59:59`)
      
      // Apply user filter if provided
      if (userId) {
        resolvedQuery = resolvedQuery.eq('created_by', userId)
      }
      
      const { data: resolvedWithUpdated } = await resolvedQuery

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
      status_summary_detailed: statusCountsDetailed,
      available_status: statusList,
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