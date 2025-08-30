import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Temporariamente desabilitado devido a incompatibilidade com Edge Runtime
// O controle de acesso será feito no lado do cliente e nas API routes

export function middleware(request: NextRequest) {
  // Por enquanto, apenas permite todas as requisições
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
}