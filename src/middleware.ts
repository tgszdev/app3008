import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  
  // Tentar obter o token com diferentes métodos
  let token = null
  let authMethod = 'none'
  
  try {
    // NextAuth v5 usa AUTH_SECRET como padrão
    // Tentar primeiro com AUTH_SECRET, depois NEXTAUTH_SECRET
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
    
    if (secret) {
      token = await getToken({ 
        req: request,
        secret: secret
      })
      if (token) {
        authMethod = process.env.AUTH_SECRET ? 'AUTH_SECRET' : 'NEXTAUTH_SECRET'
      }
    } else {
      console.log('Nenhum secret configurado (AUTH_SECRET ou NEXTAUTH_SECRET)')
    }
  } catch (e) {
    console.log('Erro ao decodificar token:', (e as Error).message)
  }
  
  const isAuth = !!token
  
  // Log apenas para debug de sessão única (remover em produção)
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_AUTH === 'true') {
    if (request.nextUrl.pathname.startsWith('/dashboard') && isAuth) {
      console.log('Session check:', {
        path: request.nextUrl.pathname,
        hasSessionToken: !!(token as any)?.sessionToken,
        userId: (token as any)?.id
      })
    }
  }

  // Verificação de sessão única no banco de dados
  // TEMPORARIAMENTE: Adicionar logs detalhados para debug
  if (isAuth && token) {
    const sessionToken = (token as any).sessionToken
    console.log('Debug - Token info:', {
      hasToken: !!token,
      hasSessionToken: !!sessionToken,
      tokenKeys: Object.keys(token || {}),
      path: request.nextUrl.pathname
    })
    
    // Se não tem sessionToken no JWT, permitir acesso (sessão sem tracking)
    if (!sessionToken) {
      console.log('Token JWT não contém sessionToken - permitindo acesso sem verificação de sessão única')
      return NextResponse.next()
    }
    
    try {
      // Importar Supabase apenas quando necessário
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      console.log('Verificando sessão no banco:', sessionToken)
      
      const { data: session, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('sessionToken', sessionToken)
        .gt('expires', new Date().toISOString())
        .single()
      
      console.log('Resultado da verificação:', {
        hasSession: !!session,
        error: error?.message,
        sessionId: session?.id
      })
      
      if (error || !session) {
        // Sessão foi invalidada (login em outro dispositivo)
        console.log('Sessão inválida - detalhes:', {
          error: error?.message,
          sessionToken: sessionToken,
          reason: !session ? 'Sessão não encontrada' : 'Erro na query'
        })
        
        // Por enquanto, NÃO forçar logout - apenas logar
        // return NextResponse.redirect(new URL('/login', request.url))
      }
    } catch (error) {
      console.error('Erro ao verificar sessão no banco:', error)
      // Em caso de erro, permitir acesso mas logar o problema
    }
  }

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return null
  }

  if (!isAuth) {
    // Sem token válido - redirecionar para login
    let from = request.nextUrl.pathname
    if (request.nextUrl.search) {
      from += request.nextUrl.search
    }

    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, request.url)
    )
  }
  
  // Token válido - permitir acesso
  return NextResponse.next()
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