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
  


  // TEMPORARIAMENTE SIMPLIFICADO: Verificação de sessão única
  // Por enquanto, apenas logar informações e permitir acesso
  // A verificação real será feita no callback JWT com trigger='update'
  if (isAuth && token) {
    // Log apenas em desenvolvimento ou com debug ativado
    if (process.env.DEBUG_AUTH === 'true') {
      console.log('Middleware - Token presente:', {
        userId: (token as any).id,
        hasSessionToken: !!(token as any).sessionToken,
        path: request.nextUrl.pathname
      })
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