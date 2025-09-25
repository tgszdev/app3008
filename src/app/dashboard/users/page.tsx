'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Shield, User as UserIcon, X, Save, Loader2, Key, Building, Users, Link2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/contexts/OrganizationContext'

const RoleBadge = ({ role, roles }: { role: string; roles?: Role[] }) => {
  // Obter o display_name da role
  const label = getRoleLabel(role, roles)
  
  // Configuração de ícones e cores para roles conhecidas
  const config: Record<string, { color: string; icon: any }> = {
    admin: { 
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      icon: Shield
    },
    analyst: { 
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      icon: UserCheck
    },
    user: { 
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      icon: UserIcon
    },
  }
  
  // Para roles customizadas, usar configuração padrão
  const defaultConfig = {
    color: getRoleBadgeColor(role),
    icon: UserIcon
  }
  
  const { color, icon: Icon } = config[role] || defaultConfig
  
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

const OrganizationBadge = ({ userType, contextName, contextType }: { 
  userType?: string; 
  contextName?: string; 
  contextType?: string 
}) => {
  if (userType === 'matrix') {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
        <Building className="w-3 h-3 mr-1" />
        🏢 Multi-Org
      </span>
    )
  }
  
  if (contextName) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
        <Users className="w-3 h-3 mr-1" />
        👤 {contextName}
      </span>
    )
  }
  
  return (
    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
      <UserIcon className="w-3 h-3 mr-1" />
      👤 Padrão
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
  user_type?: string
  context_id?: string
  context_name?: string
  context_type?: string
}

interface UserFormData {
  name: string
  email: string
  role: string
  department: string
  phone: string
  password?: string
  user_type: string
}

interface Role {
  id: string
  name: string
  display_name: string
  permissions: any
  is_system: boolean
}

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'analyst':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'user':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    default:
      // Para roles customizadas, usar cores alternativas
      const colors = [
        'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      ]
      // Usar hash do nome da role para escolher uma cor consistente
      const hash = role.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      return colors[hash % colors.length]
  }
}

const getRoleLabel = (role: string, roles?: Role[]) => {
  // Se temos a lista de roles, buscar o display_name
  if (roles) {
    const foundRole = roles.find(r => r.name === role)
    if (foundRole) return foundRole.display_name
  }
  
  // Fallback para roles conhecidas
  switch (role) {
    case 'admin':
      return 'Administrador'
    case 'analyst':
      return 'Analista'
    case 'user':
      return 'Usuário'
    default:
      // Capitalizar a primeira letra para roles customizadas
      return role.charAt(0).toUpperCase() + role.slice(1)
  }
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showAssociationModal, setShowAssociationModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [passwordChangeUser, setPasswordChangeUser] = useState<User | null>(null)
  const [associationUser, setAssociationUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [organizations, setOrganizations] = useState<any[]>([])
  const [userAssociations, setUserAssociations] = useState<any[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedContext, setSelectedContext] = useState('')
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'user',
    department: '',
    phone: '',
    password: '',
    user_type: 'context',
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

  // Buscar roles do banco
  const fetchRoles = async () => {
    try {
      const response = await axios.get('/api/roles')
      if (Array.isArray(response.data)) {
        setRoles(response.data)
        console.log(`Carregados ${response.data.length} perfis disponíveis`)
      }
    } catch (error: any) {
      console.error('Erro ao buscar perfis:', error)
      // Se falhar, usar roles padrão como fallback
      setRoles([
        { id: '1', name: 'admin', display_name: 'Administrador', permissions: {}, is_system: true },
        { id: '2', name: 'analyst', display_name: 'Analista', permissions: {}, is_system: true },
        { id: '3', name: 'user', display_name: 'Usuário', permissions: {}, is_system: true }
      ])
    }
  }

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
    fetchRoles()
    fetchUsers()
    fetchOrganizations()
  }, [])

  // Buscar organizações
  const fetchOrganizations = async () => {
    try {
      const response = await axios.get('/api/organizations')
      setOrganizations(response.data.organizations || [])
    } catch (error) {
      console.error('Erro ao buscar organizações:', error)
    }
  }

  // Buscar associações de um usuário
  const fetchUserAssociations = async (userId: string) => {
    try {
      const response = await axios.get(`/api/user-contexts?user_id=${userId}`)
      setUserAssociations(response.data.associations || [])
    } catch (error) {
      console.error('Erro ao buscar associações:', error)
      setUserAssociations([])
    }
  }

  // Buscar usuários disponíveis para associação
  const fetchAvailableUsers = async (contextId?: string) => {
    try {
      const url = contextId 
        ? `/api/users/available?context_id=${contextId}&exclude_associated=true`
        : '/api/users/available'
      const response = await axios.get(url)
      setAvailableUsers(response.data.users || [])
    } catch (error) {
      console.error('Erro ao buscar usuários disponíveis:', error)
      setAvailableUsers([])
    }
  }

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
        user_type: (user as any).user_type || 'context',
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
      user_type: (user as any).user_type || 'context',
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
      user_type: 'context',
    })
    setShowModal(true)
  }

  const handleOpenAssociationModal = (user: User) => {
    setAssociationUser(user)
    fetchUserAssociations(user.id)
    setShowAssociationModal(true)
  }

  const handleAssociateUser = async () => {
    if (!selectedContext || !associationUser) {
      toast.error('Selecione uma organização/departamento')
      return
    }

    try {
      await axios.post('/api/user-contexts', {
        user_id: associationUser.id,
        context_id: selectedContext
      })
      
      toast.success('Usuário associado com sucesso!')
      fetchUserAssociations(associationUser.id)
      setSelectedContext('')
    } catch (error: any) {
      console.error('Erro ao associar usuário:', error)
      toast.error(error.response?.data?.error || 'Erro ao associar usuário')
    }
  }

  const handleRemoveAssociation = async (contextId: string) => {
    if (!associationUser) return

    if (!confirm('Tem certeza que deseja remover esta associação?')) {
      return
    }

    try {
      await axios.delete(`/api/user-contexts?user_id=${associationUser.id}&context_id=${contextId}`)
      toast.success('Associação removida com sucesso!')
      fetchUserAssociations(associationUser.id)
    } catch (error: any) {
      console.error('Erro ao remover associação:', error)
      toast.error(error.response?.data?.error || 'Erro ao remover associação')
    }
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
        user_type: 'context',
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
            {roles.map(role => (
              <option key={role.id} value={role.name}>
                {role.display_name}
              </option>
            ))}
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

      {/* Mobile Cards View - Visible on small screens */}
      <div className="block md:hidden space-y-3">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{user.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                user.is_active
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
              }`}>
                {user.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className={`px-2 py-1 rounded-full text-xs ${getRoleBadgeColor(user.role)}`}>
                {getRoleLabel(user.role, roles)}
              </span>
              
              {session?.user?.role === 'admin' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {user.email !== 'admin@example.com' && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View - Hidden on small screens */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                  Tipo
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
                    <RoleBadge role={user.role} roles={roles} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <OrganizationBadge 
                      userType={(user as any).user_type} 
                      contextName={(user as any).context_name}
                      contextType={(user as any).context_type}
                    />
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
                        onClick={() => handleOpenAssociationModal(user)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="Gerenciar Associações"
                      >
                        <Link2 className="h-4 w-4" />
                      </button>
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
                  {roles.length > 0 ? (
                    roles.map(role => (
                      <option key={role.id} value={role.name}>
                        {role.display_name}
                      </option>
                    ))
                  ) : (
                    // Fallback caso as roles não tenham sido carregadas
                    <>
                      <option value="user">Usuário</option>
                      <option value="analyst">Analista</option>
                      <option value="admin">Administrador</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Usuário *
                </label>
                <select
                  value={formData.user_type}
                  onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="context">👤 Usuário Padrão</option>
                  <option value="matrix">🏢 Administrador Multi-Organização</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formData.user_type === 'context' 
                    ? '👤 Acessa apenas uma organização/departamento específico' 
                    : '🏢 Pode acessar múltiplas organizações e departamentos'
                  }
                </p>
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

      {/* Modal de Gerenciar Associações */}
      {showAssociationModal && associationUser && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAssociationModal(false)
              setAssociationUser(null)
              setUserAssociations([])
              setSelectedContext('')
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl shadow-2xl"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Gerenciar Associações - {associationUser.name}
              </h2>
              <button
                onClick={() => {
                  setShowAssociationModal(false)
                  setAssociationUser(null)
                  setUserAssociations([])
                  setSelectedContext('')
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Associações Atuais */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Associações Atuais
                </h3>
                {userAssociations.length > 0 ? (
                  <div className="space-y-2">
                    {userAssociations.map((association) => (
                      <div key={association.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            association.contexts.type === 'organization' 
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                          }`}>
                            <Building className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {association.contexts.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {association.contexts.type === 'organization' ? 'Cliente' : 'Departamento'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAssociation(association.context_id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Remover associação"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma associação encontrada</p>
                  </div>
                )}
              </div>

              {/* Adicionar Nova Associação */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Adicionar Nova Associação
                </h3>
                <div className="flex gap-3">
                  <select
                    value={selectedContext}
                    onChange={(e) => setSelectedContext(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma organização/departamento</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.type === 'organization' ? 'Cliente' : 'Departamento'})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssociateUser}
                    disabled={!selectedContext}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Link2 className="h-4 w-4" />
                    Associar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}