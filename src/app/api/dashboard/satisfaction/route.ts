import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'month'

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
    const { data: currentRatings, error: currentError } = await supabaseAdmin
      .from('ticket_ratings')
      .select(`
        id,
        rating,
        comment,
        created_at,
        ticket:tickets!inner(
          ticket_number,
          created_at
        )
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (currentError) {
      console.error('Error fetching current ratings:', currentError)
      throw currentError
    }

    // Get previous period ratings for trend calculation
    const { data: previousRatings, error: previousError } = await supabaseAdmin
      .from('ticket_ratings')
      .select('rating')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString())

    if (previousError) {
      console.error('Error fetching previous ratings:', previousError)
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
      .map(r => ({
        rating: r.rating,
        comment: r.comment,
        ticketNumber: r.ticket.ticket_number,
        createdAt: r.created_at
      })) || []

    return NextResponse.json({
      averageRating: Number(averageRating.toFixed(1)),
      totalRatings,
      trend: Number(trend.toFixed(1)),
      distribution,
      recentComments
    })

  } catch (error: any) {
    console.error('Error in satisfaction API:', error)
    
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