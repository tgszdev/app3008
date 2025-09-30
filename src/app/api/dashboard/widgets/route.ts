import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserContextIds } from '@/lib/context-helpers'

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
    const widgetType = searchParams.get('widget_type')
    
    // If no dates provided, use current month
    const now = new Date()
    const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const defaultEndDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

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
        widgets: [],
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

    // Processar dados baseado no tipo de widget
    let widgetData = {}

    switch (widgetType) {
      case 'stats':
        // Estatísticas gerais
        const totalTickets = tickets?.length || 0
        const openTickets = tickets?.filter(t => t.status === 'open').length || 0
        const inProgressTickets = tickets?.filter(t => t.status === 'in_progress').length || 0
        const resolvedTickets = tickets?.filter(t => t.status === 'resolved').length || 0
        const cancelledTickets = tickets?.filter(t => t.status === 'cancelled').length || 0

        widgetData = {
          totalTickets,
          openTickets,
          inProgressTickets,
          resolvedTickets,
          cancelledTickets,
          ticketsTrend: '+0%'
        }
        break

      case 'recent':
        // Tickets recentes
        const recentTickets = tickets?.slice(0, 10).map(ticket => ({
          id: ticket.id,
          ticket_number: ticket.ticket_number,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          requester: 'Sistema', // TODO: buscar nome do solicitante
          created_at: ticket.created_at,
          context_id: ticket.context_id,
          context_name: ticket.contexts?.name || 'Cliente Desconhecido'
        })) || []

        widgetData = {
          recentTickets
        }
        break

      case 'categories':
        // Estatísticas por categoria
        const categoryStats = await supabaseAdmin
          .from('tickets')
          .select(`
            id,
            category_id,
            categories!inner(nome, icon, color)
          `)
          .in('context_id', associatedContextIds)
          .gte('created_at', `${defaultStartDate}T00:00:00`)
          .lte('created_at', `${defaultEndDate}T23:59:59`)

        if (clientId && clientId !== 'all') {
          categoryStats.eq('context_id', clientId)
        }

        const { data: categoryData, error: categoryError } = await categoryStats

        if (categoryError) {
          console.error('Erro ao buscar categorias:', categoryError)
        }

        // Agrupar por categoria
        const categoryGroups = new Map()
        categoryData?.forEach(ticket => {
          const category = ticket.categories
          if (category) {
            if (!categoryGroups.has(category.nome)) {
              categoryGroups.set(category.nome, {
                nome: category.nome,
                icon: category.icon,
                color: category.color,
                quantidade: 0
              })
            }
            categoryGroups.get(category.nome).quantidade++
          }
        })

        widgetData = {
          categories: Array.from(categoryGroups.values())
        }
        break

      default:
        // Dados gerais
        widgetData = {
          totalTickets: tickets?.length || 0,
          tickets: tickets || []
        }
    }

    return NextResponse.json({
      widgetData,
      totalTickets: tickets?.length || 0,
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
    console.error('Erro na API widgets:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
