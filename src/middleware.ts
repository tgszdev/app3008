import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Lista de rotas que precisam de autenticação
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
    
    // Para páginas, redirecionar para login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Proteger todas as rotas exceto as estáticas e de autenticação
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|login|api/auth|api/health).*)',
  ],
}