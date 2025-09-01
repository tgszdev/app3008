'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Save, Bell, Shield, Palette, Globe, User, Mail, Phone, Server, Eye, EyeOff, TestTube } from 'lucide-react'
import toast from 'react-hot-toast'
import SQLInstructionsModal from '@/components/SQLInstructionsModal'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [sqlModal, setSqlModal] = useState<{ isOpen: boolean; sql: string; instructions?: string[] }>({
    isOpen: false,
    sql: '',
    instructions: []
  })
  
  // Estados para as configurações
  const [profile, setProfile] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    department: '',
    phone: '',
  })

  const [preferences, setPreferences] = useState({
    theme: 'system',
    language: 'pt-BR',
    emailNotifications: true,
    pushNotifications: true,
    notificationSound: true,
  })

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [emailConfig, setEmailConfig] = useState({
    service: 'smtp',
    host: 'smtp.gmail.com',
    port: '587',
    secure: false,
    user: '',
    pass: '',
    from: '',
    fromName: 'Sistema de Suporte Técnico'
  })

  // Carregar configurações de email ao montar o componente
  useEffect(() => {
    if (session?.user?.role === 'admin') {
      loadEmailConfig()
    }
  }, [session])

  const loadEmailConfig = async () => {
    try {
      const response = await fetch('/api/settings/email')
      if (response.ok) {
        const data = await response.json()
        setEmailConfig(data)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de email:', error)
    }
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      // Aqui você faria a chamada para a API
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePreferences = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Preferências salvas com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar preferências')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (security.newPassword !== security.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Senha alterada com sucesso!')
      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error('Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Gerencie suas configurações pessoais e preferências do sistema
        </p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <User className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Informações Pessoais
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Departamento
            </label>
            <input
              type="text"
              value={profile.department}
              onChange={(e) => setProfile({ ...profile, department: e.target.value })}
              placeholder="Ex: Tecnologia da Informação"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveProfile}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Perfil
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Palette className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Preferências
          </h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Globe className="inline h-4 w-4 mr-1" />
                Idioma
              </label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Palette className="inline h-4 w-4 mr-1" />
                Tema
              </label>
              <select
                value={preferences.theme}
                onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="system">Sistema</option>
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                <Mail className="inline h-4 w-4 mr-1" />
                Receber notificações por email
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.pushNotifications}
                onChange={(e) => setPreferences({ ...preferences, pushNotifications: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                <Bell className="inline h-4 w-4 mr-1" />
                Receber notificações push
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.notificationSound}
                onChange={(e) => setPreferences({ ...preferences, notificationSound: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Som de notificação
              </span>
            </label>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSavePreferences}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Preferências
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Shield className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Segurança
          </h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Senha Atual
            </label>
            <input
              type="password"
              value={security.currentPassword}
              onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nova Senha
              </label>
              <input
                type="password"
                value={security.newPassword}
                onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={security.confirmPassword}
                onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center"
          >
            <Shield className="h-4 w-4 mr-2" />
            Alterar Senha
          </button>
        </div>
      </div>

      {/* Email Configuration - Apenas para Admins */}
      {session?.user?.role === 'admin' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Server className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configuração de Email (SMTP)
          </h2>
        </div>
        
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Para Gmail:</strong> Use uma senha de app, não sua senha normal.
            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="ml-2 underline">
              Gerar senha de app →
            </a>
          </p>
        </div>
        
        <div className="space-y-4">
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
                  placeholder="Senha de 16 caracteres (sem espaços)"
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
              checked={emailConfig.secure}
              onChange={(e) => setEmailConfig({ ...emailConfig, secure: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Usar conexão segura (SSL/TLS)
            </span>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between">
          <button
            onClick={async () => {
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
            }}
            disabled={testingEmail || !emailConfig.user || !emailConfig.pass}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testingEmail ? 'Enviando...' : 'Testar Email'}
          </button>
          
          <button
            onClick={async () => {
              setLoading(true)
              try {
                const response = await fetch('/api/settings/email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(emailConfig)
                })
                const data = await response.json()
                
                if (data.success) {
                  toast.success('Configuração de email salva com sucesso!')
                } else if (data.sql) {
                  // Se retornou SQL, significa que a tabela não existe
                  setSqlModal({
                    isOpen: true,
                    sql: data.sql,
                    instructions: data.instructions
                  })
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
                setLoading(false)
              }
            }}
            disabled={loading || !emailConfig.user || !emailConfig.pass}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Configuração
          </button>
        </div>
      </div>
      )}

      {/* Modal de Instruções SQL */}
      <SQLInstructionsModal
        isOpen={sqlModal.isOpen}
        onClose={() => setSqlModal({ ...sqlModal, isOpen: false })}
        sql={sqlModal.sql}
        title="Configuração do Banco de Dados Necessária"
        instructions={sqlModal.instructions}
      />
    </div>
  )
}