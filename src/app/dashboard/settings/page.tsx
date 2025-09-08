'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { BookOpen, Mail, Settings, Shield, Bell, Database, Folder, Clock } from 'lucide-react'
import SQLInstructionsModal from '@/components/SQLInstructionsModal'
import ProfileCategorySettings from '@/components/ProfileCategorySettings'
import EmailConfigModal from '@/components/EmailConfigModal'
import CategoryManagementModal from '@/components/CategoryManagementModal'
import SecuritySettingsModal from '@/components/SecuritySettingsModal'
import NotificationSettingsModal from '@/components/NotificationSettingsModal'
import BackupRestoreModal from '@/components/BackupRestoreModal'
import TimesheetPermissionsModalV2 from '@/components/TimesheetPermissionsModalV2'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'admin'
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [securityModalOpen, setSecurityModalOpen] = useState(false)
  const [notificationModalOpen, setNotificationModalOpen] = useState(false)
  const [backupModalOpen, setBackupModalOpen] = useState(false)
  const [timesheetPermissionsModalOpen, setTimesheetPermissionsModalOpen] = useState(false)
  const [sqlModal, setSqlModal] = useState<{ isOpen: boolean; sql: string; instructions?: string[] }>({
    isOpen: false,
    sql: '',
    instructions: []
  })

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

  const handleComingSoon = (feature: string) => {
    toast('🚧 ' + feature + ' - Em breve!', {
      icon: '🔨',
      duration: 2000
    })
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

      {/* Cards de Configuração */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Email Configuration Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full">
          <div className="flex items-start mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configuração de Email
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                SMTP para envio de notificações
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">
            Configure o servidor SMTP para envio de emails de notificação do sistema
          </p>
          
          <button
            onClick={() => setEmailModalOpen(true)}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Settings className="h-5 w-5 mr-2" />
            Configurar Email
          </button>
        </div>

        {/* Knowledge Base Permissions Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full">
          <div className="flex items-start mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
              <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Permissões da Base
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Controle de acesso por perfil
              </p>
            </div>
          </div>
          
          <div className="flex-grow flex flex-col">
            <ProfileCategorySettings />
          </div>
        </div>

        {/* Category Management Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full">
          <div className="flex items-start mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex-shrink-0">
              <Folder className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Gerenciar Categorias
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Categorias de chamados
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">
            Gerencie as categorias utilizadas para classificar e organizar os chamados
          </p>
          
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            <Settings className="h-5 w-5 mr-2" />
            Gerenciar Categorias
          </button>
        </div>

        {/* Security Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full">
          <div className="flex items-start mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
              <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurações de Segurança
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Políticas e autenticação
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">
            Configure políticas de senha, autenticação de dois fatores e sessões
          </p>
          
          <button
            onClick={() => setSecurityModalOpen(true)}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <Settings className="h-5 w-5 mr-2" />
            Configurar Segurança
          </button>
        </div>

        {/* Notifications Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full">
          <div className="flex items-start mb-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex-shrink-0">
              <Bell className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notificações
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Alertas e comunicações
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">
            Configure tipos de notificações, frequência e canais de envio
          </p>
          
          <button
            onClick={() => setNotificationModalOpen(true)}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
          >
            <Settings className="h-5 w-5 mr-2" />
            Configurar Notificações
          </button>
        </div>

        {/* Backup Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full">
          <div className="flex items-start mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
              <Database className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Backup e Restauração
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gerenciamento de dados
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">
            Configure backups automáticos e restauração de dados do sistema
          </p>
          
          <button
            onClick={() => setBackupModalOpen(true)}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            <Settings className="h-5 w-5 mr-2" />
            Gerenciar Backups
          </button>
        </div>

        {/* Timesheet Permissions Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full">
          <div className="flex items-start mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex-shrink-0">
              <Clock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Permissões de Apontamento
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Controle de horas trabalhadas
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">
            Configure quem pode fazer apontamentos e aprovar horas trabalhadas
          </p>
          
          <button
            onClick={() => setTimesheetPermissionsModalOpen(true)}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <Settings className="h-5 w-5 mr-2" />
            Configurar Permissões
          </button>
        </div>
      </div>

      {/* Modals */}
      <EmailConfigModal 
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSqlError={(sql, instructions) => {
          setSqlModal({
            isOpen: true,
            sql,
            instructions: instructions || []
          })
        }}
      />

      <CategoryManagementModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
      />

      <SecuritySettingsModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
      />

      <NotificationSettingsModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
      />

      <BackupRestoreModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
      />

      <TimesheetPermissionsModalV2
        isOpen={timesheetPermissionsModalOpen}
        onClose={() => setTimesheetPermissionsModalOpen(false)}
      />

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