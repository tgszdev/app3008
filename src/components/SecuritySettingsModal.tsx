'use client'

import { useState, useEffect } from 'react'
import { X, Shield, Key, Lock, Clock, AlertTriangle, Save, Eye, EyeOff } from 'lucide-react'

interface SecuritySettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SecuritySettings {
  // Políticas de Senha
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireLowercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSpecialChars: boolean
  passwordExpirationDays: number
  
  // Políticas de Sessão
  sessionTimeout: number // em minutos
  maxConcurrentSessions: number
  requireMFA: boolean
  
  // Políticas de Bloqueio
  maxLoginAttempts: number
  lockoutDuration: number // em minutos
  
  // Auditoria
  enableAuditLog: boolean
  auditLogRetentionDays: number
  
  // Políticas de IP
  enableIPWhitelist: boolean
  ipWhitelist: string[]
  enableIPBlacklist: boolean
  ipBlacklist: string[]
}

export default function SecuritySettingsModal({ isOpen, onClose }: SecuritySettingsModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showPasswords, setShowPasswords] = useState(false)
  
  const [settings, setSettings] = useState<SecuritySettings>({
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false,
    passwordExpirationDays: 90,
    sessionTimeout: 30,
    maxConcurrentSessions: 3,
    requireMFA: false,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    enableAuditLog: true,
    auditLogRetentionDays: 90,
    enableIPWhitelist: false,
    ipWhitelist: [],
    enableIPBlacklist: false,
    ipBlacklist: []
  })

  const [newWhitelistIP, setNewWhitelistIP] = useState('')
  const [newBlacklistIP, setNewBlacklistIP] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchSettings()
    }
  }, [isOpen])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings/security', {
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
      const response = await fetch('/api/settings/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configurações de segurança salvas com sucesso!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        throw new Error('Erro ao salvar configurações')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações de segurança' })
      console.error('Erro:', error)
    } finally {
      setSaving(false)
    }
  }

  const addWhitelistIP = () => {
    if (newWhitelistIP && !settings.ipWhitelist.includes(newWhitelistIP)) {
      setSettings({
        ...settings,
        ipWhitelist: [...settings.ipWhitelist, newWhitelistIP]
      })
      setNewWhitelistIP('')
    }
  }

  const removeWhitelistIP = (ip: string) => {
    setSettings({
      ...settings,
      ipWhitelist: settings.ipWhitelist.filter(item => item !== ip)
    })
  }

  const addBlacklistIP = () => {
    if (newBlacklistIP && !settings.ipBlacklist.includes(newBlacklistIP)) {
      setSettings({
        ...settings,
        ipBlacklist: [...settings.ipBlacklist, newBlacklistIP]
      })
      setNewBlacklistIP('')
    }
  }

  const removeBlacklistIP = (ip: string) => {
    setSettings({
      ...settings,
      ipBlacklist: settings.ipBlacklist.filter(item => item !== ip)
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6 text-white" />
                <h2 className="text-xl font-semibold text-white">Configurações de Segurança</h2>
              </div>
              <button onClick={onClose} className="text-white hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Políticas de Senha */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Key className="w-5 h-5 mr-2 text-blue-600" />
                    Políticas de Senha
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comprimento Mínimo
                      </label>
                      <input
                        type="number"
                        min="6"
                        max="32"
                        value={settings.passwordMinLength}
                        onChange={(e) => setSettings({...settings, passwordMinLength: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiração (dias)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={settings.passwordExpirationDays}
                        onChange={(e) => setSettings({...settings, passwordExpirationDays: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0 = sem expiração"
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.passwordRequireUppercase}
                        onChange={(e) => setSettings({...settings, passwordRequireUppercase: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm">Exigir letras maiúsculas</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.passwordRequireLowercase}
                        onChange={(e) => setSettings({...settings, passwordRequireLowercase: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm">Exigir letras minúsculas</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.passwordRequireNumbers}
                        onChange={(e) => setSettings({...settings, passwordRequireNumbers: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm">Exigir números</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.passwordRequireSpecialChars}
                        onChange={(e) => setSettings({...settings, passwordRequireSpecialChars: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm">Exigir caracteres especiais (!@#$%^&*)</span>
                    </label>
                  </div>
                </div>

                {/* Políticas de Sessão */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    Políticas de Sessão
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timeout de Sessão (minutos)
                      </label>
                      <input
                        type="number"
                        min="5"
                        value={settings.sessionTimeout}
                        onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Máximo de Sessões Simultâneas
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={settings.maxConcurrentSessions}
                        onChange={(e) => setSettings({...settings, maxConcurrentSessions: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.requireMFA}
                        onChange={(e) => setSettings({...settings, requireMFA: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm">Exigir autenticação de dois fatores (2FA)</span>
                    </label>
                  </div>
                </div>

                {/* Políticas de Bloqueio */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Lock className="w-5 h-5 mr-2 text-blue-600" />
                    Políticas de Bloqueio
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Máximo de Tentativas de Login
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="10"
                        value={settings.maxLoginAttempts}
                        onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duração do Bloqueio (minutos)
                      </label>
                      <input
                        type="number"
                        min="5"
                        value={settings.lockoutDuration}
                        onChange={(e) => setSettings({...settings, lockoutDuration: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Auditoria */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-blue-600" />
                    Auditoria e Logs
                  </h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.enableAuditLog}
                        onChange={(e) => setSettings({...settings, enableAuditLog: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm">Habilitar logs de auditoria</span>
                    </label>
                    
                    {settings.enableAuditLog && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Retenção de Logs (dias)
                        </label>
                        <input
                          type="number"
                          min="30"
                          value={settings.auditLogRetentionDays}
                          onChange={(e) => setSettings({...settings, auditLogRetentionDays: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Restrições de IP */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-blue-600" />
                    Restrições de IP
                  </h3>
                  
                  {/* IP Whitelist */}
                  <div className="mb-4">
                    <label className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={settings.enableIPWhitelist}
                        onChange={(e) => setSettings({...settings, enableIPWhitelist: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">Habilitar lista de IPs permitidos</span>
                    </label>
                    
                    {settings.enableIPWhitelist && (
                      <div className="ml-6">
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newWhitelistIP}
                            onChange={(e) => setNewWhitelistIP(e.target.value)}
                            placeholder="Ex: 192.168.1.1"
                            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={addWhitelistIP}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Adicionar
                          </button>
                        </div>
                        <div className="space-y-1">
                          {settings.ipWhitelist.map((ip, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                              <span className="text-sm">{ip}</span>
                              <button
                                onClick={() => removeWhitelistIP(ip)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* IP Blacklist */}
                  <div>
                    <label className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={settings.enableIPBlacklist}
                        onChange={(e) => setSettings({...settings, enableIPBlacklist: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">Habilitar lista de IPs bloqueados</span>
                    </label>
                    
                    {settings.enableIPBlacklist && (
                      <div className="ml-6">
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newBlacklistIP}
                            onChange={(e) => setNewBlacklistIP(e.target.value)}
                            placeholder="Ex: 10.0.0.1"
                            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={addBlacklistIP}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Adicionar
                          </button>
                        </div>
                        <div className="space-y-1">
                          {settings.ipBlacklist.map((ip, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                              <span className="text-sm">{ip}</span>
                              <button
                                onClick={() => removeBlacklistIP(ip)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mensagens */}
                {message && (
                  <div className={`p-3 rounded-lg ${
                    message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {message.text}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
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