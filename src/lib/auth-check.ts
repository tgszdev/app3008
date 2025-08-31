import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  
  return session
}

export async function requireAdmin() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  
  const userRole = (session.user as any)?.role
  
  if (userRole !== 'admin') {
    redirect('/dashboard')
  }
  
  return session
}

export async function requireAnalystOrAdmin() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  
  const userRole = (session.user as any)?.role
  
  if (userRole !== 'admin' && userRole !== 'analyst') {
    redirect('/dashboard')
  }
  
  return session
}