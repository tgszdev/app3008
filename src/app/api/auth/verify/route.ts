import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'edge' // Executar na edge para performance

export async function GET() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ authenticated: false })
    }
    
    // Verificar sessão única no banco (opcional)
    if ((session.user as any).sessionToken) {
      const { data: dbSession } = await supabaseAdmin
        .from('sessions')
        .select('*')
        .eq('sessionToken', (session.user as any).sessionToken)
        .gt('expires', new Date().toISOString())
        .single()
      
      if (!dbSession) {
        return NextResponse.json({ 
          authenticated: false,
          reason: 'Session invalidated (logged in elsewhere)'
        })
      }
    }
    
    return NextResponse.json({ 
      authenticated: true,
      user: session.user
    })
  } catch (error) {
    return NextResponse.json({ 
      authenticated: false,
      error: 'Verification failed'
    }, { status: 500 })
  }
}