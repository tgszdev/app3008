import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const config = await request.json()
    const { type, period, filters, includeDetails } = config

    // Dados de exemplo para o relatório
    const reportData = {
      summary: {
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0,
        avgResolutionTime: '0h',
        satisfactionRate: 0
      },
      tickets: [],
      performance: {
        resolutionRate: 0,
        firstResponseTime: '0h',
        reopenRate: 0,
        escalationRate: 0
      },
      categoryStats: [],
      userStats: []
    }

    // Buscar tickets do período
    let query = supabaseAdmin
      .from('tickets')
      .select(`
        *,
        requester:users!tickets_requester_id_fkey(name, email),
        assignee:users!tickets_assignee_id_fkey(name, email),
        category:categories(name)
      `)

    // Aplicar filtro de período
    if (period?.start_date) {
      query = query.gte('created_at', period.start_date)
    }
    if (period?.end_date) {
      query = query.lte('created_at', period.end_date)
    }

    // Aplicar outros filtros
    if (filters?.status?.length > 0) {
      query = query.in('status', filters.status)
    }
    if (filters?.priority?.length > 0) {
      query = query.in('priority', filters.priority)
    }
    if (filters?.category?.length > 0) {
      query = query.in('category_id', filters.category)
    }

    const { data: tickets, error: ticketsError } = await query

    if (ticketsError) {
      throw ticketsError
    }

    // Calcular estatísticas
    const totalTickets = tickets?.length || 0
    const openTickets = tickets?.filter(t => t.status === 'open' || t.status === 'in_progress').length || 0
    const resolvedTickets = tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0

    // Calcular tempo médio de resolução
    let totalResolutionTime = 0
    let resolvedCount = 0
    
    tickets?.forEach(ticket => {
      if (ticket.resolved_at && ticket.created_at) {
        const created = new Date(ticket.created_at).getTime()
        const resolved = new Date(ticket.resolved_at).getTime()
        const timeDiff = resolved - created
        totalResolutionTime += timeDiff
        resolvedCount++
      }
    })

    const avgResolutionMs = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0
    const avgResolutionHours = Math.round(avgResolutionMs / (1000 * 60 * 60))

    // Estatísticas por categoria
    const categoryMap = new Map()
    tickets?.forEach(ticket => {
      const categoryName = ticket.category?.name || 'Sem categoria'
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1)
    })

    const categoryStats = Array.from(categoryMap.entries()).map(([name, count]) => ({
      name: String(name),
      count: Number(count),
      percentage: Math.round((Number(count) / totalTickets) * 100)
    }))

    // Estatísticas por usuário
    const userMap = new Map()
    tickets?.forEach(ticket => {
      const userName = ticket.requester?.name || 'Desconhecido'
      if (!userMap.has(userName)) {
        userMap.set(userName, { created: 0, resolved: 0, totalTime: 0, resolvedCount: 0 })
      }
      const userStat = userMap.get(userName)
      userStat.created++
      
      if (ticket.status === 'resolved' || ticket.status === 'closed') {
        userStat.resolved++
        if (ticket.resolved_at && ticket.created_at) {
          const timeDiff = new Date(ticket.resolved_at).getTime() - new Date(ticket.created_at).getTime()
          userStat.totalTime += timeDiff
          userStat.resolvedCount++
        }
      }
    })

    const userStats = Array.from(userMap.entries()).map(([name, stats]) => ({
      name: String(name),
      created: Number(stats.created),
      resolved: Number(stats.resolved),
      avgTime: stats.resolvedCount > 0 
        ? `${Math.round(stats.totalTime / stats.resolvedCount / (1000 * 60 * 60))}h`
        : '0h'
    }))

    // Calcular métricas de performance
    const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0
    
    // Simular outras métricas (em produção, calcular com dados reais)
    const performance = {
      resolutionRate,
      firstResponseTime: `${Math.round(Math.random() * 4 + 1)}h`,
      reopenRate: Math.round(Math.random() * 10),
      escalationRate: Math.round(Math.random() * 15)
    }

    // Preparar dados dos tickets
    const ticketsData = includeDetails ? tickets?.slice(0, 100).map(ticket => ({
      id: String(ticket.id),
      ticket_number: String(ticket.ticket_number || ticket.id),
      title: String(ticket.title || ''),
      status: String(ticket.status || ''),
      priority: String(ticket.priority || ''),
      category: String(ticket.category?.name || 'Sem categoria'),
      created_at: String(ticket.created_at || ''),
      resolved_at: ticket.resolved_at ? String(ticket.resolved_at) : null,
      requester: String(ticket.requester?.name || 'Desconhecido'),
      assignee: ticket.assignee?.name ? String(ticket.assignee.name) : null
    })) : []

    // Montar resposta final
    reportData.summary = {
      totalTickets,
      openTickets,
      resolvedTickets,
      avgResolutionTime: `${avgResolutionHours}h`,
      satisfactionRate: Math.round(Math.random() * 20 + 80) // Simular taxa de satisfação
    }
    reportData.tickets = ticketsData || []
    reportData.performance = performance
    reportData.categoryStats = categoryStats.sort((a, b) => b.count - a.count)
    reportData.userStats = userStats.sort((a, b) => b.created - a.created)

    return NextResponse.json(reportData)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    )
  }
}