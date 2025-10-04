import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // 1. Get all available statuses
    const { data: statuses, error: statusError } = await supabaseAdmin
      .from('ticket_statuses')
      .select('*')
      .order('order_index', { ascending: true })

    if (statusError) {
      return NextResponse.json(
        { error: 'Failed to fetch statuses' },
        { status: 500 }
      )
    }

    // 2. Get count of tickets for each status
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('id, status')

    if (ticketsError) {
      return NextResponse.json(
        { error: 'Failed to fetch tickets' },
        { status: 500 }
      )
    }

    // 3. Count tickets by status
    const statusCounts: Record<string, number> = {}
    tickets?.forEach(ticket => {
      statusCounts[ticket.status] = (statusCounts[ticket.status] || 0) + 1
    })

    // 4. Combine statuses with their counts
    const statusesWithCount = statuses?.map(status => ({
      ...status,
      count: statusCounts[status.slug] || 0
    })) || []

    return NextResponse.json(statusesWithCount)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









