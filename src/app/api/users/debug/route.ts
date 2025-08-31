import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const debug = {
      hasSupabaseUrl: !!supabaseUrl,
      supabaseUrlLength: supabaseUrl?.length || 0,
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyLength: supabaseServiceKey?.length || 0,
      supabaseUrlStart: supabaseUrl?.substring(0, 30) || 'NOT SET',
      timestamp: new Date().toISOString()
    }

    // Tentar buscar usuários
    let usersData = null
    let errorData = null
    
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role')
        .limit(5)
      
      if (error) {
        errorData = {
          message: error.message,
          code: error.code,
          details: error.details
        }
      } else {
        usersData = {
          count: data?.length || 0,
          sample: data?.slice(0, 2).map(u => ({ 
            id: u.id.substring(0, 8) + '...', 
            email: u.email,
            name: u.name
          }))
        }
      }
    } catch (e: any) {
      errorData = {
        message: e.message,
        type: 'exception'
      }
    }

    return NextResponse.json({
      debug,
      users: usersData,
      error: errorData,
      status: 'debug endpoint'
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Debug endpoint error',
      message: error.message 
    }, { status: 500 })
  }
}

export const runtime = 'nodejs'