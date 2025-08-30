import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const session = await auth()
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isPublicRoute = request.nextUrl.pathname.startsWith('/api/auth')

  // If not logged in and trying to access protected route
  if (!session && !isLoginPage && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If logged in and trying to access login page
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Role-based access control
  if (session) {
    const path = request.nextUrl.pathname
    const userRole = session.user?.role

    // Admin only routes
    if (path.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Analyst and admin routes
    if (path.startsWith('/analytics') && userRole === 'user') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
}