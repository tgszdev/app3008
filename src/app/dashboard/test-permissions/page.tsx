'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/hooks/usePermissions'
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TestPermissionsPage() {
  const { data: session } = useSession()
  const { hasPermission, loading } = usePermissions()

  // Lista de todas as permissões do sistema
  const permissions = [
    { key: 'tickets_view', label: 'Visualizar Tickets' },
    { key: 'tickets_create', label: 'Criar Tickets' },
    { key: 'tickets_edit_own', label: 'Editar Próprios Tickets' },
    { key: 'tickets_edit_all', label: 'Editar Todos os Tickets' },
    { key: 'tickets_delete', label: 'Excluir Tickets' },
    { key: 'tickets_assign', label: 'Atribuir Tickets' },
    { key: 'tickets_close', label: 'Fechar Tickets' },
    { key: 'kb_view', label: 'Visualizar Base de Conhecimento' },
    { key: 'kb_create', label: 'Criar Artigos' },
    { key: 'kb_edit', label: 'Editar Artigos' },
    { key: 'kb_delete', label: 'Excluir Artigos' },
    { key: 'kb_manage_categories', label: 'Gerenciar Categorias KB' },
    { key: 'timesheets_view_own', label: 'Ver Próprios Timesheets' },
    { key: 'timesheets_view_all', label: 'Ver Todos os Timesheets' },
    { key: 'timesheets_create', label: 'Criar Timesheets' },
    { key: 'timesheets_edit_own', label: 'Editar Próprios Timesheets' },
    { key: 'timesheets_edit_all', label: 'Editar Todos os Timesheets' },
    { key: 'timesheets_approve', label: 'Aprovar Timesheets' },
    { key: 'timesheets_analytics', label: 'Analytics de Timesheets' },
    { key: 'system_settings', label: 'Configurações do Sistema' },
    { key: 'system_users', label: 'Gerenciar Usuários' },
    { key: 'system_roles', label: 'Gerenciar Roles' },
    { key: 'system_backup', label: 'Backup do Sistema' },
    { key: 'system_logs', label: 'Logs do Sistema' },
  ]

  useEffect(() => {
    if (!loading && session) {
      console.log('=== DEBUG SESSION AND PERMISSIONS ===')
      console.log('Session:', session)
      console.log('User ID:', session.user?.id)
      console.log('User Email:', session.user?.email)
      console.log('User Role:', session.user?.role)
      console.log('User Role Name:', (session.user as any)?.role_name)
      
      // Test specific permissions
      console.log('Can assign tickets:', hasPermission('tickets_assign'))
      console.log('Can edit all tickets:', hasPermission('tickets_edit_all'))
    }
  }, [loading, session, hasPermission])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Teste de Permissões
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Verifique suas permissões atuais no sistema
        </p>
      </div>

      {/* User Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Informações do Usuário
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {session?.user?.name || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {session?.user?.email || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Role (Sistema)</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {session?.user?.role || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Role (Customizada)</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {(session?.user as any)?.role_name || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Permissions Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Permissões Disponíveis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {permissions.map((permission) => {
            const hasAccess = hasPermission(permission.key as any)
            return (
              <div
                key={permission.key}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  hasAccess
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <span className={`text-sm font-medium ${
                  hasAccess
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  {permission.label}
                </span>
                {hasAccess ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-6 bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Informações de Debug
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Abra o console do navegador (F12) para ver logs detalhados das permissões.
        </p>
        <div className="mt-2 text-xs font-mono text-gray-600 dark:text-gray-400">
          <p>tickets_assign: {hasPermission('tickets_assign') ? '✅ Sim' : '❌ Não'}</p>
          <p>tickets_edit_all: {hasPermission('tickets_edit_all') ? '✅ Sim' : '❌ Não'}</p>
        </div>
      </div>
    </div>
  )
}