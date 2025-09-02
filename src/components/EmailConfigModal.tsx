'use client'

import { useState, useEffect } from 'react'
import { Save, Server, Eye, EyeOff, TestTube, X, Mail, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface EmailConfig {
  service: string
  host: string
  port: string
  secure: boolean
  user: string
  pass: string
  from: string
  fromName: string
}

interface EmailConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSqlError?: (sql: string, instructions?: string[]) => void
}

export default function EmailConfigModal({ isOpen, onClose, onSqlError }: EmailConfigModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    service: 'smtp',
    host: 'smtp.gmail.com',
    port: '587',
    secure: false,
    user: '',
    pass: '',
    from: '',
    fromName: 'Sistema de Suporte Técnico'
  })

  // Carregar configurações quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      loadEmailConfig()
    }
  }, [isOpen])

  const loadEmailConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings/email')
      if (response.ok) {
        const data = await response.json()
        setEmailConfig(data)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de email:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestEmail = async () => {
    setTestingEmail(true)
    try {
      const response = await fetch('/api/settings/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailConfig)
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Email de teste enviado! Verifique sua caixa de entrada.')
      } else {
        toast.error(data.error || 'Erro ao enviar email de teste')
      }
    } catch (error) {
      toast.error('Erro ao testar configuração')
    } finally {
      setTestingEmail(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailConfig)
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success('Configuração de email salva com sucesso!')
        onClose()
      } else if (data.sql && onSqlError) {
        // Se retornou SQL, significa que a tabela não existe
        onSqlError(data.sql, data.instructions)
        toast.error(data.error || 'Tabela de configurações não existe', {
          duration: 5000
        })
      } else {
        toast.error(data.error || 'Erro ao salvar configuração')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Server className="h-6 w-6 mr-2 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Configuração de Email (SMTP)
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Info sobre Gmail */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Para Gmail:</strong> Use uma senha de app, não sua senha normal.
                    <a 
                      href="https://myaccount.google.com/apppasswords" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="ml-2 underline hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      Gerar senha de app →
                    </a>
                  </p>
                </div>

                {/* Formulário */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Servidor SMTP
                    </label>
                    <input
                      type="text"
                      value={emailConfig.host}
                      onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Porta
                    </label>
                    <select
                      value={emailConfig.port}
                      onChange={(e) => setEmailConfig({ ...emailConfig, port: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="587">587 (TLS/STARTTLS)</option>
                      <option value="465">465 (SSL)</option>
                      <option value="25">25 (Sem criptografia)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email de Usuário
                    </label>
                    <input
                      type="email"
                      value={emailConfig.user}
                      onChange={(e) => setEmailConfig({ ...emailConfig, user: e.target.value })}
                      placeholder="seu-email@gmail.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Senha de App
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={emailConfig.pass}
                        onChange={(e) => setEmailConfig({ ...emailConfig, pass: e.target.value })}
                        placeholder="Senha de 16 caracteres"
                        className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email de Envio
                    </label>
                    <input
                      type="email"
                      value={emailConfig.from}
                      onChange={(e) => setEmailConfig({ ...emailConfig, from: e.target.value })}
                      placeholder="noreply@seudominio.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Deixe vazio para usar o email do usuário
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome do Remetente
                    </label>
                    <input
                      type="text"
                      value={emailConfig.fromName}
                      onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                      placeholder="Sistema de Suporte"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="secure"
                    checked={emailConfig.secure}
                    onChange={(e) => setEmailConfig({ ...emailConfig, secure: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="secure" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Usar conexão segura (SSL/TLS)
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && (
            <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                onClick={handleSave}
                disabled={saving || !emailConfig.user || !emailConfig.pass}
                className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Save className="h-5 w-5 mr-2" />
                )}
                Salvar Configuração
              </button>
              <button
                onClick={handleTestEmail}
                disabled={testingEmail || !emailConfig.user || !emailConfig.pass}
                className="mt-3 w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {testingEmail ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-5 w-5 mr-2" />
                )}
                Testar Email
              </button>
              <button
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}