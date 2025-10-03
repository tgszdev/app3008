import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Obter sessão atual do NextAuth
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        valid: false, 
        reason: 'no_session' 
      }, { status: 401 })
    }
    
    // Obter sessionToken do JWT
    const sessionToken = (session as any)?.sessionToken
    
    if (!sessionToken) {
      console.log('[VALIDATE] Session sem token:', {
        userId: session.user.id,
        hasSession: !!session,
        sessionKeys: session ? Object.keys(session) : []
      })
      return NextResponse.json({ 
        valid: false, 
        reason: 'no_token' 
      }, { status: 401 })
    }
    
    // Verificar no banco se a sessão ainda é válida
    const { data: dbSession, error } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('sessionToken', sessionToken)
      .single()
    
    if (error || !dbSession) {
      return NextResponse.json({ 
        valid: false, 
        reason: 'session_not_found',
        error: error?.message 
      }, { status: 404 })
    }
    
    // Verificar se a sessão expirou
    const now = new Date()
    const expires = new Date(dbSession.expires)
    
    if (expires < now) {
      return NextResponse.json({ 
        valid: false, 
        reason: 'session_expired',
        expired_at: dbSession.expires,
        invalidated_at: dbSession.invalidated_at,
        invalidated_reason: dbSession.invalidated_reason
      }, { status: 401 })
    }
    
    // Verificar se foi invalidada manualmente
    if (dbSession.invalidated_at) {
      return NextResponse.json({ 
        valid: false, 
        reason: 'session_invalidated',
        invalidated_at: dbSession.invalidated_at,
        invalidated_reason: dbSession.invalidated_reason || 'manual_invalidation'
      }, { status: 401 })
    }
    
    // Sessão válida
    return NextResponse.json({ 
      valid: true,
      expires: dbSession.expires,
      userId: dbSession.userId,
      created_at: dbSession.created_at
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      valid: false, 
      reason: 'internal_error',
      error: error.message 
    }, { status: 500 })
  }
}

// POST para invalidar manualmente uma sessão específica
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }
    
    const body = await request.json()
    const { sessionToken, reason = 'manual_logout' } = body
    
    // Invalidar a sessão
    const { error } = await supabaseAdmin
      .from('sessions')
      .update({
        expires: new Date(Date.now() - 1000).toISOString(),
        invalidated_at: new Date().toISOString(),
        invalidated_reason: reason
      })
      .eq('sessionToken', sessionToken || (session as any)?.sessionToken)
      .eq('userId', session.user.id)
    
    if (error) {
      return NextResponse.json({ 
        error: 'Failed to invalidate session',
        details: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Session invalidated successfully'
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}