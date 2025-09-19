'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, Check, Trash2, Settings, CheckCheck } from 'lucide-react'
import { formatBrazilDateTime } from '@/lib/date-utils'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  severity: 'info' | 'warning' | 'error' | 'success'
  is_read: boolean
  created_at: string
  action_url?: string
  data?: any
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Buscar notificações
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/notifications?limit=10')
      setNotifications(response.data.notifications)
      setUnreadCount(response.data.unreadCount)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Marcar como lida
  const markAsRead = async (notificationId: string) => {
    try {
      await axios.patch('/api/notifications', { notification_id: notificationId })
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Erro ao marcar notificação como lida')
    }
  }

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      await axios.patch('/api/notifications', { mark_all: true })
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      toast.success('Todas as notificações foram marcadas como lidas')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Erro ao marcar notificações como lidas')
    }
  }

  // Deletar notificação
  const deleteNotification = async (notificationId: string) => {
    try {
      await axios.delete(`/api/notifications?id=${notificationId}`)
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
      toast.success('Notificação removida')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Erro ao remover notificação')
    }
  }

  // Buscar notificações ao montar e a cada 30 segundos
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Obter ícone e cor baseado na severidade
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
      case 'success':
        return 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
      default:
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificações */}
      {isOpen && (
        <>
          {/* Overlay para mobile */}
          <div 
            className="notification-overlay fixed inset-0 bg-black/30 z-[9998] lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Painel de notificações */}
          <div className="notification-panel fixed sm:absolute top-20 sm:top-auto left-2 right-2 sm:left-auto sm:right-0 sm:mt-2 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-[9999]">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notificações
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Marcar todas como lidas
                  </button>
                )}
                <Link
                  href="/dashboard/settings/notifications"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Lista de notificações */}
          <div className="max-h-[50vh] sm:max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Carregando notificações...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nenhuma notificação
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getSeverityStyle(notification.severity)}`}>
                          <Bell className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {formatBrazilDateTime(notification.created_at)}
                          </p>
                          {notification.action_url && (
                            <Link
                              href={notification.action_url}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
                              onClick={() => !notification.is_read && markAsRead(notification.id)}
                            >
                              Ver detalhes →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                          title="Marcar como lida"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 text-center border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/dashboard/notifications"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Ver todas as notificações
              </Link>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  )
}