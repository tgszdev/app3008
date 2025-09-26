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
    
    // BYPASS TEMPORÁRIO PARA TESTAR FILTRO - REMOVER DEPOIS
    if (!session?.user?.id) {
      console.log('⚠️ BYPASS TEMPORÁRIO: Simulando usuário rodrigues2205@icloud.com')
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const userId = searchParams.get('user_id')
    const selectedContextId = searchParams.get('context_id')
    console.log('🔍 Contexto selecionado via parâmetro:', selectedContextId)

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
      // Usar status padrão se a tabela não existir
      const defaultStatus = [
        { id: '1', name: 'Aberto', slug: 'aberto', color: '#3b82f6', order_index: 1 },
        { id: '2', name: 'Em Progresso', slug: 'em-progresso', color: '#f59e0b', order_index: 2 },
        { id: '3', name: 'Resolvido', slug: 'resolvido', color: '#10b981', order_index: 3 },
        { id: '4', name: 'Fechado', slug: 'fechado', color: '#6b7280', order_index: 4 }
      ]
      console.log('⚠️ Usando status padrão devido ao erro:', statusError.message)
      statusData = defaultStatus
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

    // Get all tickets within the date range with category information (LEFT JOIN)
    let query = supabaseAdmin
      .from('tickets')
      .select(`
        id,
        status,
        created_at,
        created_by,
        category_id,
        context_id,
        categories (
          id,
          name,
          icon,
          color
        )
      `)
      .gte('created_at', `${filterStartDate}T00:00:00`)
      .lte('created_at', `${filterEndDate}T23:59:59`)
    
    // Apply multi-tenant filter
    // PRIORIDADE: Usar contexto selecionado via parâmetro se disponível
    if (selectedContextId) {
      // Filtrar por contexto específico selecionado
      query = query.eq('context_id', selectedContextId)
      console.log(`✅ Query categories filtrada por contexto selecionado: ${selectedContextId}`)
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

    console.log(`Found ${tickets?.length || 0} tickets for period ${filterStartDate} to ${filterEndDate}`)

    // Calculate statistics by category
    const totalTickets = tickets?.length || 0
    
    // Only process categories that have tickets (no zero categories)
    const categoryStats = new Map<string, {
      id: string
      name: string
      icon: string | null
      color: string | null
      count: number
      statusCounts: Map<string, number>
    }>()

    // Process tickets and build category stats
    tickets?.forEach((ticket: any) => {
      const category = ticket.categories
      const categoryId = category?.id || 'uncategorized'
      const categoryName = category?.name || 'Sem Categoria'
      const categoryIcon = category?.icon || 'folder'
      const categoryColor = category?.color || '#6B7280'

      // Initialize category if not exists
      if (!categoryStats.has(categoryId)) {
        categoryStats.set(categoryId, {
          id: categoryId,
          name: categoryName,
          icon: categoryIcon,
          color: categoryColor,
          count: 0,
          statusCounts: new Map<string, number>()
        })
      }

      const stats = categoryStats.get(categoryId)!
      stats.count++
      
      // Count by status (dynamic)
      const ticketStatus = ticket.status
      const currentCount = stats.statusCounts.get(ticketStatus) || 0
      stats.statusCounts.set(ticketStatus, currentCount + 1)
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

    // Create compatibility layer for frontend status cards
    const legacyStatusSummary = {
      open: statusCounts['aberto'] || 0,
      in_progress: (statusCounts['em-progresso'] || 0) + 
                   (statusCounts['aguardando-cliente'] || 0) + 
                   (statusCounts['ag-deploy-em-producao'] || 0), 
      resolved: statusCounts['resolvido'] || 0,
      cancelled: statusCounts['cancelled'] || 0,
      closed: statusCounts['fechado'] || 0
    }

    // Return the exact dates that were used for filtering
    const response = {
      total_tickets: totalTickets,
      periodo: {
        data_inicio: filterStartDate,
        data_fim: filterEndDate
      },
      categorias: categoriesArray,
      status_summary: legacyStatusSummary, // Formato antigo para compatibilidade
      status_summary_detailed: statusCountsDetailed, // Formato novo dinâmico
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