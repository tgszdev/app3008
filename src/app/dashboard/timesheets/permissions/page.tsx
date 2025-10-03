'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import apiClient from '@/lib/api-client'
import toast from 'react-hot-toast'
import TimesheetNavigation from '@/components/TimesheetNavigation'
import {
  UserCheck,
  Shield,
  Search,
  Save,
  Loader2,
  AlertCircle,
  Users,
  Lock,
  Unlock,
  Check,
  X,
  FileDown
} from 'lucide-react'
import { exportPermissionsPDF } from '@/lib/pdf-generator'

interface User {
  id: string
  name: string
  email: string
  role: string
  department: string | null
}

interface Permission {
  user_id: string
  can_submit: boolean
  can_approve: boolean
  user?: User
}

export default function TimesheetsPermissionsPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Verificar se é admin
      const userRole = (session?.user as any)?.role
      if (userRole !== 'admin') {
        toast.error('Acesso negado. Apenas administradores podem acessar esta página.')
        return
      }
      
      // Buscar usuários
      const usersResponse = await apiClient.get('/api/users')
      const usersData = usersResponse.data || []
      setUsers(usersData)
      
      // Buscar permissões existentes
      try {
        const permissionsResponse = await apiClient.get('/api/timesheets/permissions/all')
        const permissionsData = permissionsResponse.data || []
        
        // Criar permissões para todos os usuários
        const allPermissions = usersData.map((user: User) => {
          const existing = permissionsData.find((p: Permission) => p.user_id === user.id)
          return existing || {
            user_id: user.id,
            can_submit: true,
            can_approve: user.role === 'admin',
            user
          }
        })
        
        setPermissions(allPermissions)
      } catch (error) {
        // Se falhar, criar permissões padrão
        const defaultPermissions = usersData.map((user: User) => ({
          user_id: user.id,
          can_submit: true,
          can_approve: user.role === 'admin',
          user
        }))
        setPermissions(defaultPermissions)
      }
    } catch (error) {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = async (userId: string, field: 'can_submit' | 'can_approve', value: boolean) => {
    setSaving(userId)
    
    try {
      const permission = permissions.find(p => p.user_id === userId)
      if (!permission) return
      
      const updatedPermission = {
        ...permission,
        [field]: value
      }
      
      await apiClient.post('/api/timesheets/permissions', {
        user_id: userId,
        can_submit: updatedPermission.can_submit,
        can_approve: updatedPermission.can_approve
      })
      
      setPermissions(permissions.map(p => 
        p.user_id === userId ? updatedPermission : p
      ))
      
      toast.success('Permissão atualizada com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar permissão')
    } finally {
      setSaving(null)
    }
  }

  const toggleAllSubmit = async (value: boolean) => {
    try {
      const updates = permissions.map(p => ({
        ...p,
        can_submit: value
      }))
      
      // Atualizar todas as permissões
      await Promise.all(
        updates.map(p => 
          apiClient.post('/api/timesheets/permissions', {
            user_id: p.user_id,
            can_submit: p.can_submit,
            can_approve: p.can_approve
          })
        )
      )
      
      setPermissions(updates)
      toast.success(`Todas as permissões de submissão foram ${value ? 'ativadas' : 'desativadas'}`)
    } catch (error) {
      toast.error('Erro ao atualizar permissões')
    }
  }

  // Filtrar usuários pela busca
  const filteredPermissions = permissions.filter(permission => {
    if (!searchQuery) return true
    if (!permission.user) return false
    
    const query = searchQuery.toLowerCase()
    const user = users.find(u => u.id === permission.user_id)
    if (!user) return false
    
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query) ||
      (user.department && user.department.toLowerCase().includes(query))
    )
  })

  // Estatísticas
  const stats = {
    total: permissions.length,
    canSubmit: permissions.filter(p => p.can_submit).length,
    canApprove: permissions.filter(p => p.can_approve).length,
    admins: users.filter(u => u.role === 'admin').length
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const userRole = (session?.user as any)?.role
  if (userRole !== 'admin') {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Acesso Negado
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <TimesheetNavigation />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Permissões de Apontamentos
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gerencie as permissões de apontamentos por usuário
          </p>
        </div>
        
        <button
          onClick={() => {
            const usersWithPermissions = users.map(user => ({
              ...user,
              permissions: permissions.find(p => p.user_id === user.id) || {}
            }))
            const success = exportPermissionsPDF(usersWithPermissions, 'Relatório de Permissões')
            if (success) {
              toast.success('PDF exportado com sucesso!')
            } else {
              toast.error('Erro ao exportar PDF')
            }
          }}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FileDown className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar PDF</span>
          <span className="sm:hidden">PDF</span>
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Total de Usuários
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                Podem Submeter
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {stats.canSubmit}
              </p>
            </div>
            <Check className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                Podem Aprovar
              </p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {stats.canApprove}
              </p>
            </div>
            <Shield className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                Administradores
              </p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {stats.admins}
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, email, cargo ou departamento..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => toggleAllSubmit(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Unlock className="h-4 w-4" />
              Liberar Todos
            </button>
            <button
              onClick={() => toggleAllSubmit(false)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Lock className="h-4 w-4" />
              Bloquear Todos
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Permissões - Desktop */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Usuário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Cargo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Departamento
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Pode Submeter
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Pode Aprovar
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPermissions.map((permission) => {
              const user = users.find(u => u.id === permission.user_id)
              if (!user) return null
              
              return (
                <tr key={permission.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                        : user.role === 'agent'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {user.role === 'admin' ? 'Administrador' : 
                       user.role === 'agent' ? 'Agente' : 'Usuário'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handlePermissionChange(permission.user_id, 'can_submit', !permission.can_submit)}
                      disabled={saving === permission.user_id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        permission.can_submit 
                          ? 'bg-green-600' 
                          : 'bg-gray-200 dark:bg-gray-600'
                      } ${saving === permission.user_id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        permission.can_submit ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handlePermissionChange(permission.user_id, 'can_approve', !permission.can_approve)}
                      disabled={saving === permission.user_id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        permission.can_approve 
                          ? 'bg-green-600' 
                          : 'bg-gray-200 dark:bg-gray-600'
                      } ${saving === permission.user_id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        permission.can_approve ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
        
        {filteredPermissions.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum usuário encontrado
            </p>
          </div>
        )}
      </div>
      
      {/* Lista de Permissões - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredPermissions.map((permission) => {
          const user = users.find(u => u.id === permission.user_id)
          if (!user) return null
          
          return (
            <div key={permission.user_id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="space-y-3">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}>
                    {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </span>
                  {user.department && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {user.department}
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Pode Submeter</span>
                    <button
                      onClick={() => handlePermissionChange(permission.user_id, 'can_submit', !permission.can_submit)}
                      disabled={saving === permission.user_id}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50"
                      style={{ backgroundColor: permission.can_submit ? '#10b981' : '#6b7280' }}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        permission.can_submit ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Pode Aprovar</span>
                    <button
                      onClick={() => handlePermissionChange(permission.user_id, 'can_approve', !permission.can_approve)}
                      disabled={saving === permission.user_id || user.role === 'admin'}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50"
                      style={{ backgroundColor: permission.can_approve ? '#10b981' : '#6b7280' }}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        permission.can_approve ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        
        {filteredPermissions.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum usuário encontrado
            </p>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Sobre as Permissões
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Pode Submeter:</strong> Permite que o usuário crie e envie apontamentos de horas</li>
          <li>• <strong>Pode Aprovar:</strong> Permite que o usuário aprove ou rejeite apontamentos de outros usuários</li>
          <li>• Administradores sempre têm permissão de aprovar por padrão</li>
          <li>• As alterações são salvas automaticamente ao clicar nos interruptores</li>
        </ul>
      </div>
    </div>
  )
}