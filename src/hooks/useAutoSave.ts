'use client'

import { useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'

interface UseAutoSaveOptions<T> {
  // Dados a serem salvos
  data: T
  // Chave única para o localStorage
  key: string
  // Intervalo de salvamento em ms (padrão: 30 segundos)
  interval?: number
  // Se está habilitado
  enabled?: boolean
  // Callback após salvar
  onSave?: (data: T) => void
  // Mostrar notificação ao salvar
  showNotification?: boolean
}

export function useAutoSave<T>({
  data,
  key,
  interval = 30000, // 30 segundos
  enabled = true,
  onSave,
  showNotification = false
}: UseAutoSaveOptions<T>) {
  const lastSavedRef = useRef<string>('')
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Salvar dados
  const save = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return

    try {
      const dataString = JSON.stringify(data)
      
      // Só salva se os dados mudaram
      if (dataString === lastSavedRef.current) return
      
      localStorage.setItem(key, dataString)
      lastSavedRef.current = dataString
      
      if (onSave) {
        onSave(data)
      }
      
      if (showNotification) {
        toast.success('💾 Rascunho salvo', { 
          duration: 2000,
          id: `autosave-${key}`,
          icon: '💾'
        })
      }
    } catch (error) {
      // Silently fail
    }
  }, [data, key, enabled, onSave, showNotification])

  // Salvar manualmente
  const saveNow = useCallback(() => {
    save()
  }, [save])

  // Recuperar dados salvos
  const restore = useCallback((): T | null => {
    if (typeof window === 'undefined') return null

    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        return JSON.parse(saved) as T
      }
      return null
    } catch (error) {
      return null
    }
  }, [key])

  // Limpar dados salvos
  const clear = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(key)
      lastSavedRef.current = ''
    } catch (error) {
      // Silently fail
    }
  }, [key])

  // Auto-save periódico
  useEffect(() => {
    if (!enabled) {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current)
        saveTimerRef.current = null
      }
      return
    }

    // Configurar intervalo de salvamento
    saveTimerRef.current = setInterval(() => {
      save()
    }, interval)

    // Cleanup
    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current)
        saveTimerRef.current = null
      }
    }
  }, [enabled, interval, save])

  // Salvar ao desmontar componente
  useEffect(() => {
    return () => {
      save()
    }
  }, [save])

  return {
    // Ações
    saveNow,
    restore,
    clear,
    
    // Estado
    hasSaved: lastSavedRef.current !== '',
    
    // Configuração
    interval,
    key
  }
}

