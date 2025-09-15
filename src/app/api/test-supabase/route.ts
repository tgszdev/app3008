import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    // Test 1: Simple query to ticket_ratings
    const { data: ratings, error: ratingsError } = await supabaseAdmin
      .from('ticket_ratings')
      .select('*')
      .limit(5)

    // Test 2: Count total ratings
    const { count, error: countError } = await supabaseAdmin
      .from('ticket_ratings')
      .select('*', { count: 'exact', head: true })

    // Test 3: Test join with tickets
    const { data: joinedData, error: joinError } = await supabaseAdmin
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
      .limit(5)

    return NextResponse.json({
      success: true,
      tests: {
        simpleQuery: {
          success: !ratingsError,
          error: ratingsError?.message || null,
          dataCount: ratings?.length || 0
        },
        countQuery: {
          success: !countError,
          error: countError?.message || null,
          totalCount: count || 0
        },
        joinQuery: {
          success: !joinError,
          error: joinError?.message || null,
          dataCount: joinedData?.length || 0
        }
      },
      data: {
        ratings: ratings || [],
        joinedData: joinedData || []
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack
    }, { status: 500 })
  }
}