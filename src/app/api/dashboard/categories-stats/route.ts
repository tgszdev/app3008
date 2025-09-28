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
    console.log('🔍 API categories-stats chamada')
    
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const selectedContextId = searchParams.get('context_id')
    const selectedContextIds = searchParams.get('context_ids')
    console.log('🔍 Contexto selecionado via parâmetro:', selectedContextId)
    console.log('🔍 Contextos múltiplos via parâmetro:', selectedContextIds)

    // Default to current month if no dates provided
    let filterStartDate: string
    let filterEndDate: string
    
    if (!startDate || !endDate) {
      const now = new Date()
      const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      filterStartDate = startDate || defaultStartDate
      filterEndDate = endDate || defaultEndDate
    } else {
      filterStartDate = startDate
      filterEndDate = endDate
    }

    console.log('Using dates for query:', { filterStartDate, filterEndDate })

    // Buscar status dinamicamente da tabela ticket_statuses
    const { data: statuses, error: statusError } = await supabaseAdmin
      .from('ticket_statuses')
      .select('id, name, slug, color, order_index')
      .order('order_index', { ascending: true })

    if (statusError) {
      console.error('❌ Erro ao buscar status:', statusError)
      return NextResponse.json({ error: 'Erro ao buscar status' }, { status: 500 })
    }

    const statusList = statuses || []
    console.log(`📋 Status dinâmicos carregados:`, statusList.map(s => `${s.name} (${s.slug})`))

    // Get all tickets within the date range with category information
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
    
    console.log(`🔍 Query base criada para período: ${filterStartDate} até ${filterEndDate}`)
    
    // Apply multi-tenant filter
    if (selectedContextIds) {
      // Múltiplos contextos
      const contextIds = selectedContextIds.split(',').filter(id => id.trim())
      query = query.in('context_id', contextIds)
      console.log(`✅ Query categories filtrada por múltiplos contextos: ${contextIds}`)
    } else if (selectedContextId) {
      // Contexto único
      query = query.eq('context_id', selectedContextId)
      console.log(`✅ Query categories filtrada por contexto selecionado: ${selectedContextId}`)
    } else {
      console.log(`⚠️ Nenhum filtro de contexto aplicado - buscando todos os tickets`)
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
      
      // Usar sistema dinâmico para status das categorias
      const uniqueCategoryStatuses = [...new Set(Array.from(cat.statusCounts.keys()))]
      
      uniqueCategoryStatuses.forEach(ticketStatus => {
        const count = cat.statusCounts.get(ticketStatus) || 0
        
        if (count > 0) {
          // Buscar se existe na tabela
          const existingStatus = statusList.find(s => s.slug === ticketStatus)
          
          if (existingStatus) {
            // Usar status da tabela
            statusBreakdown[existingStatus.slug] = count
            statusBreakdownDetailed.push({
              slug: existingStatus.slug,
              name: existingStatus.name,
              color: existingStatus.color,
              count: count,
              order_index: existingStatus.order_index
            })
          } else {
            // Criar status dinâmico
            const dynamicName = ticketStatus
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
            
            statusBreakdown[ticketStatus] = count
            statusBreakdownDetailed.push({
              slug: ticketStatus,
              name: dynamicName,
              color: '#6B7280', // Cor padrão
              count: count,
              order_index: 999
            })
          }
        }
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
    
    console.log(`🔍 Processando ${tickets?.length || 0} tickets para status stats`)
    console.log(`🔍 Tickets encontrados:`, tickets?.map(t => ({ id: t.id, status: t.status })))
    
    // Primeiro, identificar todos os status únicos dos tickets
    const uniqueTicketStatuses = [...new Set(tickets?.map(t => t.status) || [])]
    console.log(`🎯 Status únicos dos tickets:`, uniqueTicketStatuses)
    
    // Criar status dinâmicos baseados nos tickets encontrados
    const dynamicStatusStats = uniqueTicketStatuses.map(ticketStatus => {
      // Buscar se existe na tabela
      const existingStatus = statusList.find(s => s.slug === ticketStatus)
      
      if (existingStatus) {
        // Usar status da tabela
        const matchingTickets = tickets?.filter(ticket => ticket.status === ticketStatus) || []
        return {
          slug: existingStatus.slug,
          name: existingStatus.name,
          color: existingStatus.color,
          count: matchingTickets.length,
          order_index: existingStatus.order_index
        }
      } else {
        // Criar status dinâmico baseado no slug do ticket
        const matchingTickets = tickets?.filter(ticket => ticket.status === ticketStatus) || []
        const dynamicName = ticketStatus
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        
        return {
          slug: ticketStatus,
          name: dynamicName,
          color: '#6B7280', // Cor padrão
          count: matchingTickets.length,
          order_index: 999
        }
      }
    }).filter(status => status.count > 0) // Só mostrar status com tickets
    
    console.log(`✅ Status dinâmicos criados:`, dynamicStatusStats.map(s => `${s.name} (${s.slug}): ${s.count}`))
    
    // Aplicar aos arrays de resposta
    dynamicStatusStats.forEach(status => {
      statusCounts[status.slug] = status.count
      statusCountsDetailed.push({
        slug: status.slug,
        name: status.name,
        color: status.color,
        count: status.count,
        order_index: status.order_index
      })
    })
    
    console.log(`📊 Status counts finais:`, statusCounts)
    console.log(`📊 Status detailed finais:`, statusCountsDetailed.map(s => `${s.name}: ${s.count}`))
    
    // Sort status by order_index
    statusCountsDetailed.sort((a, b) => a.order_index - b.order_index)

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
      average_resolution_time: '0h 0m'
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