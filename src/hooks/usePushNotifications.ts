import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import pushManager from '@/lib/push-notifications'
import { toast } from 'react-hot-toast'

interface UsePushNotificationsReturn {
  isSupported: boolean
  permission: NotificationPermission
  isSubscribed: boolean
  isLoading: boolean
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
  requestPermission: () => Promise<void>
  testNotification: () => Promise<void>
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { data: session } = useSession()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSupported] = useState(() => pushManager.isSupported())

  // Check initial permission and subscription status
  useEffect(() => {
    if (!isSupported) return

    // Check permission
    setPermission(pushManager.getPermissionStatus())

    // Check subscription
    pushManager.isSubscribed().then(setIsSubscribed)
  }, [isSupported])

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!session?.user?.id) {
      toast.error('Você precisa estar logado')
      return
    }

    setIsLoading(true)
    try {
      const subscription = await pushManager.subscribe(session.user.id)
      if (subscription) {
        setIsSubscribed(true)
        setPermission('granted')
        toast.success('Notificações push ativadas!')
      }
    } catch (error) {
      toast.error('Erro ao ativar notificações push')
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setIsLoading(true)
    try {
      const success = await pushManager.unsubscribe()
      if (success) {
        setIsSubscribed(false)
        
        // Also remove from server
        if (session?.user?.id) {
          await fetch('/api/notifications/subscribe', {
            method: 'DELETE'
          })
        }
        
        toast.success('Notificações push desativadas')
      }
    } catch (error) {
      toast.error('Erro ao desativar notificações push')
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  // Request notification permission
  const requestPermission = useCallback(async () => {
    setIsLoading(true)
    try {
      const perm = await pushManager.requestPermission()
      setPermission(perm)
      
      if (perm === 'granted' && session?.user?.id) {
        // Auto-subscribe if permission granted
        await subscribe()
      }
    } catch (error) {
      toast.error('Erro ao solicitar permissão')
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, subscribe])

  // Test notification
  const testNotification = useCallback(async () => {
    setIsLoading(true)
    try {
      await pushManager.testNotification()
    } catch (error) {
      toast.error('Erro ao testar notificação')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission,
    testNotification
  }
}