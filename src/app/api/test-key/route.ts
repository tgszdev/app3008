import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  const selectedKey = serviceRoleKey || serviceKey || anonKey!
  
  // Test with the selected key
  const supabase = createClient(url, selectedKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  // Try a simple query
  const { data, error } = await supabase
    .from('ticket_ratings')
    .select('count')
    .limit(1)
  
  return NextResponse.json({
    env: {
      hasUrl: !!url,
      urlStart: url ? url.substring(0, 30) : null,
      hasServiceRoleKey: !!serviceRoleKey,
      hasServiceKey: !!serviceKey,
      hasAnonKey: !!anonKey,
      selectedKeyType: serviceRoleKey ? 'service_role' : serviceKey ? 'service' : 'anon',
      keyPrefix: selectedKey ? selectedKey.substring(0, 20) : null,
      keySuffix: selectedKey ? selectedKey.substring(selectedKey.length - 10) : null
    },
    test: {
      success: !error,
      error: error?.message || null,
      hasData: !!data
    }
  })
}