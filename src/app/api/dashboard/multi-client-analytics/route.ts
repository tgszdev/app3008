import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Buscar analytics agrupados por cliente/organização
export async function GET(request: NextRequest) {
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
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const contextIds = searchParams.get('context_ids')?.split(',').filter(Boolean) || []
    const userId = searchParams.get('user_id')
    const myTicketsUserId = searchParams.get('myTickets') // Filtro "Meus Tickets"

    console.log('🔍 Multi-client analytics request:', {
      startDate,
      endDate,
      contextIds,
      userId,
      myTicketsUserId,
      userEmail: session.user.email,
      currentUserId,
      userRole,
      userType
    })

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 })
    }

    if (contextIds.length === 0) {
      return NextResponse.json({ error: 'context_ids are required' }, { status: 400 })
    }

    // Verificar se o usuário tem acesso aos contextos solicitados
    if (userType === 'matrix') {
      // Para usuários matrix, verificar se os contextos estão associados
      const { data: userContexts, error: contextsError } = await supabaseAdmin
        .from('user_contexts')
        .select('context_id')
        .eq('user_id', currentUserId)
      
      if (!contextsError && userContexts) {
        const userContextIds = userContexts.map(uc => uc.context_id)
        const unauthorizedContexts = contextIds.filter(id => !userContextIds.includes(id))
        
        if (unauthorizedContexts.length > 0) {
          return NextResponse.json({ error: 'Acesso negado a alguns contextos' }, { status: 403 })
        }
      }
    } else if (userType === 'context') {
      // Para usuários de contexto, SEMPRE usar o context_id do banco (mais atualizado)
      // Ignorar contextIds da URL (pode estar desatualizado na sessão JWT)
      if (!userContextId) {
        return NextResponse.json({ error: 'Usuário sem contexto definido' }, { status: 403 })
      }
      // Forçar uso do contexto correto do banco
      contextIds.length = 0
      contextIds.push(userContextId)
    }

    // Buscar dados de cada contexto selecionado
    const clientData = []

    for (const contextId of contextIds) {
      try {
        // Buscar informações do contexto
        const { data: context, error: contextError } = await supabaseAdmin
          .from('contexts')
          .select('id, name, type, slug')
          .eq('id', contextId)
          .single()

        if (contextError || !context) {
          continue
        }
        

        // Buscar tickets do contexto no período
        let ticketsQuery = supabaseAdmin
          .from('tickets')
          .select(`
            id,
            ticket_number,
            title,
            status,
            priority,
            created_at,
            updated_at,
            resolved_at,
            created_by,
            assigned_to,
            category_id,
            created_by_user:users!tickets_created_by_fkey(id, name, email),
            assigned_to_user:users!tickets_assigned_to_fkey(id, name, email),
            ticket_history:ticket_history(
              id,
              action_type,
              field_changed,
              old_value,
              new_value,
              created_at,
              user:users(id, name, email)
            ),
            categories(
              id,
              name,
              slug,
              color,
              icon,
              is_global,
              context_id
            ),
            ratings:ticket_ratings(
              id,
              rating,
              comment,
              created_at
            )
          `)
          .eq('context_id', contextId)
          .gte('created_at', `${startDate}T00:00:00`)
          .lte('created_at', `${endDate}T23:59:59.999`)
          .order('created_at', { ascending: false }) // Mais recente primeiro

        // Filtro por usuário se especificado
        if (userId) {
          ticketsQuery = ticketsQuery.or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
        }

        // Filtro "Meus Tickets" (criador OU responsável)
        if (myTicketsUserId) {
          ticketsQuery = ticketsQuery.or(`created_by.eq.${myTicketsUserId},assigned_to.eq.${myTicketsUserId}`)
        }
        

        const { data: tickets, error: ticketsError } = await ticketsQuery

        if (ticketsError) {
          continue
        }

        
        if (tickets && tickets.length > 0) {
          tickets.forEach(ticket => {
          })
        } else {
        }

        // Buscar status disponíveis com contagem
        const { data: statuses, error: statusError } = await supabaseAdmin
          .from('ticket_statuses')
          .select('id, name, slug, color, order_index')
          .order('order_index', { ascending: true })

        if (statusError) {
          continue
        }

        // Calcular estatísticas por status - DINÂMICO
        
        // Primeiro, identificar todos os status únicos dos tickets
        const uniqueTicketStatuses = [...new Set(tickets?.map(t => t.status) || [])]
        
        // Criar status dinâmicos baseados nos tickets encontrados
        // Se não existir na tabela, criar um status temporário
        const dynamicStatusStats = uniqueTicketStatuses.map(ticketStatus => {
          // Buscar se existe na tabela por name (português) em vez de slug (inglês)
          const existingStatus = statuses.find(s => s.name === ticketStatus)
          
          if (existingStatus) {
            // Usar status da tabela
            const matchingTickets = tickets?.filter(ticket => ticket.status === ticketStatus) || []
            return {
              id: existingStatus.id,
              name: existingStatus.name,
              slug: existingStatus.slug,
              color: existingStatus.color,
              order_index: existingStatus.order_index,
              count: matchingTickets.length
            }
          } else {
            // Criar status dinâmico baseado no status do ticket (português)
            const matchingTickets = tickets?.filter(ticket => ticket.status === ticketStatus) || []
            
            return {
              id: `dynamic-${ticketStatus}`,
              name: ticketStatus, // Usar o status como está (português)
              slug: ticketStatus.toLowerCase().replace(/\s+/g, '-'), // Converter para slug
              color: '#6B7280', // Cor padrão
              order_index: 999,
              count: matchingTickets.length
            }
          }
        }).filter(status => status.count > 0) // Só mostrar status com tickets
        
        
        // Ordenar status por order_index (mesma ordem do cadastro)
        const statusStats = dynamicStatusStats.sort((a, b) => a.order_index - b.order_index)
        

        // Calcular estatísticas por categoria
        const categoryMap = new Map()
        tickets?.forEach(ticket => {
          if (ticket.categories) {
            const category = Array.isArray(ticket.categories) ? ticket.categories[0] : ticket.categories
            if (category) {
              const key = category.id
              if (!categoryMap.has(key)) {
                categoryMap.set(key, {
                  id: category.id,
                  name: category.name,
                  slug: category.slug,
                  color: category.color,
                  icon: category.icon,
                  is_global: category.is_global,
                  context_id: category.context_id,
                  total: 0,
                  status_breakdown: {}
                })
              }
              
              const catData = categoryMap.get(key)
              catData.total++
              
              if (!catData.status_breakdown[ticket.status]) {
                catData.status_breakdown[ticket.status] = 0
              }
              catData.status_breakdown[ticket.status]++
            }
          } else {
            // Ticket sem categoria - criar categoria "Sem Categoria"
            const key = 'uncategorized'
            if (!categoryMap.has(key)) {
              categoryMap.set(key, {
                id: 'uncategorized',
                name: 'Sem Categoria',
                slug: 'sem-categoria',
                color: '#6B7280',
                icon: 'folder',
                is_global: false,
                context_id: contextId,
                total: 0,
                status_breakdown: {}
              })
            }
            
            const catData = categoryMap.get(key)
            catData.total++
            
            if (!catData.status_breakdown[ticket.status]) {
              catData.status_breakdown[ticket.status] = 0
            }
            catData.status_breakdown[ticket.status]++
          }
        })

        const categoryStats = Array.from(categoryMap.values()).map(category => {
          const total = category.total
          const percentage = tickets?.length ? (total / tickets.length) * 100 : 0
          
          const statusBreakdownDetailed = statuses.map(status => ({
            slug: status.slug,
            name: status.name,
            color: status.color,
            count: category.status_breakdown[status.slug] || 0,
            order_index: status.order_index
          })).filter(status => status.count > 0)
          
          
          return {
            ...category,
            percentage: Math.round(percentage * 100) / 100,
            status_breakdown_detailed: statusBreakdownDetailed
          }
        }).sort((a, b) => b.total - a.total)
        

        // Calcular tempo médio de resolução
        const resolvedTickets = tickets?.filter(ticket => 
          ticket.resolved_at && 
          (ticket.status === 'resolved' || ticket.status === 'closed')
        ) || []

        let avgResolutionTime = 'N/A'
        if (resolvedTickets.length > 0) {
          const totalTime = resolvedTickets.reduce((sum, ticket) => {
            const created = new Date(ticket.created_at)
            const resolved = new Date(ticket.resolved_at!)
            return sum + (resolved.getTime() - created.getTime())
          }, 0)
          
          const avgMs = totalTime / resolvedTickets.length
          const avgHours = Math.round(avgMs / (1000 * 60 * 60) * 10) / 10
          avgResolutionTime = `${avgHours}h`
        }

        // Dados do cliente
        const clientInfo = {
          context: {
            id: context.id,
            name: context.name,
            type: context.type,
            slug: context.slug
          },
          summary: {
            total_tickets: tickets?.length || 0,
            avg_resolution_time: avgResolutionTime,
            period: {
              start_date: startDate,
              end_date: endDate
            }
          },
          status_stats: statusStats,
          category_stats: categoryStats,
          tickets: tickets?.slice(0, 10) || [] // Últimos 10 tickets
        }

        console.log(`📊 Dados do cliente ${context.name}:`, {
          totalTickets: clientInfo.summary.total_tickets,
          statusStats: statusStats.length,
          categoryStats: categoryStats.length
        })

        clientData.push(clientInfo)

        console.log(`✅ Dados do contexto ${context.name}:`, {
          totalTickets: tickets?.length || 0,
          statusCount: statusStats.length,
          categoryCount: categoryStats.length
        })

      } catch (error) {
        continue
      }
    }

    // Calcular dados consolidados
    const totalTickets = clientData.reduce((sum, client) => sum + client.summary.total_tickets, 0)
    
    console.log(`📊 Dados consolidados:`, {
      totalClients: clientData.length,
      totalTickets: totalTickets,
      clientData: clientData.map(c => ({
        name: c.context.name,
        tickets: c.summary.total_tickets
      }))
    })
    
    // Consolidar status de todos os clientes
    const consolidatedStatusMap = new Map()
    clientData.forEach(client => {
      client.status_stats.forEach(status => {
        const key = status.slug
        if (!consolidatedStatusMap.has(key)) {
          consolidatedStatusMap.set(key, {
            ...status,
            count: 0
          })
        }
        consolidatedStatusMap.get(key).count += status.count
      })
    })

    const consolidatedStatusStats = Array.from(consolidatedStatusMap.values())
      .filter(status => status.count > 0)
      .sort((a, b) => b.count - a.count)

    // Consolidar categorias de todos os clientes
    const consolidatedCategoryMap = new Map()
    clientData.forEach(client => {
      client.category_stats.forEach(category => {
        const key = category.id
        if (!consolidatedCategoryMap.has(key)) {
          consolidatedCategoryMap.set(key, {
            ...category,
            total: 0,
            status_breakdown: {}
          })
        }
        const catData = consolidatedCategoryMap.get(key)
        catData.total += category.total
        
        // Consolidar status breakdown
        Object.entries(category.status_breakdown).forEach(([status, count]) => {
          if (!catData.status_breakdown[status]) {
            catData.status_breakdown[status] = 0
          }
          catData.status_breakdown[status] += count
        })
      })
    })

    const consolidatedCategoryStats = Array.from(consolidatedCategoryMap.values())
      .map(category => {
        const percentage = totalTickets ? (category.total / totalTickets) * 100 : 0
        return {
          ...category,
          percentage: Math.round(percentage * 100) / 100
        }
      })
      .sort((a, b) => b.total - a.total)

    // Calcular dados adicionais para os gráficos
    const ticketsTrend = []
    const peakHours = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }))
    const userActivity = []
    
    // Calcular distribuição de prioridades
    const priorityDistribution = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }
    
    // Calcular tempo médio de resolução e satisfação
    let totalResolutionTime = 0
    let resolvedTicketsCount = 0
    let totalRatings = 0
    let totalRatingSum = 0
    
        // Processar tickets de todos os clientes para calcular métricas
        console.log(`🔍 DEBUG: Processando ${clientData.length} clientes para métricas`)
        clientData.forEach((client, clientIndex) => {
          console.log(`🔍 DEBUG: Cliente ${clientIndex + 1} (${client.context.name}): ${client.tickets.length} tickets`)
          client.tickets.forEach((ticket, ticketIndex) => {
            // Contar por prioridade
            if (ticket.priority === 'low') priorityDistribution.low++
            else if (ticket.priority === 'medium') priorityDistribution.medium++
            else if (ticket.priority === 'high') priorityDistribution.high++
            else if (ticket.priority === 'critical') priorityDistribution.critical++
            
            // Contar por hora
            const hour = new Date(ticket.created_at).getHours()
            peakHours[hour].count++
            
            // Calcular tempo de resolução se ticket foi resolvido
            if (ticket.resolved_at) {
              const created = new Date(ticket.created_at)
              const resolved = new Date(ticket.resolved_at)
              const diffHours = (resolved - created) / (1000 * 60 * 60) // em horas
              totalResolutionTime += diffHours
              resolvedTicketsCount++
            }
            
            // Calcular satisfação se ticket tem rating
            if (ticket.ratings && ticket.ratings.length > 0) {
              console.log(`🔍 DEBUG: Ticket ${ticket.id} tem ${ticket.ratings.length} rating(s):`, ticket.ratings)
              ticket.ratings.forEach(rating => {
                totalRatings++
                totalRatingSum += rating.rating || 0
                console.log(`  - Rating: ${rating.rating}, totalRatings: ${totalRatings}, totalRatingSum: ${totalRatingSum}`)
              })
            }
          })
        })
    
    // Calcular tempo médio de resolução
    const avgResolutionHours = resolvedTicketsCount > 0 ? totalResolutionTime / resolvedTicketsCount : 0
    const avgResolutionDays = avgResolutionHours / 24
    const avgResolutionTime = resolvedTicketsCount > 0 
      ? `${avgResolutionDays.toFixed(1)} dias` 
      : 'N/A'
    
    // Calcular taxa de satisfação
    const satisfactionRate = totalRatings > 0 ? Math.round((totalRatingSum / totalRatings / 5) * 100) : 0
    
    console.log('🔍 DEBUG: Cálculo de satisfação:', {
      totalRatings,
      totalRatingSum,
      avgRating: totalRatings > 0 ? totalRatingSum / totalRatings : 0,
      satisfactionRate,
      formula: totalRatings > 0 ? `(${totalRatingSum} / ${totalRatings} / 5) * 100 = ${satisfactionRate}%` : 'N/A'
    })
    
    const performanceMetrics = {
      firstResponseTime: 'N/A',
      resolutionRate: resolvedTicketsCount > 0 ? Math.round((resolvedTicketsCount / totalTickets) * 100) : 0,
      satisfactionRate: satisfactionRate,
      reopenRate: 0,
      escalationRate: 0
    }

    const response = {
      clients: clientData,
      consolidated: {
        total_tickets: totalTickets,
        period: {
          start_date: startDate,
          end_date: endDate
        },
        avg_resolution_time: avgResolutionTime,
        status_distribution: consolidatedStatusStats,
        priority_distribution: priorityDistribution,
        category_distribution: consolidatedCategoryStats,
        tickets_trend: ticketsTrend,
        peak_hours: peakHours,
        user_activity: userActivity,
        performance_metrics: performanceMetrics
      }
    }

    console.log('✅ Multi-client analytics response:', {
      clientsCount: clientData.length,
      totalTickets,
      consolidatedStatusCount: consolidatedStatusStats.length,
      consolidatedCategoryCount: consolidatedCategoryStats.length
    })

    return NextResponse.json(response)

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
