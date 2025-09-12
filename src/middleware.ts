import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { createClient } from '@supabase/supabase-js'

// Criar cliente Supabase para o middleware
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function middleware(request: NextRequest) {
  // Passar o secret explicitamente para o getToken
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })
  const isAuth = !!token
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  
  // Debug para entender o problema de autenticação
  console.log('Middleware Debug:', {
    path: request.nextUrl.pathname,
    hasToken: !!token,
    tokenData: token ? 'Token exists' : 'No token',
    isAuthPage,
    cookies: request.cookies.getAll().map(c => c.name),
    secret: process.env.NEXTAUTH_SECRET ? 'Secret exists' : 'No secret'
  })

  // TEMPORARIAMENTE DESABILITADO: Verificação de sessão no banco
  // Motivo: Causando loop de redirecionamento devido a delay na sincronização
  // O trigger do PostgreSQL continua funcionando para invalidar sessões antigas
  // TODO: Investigar e corrigir sincronização entre JWT e banco de dados
  /*
  if (isAuth && token.sessionToken) {
    try {
      const { data: session } = await supabase
        .from('sessions')
        .select('*')
        .eq('sessionToken', token.sessionToken as string)
        .gt('expires', new Date().toISOString())
        .single()
      
      if (!session) {
        // Sessão foi invalidada (login em outro dispositivo)
        console.log('Sessão invalidada - redirecionando para login')
        
        // Limpar cookies de autenticação
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('next-auth.session-token')
        response.cookies.delete('next-auth.csrf-token')
        response.cookies.delete('__Secure-next-auth.session-token')
        response.cookies.delete('__Secure-next-auth.csrf-token')
        
        return response
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error)
    }
  }
  */

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return null
  }

  if (!isAuth) {
    // TEMPORÁRIO: Verificar se o cookie de sessão existe mesmo sem token decodificado
    const sessionCookie = request.cookies.get('__Secure-authjs.session-token') || 
                         request.cookies.get('authjs.session-token') ||
                         request.cookies.get('next-auth.session-token') ||
                         request.cookies.get('__Secure-next-auth.session-token')
    
    if (sessionCookie) {
      console.log('Cookie de sessão encontrado mas token não decodificado - permitindo acesso temporariamente')
      return NextResponse.next()
    }
    
    let from = request.nextUrl.pathname
    if (request.nextUrl.search) {
      from += request.nextUrl.search
    }

    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, request.url)
    )
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/api/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}