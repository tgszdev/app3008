'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, Smartphone, Clock, Save, TestTube, Loader2 } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { usePushNotifications } from '@/hooks/usePushNotifications'

interface NotificationPreferences {
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  ticket_created: { email: boolean; push: boolean; in_app: boolean }
  ticket_assigned: { email: boolean; push: boolean; in_app: boolean }
  ticket_updated: { email: boolean; push: boolean; in_app: boolean }
  ticket_resolved: { email: boolean; push: boolean; in_app: boolean }
  comment_added: { email: boolean; push: boolean; in_app: boolean }
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
}

const defaultPreferences: NotificationPreferences = {
  email_enabled: true,
  push_enabled: true,
  in_app_enabled: true,
  ticket_created: { email: true, push: true, in_app: true },
  ticket_assigned: { email: true, push: true, in_app: true },
  ticket_updated: { email: false, push: false, in_app: true },
  ticket_resolved: { email: true, push: false, in_app: true },
  comment_added: { email: false, push: false, in_app: true },
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00'
}

const notificationTypes = [
  { key: 'ticket_created', label: 'Novo Chamado', description: 'Quando um novo chamado é criado' },
  { key: 'ticket_assigned', label: 'Chamado Atribuído', description: 'Quando um chamado é atribuído a você' },
  { key: 'ticket_updated', label: 'Chamado Atualizado', description: 'Quando um chamado é atualizado' },
  { key: 'ticket_resolved', label: 'Chamado Resolvido', description: 'Quando um chamado é resolvido' },
  { key: 'comment_added', label: 'Novo Comentário', description: 'Quando alguém comenta em um chamado' },
]

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe, testNotification } = usePushNotifications()

  // Buscar preferências
  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await axios.get('/api/notifications/preferences')
      setPreferences(response.data)
    } catch (error) {
      console.error('Error fetching preferences:', error)
      toast.error('Erro ao carregar preferências')
    } finally {
      setLoading(false)
    }
  }

  // Salvar preferências
  const savePreferences = async () => {
    setSaving(true)
    try {
      await axios.patch('/api/notifications/preferences', preferences)
      toast.success('Preferências salvas com sucesso!')
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Erro ao salvar preferências')
    } finally {
      setSaving(false)
    }
  }

  // Toggle método de notificação para um tipo
  const toggleNotificationType = (type: string, method: 'email' | 'push' | 'in_app') => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type as keyof NotificationPreferences] as any,
        [method]: !(prev[type as keyof NotificationPreferences] as any)[method]
      }
    }))
  }

  // Toggle push notifications
  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe()
      setPreferences(prev => ({ ...prev, push_enabled: false }))
    } else {
      const success = await subscribe()
      if (success) {
        setPreferences(prev => ({ ...prev, push_enabled: true }))
      }
    }
  }

  // Criar notificação de teste
  const sendTestNotification = async () => {
    try {
      const response = await axios.post('/api/notifications', {
        user_id: 'current', // API vai pegar o usuário da sessão
        title: 'Notificação de Teste',
        message: 'Esta é uma notificação de teste para verificar se tudo está funcionando corretamente.',
        type: 'test',
        severity: 'info',
        action_url: null // Sem URL de ação para notificação de teste
      })
      
      console.log('Test notification response:', response.data)
      toast.success('Notificação de teste enviada!')
      
      // Se push está ativado, enviar também push notification
      if (isSubscribed) {
        await testNotification()
      }
    } catch (error: any) {
      console.error('Error sending test notification:', error)
      console.error('Error response:', error.response?.data)
      const errorMessage = error.response?.data?.error || 'Erro ao enviar notificação de teste'
      toast.error(errorMessage)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Configurações de Notificações
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Gerencie como e quando você recebe notificações
          </p>
        </div>

        {/* Métodos Globais */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Métodos de Notificação
          </h2>
          
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Email</p>
                  <p className="text-sm text-gray-500">Receber notificações por email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_enabled}
                  onChange={(e) => setPreferences(prev => ({ ...prev, email_enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Push */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                  <p className="text-sm text-gray-500">
                    {isSupported 
                      ? isSubscribed 
                        ? 'Notificações push ativadas neste dispositivo'
                        : 'Receber notificações no navegador'
                      : 'Não suportado neste navegador'}
                  </p>
                </div>
              </div>
              <button
                onClick={handlePushToggle}
                disabled={!isSupported || isLoading}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                  isSubscribed 
                    ? 'bg-blue-600' 
                    : 'bg-gray-200 dark:bg-gray-700'
                } ${!isSupported || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className={`inline-block w-5 h-5 transform transition-transform bg-white rounded-full ${
                  isSubscribed ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* In-App */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Notificações In-App</p>
                  <p className="text-sm text-gray-500">Mostrar notificações dentro do sistema</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.in_app_enabled}
                  onChange={(e) => setPreferences(prev => ({ ...prev, in_app_enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Tipos de Notificação */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tipos de Notificação
          </h2>

          <div className="space-y-6">
            {notificationTypes.map((type) => (
              <div key={type.key} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{type.label}</p>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                </div>
                
                <div className="flex gap-4 ml-0">
                  {['email', 'push', 'in_app'].map((method) => (
                    <label key={method} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(preferences[type.key as keyof NotificationPreferences] as any)?.[method] || false}
                        onChange={() => toggleNotificationType(type.key, method as 'email' | 'push' | 'in_app')}
                        disabled={
                          (method === 'email' && !preferences.email_enabled) ||
                          (method === 'push' && !preferences.push_enabled) ||
                          (method === 'in_app' && !preferences.in_app_enabled)
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {method === 'in_app' ? 'In-App' : method}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Horário de Silêncio */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horário de Silêncio
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Ativar Horário de Silêncio</p>
                <p className="text-sm text-gray-500">Pausar notificações durante este período</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.quiet_hours_enabled}
                  onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {preferences.quiet_hours_enabled && (
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Início
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_hours_start}
                    onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fim
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_hours_end}
                    onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="p-6 flex justify-between">
          <button
            onClick={sendTestNotification}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <TestTube className="h-4 w-4" />
            Enviar Teste
          </button>
          
          <button
            onClick={savePreferences}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Salvando...' : 'Salvar Preferências'}
          </button>
        </div>
      </div>
    </div>
  )
}