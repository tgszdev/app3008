import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const session = await auth()
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
    
    // Verificar qual secret está configurado e seu status
    let secretStatus = 'not_set'
    let secretType = 'none'
    
    // NextAuth v5 usa AUTH_SECRET por padrão
    if (process.env.AUTH_SECRET) {
      secretType = 'AUTH_SECRET'
      if (process.env.AUTH_SECRET.includes('your-')) {
        secretStatus = 'placeholder_value'
      } else {
        secretStatus = 'custom_value'
      }
    } else if (process.env.NEXTAUTH_SECRET) {
      secretType = 'NEXTAUTH_SECRET'
      if (process.env.NEXTAUTH_SECRET.includes('your-')) {
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
      secretType,
      recommendation: secretStatus === 'placeholder_value' 
        ? `⚠️ ${secretType} está com valor placeholder. Configure um valor real no Vercel!`
        : secretStatus === 'not_set'
        ? '❌ Nenhum secret configurado. Adicione AUTH_SECRET (recomendado) ou NEXTAUTH_SECRET no Vercel!'
        : `✅ ${secretType} configurado corretamente`
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check auth',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}