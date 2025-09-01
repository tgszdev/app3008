import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

// Version: 1.5.2 - Deploy: 2025-09-01 22:40
export default async function HomePage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  
  redirect('/dashboard')
}