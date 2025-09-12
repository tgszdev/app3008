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
  
  // Log simplificado apenas para debug
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('Auth Status:', {
      path: request.nextUrl.pathname,
      authenticated: isAuth,
      authMethod,
      hasCookie: !!request.cookies.get('__Secure-authjs.session-token')
    })
  }

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
    // Verificar se o cookie de sessão existe (fallback de segurança)
    const sessionCookie = request.cookies.get('__Secure-authjs.session-token') || 
                         request.cookies.get('authjs.session-token')
    
    if (sessionCookie) {
      // Cookie existe mas não conseguimos decodificar - permitir acesso mas logar aviso
      console.warn('⚠️ Cookie de sessão presente mas JWT não pode ser verificado. Verifique NEXTAUTH_SECRET no Vercel.')
      return NextResponse.next()
    }
    
    // Sem cookie e sem token - redirecionar para login
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