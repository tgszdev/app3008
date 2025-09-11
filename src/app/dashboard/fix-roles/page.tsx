'use client'

import { useState } from 'react'
import { Database, CheckCircle, AlertCircle, Loader2, UserPlus, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useRouter } from 'next/navigation'

export default function FixRolesPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const router = useRouter()

  const createDeveloperRole = async () => {
    setLoading(true)
    try {
      const response = await axios.post('/api/admin/create-developer-role')
      setResult(response.data)
      
      if (response.data.success) {
        toast.success(response.data.message)
      } else {
        toast.error('Role já existe ou erro ao criar')
      }
    } catch (error: any) {
      console.error('Erro:', error)
      toast.error('Erro ao criar role desenvolvedor')
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const clearCache = async () => {
    setLoading(true)
    try {
      const response = await axios.post('/api/admin/clear-cache')
      toast.success('Cache limpo com sucesso! Faça logout e login novamente.')
      setResult({ cache_cleared: true })
    } catch (error) {
      toast.error('Erro ao limpar cache')
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async () => {
    const email = prompt('Digite o email do usuário para atribuir a role "desenvolvedor":')
    if (!email) return

    setLoading(true)
    try {
      // Aqui você precisaria de um endpoint para atualizar o usuário
      // Por enquanto, vamos apenas mostrar as instruções SQL
      setResult({
        sql_instructions: `
          -- Execute este SQL no Supabase para atribuir a role ao usuário:
          UPDATE users 
          SET role_name = 'desenvolvedor' 
          WHERE email = '${email}';
        `
      })
      toast.success('Instruções SQL geradas. Execute no Supabase.')
    } catch (error) {
      toast.error('Erro ao gerar instruções')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Database className="h-6 w-6 text-purple-600" />
          Correção de Roles e Permissões
        </h1>

        <div className="space-y-4">
          {/* Informação sobre o problema */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h2 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Problema Detectado
                </h2>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  A role "desenvolvedor" não existe no banco de dados. Isso impede que as permissões funcionem corretamente.
                </p>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={createDeveloperRole}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <UserPlus className="h-5 w-5" />
              )}
              Criar Role Desenvolvedor
            </button>

            <button
              onClick={clearCache}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
              Limpar Cache
            </button>

            <button
              onClick={updateUserRole}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Database className="h-5 w-5" />
              )}
              Atribuir Role ao Usuário
            </button>
          </div>

          {/* Resultado */}
          {result && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Sucesso
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    Resultado
                  </>
                )}
              </h3>
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {/* Instruções */}
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold text-lg">📋 Passos para Corrigir:</h3>
            
            <ol className="space-y-3 list-decimal list-inside">
              <li>
                <strong>Criar a Role:</strong> Clique em "Criar Role Desenvolvedor" para criar a role no banco
              </li>
              <li>
                <strong>Limpar Cache:</strong> Clique em "Limpar Cache" para forçar recarregamento das permissões
              </li>
              <li>
                <strong>Logout/Login:</strong> Faça logout e login novamente para aplicar as mudanças
              </li>
              <li>
                <strong>Atribuir ao Usuário:</strong> Use o botão "Atribuir Role ao Usuário" ou execute o SQL no Supabase
              </li>
            </ol>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                💡 Permissões da Role Desenvolvedor:
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>✅ Visualizar, criar e editar tickets</li>
                <li>✅ <strong>Excluir tickets</strong></li>
                <li>✅ Atribuir responsáveis</li>
                <li>✅ Fechar tickets</li>
                <li>✅ Criar e editar artigos da base de conhecimento</li>
                <li>✅ Gerenciar próprios apontamentos</li>
                <li>❌ Sem acesso administrativo ao sistema</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            ← Voltar
          </button>
          
          <button
            onClick={() => router.push('/dashboard/test-permissions')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Testar Permissões →
          </button>
        </div>
      </div>
    </div>
  )
}