'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { signOut } from 'next-auth/react'

interface UseIdleTimeoutOptions {
  // Tempo de inatividade em ms (padrão: 60 minutos)
  timeout?: number
  // Tempo de aviso antes de expirar em ms (padrão: 5 minutos)
  warningTime?: number
  // Callback quando idle é detectado
  onIdle?: () => void
  // Callback quando aviso é mostrado
  onWarning?: () => void
  // Se está habilitado
  enabled?: boolean
  // Eventos a monitorar
  events?: string[]
}

interface IdleTimeoutState {
  isIdle: boolean
  isWarning: boolean
  remainingTime: number
}

export function useIdleTimeout(options: UseIdleTimeoutOptions = {}) {
  const {
    timeout = 60 * 60 * 1000,        // 60 minutos
    warningTime = 5 * 60 * 1000,     // 5 minutos
    onIdle,
    onWarning,
    enabled = true,
    events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
  } = options

  const [state, setState] = useState<IdleTimeoutState>({
    isIdle: false,
    isWarning: false,
    remainingTime: timeout
  })

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  // Limpar todos os timers
  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
      warningTimerRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [])

  // Função chamada quando idle timeout acontece
  const handleIdle = useCallback(() => {
    setState(prev => ({ ...prev, isIdle: true, isWarning: false }))
    clearTimers()
    
    if (onIdle) {
      onIdle()
    } else {
      // Ação padrão: deslogar
      signOut({ callbackUrl: '/login?reason=idle_timeout' })
    }
  }, [onIdle, clearTimers])

  // Função chamada quando warning é ativado
  const handleWarning = useCallback(() => {
    setState(prev => ({ ...prev, isWarning: true }))
    
    if (onWarning) {
      onWarning()
    }

    // Iniciar countdown
    const warningStartTime = Date.now()
    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - warningStartTime
      const remaining = warningTime - elapsed
      
      if (remaining <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
        }
      } else {
        setState(prev => ({ ...prev, remainingTime: remaining }))
      }
    }, 1000) // Atualiza a cada segundo
  }, [onWarning, warningTime])

  // Resetar o timer de idle
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    
    // Só atualiza estado se estava em warning
    setState(prev => ({
      isIdle: false,
      isWarning: false,
      remainingTime: timeout
    }))
    
    clearTimers()

    if (!enabled) return

    // Timer para mostrar aviso
    warningTimerRef.current = setTimeout(() => {
      handleWarning()
    }, timeout - warningTime)

    // Timer para idle final
    idleTimerRef.current = setTimeout(() => {
      handleIdle()
    }, timeout)
  }, [enabled, timeout, warningTime, handleWarning, handleIdle, clearTimers])

  // Configurar listeners de atividade
  useEffect(() => {
    if (!enabled) {
      clearTimers()
      return
    }

    // Inicializar timer
    resetIdleTimer()

    // Adicionar event listeners
    const handleActivity = () => {
      // Debounce - só reseta se passou pelo menos 1 segundo desde última atividade
      const now = Date.now()
      if (now - lastActivityRef.current > 1000) {
        resetIdleTimer()
      }
    }

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true, capture: false })
    })

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity, { capture: false })
      })
      clearTimers()
    }
  }, [enabled, events, resetIdleTimer, clearTimers])

  return {
    // Estado
    isIdle: state.isIdle,
    isWarning: state.isWarning,
    remainingTime: state.remainingTime,
    remainingSeconds: Math.floor(state.remainingTime / 1000),
    remainingMinutes: Math.floor(state.remainingTime / 60000),
    
    // Ações
    resetIdleTimer,
    
    // Configuração
    timeout,
    warningTime
  }
}

