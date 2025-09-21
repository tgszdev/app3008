import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  // MIDDLEWARE COMPLETAMENTE DESATIVADO TEMPORARIAMENTE
  // Motivo: Problemas de autenticação impedindo login
  // TODO: Reativar após resolver configuração do NextAuth
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