'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Shield, User as UserIcon, X, Save, Loader2, Key } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const RoleBadge = ({ role }: { role: string }) => {
  const config: Record<string, { color: string; icon: any; label: string }> = {
    admin: { 
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      icon: Shield,
      label: 'Administrador'
    },
    analyst: { 
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      icon: UserCheck,
      label: 'Analista'
    },
    user: { 
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      icon: UserIcon,
      label: 'Usuário'
    },
  }
  
  const { color, icon: Icon, label } = config[role] || config.user
  
  return (
    <span className={cn("inline-flex items-center px-2 py-1 text-xs font-medium rounded-full", color)}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </span>
  )
}

const StatusBadge = ({ isActive }: { isActive: boolean }) => {
  return isActive ? (
    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
      <UserCheck className="w-3 h-3 mr-1" />
      Ativo
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
      <UserX className="w-3 h-3 mr-1" />
      Inativo
    </span>
  )
}

interface User {
  id: string
  name: string
  email: string
  role: string
  department?: string
  phone?: string
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

interface UserFormData {
  name: string
  email: string
  role: string
  department: string
  phone: string
  password?: string
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [passwordChangeUser, setPasswordChangeUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'user',
    department: '',
    phone: '',
    password: '',
  })

  // Verificar se o usuário atual é admin
  const currentUserRole = (session?.user as any)?.role
  const isCurrentUserAdmin = currentUserRole === 'admin'

  // Verificar permissão de acesso
  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    
    if (status === 'authenticated' && !isCurrentUserAdmin) {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.')
      router.push('/dashboard')
    }
  }, [status, isCurrentUserAdmin, router])

  // Buscar usuários do banco
  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users')
      
      // Verificar se a resposta é um array
      if (Array.isArray(response.data)) {
        setUsers(response.data)
        console.log(`Carregados ${response.data.length} usuários do banco`)
      } else {
        console.error('Resposta inválida da API:', response.data)
        toast.error('Formato de dados inválido')
        
        // Tentar debug endpoint
        try {
          const debugResponse = await axios.get('/api/users/debug')
          console.log('Debug info:', debugResponse.data)
        } catch (debugError) {
          console.error('Debug endpoint falhou:', debugError)
        }
      }
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error)
      
      // Mensagem de erro mais específica
      if (error.response?.status === 500) {
        toast.error('Erro no servidor. Verifique as configurações do Supabase.')
      } else if (error.response?.status === 404) {
        toast.error('API não encontrada')
      } else {
        toast.error('Erro ao carregar usuários')
      }
      
      // Tentar debug endpoint em caso de erro
      try {
        const debugResponse = await axios.get('/api/users/debug')
        console.log('Debug info após erro:', debugResponse.data)
      } catch (debugError) {
        console.error('Debug endpoint falhou:', debugError)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.is_active) ||
                         (statusFilter === 'inactive' && !user.is_active)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await axios.patch('/api/users', {
        id: userId,
        is_active: !currentStatus
      })
      
      await fetchUsers()
      toast.success(`Usuário ${currentStatus ? 'desativado' : 'ativado'} com sucesso!`)
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status do usuário')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId)
    
    if (user?.email === 'admin@example.com') {
      toast.error('Não é possível excluir o administrador principal!')
      return
    }
    
    if (confirm(`Tem certeza que deseja excluir o usuário ${user?.name}?`)) {
      try {
        await axios.delete(`/api/users?id=${userId}`)
        await fetchUsers()
        toast.success('Usuário excluído com sucesso!')
      } catch (error: any) {
        console.error('Erro ao excluir usuário:', error)
        toast.error(error.response?.data?.error || 'Erro ao excluir usuário')
      }
    }
  }

  const handleEditUser = (user: User) => {
    // Se o usuário atual for admin, abrir modal com opção de alterar senha
    if (isCurrentUserAdmin) {
      setPasswordChangeUser(user)
      setShowPasswordModal(true)
    } else {
      // Se não for admin, abrir modal normal de edição
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || '',
        phone: user.phone || '',
      })
      setShowModal(true)
    }
  }

  const handleEditUserInfo = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      phone: user.phone || '',
    })
    setShowModal(true)
    setShowPasswordModal(false)
  }

  const handleChangePassword = async () => {
    // Validação
    if (!newPassword || !confirmPassword) {
      toast.error('Por favor, preencha todos os campos!')
      return
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres!')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem!')
      return
    }

    setSaving(true)

    try {
      await axios.put('/api/users/change-password', {
        userId: passwordChangeUser?.id,
        newPassword: newPassword,
      })

      toast.success('Senha alterada com sucesso!')
      setShowPasswordModal(false)
      setPasswordChangeUser(null)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error)
      toast.error(error.response?.data?.error || 'Erro ao alterar senha')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenNewUserModal = () => {
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      role: 'user',
      department: '',
      phone: '',
      password: '',
    })
    setShowModal(true)
  }

  const handleSaveUser = async () => {
    // Validação
    if (!formData.name || !formData.email) {
      toast.error('Nome e email são obrigatórios!')
      return
    }

    if (!editingUser && !formData.password) {
      toast.error('Senha é obrigatória para novo usuário!')
      return
    }

    setSaving(true)

    try {
      if (editingUser) {
        // Editar usuário existente
        await axios.patch('/api/users', {
          id: editingUser.id,
          ...formData
        })
        toast.success('Usuário atualizado com sucesso!')
      } else {
        // Criar novo usuário
        await axios.post('/api/users', formData)
        toast.success('Usuário criado com sucesso!')
      }

      await fetchUsers()
      setShowModal(false)
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        role: 'user',
        department: '',
        phone: '',
        password: '',
      })
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error)
      toast.error(error.response?.data?.error || 'Erro ao salvar usuário')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Usuários
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gerencie os usuários do sistema
          </p>
        </div>
        <button
          onClick={handleOpenNewUserModal}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Usuário
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Perfis</option>
            <option value="admin">Administrador</option>
            <option value="analyst">Analista</option>
            <option value="user">Usuário</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Perfil
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Departamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Último Acesso
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge isActive={user.is_active} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString('pt-BR') : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                        title={user.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination - Simplificada */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Total de <span className="font-medium">{filteredUsers.length}</span> usuários
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Escolha de Ação para Admin */}
      {showPasswordModal && isCurrentUserAdmin ? (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPasswordModal(false)
              setPasswordChangeUser(null)
              setNewPassword('')
              setConfirmPassword('')
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Editar Usuário: {passwordChangeUser?.name}
              </h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordChangeUser(null)
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Escolha o que deseja fazer:
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handleEditUserInfo(passwordChangeUser!)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      <Edit className="h-5 w-5 mr-3 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">Editar Informações</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Alterar nome, perfil, departamento</p>
                      </div>
                    </div>
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-gray-50 dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">ou</span>
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-start">
                      <Key className="h-5 w-5 mr-3 text-orange-600 dark:text-orange-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white mb-3">Alterar Senha</p>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Nova Senha
                            </label>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="Mínimo 6 caracteres"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Confirmar Nova Senha
                            </label>
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="Digite a senha novamente"
                            />
                          </div>

                          <button
                            onClick={handleChangePassword}
                            className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                            disabled={saving || !newPassword || !confirmPassword}
                          >
                            {saving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Alterando...
                              </>
                            ) : (
                              <>
                                <Key className="h-4 w-4 mr-2" />
                                Alterar Senha
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start">
                  <Shield className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    <strong>Atenção:</strong> Apenas administradores podem alterar senhas de outros usuários. Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal de Criar/Editar Usuário */}
      {showModal ? (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false)
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@exemplo.com"
                  disabled={!!editingUser}
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Senha *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Perfil *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="user">Usuário</option>
                  <option value="analyst">Analista</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Tecnologia da Informação"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center disabled:opacity-50"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingUser ? 'Salvar' : 'Criar'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}