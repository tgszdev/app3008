'use client'

import { useState, useEffect } from 'react'
import { X, Bell, Mail, MessageSquare, Smartphone, Volume2, Save, TestTube } from 'lucide-react'

interface NotificationSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface NotificationChannel {
  enabled: boolean
  events: {
    newTicket: boolean
    ticketAssigned: boolean
    ticketStatusChange: boolean
    ticketComment: boolean
    ticketClosed: boolean
    userRegistration: boolean
    systemAlert: boolean
    reportGenerated: boolean
  }
}

interface NotificationSettings {
  email: NotificationChannel & {
    defaultRecipients: string[]
    digestEnabled: boolean
    digestFrequency: 'daily' | 'weekly' | 'monthly'
  }
  
  browser: NotificationChannel & {
    soundEnabled: boolean
    soundVolume: number
  }
  
  slack: NotificationChannel & {
    webhookUrl: string
    channel: string
    username: string
    iconEmoji: string
  }
  
  webhook: NotificationChannel & {
    url: string
    headers: { key: string; value: string }[]
    method: 'POST' | 'PUT'
    retryAttempts: number
  }
  
  sms: NotificationChannel & {
    provider: 'twilio' | 'aws-sns' | 'custom'
    accountSid?: string
    authToken?: string
    fromNumber?: string
    defaultRecipients: string[]
  }
}

export default function NotificationSettingsModal({ isOpen, onClose }: NotificationSettingsModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'email' | 'browser' | 'slack' | 'webhook' | 'sms'>('email')
  
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      enabled: true,
      events: {
        newTicket: true,
        ticketAssigned: true,
        ticketStatusChange: true,
        ticketComment: true,
        ticketClosed: false,
        userRegistration: true,
        systemAlert: true,
        reportGenerated: false
      },
      defaultRecipients: [],
      digestEnabled: false,
      digestFrequency: 'daily'
    },
    browser: {
      enabled: true,
      events: {
        newTicket: true,
        ticketAssigned: true,
        ticketStatusChange: false,
        ticketComment: true,
        ticketClosed: false,
        userRegistration: false,
        systemAlert: true,
        reportGenerated: false
      },
      soundEnabled: true,
      soundVolume: 50
    },
    slack: {
      enabled: false,
      events: {
        newTicket: true,
        ticketAssigned: false,
        ticketStatusChange: false,
        ticketComment: false,
        ticketClosed: false,
        userRegistration: false,
        systemAlert: true,
        reportGenerated: false
      },
      webhookUrl: '',
      channel: '#support',
      username: 'Support Bot',
      iconEmoji: ':ticket:'
    },
    webhook: {
      enabled: false,
      events: {
        newTicket: true,
        ticketAssigned: true,
        ticketStatusChange: true,
        ticketComment: true,
        ticketClosed: true,
        userRegistration: true,
        systemAlert: true,
        reportGenerated: true
      },
      url: '',
      headers: [],
      method: 'POST',
      retryAttempts: 3
    },
    sms: {
      enabled: false,
      events: {
        newTicket: false,
        ticketAssigned: false,
        ticketStatusChange: false,
        ticketComment: false,
        ticketClosed: false,
        userRegistration: false,
        systemAlert: true,
        reportGenerated: false
      },
      provider: 'twilio',
      accountSid: '',
      authToken: '',
      fromNumber: '',
      defaultRecipients: []
    }
  })

  const [newEmailRecipient, setNewEmailRecipient] = useState('')
  const [newSMSRecipient, setNewSMSRecipient] = useState('')
  const [newWebhookHeader, setNewWebhookHeader] = useState({ key: '', value: '' })

  useEffect(() => {
    if (isOpen) {
      fetchSettings()
    }
  }, [isOpen])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data) {
          setSettings(data)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configurações de notificação salvas com sucesso!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        throw new Error('Erro ao salvar configurações')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações de notificação' })
      console.error('Erro:', error)
    } finally {
      setSaving(false)
    }
  }

  const testNotification = async (channel: string) => {
    setTesting(channel)
    setMessage(null)
    
    try {
      const response = await fetch('/api/settings/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ channel, settings: settings[channel as keyof NotificationSettings] })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `Notificação de teste enviada via ${channel}!` })
      } else {
        throw new Error('Erro ao enviar notificação de teste')
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Erro ao testar notificação via ${channel}` })
    } finally {
      setTesting(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const addEmailRecipient = () => {
    if (newEmailRecipient && !settings.email.defaultRecipients.includes(newEmailRecipient)) {
      setSettings({
        ...settings,
        email: {
          ...settings.email,
          defaultRecipients: [...settings.email.defaultRecipients, newEmailRecipient]
        }
      })
      setNewEmailRecipient('')
    }
  }

  const removeEmailRecipient = (email: string) => {
    setSettings({
      ...settings,
      email: {
        ...settings.email,
        defaultRecipients: settings.email.defaultRecipients.filter(e => e !== email)
      }
    })
  }

  const addSMSRecipient = () => {
    if (newSMSRecipient && !settings.sms.defaultRecipients.includes(newSMSRecipient)) {
      setSettings({
        ...settings,
        sms: {
          ...settings.sms,
          defaultRecipients: [...settings.sms.defaultRecipients, newSMSRecipient]
        }
      })
      setNewSMSRecipient('')
    }
  }

  const removeSMSRecipient = (phone: string) => {
    setSettings({
      ...settings,
      sms: {
        ...settings.sms,
        defaultRecipients: settings.sms.defaultRecipients.filter(p => p !== phone)
      }
    })
  }

  const addWebhookHeader = () => {
    if (newWebhookHeader.key && newWebhookHeader.value) {
      setSettings({
        ...settings,
        webhook: {
          ...settings.webhook,
          headers: [...settings.webhook.headers, newWebhookHeader]
        }
      })
      setNewWebhookHeader({ key: '', value: '' })
    }
  }

  const removeWebhookHeader = (index: number) => {
    setSettings({
      ...settings,
      webhook: {
        ...settings.webhook,
        headers: settings.webhook.headers.filter((_, i) => i !== index)
      }
    })
  }

  const eventLabels = {
    newTicket: 'Novo Ticket',
    ticketAssigned: 'Ticket Atribuído',
    ticketStatusChange: 'Mudança de Status',
    ticketComment: 'Novo Comentário',
    ticketClosed: 'Ticket Fechado',
    userRegistration: 'Novo Usuário',
    systemAlert: 'Alerta do Sistema',
    reportGenerated: 'Relatório Gerado'
  }

  if (!isOpen) return null

  const renderEventSettings = (channel: keyof NotificationSettings) => {
    const channelSettings = settings[channel]
    
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Eventos para Notificar:</h4>
        {Object.entries(eventLabels).map(([key, label]) => (
          <label key={key} className="flex items-center">
            <input
              type="checkbox"
              checked={channelSettings.events[key as keyof typeof channelSettings.events]}
              onChange={(e) => {
                setSettings({
                  ...settings,
                  [channel]: {
                    ...channelSettings,
                    events: {
                      ...channelSettings.events,
                      [key]: e.target.checked
                    }
                  }
                })
              }}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
          </label>
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-6 h-6 text-white" />
                <h2 className="text-xl font-semibold text-white">Configurações de Notificações</h2>
              </div>
              <button onClick={onClose} className="text-white hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-1 px-6 pt-4">
              {[
                { id: 'email', label: 'E-mail', icon: Mail },
                { id: 'browser', label: 'Navegador', icon: Bell },
                { id: 'slack', label: 'Slack', icon: MessageSquare },
                { id: 'webhook', label: 'Webhook', icon: Volume2 },
                { id: 'sms', label: 'SMS', icon: Smartphone }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-4 py-2 rounded-t-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-800 border-t border-l border-r border-gray-200 dark:border-gray-700 text-purple-600 dark:text-purple-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto bg-white dark:bg-gray-800">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div>
                {/* Email Settings */}
                {activeTab === 'email' && (
                  <div className="space-y-4">
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={settings.email.enabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          email: { ...settings.email, enabled: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      <span className="font-medium">Habilitar notificações por e-mail</span>
                    </label>

                    {settings.email.enabled && (
                      <>
                        {renderEventSettings('email')}
                        
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Destinatários Padrão:</h4>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="email"
                              value={newEmailRecipient}
                              onChange={(e) => setNewEmailRecipient(e.target.value)}
                              placeholder="email@exemplo.com"
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                              onClick={addEmailRecipient}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                              Adicionar
                            </button>
                          </div>
                          <div className="space-y-1">
                            {settings.email.defaultRecipients.map((email, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                                <span className="text-sm text-gray-700 dark:text-gray-300">{email}</span>
                                <button
                                  onClick={() => removeEmailRecipient(email)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <label className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              checked={settings.email.digestEnabled}
                              onChange={(e) => setSettings({
                                ...settings,
                                email: { ...settings.email, digestEnabled: e.target.checked }
                              })}
                              className="mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Habilitar resumo de notificações</span>
                          </label>
                          
                          {settings.email.digestEnabled && (
                            <div className="ml-6">
                              <label className="block text-sm text-gray-700 mb-1">Frequência:</label>
                              <select
                                value={settings.email.digestFrequency}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  email: { ...settings.email, digestFrequency: e.target.value as any }
                                })}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="daily">Diário</option>
                                <option value="weekly">Semanal</option>
                                <option value="monthly">Mensal</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Browser Settings */}
                {activeTab === 'browser' && (
                  <div className="space-y-4">
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={settings.browser.enabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          browser: { ...settings.browser, enabled: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      <span className="font-medium">Habilitar notificações do navegador</span>
                    </label>

                    {settings.browser.enabled && (
                      <>
                        {renderEventSettings('browser')}
                        
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <label className="flex items-center mb-3">
                            <input
                              type="checkbox"
                              checked={settings.browser.soundEnabled}
                              onChange={(e) => setSettings({
                                ...settings,
                                browser: { ...settings.browser, soundEnabled: e.target.checked }
                              })}
                              className="mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Habilitar som de notificação</span>
                          </label>
                          
                          {settings.browser.soundEnabled && (
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">Volume: {settings.browser.soundVolume}%</label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={settings.browser.soundVolume}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  browser: { ...settings.browser, soundVolume: parseInt(e.target.value) }
                                })}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Slack Settings */}
                {activeTab === 'slack' && (
                  <div className="space-y-4">
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={settings.slack.enabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          slack: { ...settings.slack, enabled: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      <span className="font-medium">Habilitar notificações do Slack</span>
                    </label>

                    {settings.slack.enabled && (
                      <>
                        {renderEventSettings('slack')}
                        
                        <div className="mt-4 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Webhook URL
                            </label>
                            <input
                              type="url"
                              value={settings.slack.webhookUrl}
                              onChange={(e) => setSettings({
                                ...settings,
                                slack: { ...settings.slack, webhookUrl: e.target.value }
                              })}
                              placeholder="https://hooks.slack.com/services/..."
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Canal
                              </label>
                              <input
                                type="text"
                                value={settings.slack.channel}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  slack: { ...settings.slack, channel: e.target.value }
                                })}
                                placeholder="#support"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nome do Bot
                              </label>
                              <input
                                type="text"
                                value={settings.slack.username}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  slack: { ...settings.slack, username: e.target.value }
                                })}
                                placeholder="Support Bot"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Emoji do Ícone
                            </label>
                            <input
                              type="text"
                              value={settings.slack.iconEmoji}
                              onChange={(e) => setSettings({
                                ...settings,
                                slack: { ...settings.slack, iconEmoji: e.target.value }
                              })}
                              placeholder=":ticket:"
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Webhook Settings */}
                {activeTab === 'webhook' && (
                  <div className="space-y-4">
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={settings.webhook.enabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          webhook: { ...settings.webhook, enabled: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      <span className="font-medium">Habilitar Webhook personalizado</span>
                    </label>

                    {settings.webhook.enabled && (
                      <>
                        {renderEventSettings('webhook')}
                        
                        <div className="mt-4 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              URL do Webhook
                            </label>
                            <input
                              type="url"
                              value={settings.webhook.url}
                              onChange={(e) => setSettings({
                                ...settings,
                                webhook: { ...settings.webhook, url: e.target.value }
                              })}
                              placeholder="https://api.exemplo.com/webhook"
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Método HTTP
                              </label>
                              <select
                                value={settings.webhook.method}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  webhook: { ...settings.webhook, method: e.target.value as 'POST' | 'PUT' }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Tentativas de Retry
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="5"
                                value={settings.webhook.retryAttempts}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  webhook: { ...settings.webhook, retryAttempts: parseInt(e.target.value) }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Headers Personalizados
                            </label>
                            <div className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={newWebhookHeader.key}
                                onChange={(e) => setNewWebhookHeader({ ...newWebhookHeader, key: e.target.value })}
                                placeholder="Nome do Header"
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                              />
                              <input
                                type="text"
                                value={newWebhookHeader.value}
                                onChange={(e) => setNewWebhookHeader({ ...newWebhookHeader, value: e.target.value })}
                                placeholder="Valor"
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                              />
                              <button
                                onClick={addWebhookHeader}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                              >
                                Adicionar
                              </button>
                            </div>
                            <div className="space-y-1">
                              {settings.webhook.headers.map((header, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">{header.key}: {header.value}</span>
                                  <button
                                    onClick={() => removeWebhookHeader(index)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* SMS Settings */}
                {activeTab === 'sms' && (
                  <div className="space-y-4">
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={settings.sms.enabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          sms: { ...settings.sms, enabled: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      <span className="font-medium">Habilitar notificações por SMS</span>
                    </label>

                    {settings.sms.enabled && (
                      <>
                        {renderEventSettings('sms')}
                        
                        <div className="mt-4 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Provedor de SMS
                            </label>
                            <select
                              value={settings.sms.provider}
                              onChange={(e) => setSettings({
                                ...settings,
                                sms: { ...settings.sms, provider: e.target.value as any }
                              })}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="twilio">Twilio</option>
                              <option value="aws-sns">AWS SNS</option>
                              <option value="custom">Personalizado</option>
                            </select>
                          </div>
                          
                          {settings.sms.provider === 'twilio' && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Account SID
                                </label>
                                <input
                                  type="text"
                                  value={settings.sms.accountSid || ''}
                                  onChange={(e) => setSettings({
                                    ...settings,
                                    sms: { ...settings.sms, accountSid: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Auth Token
                                </label>
                                <input
                                  type="password"
                                  value={settings.sms.authToken || ''}
                                  onChange={(e) => setSettings({
                                    ...settings,
                                    sms: { ...settings.sms, authToken: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Número de Origem
                                </label>
                                <input
                                  type="tel"
                                  value={settings.sms.fromNumber || ''}
                                  onChange={(e) => setSettings({
                                    ...settings,
                                    sms: { ...settings.sms, fromNumber: e.target.value }
                                  })}
                                  placeholder="+1234567890"
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                            </>
                          )}
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Destinatários Padrão:</h4>
                            <div className="flex gap-2 mb-2">
                              <input
                                type="tel"
                                value={newSMSRecipient}
                                onChange={(e) => setNewSMSRecipient(e.target.value)}
                                placeholder="+5511999999999"
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                              />
                              <button
                                onClick={addSMSRecipient}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                              >
                                Adicionar
                              </button>
                            </div>
                            <div className="space-y-1">
                              {settings.sms.defaultRecipients.map((phone, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">{phone}</span>
                                  <button
                                    onClick={() => removeSMSRecipient(phone)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Test Button for current tab */}
                {settings[activeTab].enabled && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => testNotification(activeTab)}
                      disabled={testing === activeTab}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
                    >
                      {testing === activeTab ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Testando...
                        </>
                      ) : (
                        <>
                          <TestTube className="w-4 h-4 mr-2" />
                          Testar {activeTab === 'email' ? 'E-mail' : 
                                  activeTab === 'browser' ? 'Navegador' :
                                  activeTab === 'slack' ? 'Slack' :
                                  activeTab === 'webhook' ? 'Webhook' : 'SMS'}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Messages */}
                {message && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {message.text}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}