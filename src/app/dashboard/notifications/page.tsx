'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, Trash2, Filter, Search, Calendar, AlertCircle, Info, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { formatBrazilDateTime } from '@/lib/date-utils'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  severity: 'info' | 'warning' | 'error' | 'success'
  is_read: boolean
  created_at: string
  read_at?: string
  action_url?: string
  data?: any
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const limit = 20

  // Buscar notificações
  const fetchNotifications = async (append = false) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString()
      })

      if (filter === 'unread') {
        params.append('unread', 'true')
      }

      const response = await axios.get(`/api/notifications?${params}`)
      
      if (append) {
        setNotifications(prev => [...prev, ...response.data.notifications])
      } else {
        setNotifications(response.data.notifications)
      }
      
      setHasMore(response.data.notifications.length === limit)
    } catch (error) {
      toast.error('Erro ao carregar notificações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [filter, page])

  // Marcar como lida
  const markAsRead = async (notificationId: string) => {
    try {
      await axios.patch('/api/notifications', { notification_id: notificationId })
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      
      toast.success('Notificação marcada como lida')
    } catch (error) {
      toast.error('Erro ao marcar como lida')
    }
  }

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      await axios.patch('/api/notifications', { mark_all: true })
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('Todas as notificações foram marcadas como lidas')
    } catch (error) {
      toast.error('Erro ao marcar todas como lidas')
    }
  }

  // Deletar notificação
  const deleteNotification = async (notificationId: string) => {
    try {
      await axios.delete(`/api/notifications?id=${notificationId}`)
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      setSelectedNotifications(prev => prev.filter(id => id !== notificationId))
      
      toast.success('Notificação removida')
    } catch (error) {
      toast.error('Erro ao remover notificação')
    }
  }

  // Deletar selecionadas
  const deleteSelected = async () => {
    if (selectedNotifications.length === 0) {
      toast.error('Selecione pelo menos uma notificação')
      return
    }

    try {
      // Deletar uma por uma (pode ser otimizado com endpoint de batch delete)
      for (const id of selectedNotifications) {
        await axios.delete(`/api/notifications?id=${id}`)
      }
      
      setNotifications(prev => 
        prev.filter(n => !selectedNotifications.includes(n.id))
      )
      setSelectedNotifications([])
      
      toast.success(`${selectedNotifications.length} notificações removidas`)
    } catch (error) {
      toast.error('Erro ao remover notificações')
    }
  }

  // Toggle seleção
  const toggleSelection = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    )
  }

  // Selecionar todas
  const toggleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([])
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id))
    }
  }

  // Filtrar notificações
  const filteredNotifications = notifications.filter(notification => {
    // Filtro de leitura
    if (filter === 'unread' && notification.is_read) return false
    if (filter === 'read' && !notification.is_read) return false
    
    // Filtro de tipo
    if (selectedType !== 'all' && notification.type !== selectedType) return false
    
    // Filtro de busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        notification.title.toLowerCase().includes(search) ||
        notification.message.toLowerCase().includes(search)
      )
    }
    
    return true
  })

  // Obter ícone e cor baseado na severidade
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'error':
        return {
          bg: 'bg-red-100 dark:bg-red-900/20',
          text: 'text-red-600 dark:text-red-400',
          icon: XCircle
        }
      case 'warning':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/20',
          text: 'text-yellow-600 dark:text-yellow-400',
          icon: AlertCircle
        }
      case 'success':
        return {
          bg: 'bg-green-100 dark:bg-green-900/20',
          text: 'text-green-600 dark:text-green-400',
          icon: CheckCircle
        }
      default:
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/20',
          text: 'text-blue-600 dark:text-blue-400',
          icon: Info
        }
    }
  }

  // Tipos únicos de notificação
  const notificationTypes = [...new Set(notifications.map(n => n.type))]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notificações
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gerencie todas as suas notificações
        </p>
      </div>

      {/* Filtros e Ações */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar notificações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            {/* Filtro de status */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Todas</option>
              <option value="unread">Não lidas</option>
              <option value="read">Lidas</option>
            </select>

            {/* Filtro de tipo */}
            {notificationTypes.length > 0 && (
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos os tipos</option>
                {notificationTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ').charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Ações em massa */}
          <div className="flex gap-2">
            {selectedNotifications.length > 0 && (
              <>
                <button
                  onClick={deleteSelected}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Deletar ({selectedNotifications.length})
                </button>
              </>
            )}
            
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todas como lidas
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Notificações */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-500">Carregando notificações...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Nenhuma notificação encontrada</p>
          </div>
        ) : (
          <>
            {/* Cabeçalho da lista */}
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Selecionar todas ({filteredNotifications.length})
                </span>
              </label>
            </div>

            {/* Notificações */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredNotifications.map((notification) => {
                const style = getSeverityStyle(notification.severity)
                const Icon = style.icon
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => toggleSelection(notification.id)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />

                      {/* Ícone */}
                      <div className={`p-2 rounded-lg ${style.bg}`}>
                        <Icon className={`h-5 w-5 ${style.text}`} />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {notification.title}
                              {!notification.is_read && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                  Nova
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatBrazilDateTime(notification.created_at)}
                              </span>
                              {notification.is_read && notification.read_at && (
                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                  Lida em {formatBrazilDateTime(notification.read_at)}
                                </span>
                              )}
                            </div>
                            {notification.action_url && (
                              <Link
                                href={notification.action_url}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
                              >
                                Ver detalhes →
                              </Link>
                            )}
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-1">
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
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Carregar mais */}
            {hasMore && (
              <div className="p-4 text-center">
                <button
                  onClick={() => {
                    setPage(prev => prev + 1)
                    fetchNotifications(true)
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Carregar mais
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}