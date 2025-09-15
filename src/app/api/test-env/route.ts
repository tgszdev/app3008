import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
    keyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 
             process.env.SUPABASE_SERVICE_KEY ? 'service' : 
             process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'anon' : 'none'
  })
}