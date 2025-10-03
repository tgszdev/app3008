import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth-config'
import { supabaseAdmin } from '@/lib/supabase'
import { getToken } from 'next-auth/jwt'

export async function GET(request: Request) {
  try {
    // Obter token JWT
    const token = await getToken({ req: request as any })
    
    if (!token || !token.sessionToken) {
      return NextResponse.json({ valid: false, message: 'No session' })
    }
    
    // Verificar se a sessão ainda é válida no banco
    const { data: session, error } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('sessionToken', token.sessionToken as string)
      .gt('expires', new Date().toISOString())
      .single()
    
    if (error || !session) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Session invalidated (logged in elsewhere)' 
      })
    }
    
    // Atualizar timestamp da sessão
    await supabaseAdmin
      .from('sessions')
      .update({ /* updated_at automático */ })
      .eq('id', session.id)
    
    return NextResponse.json({ 
      valid: true, 
      sessionToken: token.sessionToken,
      userId: session.userId,
      expires: session.expires
    })
  } catch (error) {
    return NextResponse.json({ valid: false, error: 'Internal error' }, { status: 500 })
  }
}