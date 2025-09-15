import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  // Use anon key since it works
  const supabase = createClient(url, anonKey)
  
  // Test the exact query from satisfaction API
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 1) // 1 year ago
  
  // Test 1: Simple query
  const { data: simpleData, error: simpleError } = await supabase
    .from('ticket_ratings')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })
  
  // Test 2: Join query (exactly like the API)
  const { data: joinData, error: joinError } = await supabase
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
  
  // Test 3: Join without !inner
  const { data: leftJoinData, error: leftJoinError } = await supabase
    .from('ticket_ratings')
    .select(`
      id,
      rating,
      comment,
      created_at,
      ticket:tickets(
        ticket_number,
        created_at
      )
    `)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })
  
  return NextResponse.json({
    simpleQuery: {
      success: !simpleError,
      error: simpleError?.message || null,
      count: simpleData?.length || 0,
      data: simpleData || []
    },
    joinQuery: {
      success: !joinError,
      error: joinError?.message || null,
      count: joinData?.length || 0,
      data: joinData || []
    },
    leftJoinQuery: {
      success: !leftJoinError,
      error: leftJoinError?.message || null,
      count: leftJoinData?.length || 0,
      data: leftJoinData || []
    }
  })
}