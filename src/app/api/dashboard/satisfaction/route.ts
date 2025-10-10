import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'month'
    const contextIds = searchParams.get('context_ids')?.split(',').filter(Boolean) || []

    // Se não há contextIds fornecidos, retornar dados vazios
    if (contextIds.length === 0) {
      return NextResponse.json({
        averageRating: 0,
        totalRatings: 0,
        trend: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentComments: []
      })
    }

    // Calculate date range based on period
    const now = new Date()
    let startDate = new Date()
    let previousStartDate = new Date()
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        previousStartDate.setDate(now.getDate() - 14)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        previousStartDate.setMonth(now.getMonth() - 2)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        previousStartDate.setFullYear(now.getFullYear() - 2)
        break
    }

    // Get current period ratings
    let query = supabaseAdmin
      .from('ticket_ratings')
      .select(`
        id,
        rating,
        comment,
        created_at,
        ticket_id
      `)
      .gte('created_at', startDate.toISOString().split('T')[0] + 'T00:00:00')
      .order('created_at', { ascending: false })

    // Se contextIds foram fornecidos, filtrar por contexto
    if (contextIds.length > 0) {
      // Primeiro buscar os IDs dos tickets que pertencem aos contextos
      const { data: ticketsInContexts, error: ticketsError } = await supabaseAdmin
        .from('tickets')
        .select('id')
        .in('context_id', contextIds)
      
      if (ticketsError) {
        console.error('🔍 DEBUG: Error fetching tickets for contexts:', ticketsError)
        throw ticketsError
      }
      
      const ticketIds = ticketsInContexts?.map(t => t.id) || []
      
      if (ticketIds.length > 0) {
        query = query.in('ticket_id', ticketIds)
      } else {
        // Se não há tickets nos contextos, retornar dados vazios
        return NextResponse.json({
          averageRating: 0,
          totalRatings: 0,
          trend: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          recentComments: []
        })
      }
    }

    const { data: currentRatings, error: currentError } = await query

    if (currentError) {
      console.error('🔍 DEBUG: Error fetching current ratings:', currentError)
      throw currentError
    }

    console.log('🔍 DEBUG: Current ratings data:', {
      count: currentRatings?.length || 0,
      firstRating: currentRatings?.[0] || null
    })

    // Get ticket data for each rating
    const ticketIds = currentRatings?.map(r => r.ticket_id) || []
    let ticketDataMap = new Map()
    
    if (ticketIds.length > 0) {
      const { data: tickets, error: ticketsError } = await supabaseAdmin
        .from('tickets')
        .select('id, ticket_number, title')
        .in('id', ticketIds)
      
      if (ticketsError) {
        console.error('🔍 DEBUG: Error fetching tickets:', ticketsError)
      } else {
        console.log('🔍 DEBUG: Tickets found:', tickets?.length || 0)
        tickets?.forEach(ticket => {
          ticketDataMap.set(ticket.id, ticket)
        })
      }
    }

    // Get previous period ratings for trend calculation
    let previousQuery = supabaseAdmin
      .from('ticket_ratings')
      .select('rating')
      .gte('created_at', previousStartDate.toISOString().split('T')[0] + 'T00:00:00')
      .lt('created_at', startDate.toISOString().split('T')[0] + 'T00:00:00')

    // Se contextIds foram fornecidos, filtrar por contexto
    if (contextIds.length > 0) {
      // Usar os mesmos ticketIds já buscados anteriormente
      const { data: ticketsInContexts, error: ticketsError } = await supabaseAdmin
        .from('tickets')
        .select('id')
        .in('context_id', contextIds)
      
      if (!ticketsError && ticketsInContexts) {
        const ticketIds = ticketsInContexts.map(t => t.id)
        if (ticketIds.length > 0) {
          previousQuery = previousQuery.in('ticket_id', ticketIds)
        }
      }
    }

    const { data: previousRatings, error: previousError } = await previousQuery

    if (previousError) {
      throw previousError
    }

    // Calculate statistics
    const totalRatings = currentRatings?.length || 0
    const averageRating = totalRatings > 0
      ? currentRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0

    // Calculate distribution
    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    }

    currentRatings?.forEach(r => {
      distribution[r.rating as keyof typeof distribution]++
    })

    // Calculate trend
    let trend = 0
    if (previousRatings && previousRatings.length > 0) {
      const previousAverage = previousRatings.reduce((sum, r) => sum + r.rating, 0) / previousRatings.length
      if (previousAverage > 0) {
        trend = ((averageRating - previousAverage) / previousAverage) * 100
      }
    }

    // Get recent comments (last 5 with comments)
    const recentComments = currentRatings
      ?.filter(r => r.comment)
      .slice(0, 5)
      .map(r => {
        const ticket = ticketDataMap.get(r.ticket_id)
        return {
          rating: r.rating,
          comment: r.comment,
          ticketNumber: ticket?.ticket_number ? `#${ticket.ticket_number}` : `#${r.ticket_id?.substring(0, 8)}`,
          ticketTitle: ticket?.title || 'Ticket sem título',
          createdAt: r.created_at
        }
      }) || []

    return NextResponse.json({
      averageRating: Number(averageRating.toFixed(1)),
      totalRatings,
      trend: Number(trend.toFixed(1)),
      distribution,
      recentComments
    })

  } catch (error: any) {
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details
    })
    
    // Return mock data if table doesn't exist yet
    if (error.message?.includes('ticket_ratings') || error.code === '42P01') {
      return NextResponse.json({
        averageRating: 4.2,
        totalRatings: 0,
        trend: 0,
        distribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        },
        recentComments: []
      })
    }
    
    return NextResponse.json(
      { error: 'Erro ao buscar dados de satisfação' },
      { status: 500 }
    )
  }
}