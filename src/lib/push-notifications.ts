// Push Notifications Manager
import { toast } from 'react-hot-toast'

// VAPID public key - você precisa gerar isso no servidor
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

export class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null
  private subscription: PushSubscription | null = null

  // Initialize service worker and push notifications
  async initialize(): Promise<boolean> {
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.log('Service Workers not supported')
        return false
      }

      // Check if push notifications are supported
      if (!('PushManager' in window)) {
        console.log('Push notifications not supported')
        return false
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/service-worker.js')
      console.log('Service Worker registered:', this.registration)

      // Check for updates
      this.registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found')
        const newWorker = this.registration!.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              toast.success('Nova versão disponível! Recarregue a página.')
            }
          })
        }
      })

      return true
    } catch (error) {
      console.error('Failed to initialize push notifications:', error)
      return false
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    try {
      const permission = await Notification.requestPermission()
      console.log('Notification permission:', permission)
      
      if (permission === 'granted') {
        toast.success('Notificações ativadas!')
      } else if (permission === 'denied') {
        toast.error('Permissão para notificações negada')
      }
      
      return permission
    } catch (error) {
      console.error('Failed to request permission:', error)
      return 'denied'
    }
  }

  // Subscribe to push notifications
  async subscribe(userId: string): Promise<PushSubscription | null> {
    try {
      if (!this.registration) {
        await this.initialize()
      }

      if (!this.registration) {
        throw new Error('Service Worker not registered')
      }

      // Check permission
      if (Notification.permission !== 'granted') {
        const permission = await this.requestPermission()
        if (permission !== 'granted') {
          return null
        }
      }

      // Get subscription
      let subscription = await this.registration.pushManager.getSubscription()

      // Create new subscription if needed
      if (!subscription) {
        const convertedVapidKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey as BufferSource
        })
      }

      this.subscription = subscription

      // Save subscription to server
      await this.saveSubscription(userId, subscription)

      console.log('Push subscription:', subscription)
      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      toast.error('Erro ao ativar notificações push')
      return null
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.subscription) {
        return true
      }

      const success = await this.subscription.unsubscribe()
      if (success) {
        this.subscription = null
        toast.success('Notificações push desativadas')
      }
      
      return success
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
      toast.error('Erro ao desativar notificações push')
      return false
    }
  }

  // Save subscription to server
  private async saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          subscription: subscription.toJSON()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }

      console.log('Subscription saved to server')
    } catch (error) {
      console.error('Failed to save subscription:', error)
      throw error
    }
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    
    return outputArray
  }

  // Test notification
  async testNotification(): Promise<void> {
    try {
      if (Notification.permission !== 'granted') {
        await this.requestPermission()
      }

      if (Notification.permission === 'granted') {
        const notificationOptions: NotificationOptions = {
          body: 'Esta é uma notificação de teste do sistema',
          icon: '/icon-192x192.png',
          badge: '/icon-72x72.png',
          tag: 'test-notification',
          requireInteraction: false,
          data: {
            action_url: '/dashboard/notifications'
          }
        }
        
        // Adicionar vibrate apenas se suportado (não existe em NotificationOptions padrão)
        if ('vibrate' in Notification.prototype) {
          (notificationOptions as any).vibrate = [200, 100, 200]
        }
        
        const notification = new Notification('Teste de Notificação', notificationOptions)

        notification.addEventListener('click', () => {
          window.open('/dashboard/notifications', '_blank')
          notification.close()
        })

        setTimeout(() => notification.close(), 5000)
        toast.success('Notificação de teste enviada!')
      }
    } catch (error) {
      console.error('Failed to show test notification:', error)
      toast.error('Erro ao enviar notificação de teste')
    }
  }

  // Check if push notifications are supported and enabled
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window
  }

  // Check if user has granted permission
  hasPermission(): boolean {
    return Notification.permission === 'granted'
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission
  }

  // Check if subscribed
  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.registration) {
        await this.initialize()
      }

      if (!this.registration) {
        return false
      }

      const subscription = await this.registration.pushManager.getSubscription()
      return subscription !== null
    } catch (error) {
      console.error('Failed to check subscription:', error)
      return false
    }
  }

  // Send message to service worker
  async sendMessage(message: any): Promise<void> {
    if (!this.registration || !this.registration.active) {
      console.warn('Service Worker not active')
      return
    }

    this.registration.active.postMessage(message)
  }

  // Clear all notifications
  async clearAll(): Promise<void> {
    if (!this.registration) {
      return
    }

    const notifications = await this.registration.getNotifications()
    notifications.forEach(notification => notification.close())
  }
}

// Create singleton instance
const pushManager = new PushNotificationManager()

// Auto-initialize on load
if (typeof window !== 'undefined') {
  pushManager.initialize().catch(console.error)
}

export default pushManager