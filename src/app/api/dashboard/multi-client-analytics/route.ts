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

    console.log('🔍 Multi-client analytics request:', {
      startDate,
      endDate,
      contextIds,
      userId,
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
          console.log('❌ Usuário não tem acesso aos contextos:', unauthorizedContexts)
          return NextResponse.json({ error: 'Acesso negado a alguns contextos' }, { status: 403 })
        }
      }
    } else if (userType === 'context') {
      // Para usuários de contexto, só podem acessar seu próprio contexto
      if (contextIds.length > 1 || !contextIds.includes(userContextId)) {
        console.log('❌ Usuário de contexto tentando acessar contextos não autorizados')
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
      }
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
          console.error(`❌ Erro ao buscar contexto ${contextId}:`, contextError)
          continue
        }
        
        console.log(`✅ Contexto encontrado: ${context.name} (${contextId})`)

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
            categories(
              id,
              name,
              slug,
              color,
              icon,
              is_global,
              context_id
            )
          `)
          .eq('context_id', contextId)
          .gte('created_at', `${startDate}T00:00:00.000Z`)
          .lte('created_at', `${endDate}T23:59:59.999Z`)

        // Filtro por usuário se especificado
        if (userId) {
          ticketsQuery = ticketsQuery.or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
        }
        
        console.log(`🔍 Query para contexto ${context.name}:`)
        console.log(`  - Context ID: ${contextId}`)
        console.log(`  - Período: ${startDate} até ${endDate}`)
        console.log(`  - User ID: ${userId || 'não especificado'}`)

        const { data: tickets, error: ticketsError } = await ticketsQuery

        if (ticketsError) {
          console.error(`❌ Erro ao buscar tickets do contexto ${contextId}:`, ticketsError)
          continue
        }

        console.log(`✅ Contexto ${context.name}: ${tickets?.length || 0} tickets encontrados`)
        
        if (tickets && tickets.length > 0) {
          tickets.forEach(ticket => {
            console.log(`  - Ticket #${ticket.ticket_number}: ${ticket.title} (status: ${ticket.status})`)
          })
        } else {
          console.log(`⚠️ Nenhum ticket encontrado para o contexto ${context.name}`)
        }

        // Buscar status disponíveis com contagem
        const { data: statuses, error: statusError } = await supabaseAdmin
          .from('ticket_statuses')
          .select('id, name, slug, color, order_index')
          .order('order_index', { ascending: true })

        if (statusError) {
          console.error(`❌ Erro ao buscar status:`, statusError)
          continue
        }

        // Calcular estatísticas por status - DINÂMICO
        console.log(`🔍 DEBUG STATUS COMPARISON:`)
        console.log(`📋 Status disponíveis:`, statuses.map(s => `${s.name} (${s.slug})`))
        console.log(`🎫 Tickets encontrados:`, tickets?.map(t => `${t.ticket_number}: ${t.status}`) || [])
        
        // Primeiro, identificar todos os status únicos dos tickets
        const uniqueTicketStatuses = [...new Set(tickets?.map(t => t.status) || [])]
        console.log(`🎯 Status únicos dos tickets:`, uniqueTicketStatuses)
        
        // Criar status dinâmicos baseados nos tickets encontrados
        // Se não existir na tabela, criar um status temporário
        const dynamicStatusStats = uniqueTicketStatuses.map(ticketStatus => {
          // Buscar se existe na tabela
          const existingStatus = statuses.find(s => s.slug === ticketStatus)
          
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
            // Criar status dinâmico baseado no slug do ticket
            const matchingTickets = tickets?.filter(ticket => ticket.status === ticketStatus) || []
            const dynamicName = ticketStatus
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
            
            return {
              id: `dynamic-${ticketStatus}`,
              name: dynamicName,
              slug: ticketStatus,
              color: '#6B7280', // Cor padrão
              order_index: 999,
              count: matchingTickets.length
            }
          }
        }).filter(status => status.count > 0) // Só mostrar status com tickets
        
        console.log(`✅ Status dinâmicos criados:`, dynamicStatusStats.map(s => `${s.name} (${s.slug}): ${s.count}`))
        
        // Ordenar status por order_index (mesma ordem do cadastro)
        const statusStats = dynamicStatusStats.sort((a, b) => a.order_index - b.order_index)
        
        console.log(`📊 Status stats finais para ${context.name}:`, statusStats.map(s => `${s.name}: ${s.count}`))

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
          
          console.log(`📊 Categoria ${category.name}: ${total} tickets (${percentage.toFixed(2)}%)`)
          
          return {
            ...category,
            percentage: Math.round(percentage * 100) / 100,
            status_breakdown_detailed: statusBreakdownDetailed
          }
        }).sort((a, b) => b.total - a.total)
        
        console.log(`📊 Category stats finais para ${context.name}:`, categoryStats.map(c => `${c.name}: ${c.total}`))

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
        console.error(`❌ Erro ao processar contexto ${contextId}:`, error)
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

    const response = {
      clients: clientData,
      consolidated: {
        total_tickets: totalTickets,
        period: {
          start_date: startDate,
          end_date: endDate
        },
        status_stats: consolidatedStatusStats,
        category_stats: consolidatedCategoryStats
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
    console.error('❌ Multi-client analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
