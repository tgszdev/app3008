import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Limpar todos os cookies de sessão do NextAuth
    const cookieStore = await cookies()
    
    // NextAuth usa estes cookies para sessão
    const authCookies = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Secure-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
    ]
    
    // Limpar cada cookie
    authCookies.forEach(cookieName => {
      cookieStore.delete(cookieName)
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
    return NextResponse.json({ error: 'Erro ao fazer logout' }, { status: 500 })
  }
}

export const runtime = 'nodejs'