'use client'

import { useSession } from 'next-auth/react'
import { useOrganization } from '@/contexts/OrganizationContext'

export function OrganizationDebug() {
  const { data: session } = useSession()
  const { 
    currentContext, 
    availableContexts, 
    isMatrixUser, 
    isContextUser,
    isLoading 
  } = useOrganization()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">🐛 Organization Debug</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Session User:</strong>
          <pre className="text-xs overflow-auto max-h-20">
            {JSON.stringify({
              id: session?.user?.id,
              email: session?.user?.email,
              role: session?.user?.role,
              userType: (session?.user as any)?.userType,
              contextType: (session?.user as any)?.contextType,
              context_id: (session?.user as any)?.context_id,
              context_name: (session?.user as any)?.context_name,
              availableContexts: (session?.user as any)?.availableContexts
            }, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong>Organization Context:</strong>
          <pre className="text-xs overflow-auto max-h-20">
            {JSON.stringify({
              currentContext,
              availableContexts: availableContexts?.length || 0,
              isMatrixUser,
              isContextUser,
              isLoading
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
