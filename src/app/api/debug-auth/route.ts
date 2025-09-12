import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth-config'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const session = await getServerSession(authConfig)
    const cookieStore = cookies()
    
    // Verificar cookies de sessão
    const sessionCookie = cookieStore.get('__Secure-authjs.session-token') || 
                         cookieStore.get('authjs.session-token')
    
    // Verificar variáveis de ambiente (sem expor valores)
    const envCheck = {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      AUTH_SECRET: !!process.env.AUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NODE_ENV: process.env.NODE_ENV
    }
    
    // Se NEXTAUTH_SECRET existe, verificar se não é o placeholder
    let secretStatus = 'not_set'
    if (process.env.NEXTAUTH_SECRET) {
      if (process.env.NEXTAUTH_SECRET.includes('your-nextauth-secret-key-here')) {
        secretStatus = 'placeholder_value'
      } else {
        secretStatus = 'custom_value'
      }
    }
    
    return NextResponse.json({
      status: 'ok',
      session: session ? {
        user: session.user?.email,
        expires: session.expires
      } : null,
      cookie: {
        exists: !!sessionCookie,
        name: sessionCookie?.name
      },
      environment: envCheck,
      secretStatus,
      recommendation: secretStatus === 'placeholder_value' 
        ? '⚠️ NEXTAUTH_SECRET está com valor placeholder. Configure um valor real no Vercel!'
        : secretStatus === 'not_set'
        ? '❌ NEXTAUTH_SECRET não está configurado. Adicione no Vercel!'
        : '✅ NEXTAUTH_SECRET configurado'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check auth',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}