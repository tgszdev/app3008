'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

interface SessionMonitorProps {
  checkInterval?: number // Em milissegundos
  enabled?: boolean
}

export function SessionMonitor({ 
  checkInterval = 5000, // Verifica a cada 5 segundos por padrão
  enabled = true 
}: SessionMonitorProps) {
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(false)
  
  useEffect(() => {
    if (!enabled) return
    
    // Não verificar na página de login
    if (pathname === '/login') return
    
    const checkSession = async () => {
      // Evitar múltiplas verificações simultâneas
      if (isChecking) return
      
      setIsChecking(true)
      
      try {
        const response = await fetch('/api/auth/check-session-realtime')
        const data = await response.json()
        
        if (!data.valid) {
          // Fazer logout imediato
          await signOut({ 
            callbackUrl: '/login',
            redirect: true 
          })
        }
      } catch (error) {
      } finally {
        setIsChecking(false)
      }
    }
    
    // Verificar imediatamente ao montar
    checkSession()
    
    // Configurar intervalo de verificação
    const interval = setInterval(checkSession, checkInterval)
    
    // Verificar também quando a janela ganha foco
    const handleFocus = () => checkSession()
    window.addEventListener('focus', handleFocus)
    
    // Verificar quando há atividade do usuário
    const handleActivity = () => {
      // Debounce - só verifica após 1 segundo de inatividade
      clearTimeout((window as any).sessionCheckTimeout)
      ;(window as any).sessionCheckTimeout = setTimeout(checkSession, 1000)
    }
    
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keypress', handleActivity)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keypress', handleActivity)
      clearTimeout((window as any).sessionCheckTimeout)
    }
  }, [pathname, enabled, checkInterval, isChecking])
  
  // Componente invisível - apenas monitora
  return null
}

// Hook para usar em componentes específicos
export function useSessionMonitor(options?: SessionMonitorProps) {
  const [isValid, setIsValid] = useState(true)
  const { checkInterval = 5000, enabled = true } = options || {}
  
  useEffect(() => {
    if (!enabled) return
    
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/check-session-realtime')
        const data = await response.json()
        setIsValid(data.valid)
        
        if (!data.valid) {
          await signOut({ callbackUrl: '/login' })
        }
      } catch (error) {
      }
    }
    
    checkSession()
    const interval = setInterval(checkSession, checkInterval)
    
    return () => clearInterval(interval)
  }, [enabled, checkInterval])
  
  return isValid
}