'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Server, BookOpen, Mail, Settings } from 'lucide-react'
import SQLInstructionsModal from '@/components/SQLInstructionsModal'
import ProfileCategorySettings from '@/components/ProfileCategorySettings'
import EmailConfigModal from '@/components/EmailConfigModal'

export default function SettingsPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'admin'
  const [emailModalOpen, setEmailModalOpen] = useState(false)
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Configuration Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
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
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Configure o servidor SMTP para envio de emails de notificação do sistema
          </p>
          
          <button
            onClick={() => setEmailModalOpen(true)}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Server className="h-5 w-5 mr-2" />
            Configurar Email
          </button>
        </div>

        {/* Knowledge Base Permissions Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
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
          
          <ProfileCategorySettings />
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