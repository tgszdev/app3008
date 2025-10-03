'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useRef, useCallback } from 'react'
import { supabaseClient } from '@/lib/supabase-client'

export function SessionMonitor() {
  const { data: session, status } = useSession()
  const checkIntervalRef = useRef<NodeJS.Timeout>()
  const lastCheckRef = useRef<Date>(new Date())
  
  const checkSession = useCallback(async () => {
    if (!session?.user?.id) return
    
    try {
      // Buscar a sessão atual do usuário no banco
      const { data: currentSession } = await supabaseClient
        .from('sessions')
        .select('sessionToken, expires')
        .eq('userId', session.user.id)
        .gt('expires', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      // Obter o sessionToken da sessão atual do NextAuth
      const currentToken = (session as any)?.sessionToken
      
      if (currentSession) {
        // Se há uma sessão válida no banco mas não é a nossa, fazer logout
        if (currentToken && currentSession.sessionToken !== currentToken) {
          
          // Mostrar notificação antes do logout
          const notification = document.createElement('div')
          notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
          notification.innerHTML = `
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              <div>
                <div class="font-semibold">🔒 Sessão encerrada</div>
                <div class="text-sm">Sua sessão foi encerrada por um novo login em outro dispositivo</div>
              </div>
            </div>
          `
          document.body.appendChild(notification)
          
          // Logout imediato - manter notificação visível por 5 segundos
          setTimeout(() => {
            document.body.removeChild(notification)
          }, 5000)
          
          // Fazer logout imediatamente
          signOut({ callbackUrl: '/login?reason=session_expired' })
          
          // Parar verificação
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current)
          }
        }
      } else if (currentToken) {
        // Se não há sessão válida no banco mas temos token, verificar se expirou
        
        // Fazer logout imediatamente se não há sessão válida
        signOut({ callbackUrl: '/login?reason=session_invalid' })
      }
      
      lastCheckRef.current = new Date()
    } catch (error) {
    }
  }, [session])
  
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      // Verificar imediatamente
      checkSession()
      
      // Configurar verificação periódica (a cada 10 segundos)
      checkIntervalRef.current = setInterval(checkSession, 10000)
      
      // Verificar também quando a janela ganha foco
      const handleFocus = () => {
        const now = new Date()
        const timeSinceLastCheck = now.getTime() - lastCheckRef.current.getTime()
        
        // Se passou mais de 5 segundos desde a última verificação
        if (timeSinceLastCheck > 5000) {
          checkSession()
        }
      }
      
      window.addEventListener('focus', handleFocus)
      
      return () => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current)
        }
        window.removeEventListener('focus', handleFocus)
      }
    }
  }, [status, session, checkSession])
  
  // Componente não renderiza nada visível
  return null
}