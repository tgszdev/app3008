import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

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

    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('client_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    
    // If no dates provided, use current month
    const now = new Date()
    const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const defaultEndDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    // Get user's associated organizations
    const { data: userContexts, error: contextsError } = await supabaseAdmin
      .from('user_contexts')
      .select('context_id, contexts(name, slug)')
      .eq('user_id', currentUserId)

    if (contextsError) {
      console.error('Erro ao buscar contextos do usuário:', contextsError)
      return NextResponse.json(
        { error: 'Erro ao buscar contextos do usuário' },
        { status: 500 }
      )
    }

    // Se não tem contextos associados, retornar vazio
    if (!userContexts || userContexts.length === 0) {
      return NextResponse.json({
        clientGroups: [],
        totalTickets: 0,
        period: {
          start_date: defaultStartDate,
          end_date: defaultEndDate
        }
      })
    }

    // Obter IDs dos contextos associados
    const associatedContextIds = userContexts.map(uc => uc.context_id)

    // Query base para tickets
    let query = supabaseAdmin
      .from('tickets')
      .select(`
        id, 
        ticket_number, 
        title, 
        status, 
        priority, 
        created_at, 
        created_by, 
        context_id,
        contexts!inner(name, slug)
      `)
      .in('context_id', associatedContextIds)
      .gte('created_at', `${defaultStartDate}T00:00:00`)
      .lte('created_at', `${defaultEndDate}T23:59:59`)
      .order('created_at', { ascending: false })

    // Se clientId específico foi fornecido, filtrar por ele
    if (clientId && clientId !== 'all') {
      query = query.eq('context_id', clientId)
    }

    const { data: tickets, error: ticketsError } = await query

    if (ticketsError) {
      console.error('Erro ao buscar tickets:', ticketsError)
      return NextResponse.json(
        { error: 'Erro ao buscar tickets' },
        { status: 500 }
      )
    }

    // Agrupar tickets por cliente
    const clientGroups = new Map<string, any>()

    tickets?.forEach(ticket => {
      const clientId = ticket.context_id
      const clientName = ticket.contexts?.name || 'Cliente Desconhecido'

      if (!clientGroups.has(clientId)) {
        clientGroups.set(clientId, {
          clientId,
          clientName,
          tickets: [],
          stats: {
            total: 0,
            open: 0,
            inProgress: 0,
            resolved: 0,
            cancelled: 0
          }
        })
      }

      const group = clientGroups.get(clientId)
      group.tickets.push({
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        requester: 'Sistema', // TODO: buscar nome do solicitante
        created_at: ticket.created_at,
        context_id: ticket.context_id,
        context_name: clientName
      })

      // Atualizar estatísticas
      group.stats.total++
      switch (ticket.status) {
        case 'open':
          group.stats.open++
          break
        case 'in_progress':
          group.stats.inProgress++
          break
        case 'resolved':
        case 'closed':
          group.stats.resolved++
          break
        case 'cancelled':
          group.stats.cancelled++
          break
      }
    })

    // Converter Map para Array
    const clientGroupsArray = Array.from(clientGroups.values())

    // Calcular estatísticas gerais
    const totalTickets = tickets?.length || 0

    return NextResponse.json({
      clientGroups: clientGroupsArray,
      totalTickets,
      period: {
        start_date: defaultStartDate,
        end_date: defaultEndDate
      },
      userInfo: {
        userType,
        associatedContexts: userContexts.length,
        canViewAll: userRole === 'admin' || userRole === 'analyst'
      }
    })

  } catch (error) {
    console.error('Erro na API client-tickets:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
