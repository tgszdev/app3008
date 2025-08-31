import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Rotas públicas que não precisam de autenticação
  const publicPaths = ['/login', '/api/auth', '/api/health', '/_next', '/static', '/icons', '/manifest.json', '/sw.js', '/favicon.ico']
  
  // Verificar se é uma rota pública
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // Se for rota pública, permitir acesso
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // Verificar se existe token de sessão nos cookies
  const sessionToken = request.cookies.get('next-auth.session-token')?.value || 
                      request.cookies.get('__Secure-next-auth.session-token')?.value
  
  // Se estiver tentando acessar rota protegida sem token
  if (!sessionToken && pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Se for a rota raiz e não tiver token, redirecionar para login
  if (!sessionToken && pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Se for a rota raiz e tiver token, redirecionar para dashboard
  if (sessionToken && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Se estiver logado e tentar acessar login, redirecionar para dashboard
  if (sessionToken && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (icons, manifest, etc)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|icons/.*|manifest.json|sw.js|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}