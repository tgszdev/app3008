'use client'

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export function SessionMonitorSSE() {
  const pathname = usePathname()
  
  useEffect(() => {
    // Não monitorar na página de login
    if (pathname === '/login') return
    
    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout
    
    const connect = () => {
      // Criar conexão Server-Sent Events
      eventSource = new EventSource('/api/auth/session-events')
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'session_invalidated') {
            eventSource?.close()
            signOut({ callbackUrl: '/login', redirect: true })
          } else if (data.type === 'connected') {
          }
        } catch (error) {
        }
      }
      
      eventSource.onerror = (error) => {
        eventSource?.close()
        
        // Reconectar após 5 segundos
        reconnectTimeout = setTimeout(connect, 5000)
      }
    }
    
    // Conectar ao montar
    connect()
    
    // Limpar ao desmontar
    return () => {
      eventSource?.close()
      clearTimeout(reconnectTimeout)
    }
  }, [pathname])
  
  return null
}