'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/hooks/usePermissions'
import { Shield, Check, X, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TestPermissionsPage() {
  const { data: session } = useSession()
  const { permissions, loading, hasPermission, reloadPermissions } = usePermissions()
  const [testResults, setTestResults] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  // Lista completa das 24 permissões
  const allPermissions = [
    // Tickets
    { key: 'tickets_view', label: 'Visualizar Tickets', category: 'Tickets' },
    { key: 'tickets_create', label: 'Criar Tickets', category: 'Tickets' },
    { key: 'tickets_edit_own', label: 'Editar Próprios Tickets', category: 'Tickets' },
    { key: 'tickets_edit_all', label: 'Editar Todos os Tickets', category: 'Tickets' },
    { key: 'tickets_delete', label: 'Excluir Tickets', category: 'Tickets' },
    { key: 'tickets_assign', label: 'Atribuir Tickets', category: 'Tickets' },
    { key: 'tickets_close', label: 'Fechar Tickets', category: 'Tickets' },
    
    // Base de Conhecimento
    { key: 'kb_view', label: 'Visualizar Base de Conhecimento', category: 'Base de Conhecimento' },
    { key: 'kb_create', label: 'Criar Artigos', category: 'Base de Conhecimento' },
    { key: 'kb_edit', label: 'Editar Artigos', category: 'Base de Conhecimento' },
    { key: 'kb_delete', label: 'Excluir Artigos', category: 'Base de Conhecimento' },
    { key: 'kb_manage_categories', label: 'Gerenciar Categorias', category: 'Base de Conhecimento' },
    
    // Apontamentos
    { key: 'timesheets_view_own', label: 'Ver Próprios Apontamentos', category: 'Apontamentos' },
    { key: 'timesheets_view_all', label: 'Ver Todos os Apontamentos', category: 'Apontamentos' },
    { key: 'timesheets_create', label: 'Criar Apontamentos', category: 'Apontamentos' },
    { key: 'timesheets_edit_own', label: 'Editar Próprios Apontamentos', category: 'Apontamentos' },
    { key: 'timesheets_edit_all', label: 'Editar Todos os Apontamentos', category: 'Apontamentos' },
    { key: 'timesheets_approve', label: 'Aprovar Apontamentos', category: 'Apontamentos' },
    { key: 'timesheets_analytics', label: 'Ver Analytics', category: 'Apontamentos' },
    
    // Sistema
    { key: 'system_settings', label: 'Configurações do Sistema', category: 'Sistema' },
    { key: 'system_users', label: 'Gerenciar Usuários', category: 'Sistema' },
    { key: 'system_roles', label: 'Gerenciar Perfis', category: 'Sistema' },
    { key: 'system_backup', label: 'Backup e Restauração', category: 'Sistema' },
    { key: 'system_logs', label: 'Visualizar Logs', category: 'Sistema' }
  ]

  // Agrupar permissões por categoria
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = []
    }
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, typeof allPermissions>)

  const runTest = async () => {
    setTesting(true)
    try {
      const response = await fetch('/api/test-permissions')
      const data = await response.json()
      setTestResults(data)
      
      if (data.error) {
        toast.error(`Erro no teste: ${data.error}`)
      } else {
        toast.success(`Teste concluído! ${data.stats.active}/${data.stats.total} permissões ativas`)
      }
    } catch (error) {
      console.error('Erro ao executar teste:', error)
      toast.error('Erro ao executar teste de permissões')
    } finally {
      setTesting(false)
    }
  }

  const clearCache = async () => {
    try {
      const response = await fetch('/api/admin/clear-cache', {
        method: 'POST'
      })
      
      if (response.ok) {
        toast.success('Cache limpo! Recarregando permissões...')
        reloadPermissions()
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (error) {
      toast.error('Erro ao limpar cache')
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Teste de Permissões
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Verificação completa do sistema de permissões
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearCache}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Limpar Cache
            </button>
            <button
              onClick={runTest}
              disabled={testing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Executar Teste
            </button>
          </div>
        </div>

        {/* Informações do usuário */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Usuário</p>
            <p className="font-semibold">{session?.user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
            <p className="font-semibold">{session?.user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Perfil</p>
            <p className="font-semibold uppercase">
              {session?.user?.role_name || session?.user?.role || 'user'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Permissões */}
      {Object.entries(groupedPermissions).map(([category, perms]) => (
        <div key={category} className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            {category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {perms.map((perm) => {
              const isActive = hasPermission(perm.key as any)
              return (
                <div
                  key={perm.key}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${isActive 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                      : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`font-medium ${isActive ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                        {perm.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                    Chave: {perm.key}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Resultados do Teste */}
      {testResults && (
        <div className="mt-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Resultados do Teste API
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-xl font-bold">{testResults.stats?.total}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded">
              <p className="text-sm text-green-600 dark:text-green-400">Ativas</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">
                {testResults.stats?.active}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded">
              <p className="text-sm text-red-600 dark:text-red-400">Inativas</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-300">
                {testResults.stats?.inactive}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded">
              <p className="text-sm text-blue-600 dark:text-blue-400">Status</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {testResults.stats?.loaded ? '✅' : '❌'}
              </p>
            </div>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
              Ver JSON completo
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}