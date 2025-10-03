'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface UseProtectedSessionOptions {
  // Intervalo de verificação via polling (fallback)
  pollingInterval?: number
  // Se deve mostrar notificações
  showNotifications?: boolean
  // Se deve redirecionar ao fazer logout
  redirectTo?: string
  // Se deve usar SSE
  enableSSE?: boolean
  // Se deve usar polling como fallback
  enablePolling?: boolean
  // Callback quando sessão for invalidada
  onSessionInvalidated?: (reason: string) => void
}

interface ProtectedSessionState {
  isValid: boolean
  isLoading: boolean
  isConnected: boolean
  lastCheck: Date | null
  invalidationReason: string | null
}

export function useProtectedSession(options: UseProtectedSessionOptions = {}) {
  const {
    pollingInterval = 10000, // 10 segundos
    showNotifications = true,
    redirectTo = '/login',
    enableSSE = true,
    enablePolling = true,
    onSessionInvalidated
  } = options

  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [state, setState] = useState<ProtectedSessionState>({
    isValid: true,
    isLoading: true,
    isConnected: false,
    lastCheck: null,
    invalidationReason: null
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInvalidatingRef = useRef(false)

  // Função para verificar sessão via API
  const checkSessionValidity = useCallback(async () => {
    if (!session?.user?.id) return false

    try {
      const response = await fetch('/api/session/validate')
      const data = await response.json()

      setState(prev => ({
        ...prev,
        isValid: data.valid,
        lastCheck: new Date(),
        invalidationReason: data.valid ? null : data.reason
      }))

      if (!data.valid) {
        if (!isInvalidatingRef.current) {
          isInvalidatingRef.current = true
          
          if (showNotifications) {
            toast.error(
              data.reason === 'session_invalidated' 
                ? '🔒 Sua sessão foi encerrada por um novo login em outro dispositivo.'
                : data.reason === 'session_expired'
                ? '⏰ Sua sessão expirou. Faça login novamente.'
                : '❌ Sessão inválida. Redirecionando...',
              { duration: 5000, id: 'session-invalidated' }
            )
          }

          // Callback customizado
          if (onSessionInvalidated) {
            onSessionInvalidated(data.reason)
          }

          // Pequeno delay apenas para garantir que o toast seja renderizado
          setTimeout(() => {
            signOut({ callbackUrl: redirectTo })
          }, 200)
        }

        return false
      }

      return true
    } catch (error) {
      return true
    }
  }, [session, showNotifications, redirectTo, onSessionInvalidated])

  // Configurar SSE
  useEffect(() => {
    if (!enableSSE || !session?.user?.id || status !== 'authenticated') {
      return
    }

    const setupSSE = () => {
      // Fechar conexão anterior se existir
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      const eventSource = new EventSource('/api/session/events')
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setState(prev => ({ ...prev, isConnected: true }))
        
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'connected') {
            if (showNotifications) {
              toast.success('🔒 Proteção de sessão ativada', { duration: 2000 })
            }
          } else if (data.type === 'session_invalidated') {
            
            setState(prev => ({
              ...prev,
              isValid: false,
              invalidationReason: data.reason
            }))

            if (!isInvalidatingRef.current) {
              isInvalidatingRef.current = true

              if (showNotifications) {
                toast.error(
                  '🔒 Sua sessão foi encerrada por um novo login em outro dispositivo.',
                  { duration: 5000, id: 'session-invalidated-sse' }
                )
              }

              if (onSessionInvalidated) {
                onSessionInvalidated(data.reason)
              }

              // Pequeno delay apenas para garantir que o toast seja renderizado
              setTimeout(() => {
                eventSource.close()
                signOut({ callbackUrl: redirectTo })
              }, 200)
            }
          } else if (data.type === 'session_expired') {
            
            setState(prev => ({
              ...prev,
              isValid: false,
              invalidationReason: 'session_expired'
            }))

            if (!isInvalidatingRef.current) {
              isInvalidatingRef.current = true

              if (showNotifications) {
                toast.error('⏰ Sua sessão expirou. Faça login novamente.', { duration: 5000, id: 'session-expired' })
              }

              if (onSessionInvalidated) {
                onSessionInvalidated('session_expired')
              }

              // Pequeno delay apenas para garantir que o toast seja renderizado
              setTimeout(() => {
                eventSource.close()
                signOut({ callbackUrl: redirectTo })
              }, 200)
            }
          }
        } catch (error) {
          // Silently handle error
        }
      }

      eventSource.onerror = (error) => {
        setState(prev => ({ ...prev, isConnected: false }))
        
        if (enablePolling && !pollingIntervalRef.current) {
          checkSessionValidity()
          pollingIntervalRef.current = setInterval(checkSessionValidity, pollingInterval)
        }
      }
    }

    // Configurar SSE com delay para garantir que a sessão está pronta
    const setupTimeout = setTimeout(setupSSE, 1000)

    // Cleanup
    return () => {
      clearTimeout(setupTimeout)
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [session, status, enableSSE, enablePolling, pollingInterval, checkSessionValidity, showNotifications, redirectTo, onSessionInvalidated])

  // Configurar polling se SSE estiver desabilitado
  useEffect(() => {
    if (!enablePolling || enableSSE || !session?.user?.id || status !== 'authenticated') {
      return
    }

    checkSessionValidity()
    pollingIntervalRef.current = setInterval(checkSessionValidity, pollingInterval)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [session, status, enableSSE, enablePolling, pollingInterval, checkSessionValidity])

  // Atualizar estado de loading
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isLoading: status === 'loading'
    }))
  }, [status])

  // Verificar ao ganhar foco da janela
  useEffect(() => {
    const handleFocus = () => {
      if (state.isValid && !state.isConnected && session?.user?.id) {
        checkSessionValidity()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [state.isValid, state.isConnected, session, checkSessionValidity])

  return {
    // Estados
    isValid: state.isValid,
    isLoading: state.isLoading,
    isConnected: state.isConnected,
    lastCheck: state.lastCheck,
    invalidationReason: state.invalidationReason,
    
    // Informações da sessão
    session,
    userId: session?.user?.id,
    
    // Ações
    checkNow: checkSessionValidity,
    disconnect: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
        setState(prev => ({ ...prev, isConnected: false }))
      }
    }
  }
}