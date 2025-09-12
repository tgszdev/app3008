import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function requireAuth() {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  return session
}

export async function requireRole(roles: string[]) {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  const userRole = session.user?.role as string
  if (!roles.includes(userRole)) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }
  
  return session
}

// Exemplo de uso em API Route:
// export async function GET() {
//   const session = await requireAuth()
//   if (session instanceof NextResponse) return session
//   
//   // Código da API...
// }