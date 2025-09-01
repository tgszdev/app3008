'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || 'BKRJGDpkYQJm0P3XvX_9cVpRgNq0HjWXPwZ7VOXQzWqN4hMpkbz3R6wXt1lS6iYZgDqjcD_kxXdJvgYGqzW_Ens'

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Verificar se o navegador suporta push notifications
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      checkSubscription()
    }
  }, [])

  // Verificar se já está inscrito
  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.getSubscription()
      
      if (sub) {
        setSubscription(sub)
        setIsSubscribed(true)
      }
    } catch (error) {
      console.error('Erro ao verificar subscription:', error)
    }
  }

  // Converter VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
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

  // Inscrever para push notifications
  const subscribe = async () => {
    if (!isSupported) {
      toast.error('Seu navegador não suporta notificações push')
      return false
    }

    setIsLoading(true)

    try {
      // Pedir permissão
      const permission = await Notification.requestPermission()
      
      if (permission !== 'granted') {
        toast.error('Permissão para notificações negada')
        setIsLoading(false)
        return false
      }

      // Obter service worker registration
      const registration = await navigator.serviceWorker.ready

      // Criar subscription
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      })

      // Enviar subscription para o servidor
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }

      await axios.post('/api/notifications/push/subscribe', {
        subscription: sub.toJSON(),
        deviceInfo
      })

      setSubscription(sub)
      setIsSubscribed(true)
      toast.success('Notificações push ativadas!')
      
      return true
    } catch (error) {
      console.error('Erro ao inscrever para push notifications:', error)
      toast.error('Erro ao ativar notificações push')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Cancelar inscrição
  const unsubscribe = async () => {
    if (!subscription) return false

    setIsLoading(true)

    try {
      // Cancelar subscription no navegador
      await subscription.unsubscribe()

      // Notificar servidor
      await axios.delete(`/api/notifications/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`)

      setSubscription(null)
      setIsSubscribed(false)
      toast.success('Notificações push desativadas')
      
      return true
    } catch (error) {
      console.error('Erro ao cancelar push notifications:', error)
      toast.error('Erro ao desativar notificações push')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Testar notificação
  const testNotification = async () => {
    if (!isSubscribed) {
      toast.error('Você precisa ativar as notificações primeiro')
      return
    }

    try {
      // Criar notificação local para teste
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification('Teste de Notificação', {
        body: 'As notificações push estão funcionando!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'test-notification'
      } as any) // Type cast para permitir vibrate em alguns navegadores
      
      toast.success('Notificação de teste enviada!')
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error)
      toast.error('Erro ao enviar notificação de teste')
    }
  }

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    testNotification
  }
}