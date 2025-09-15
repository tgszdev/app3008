import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  // Test with anon key
  const supabase = createClient(url, anonKey)
  
  // Try a simple query
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('id, ticket_number')
    .limit(1)
  
  // Try ticket_ratings
  const { data: ratings, error: ratingsError } = await supabase
    .from('ticket_ratings')
    .select('*')
    .limit(1)
  
  return NextResponse.json({
    keyInfo: {
      url: url.substring(0, 30),
      keyPrefix: anonKey.substring(0, 20),
      keySuffix: anonKey.substring(anonKey.length - 10)
    },
    tickets: {
      success: !ticketsError,
      error: ticketsError?.message || null,
      data: tickets || []
    },
    ratings: {
      success: !ratingsError,
      error: ratingsError?.message || null,
      data: ratings || []
    }
  })
}