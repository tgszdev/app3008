import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Get count of tickets for each priority
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('id, priority')

    if (ticketsError) {
      return NextResponse.json(
        { error: 'Failed to fetch tickets' },
        { status: 500 }
      )
    }

    // Count tickets by priority
    const priorityCounts: Record<string, number> = {}
    tickets?.forEach(ticket => {
      priorityCounts[ticket.priority] = (priorityCounts[ticket.priority] || 0) + 1
    })

    // Define priorities with their counts
    const prioritiesWithCount = [
      {
        slug: 'low',
        name: 'Baixa',
        color: '#6b7280',
        count: priorityCounts['low'] || 0
      },
      {
        slug: 'medium',
        name: 'Média',
        color: '#2563eb',
        count: priorityCounts['medium'] || 0
      },
      {
        slug: 'high',
        name: 'Alta',
        color: '#d97706',
        count: priorityCounts['high'] || 0
      },
      {
        slug: 'critical',
        name: 'Crítica',
        color: '#dc2626',
        count: priorityCounts['critical'] || 0
      }
    ]

    return NextResponse.json(prioritiesWithCount)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}










