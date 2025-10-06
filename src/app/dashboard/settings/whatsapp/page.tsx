'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface WhatsAppSettings {
  phone: string
  whatsapp_enabled: boolean
  preferences: {
    ticket_created: boolean
    ticket_assigned: boolean
    ticket_updated: boolean
    ticket_resolved: boolean
    comment_added: boolean
    comment_mention: boolean
  }
}

export default function WhatsAppSettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [settings, setSettings] = useState<WhatsAppSettings>({
    phone: '',
    whatsapp_enabled: false,
    preferences: {
      ticket_created: false,
      ticket_assigned: false,
      ticket_updated: false,
      ticket_resolved: false,
      comment_added: false,
      comment_mention: false
    }
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings/whatsapp')
      const data = await response.json()
      
      if (data.success) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('✅ Configurações salvas com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao salvar')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleTestMessage = async () => {
    if (!settings.phone) {
      toast.error('Adicione um número de telefone primeiro')
      return
    }

    setTesting(true)
    try {
      const response = await fetch('/api/settings/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: settings.phone })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('✅ Mensagem de teste enviada! Verifique seu WhatsApp')
      } else {
        toast.error(data.error || 'Erro ao enviar mensagem de teste')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao enviar mensagem de teste')
    } finally {
      setTesting(false)
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 4) return `+${numbers.slice(0, 2)} ${numbers.slice(2)}`
    if (numbers.length <= 9) return `+${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4)}`
    return `+${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4, 9)}-${numbers.slice(9, 13)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <span className="text-4xl">📱</span>
          Notificações WhatsApp
        </h1>
        <p className="text-gray-600">
          Configure seu WhatsApp para receber notificações em tempo real via Meta Business API
        </p>
      </div>

      {/* Alerta Importante */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-2xl">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Meta WhatsApp Business API
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2"><strong>API Oficial da Meta/Facebook</strong></p>
              <ul className="list-disc ml-5 space-y-1">
                <li>✅ Templates aprovados pela Meta</li>
                <li>✅ Alta taxa de entrega (99%+)</li>
                <li>✅ Custo: ~R$ 0,04 por mensagem</li>
                <li>✅ Suporte a mídia e botões interativos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Configuração do Telefone */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span>📞</span>
          Número de WhatsApp
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Seu número WhatsApp
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => setSettings({
                ...settings,
                phone: formatPhone(e.target.value)
              })}
              placeholder="+55 11 98765-4321"
              className="w-full px-4 py-3 border rounded-lg text-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Digite o número no formato internacional (com código do país +55)
            </p>
          </div>

          <button
            onClick={handleTestMessage}
            disabled={!settings.phone || testing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {testing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <span>✉️</span>
                Enviar Mensagem de Teste
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toggle Principal */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-1">
              <span>🔔</span>
              Notificações WhatsApp
            </h2>
            <p className="text-sm text-gray-600">
              Ativar notificações via WhatsApp para todas as ações
            </p>
          </div>
          
          <label className="relative inline-block w-16 h-9 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.whatsapp_enabled}
              onChange={(e) => setSettings({
                ...settings,
                whatsapp_enabled: e.target.checked
              })}
              className="sr-only peer"
            />
            <div className="w-full h-full bg-gray-200 peer-checked:bg-green-500 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-green-300" />
            <div className="absolute top-1 left-1 w-7 h-7 bg-white rounded-full transition-transform peer-checked:translate-x-7 shadow-md" />
          </label>
        </div>
      </div>

      {/* Preferências Detalhadas */}
      {settings.whatsapp_enabled && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>⚙️</span>
            Preferências por Tipo
          </h2>
          
          <div className="space-y-4">
            {[
              { key: 'ticket_created', icon: '🎫', label: 'Novo Chamado', desc: 'Quando um novo chamado é criado' },
              { key: 'ticket_assigned', icon: '👤', label: 'Chamado Atribuído', desc: 'Quando um chamado é atribuído a você' },
              { key: 'ticket_updated', icon: '🔄', label: 'Chamado Atualizado', desc: 'Quando há mudanças no chamado' },
              { key: 'ticket_resolved', icon: '✅', label: 'Chamado Resolvido', desc: 'Quando um chamado é finalizado' },
              { key: 'comment_added', icon: '💬', label: 'Novo Comentário', desc: 'Quando alguém comenta em seus chamados' },
              { key: 'comment_mention', icon: '📢', label: 'Menção em Comentário', desc: 'Quando você é mencionado (@você)' }
            ].map((pref) => (
              <div key={pref.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{pref.icon}</span>
                  <div>
                    <h3 className="font-medium">{pref.label}</h3>
                    <p className="text-sm text-gray-600">{pref.desc}</p>
                  </div>
                </div>
                
                <label className="relative inline-block w-14 h-8 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.preferences[pref.key as keyof typeof settings.preferences]}
                    onChange={(e) => setSettings({
                      ...settings,
                      preferences: {
                        ...settings.preferences,
                        [pref.key]: e.target.checked
                      }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-full h-full bg-gray-300 peer-checked:bg-blue-500 rounded-full transition-colors" />
                  <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botão Salvar */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">
          Alterações não salvas serão perdidas
        </p>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <span>💾</span>
              Salvar Configurações
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <span>ℹ️</span>
          Informações Importantes
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
          <li>Mensagens enviadas via API oficial da Meta/Facebook</li>
          <li>Templates pré-aprovados garantem alta taxa de entrega</li>
          <li>Custo aproximado: R$ 0,04 por mensagem</li>
          <li>Suporte a botões interativos e mídia</li>
          <li>Notificações são enviadas apenas se esta função estiver ativada</li>
        </ul>
      </div>
    </div>
  )
}

