'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Save, Server, Eye, EyeOff, TestTube, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import SQLInstructionsModal from '@/components/SQLInstructionsModal'
import ProfileCategorySettings from '@/components/ProfileCategorySettings'

export default function SettingsPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'admin'
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [sqlModal, setSqlModal] = useState<{ isOpen: boolean; sql: string; instructions?: string[] }>({
    isOpen: false,
    sql: '',
    instructions: []
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
    if (isAdmin) {
      loadEmailConfig()
    }
  }, [isAdmin])

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

  // Verificar se o usuário é admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Acesso Restrito
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Esta página é restrita a administradores.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Configurações Administrativas
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Gerencie as configurações administrativas do sistema
        </p>
      </div>

      {/* Email Configuration */}
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

      {/* Configuração de Perfis e Categorias da Base de Conhecimento */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configuração de Perfis - Base de Conhecimento
            </h2>
          </div>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Configure quais categorias cada perfil pode visualizar na Base de Conhecimento
          </p>
        </div>

        <div className="p-4">
          <ProfileCategorySettings />
        </div>
      </div>

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