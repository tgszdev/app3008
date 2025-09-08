'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Shield,
  Check,
  X,
  Save,
  Loader2,
  User,
  UserCheck,
  UserX,
  Settings
} from 'lucide-react'

interface UserPermission {
  id?: string
  user_id: string
  can_submit: boolean
  can_approve: boolean
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export default function TimesheetPermissionsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [permissions, setPermissions] = useState<UserPermission[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changes, setChanges] = useState<Record<string, Partial<UserPermission>>>({})

  useEffect(() => {
    // Verificar se é admin
    if (session?.user && (session.user as any).role !== 'admin') {
      toast.error('Acesso negado. Apenas administradores podem gerenciar permissões.')
      router.push('/dashboard/timesheets')
      return
    }

    fetchData()
  }, [session])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Buscar todos os usuários
      const usersResponse = await axios.get('/api/users')
      const allUsers = usersResponse.data || []
      setUsers(allUsers)
      
      // Buscar permissões existentes
      const permResponse = await axios.get('/api/timesheets/permissions')
      const existingPermissions = permResponse.data || []
      
      // Criar lista completa de permissões (incluindo usuários sem permissão ainda)
      const fullPermissions = allUsers.map((user: any) => {
        const existing = existingPermissions.find((p: any) => p.user_id === user.id)
        return existing || {
          user_id: user.id,
          can_submit: true, // Padrão: pode submeter
          can_approve: user.role === 'admin', // Padrão: admin pode aprovar
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }
      })
      
      setPermissions(fullPermissions)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = (userId: string, field: 'can_submit' | 'can_approve', value: boolean) => {
    // Atualizar estado local
    setPermissions(permissions.map(p => 
      p.user_id === userId ? { ...p, [field]: value } : p
    ))
    
    // Registrar mudança para salvar
    setChanges(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        user_id: userId,
        [field]: value
      }
    }))
  }

  const handleSaveAll = async () => {
    if (Object.keys(changes).length === 0) {
      toast('Nenhuma alteração para salvar', { icon: 'ℹ️' })
      return
    }
    
    try {
      setSaving(true)
      
      // Preparar array de permissões para atualizar
      const permissionsToUpdate = Object.entries(changes).map(([userId, perms]) => ({
        user_id: userId,
        can_submit: permissions.find(p => p.user_id === userId)?.can_submit ?? true,
        can_approve: permissions.find(p => p.user_id === userId)?.can_approve ?? false
      }))
      
      // Enviar atualizações em lote
      await axios.put('/api/timesheets/permissions', {
        permissions: permissionsToUpdate
      })
      
      toast.success('Permissões atualizadas com sucesso!')
      setChanges({})
    } catch (error: any) {
      console.error('Error saving permissions:', error)
      toast.error(error.response?.data?.error || 'Erro ao salvar permissões')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Permissões de Apontamentos
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gerencie as permissões de apontamento de horas dos usuários
          </p>
        </div>
        
        {Object.keys(changes).length > 0 && (
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Alterações ({Object.keys(changes).length})
              </>
            )}
          </button>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Permissão de Submissão
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Usuários com esta permissão podem adicionar apontamentos de horas aos tickets.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-900 dark:text-green-100">
                Permissão de Aprovação
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Usuários com esta permissão podem aprovar ou rejeitar apontamentos de outros usuários.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Usuários e Permissões
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pode Submeter
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pode Aprovar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {permissions.map((permission) => (
                <tr key={permission.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {permission.user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {permission.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      permission.user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                        : permission.user.role === 'agent'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                    }`}>
                      {permission.user.role === 'admin' ? 'Administrador' : 
                       permission.user.role === 'agent' ? 'Agente' : 'Cliente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handlePermissionChange(permission.user_id, 'can_submit', !permission.can_submit)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        permission.can_submit 
                          ? 'bg-blue-600' 
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          permission.can_submit ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handlePermissionChange(permission.user_id, 'can_approve', !permission.can_approve)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        permission.can_approve 
                          ? 'bg-green-600' 
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          permission.can_approve ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legenda */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Observações:
        </h3>
        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>• Por padrão, todos os usuários podem submeter apontamentos</li>
          <li>• Apenas administradores podem aprovar apontamentos por padrão</li>
          <li>• As alterações só serão aplicadas após clicar em "Salvar Alterações"</li>
          <li>• Usuários sem permissão de submissão não verão o botão de adicionar apontamento</li>
        </ul>
      </div>
    </div>
  )
}