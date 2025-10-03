import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ valid: false, reason: 'No session' })
    }
    
    // Pegar o sessionToken do JWT
    const userId = session.user?.id
    
    if (!userId) {
      return NextResponse.json({ valid: false, reason: 'No user ID' })
    }
    
    // Verificar DIRETAMENTE no banco se existe sessão válida para este usuário
    const { data: validSession, error } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('userId', userId)
      .gt('expires', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error || !validSession) {
      // Sessão foi invalidada por login em outro dispositivo
      return NextResponse.json({ 
        valid: false, 
        reason: 'Session invalidated - logged in elsewhere'
      })
    }
    
    // Verificar se o sessionToken atual ainda é o mais recente
    const currentSessionToken = (session as any).sessionToken
    if (currentSessionToken && validSession.sessionToken !== currentSessionToken) {
      return NextResponse.json({ 
        valid: false, 
        reason: 'Newer session exists'
      })
    }
    
    return NextResponse.json({ 
      valid: true,
      sessionId: validSession.id,
      expires: validSession.expires
    })
  } catch (error) {
    return NextResponse.json({ valid: false, error: 'Check failed' }, { status: 500 })
  }
}