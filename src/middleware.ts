import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Rotas que precisam de autenticação
  const protectedPaths = ['/dashboard', '/api/users', '/api/tickets']
  
  // Verificar se é uma rota protegida
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  
  // Se não for rota protegida, permitir acesso
  if (!isProtectedPath) {
    return NextResponse.next()
  }
  
  // Verificar se existe token de sessão nos cookies
  const sessionToken = request.cookies.get('next-auth.session-token')?.value || 
                      request.cookies.get('__Secure-next-auth.session-token')?.value
  
  // Se for rota protegida e não tiver token, redirecionar para login
  if (!sessionToken) {
    // Para APIs, retornar erro 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Para páginas, redirecionar para login com callbackUrl
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icons, manifest.json, sw.js (PWA files)
     * - login page
     * - api/auth routes (authentication endpoints)
     * - api/health (health check)
     * - status page
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|login|api/auth|api/health|status).*)',
  ],
}