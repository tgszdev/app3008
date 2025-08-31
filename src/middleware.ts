import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Se for página de login ou rotas de API de autenticação, permitir sempre
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }
  
  // Verificar se existe token de sessão
  const sessionToken = request.cookies.get('next-auth.session-token')?.value || 
                      request.cookies.get('__Secure-next-auth.session-token')?.value
  
  // Proteger rotas do dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!sessionToken) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }
  
  // Proteger APIs (exceto auth)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/health')) {
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
  }
  
  // Redirecionar da raiz para dashboard se autenticado, senão para login
  if (pathname === '/') {
    if (sessionToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
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
     * - status page
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|status).*)',
  ],
}