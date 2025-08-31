import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const env = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasJwtSecret: !!process.env.JWT_SECRET,
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  }
  
  return NextResponse.json({
    status: 'API is working',
    environment: process.env.NODE_ENV,
    variables: env,
    message: 'If you see this, the API routes are working!'
  })
}

export const runtime = 'nodejs'