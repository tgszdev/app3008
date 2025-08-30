'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface UseAuthOptions {
  required?: boolean
  redirectTo?: string
  role?: string | string[]
}

export function useAuth(options: UseAuthOptions = {}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { required = true, redirectTo = '/login', role } = options

  useEffect(() => {
    if (status === 'loading') return

    if (required && !session) {
      router.push(redirectTo)
    }

    if (role && session) {
      const userRole = session.user?.role
      const allowedRoles = Array.isArray(role) ? role : [role]
      
      if (!allowedRoles.includes(userRole)) {
        router.push('/dashboard')
      }
    }
  }, [session, status, required, redirectTo, role, router])

  return { session, status, isLoading: status === 'loading' }
}