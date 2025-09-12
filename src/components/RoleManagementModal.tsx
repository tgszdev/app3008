'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Shield, 
  Users, 
  Edit2,
  Check,
  AlertCircle,
  UserCog,
  Key,
  Eye,
  FileText,
  Clock,
  BarChart3,
  Settings,
  Database
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/lib/api-client'

interface Role {
  id: string
  name: string
  display_name: string
  description: string
  permissions: {
    // Tickets
    tickets_view: boolean
    tickets_create: boolean
    tickets_edit_own: boolean
    tickets_edit_all: boolean
    tickets_delete: boolean
    tickets_assign: boolean
    tickets_close: boolean
    
    // Knowledge Base
    kb_view: boolean
    kb_create: boolean
    kb_edit: boolean
    kb_delete: boolean
    kb_manage_categories: boolean
    
    // Timesheets
    timesheets_view_own: boolean
    timesheets_view_all: boolean
    timesheets_create: boolean
    timesheets_edit_own: boolean
    timesheets_edit_all: boolean
    timesheets_approve: boolean
    timesheets_analytics: boolean
    timesheets_analytics_full: boolean // Ver Analytics de todos os colaboradores
    
    // System
    system_settings: boolean
    system_users: boolean
    system_roles: boolean
    system_backup: boolean
    system_logs: boolean
  }
  is_system: boolean // Roles do sistema (admin, analyst, user) não podem ser deletados
  created_at: string
  updated_at: string
}

interface RoleManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

const defaultPermissions = {
  tickets_view: false,
  tickets_create: false,
  tickets_edit_own: false,
  tickets_edit_all: false,
  tickets_delete: false,
  tickets_assign: false,
  tickets_close: false,
  kb_view: false,
  kb_create: false,
  kb_edit: false,
  kb_delete: false,
  kb_manage_categories: false,
  timesheets_view_own: false,
  timesheets_view_all: false,
  timesheets_create: false,
  timesheets_edit_own: false,
  timesheets_edit_all: false,
  timesheets_approve: false,
  timesheets_analytics: false,
  timesheets_analytics_full: false,
  system_settings: false,
  system_users: false,
  system_roles: false,
  system_backup: false,
  system_logs: false
}

// Permissões padrão para os roles existentes
const systemRolesPermissions = {
  admin: {
    ...defaultPermissions,
    tickets_view: true,
    tickets_create: true,
    tickets_edit_own: true,
    tickets_edit_all: true,
    tickets_delete: true,
    tickets_assign: true,
    tickets_close: true,
    kb_view: true,
    kb_create: true,
    kb_edit: true,
    kb_delete: true,
    kb_manage_categories: true,
    timesheets_view_own: true,
    timesheets_view_all: true,
    timesheets_create: true,
    timesheets_edit_own: true,
    timesheets_edit_all: true,
    timesheets_approve: true,
    timesheets_analytics: true,
    timesheets_analytics_full: true, // Admin tem acesso completo por padrão
    system_settings: true,
    system_users: true,
    system_roles: true,
    system_backup: true,
    system_logs: true
  },
  developer: {
    ...defaultPermissions,
    tickets_view: true,
    tickets_create: true,
    tickets_edit_own: true,
    tickets_edit_all: true,
    tickets_delete: false,
    tickets_assign: true, // Desenvolvedor pode atribuir tickets
    tickets_close: true,
    kb_view: true,
    kb_create: true,
    kb_edit: true,
    kb_delete: false,
    kb_manage_categories: false,
    timesheets_view_own: true,
    timesheets_view_all: true,
    timesheets_create: true,
    timesheets_edit_own: true,
    timesheets_edit_all: false,
    timesheets_approve: false,
    timesheets_analytics: true,
    timesheets_analytics_full: false, // Desenvolvedor vê apenas seus próprios dados
    system_settings: false,
    system_users: false,
    system_roles: false,
    system_backup: false,
    system_logs: false
  },
  analyst: {
    ...defaultPermissions,
    tickets_view: true,
    tickets_create: true,
    tickets_edit_own: true,
    tickets_edit_all: true,
    tickets_assign: true,
    tickets_close: true,
    kb_view: true,
    kb_create: true,
    kb_edit: true,
    timesheets_view_own: true,
    timesheets_view_all: true,
    timesheets_create: true,
    timesheets_edit_own: true,
    timesheets_approve: true,
    timesheets_analytics: true, // Analista pode ver analytics (apenas próprio)
    timesheets_analytics_full: false // Analista vê apenas seus próprios dados
  },
  user: {
    ...defaultPermissions,
    tickets_view: true,
    tickets_create: true,
    tickets_edit_own: true,
    kb_view: true,
    timesheets_view_own: true,
    timesheets_create: true,
    timesheets_edit_own: true,
    timesheets_analytics: false, // Usuário NÃO tem acesso ao analytics
    timesheets_analytics_full: false // Usuário não tem acesso completo
  }
}

export default function RoleManagementModal({ isOpen, onClose }: RoleManagementModalProps) {
  if (!isOpen) return null
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newRole, setNewRole] = useState<Partial<Role>>({
    name: '',
    display_name: '',
    description: '',
    permissions: { ...defaultPermissions }
  })

  useEffect(() => {
    if (isOpen) {
      fetchRoles()
    }
  }, [isOpen])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/roles')
      
      // Se a API não existir ainda, criar roles padrão
      if (response.status === 404 || !response.data) {
        const defaultRoles: Role[] = [
          {
            id: '1',
            name: 'admin',
            display_name: 'Administrador',
            description: 'Acesso total ao sistema',
            permissions: systemRolesPermissions.admin,
            is_system: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'developer',
            display_name: 'Desenvolvedor',
            description: 'Desenvolvimento e Correções',
            permissions: systemRolesPermissions.developer,
            is_system: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            name: 'analyst',
            display_name: 'Analista',
            description: 'Pode gerenciar tickets e criar conteúdo',
            permissions: systemRolesPermissions.analyst,
            is_system: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '4',
            name: 'user',
            display_name: 'Usuário',
            description: 'Pode criar tickets e visualizar conteúdo',
            permissions: systemRolesPermissions.user,
            is_system: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
        setRoles(defaultRoles)
      } else {
        // Garantir que todos os perfis tenham a nova permissão
        const rolesWithNewPermission = response.data.map((role: Role) => {
          const updatedPermissions = { ...role.permissions }
          
          // Adicionar timesheets_analytics_full se não existir
          if (updatedPermissions.timesheets_analytics_full === undefined) {
            // Definir valor padrão baseado no tipo de perfil
            if (role.name === 'admin') {
              updatedPermissions.timesheets_analytics_full = true
            } else {
              updatedPermissions.timesheets_analytics_full = false
            }
          }
          
          // Ajustar permissões do user
          if (role.name === 'user') {
            updatedPermissions.timesheets_analytics = false
            updatedPermissions.timesheets_analytics_full = false
          }
          
          // Ajustar permissões do analyst
          if (role.name === 'analyst') {
            updatedPermissions.timesheets_analytics = true
            updatedPermissions.timesheets_analytics_full = false
          }
          
          // Ajustar permissões do developer
          if (role.name === 'developer' || role.name === 'dev') {
            // Garantir que desenvolvedor pode atribuir tickets
            if (updatedPermissions.tickets_assign === undefined) {
              updatedPermissions.tickets_assign = true
            }
            updatedPermissions.timesheets_analytics = true
            updatedPermissions.timesheets_analytics_full = false
          }
          
          return {
            ...role,
            permissions: updatedPermissions
          }
        })
        
        setRoles(rolesWithNewPermission)
      }
    } catch (error: any) {
      console.error('Error fetching roles:', error)
      // Se a API não existir, usar roles padrão com permissões corretas
      const defaultRoles: Role[] = [
        {
          id: '1',
          name: 'admin',
          display_name: 'Administrador',
          description: 'Acesso total ao sistema',
          permissions: systemRolesPermissions.admin,
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'developer',
          display_name: 'Desenvolvedor',
          description: 'Desenvolvimento e Correções',
          permissions: systemRolesPermissions.developer,
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'analyst',
          display_name: 'Analista',
          description: 'Pode gerenciar tickets e criar conteúdo',
          permissions: systemRolesPermissions.analyst,
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'user',
          display_name: 'Usuário',
          description: 'Pode criar tickets e visualizar conteúdo',
          permissions: systemRolesPermissions.user,
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      setRoles(defaultRoles)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRole = async (role: Role) => {
    try {
      setSaving(true)
      const response = await apiClient.put(`/api/roles/${role.id}`, role)
      
      if (response.status === 200) {
        toast.success('Perfil atualizado com sucesso!')
        setEditingRole(null)
        fetchRoles()
      }
    } catch (error: any) {
      console.error('Error saving role:', error)
      toast.error('Erro ao salvar perfil. As alterações foram salvas localmente.')
      
      // Atualizar localmente
      setRoles(prev => prev.map(r => r.id === role.id ? role : r))
      setEditingRole(null)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateRole = async () => {
    if (!newRole.name || !newRole.display_name) {
      toast.error('Nome e nome de exibição são obrigatórios')
      return
    }

    try {
      setSaving(true)
      const roleToCreate = {
        ...newRole,
        name: newRole.name!.toLowerCase().replace(/\s+/g, '_'),
        is_system: false
      }
      
      const response = await apiClient.post('/api/roles', roleToCreate)
      
      if (response.status === 201) {
        toast.success('Perfil criado com sucesso!')
        setIsCreating(false)
        setNewRole({
          name: '',
          display_name: '',
          description: '',
          permissions: { ...defaultPermissions }
        })
        fetchRoles()
      }
    } catch (error: any) {
      console.error('Error creating role:', error)
      toast.error('Erro ao criar perfil. O perfil foi salvo localmente.')
      
      // Criar localmente
      const localRole: Role = {
        id: Date.now().toString(),
        name: newRole.name!.toLowerCase().replace(/\s+/g, '_'),
        display_name: newRole.display_name!,
        description: newRole.description || '',
        permissions: newRole.permissions!,
        is_system: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setRoles(prev => [...prev, localRole])
      setIsCreating(false)
      setNewRole({
        name: '',
        display_name: '',
        description: '',
        permissions: { ...defaultPermissions }
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este perfil?')) {
      return
    }

    try {
      setSaving(true)
      const response = await apiClient.delete(`/api/roles/${roleId}`)
      
      if (response.status === 200) {
        toast.success('Perfil excluído com sucesso!')
        fetchRoles()
      }
    } catch (error: any) {
      console.error('Error deleting role:', error)
      toast.success('Perfil excluído localmente!')
      
      // Excluir localmente
      setRoles(prev => prev.filter(r => r.id !== roleId))
    } finally {
      setSaving(false)
    }
  }

  const togglePermission = (role: Role, permission: keyof Role['permissions']) => {
    const updatedRole = {
      ...role,
      permissions: {
        ...role.permissions,
        [permission]: !role.permissions[permission]
      }
    }
    
    if (editingRole?.id === role.id) {
      setEditingRole(updatedRole)
    }
  }

  const toggleNewRolePermission = (permission: keyof Role['permissions']) => {
    setNewRole(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions!,
        [permission]: !prev.permissions![permission]
      }
    }))
  }

  const getPermissionIcon = (permission: string) => {
    if (permission.startsWith('tickets_')) return <FileText className="h-4 w-4" />
    if (permission.startsWith('kb_')) return <Eye className="h-4 w-4" />
    if (permission.startsWith('timesheets_')) return <Clock className="h-4 w-4" />
    if (permission.startsWith('system_')) return <Settings className="h-4 w-4" />
    return <Key className="h-4 w-4" />
  }

  const getPermissionLabel = (permission: string) => {
    const labels: Record<string, string> = {
      // Tickets
      tickets_view: 'Visualizar Tickets',
      tickets_create: 'Criar Tickets',
      tickets_edit_own: 'Editar Próprios Tickets',
      tickets_edit_all: 'Editar Todos os Tickets',
      tickets_delete: 'Excluir Tickets',
      tickets_assign: 'Atribuir Tickets',
      tickets_close: 'Fechar Tickets',
      
      // Knowledge Base
      kb_view: 'Visualizar Base de Conhecimento',
      kb_create: 'Criar Artigos',
      kb_edit: 'Editar Artigos',
      kb_delete: 'Excluir Artigos',
      kb_manage_categories: 'Gerenciar Categorias',
      
      // Timesheets
      timesheets_view_own: 'Ver Próprios Apontamentos',
      timesheets_view_all: 'Ver Todos os Apontamentos',
      timesheets_create: 'Criar Apontamentos',
      timesheets_edit_own: 'Editar Próprios Apontamentos',
      timesheets_edit_all: 'Editar Todos os Apontamentos',
      timesheets_approve: 'Aprovar Apontamentos',
      timesheets_analytics: 'Ver Analytics',
      timesheets_analytics_full: 'Ver Analytics Completo',
      
      // System
      system_settings: 'Configurações do Sistema',
      system_users: 'Gerenciar Usuários',
      system_roles: 'Gerenciar Perfis',
      system_backup: 'Backup e Restauração',
      system_logs: 'Visualizar Logs'
    }
    
    return labels[permission] || permission
  }

  const getPermissionTooltip = (permission: string) => {
    const tooltips: Record<string, string> = {
      // Tickets
      tickets_view: 'Permite visualizar todos os tickets do sistema',
      tickets_create: 'Permite criar novos tickets',
      tickets_edit_own: 'Permite editar apenas tickets criados pelo próprio usuário',
      tickets_edit_all: 'Permite editar todos os tickets do sistema',
      tickets_delete: 'Permite excluir tickets permanentemente',
      tickets_assign: 'Permite atribuir ou alterar o responsável por tickets',
      tickets_close: 'Permite fechar tickets resolvidos',
      
      // Knowledge Base
      kb_view: 'Permite visualizar artigos da base de conhecimento',
      kb_create: 'Permite criar novos artigos na base de conhecimento',
      kb_edit: 'Permite editar artigos existentes',
      kb_delete: 'Permite excluir artigos da base de conhecimento',
      kb_manage_categories: 'Permite criar, editar e excluir categorias',
      
      // Timesheets
      timesheets_view_own: 'Permite visualizar apenas seus próprios apontamentos',
      timesheets_view_all: 'Permite visualizar apontamentos de todos os colaboradores',
      timesheets_create: 'Permite criar novos apontamentos de horas',
      timesheets_edit_own: 'Permite editar apenas seus próprios apontamentos',
      timesheets_edit_all: 'Permite editar apontamentos de qualquer colaborador',
      timesheets_approve: 'Permite aprovar ou rejeitar apontamentos',
      timesheets_analytics: 'Permite acessar relatórios e análises de apontamentos',
      timesheets_analytics_full: 'Permite ver análises de todos os colaboradores (se desmarcado, vê apenas suas próprias)',
      
      // System
      system_settings: 'Permite configurar parâmetros gerais do sistema',
      system_users: 'Permite criar, editar e desativar usuários',
      system_roles: 'Permite gerenciar perfis e suas permissões',
      system_backup: 'Permite fazer backup e restaurar dados do sistema',
      system_logs: 'Permite visualizar logs de auditoria e sistema'
    }
    
    return tooltips[permission] || 'Sem descrição disponível'
  }

  const groupPermissions = (permissions: Role['permissions']) => {
    const groups = {
      'Tickets': [] as string[],
      'Base de Conhecimento': [] as string[],
      'Apontamentos': [] as string[],
      'Sistema': [] as string[]
    }
    
    Object.keys(permissions).forEach(perm => {
      if (perm.startsWith('tickets_')) groups['Tickets'].push(perm)
      else if (perm.startsWith('kb_')) groups['Base de Conhecimento'].push(perm)
      else if (perm.startsWith('timesheets_')) groups['Apontamentos'].push(perm)
      else if (perm.startsWith('system_')) groups['Sistema'].push(perm)
    })
    
    return groups
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-75 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
                <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 sm:mx-0 sm:h-10 sm:w-10">
                      <UserCog className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                      <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                        Gerenciamento de Perfis (Roles)
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Configure os perfis de usuário e suas permissões no sistema
                        </p>
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>
                              <strong>Dica:</strong> Passe o mouse sobre cada permissão para ver sua descrição detalhada. 
                              As alterações só serão aplicadas após clicar em "Limpar Cache" e o usuário fazer login novamente.
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="ml-auto -mr-2 -mt-2 p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-4">
                      {/* Botões de ação */}
                      {!isCreating && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsCreating(true)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <Plus className="h-5 w-5" />
                            Criar Novo Perfil
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const response = await apiClient.post('/api/admin/clear-cache')
                                if (response.status === 200) {
                                  toast.success('Cache de permissões limpo! Faça logout e login novamente para aplicar as mudanças.')
                                }
                              } catch (error) {
                                toast.error('Erro ao limpar cache')
                              }
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            title="Limpar cache de permissões"
                          >
                            <Database className="h-5 w-5" />
                            Limpar Cache
                          </button>
                        </div>
                      )}

                      {/* Formulário de criação */}
                      {isCreating && (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4">
                          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Novo Perfil
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nome Interno
                              </label>
                              <input
                                type="text"
                                value={newRole.name}
                                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                                placeholder="ex: supervisor"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nome de Exibição
                              </label>
                              <input
                                type="text"
                                value={newRole.display_name}
                                onChange={(e) => setNewRole({ ...newRole, display_name: e.target.value })}
                                placeholder="ex: Supervisor"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Descrição
                              </label>
                              <input
                                type="text"
                                value={newRole.description}
                                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                                placeholder="ex: Supervisiona equipes"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>

                          {/* Permissões do novo perfil */}
                          <div className="space-y-6">
                            <h5 className="font-medium text-gray-900 dark:text-white">Permissões</h5>
                            {Object.entries(groupPermissions(newRole.permissions!)).map(([group, perms]) => (
                              <div key={group} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <h6 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                  {group === 'Tickets' && <FileText className="h-4 w-4" />}
                                  {group === 'Base de Conhecimento' && <Eye className="h-4 w-4" />}
                                  {group === 'Apontamentos' && <Clock className="h-4 w-4" />}
                                  {group === 'Sistema' && <Settings className="h-4 w-4" />}
                                  {group}
                                </h6>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {perms.map(perm => (
                                    <div 
                                      key={perm}
                                      className="relative group"
                                    >
                                      <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <input
                                          type="checkbox"
                                          checked={newRole.permissions![perm as keyof Role['permissions']]}
                                          onChange={() => toggleNewRolePermission(perm as keyof Role['permissions'])}
                                          className="mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                        />
                                        <div className="flex-1">
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                                            {getPermissionLabel(perm)}
                                          </span>
                                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
                                            {getPermissionTooltip(perm).substring(0, 50)}...
                                          </span>
                                        </div>
                                      </label>
                                      
                                      {/* Tooltip completo */}
                                      <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded-lg p-3 w-64 bottom-full left-0 mb-2 pointer-events-none">
                                        <div className="font-semibold mb-1">{getPermissionLabel(perm)}</div>
                                        <div>{getPermissionTooltip(perm)}</div>
                                        <div className="absolute bottom-0 left-6 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={handleCreateRole}
                              disabled={saving}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {saving ? 'Salvando...' : 'Criar Perfil'}
                            </button>
                            <button
                              onClick={() => {
                                setIsCreating(false)
                                setNewRole({
                                  name: '',
                                  display_name: '',
                                  description: '',
                                  permissions: { ...defaultPermissions }
                                })
                              }}
                              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Lista de perfis existentes */}
                      <div className="space-y-4">
                        {roles.map(role => (
                          <div key={role.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                  <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    {role.display_name}
                                    {role.is_system && (
                                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                                        Sistema
                                      </span>
                                    )}
                                  </h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{role.description}</p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    Nome interno: {role.name}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                {editingRole?.id === role.id ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveRole(editingRole)}
                                      disabled={saving}
                                      className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                    >
                                      <Save className="h-5 w-5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingRole(null)}
                                      className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                      <X className="h-5 w-5" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        // Garantir que o perfil tem todas as permissões definidas
                                        const updatedPermissions = { ...role.permissions }
                                        
                                        // Adicionar timesheets_analytics_full se não existir
                                        if (updatedPermissions.timesheets_analytics_full === undefined) {
                                          if (role.name === 'admin') {
                                            updatedPermissions.timesheets_analytics_full = true
                                          } else {
                                            updatedPermissions.timesheets_analytics_full = false
                                          }
                                        }
                                        
                                        // Garantir configurações corretas por perfil
                                        if (role.name === 'user') {
                                          updatedPermissions.timesheets_analytics = false
                                          updatedPermissions.timesheets_analytics_full = false
                                        } else if (role.name === 'analyst') {
                                          updatedPermissions.timesheets_analytics = true
                                          updatedPermissions.timesheets_analytics_full = false
                                        } else if (role.name === 'developer' || role.name === 'dev') {
                                          // Garantir que desenvolvedor tem as permissões corretas
                                          if (updatedPermissions.tickets_assign === undefined) {
                                            updatedPermissions.tickets_assign = true
                                          }
                                          updatedPermissions.timesheets_analytics = true
                                          updatedPermissions.timesheets_analytics_full = false
                                        }
                                        
                                        setEditingRole({
                                          ...role,
                                          permissions: updatedPermissions
                                        })
                                      }}
                                      className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                    >
                                      <Edit2 className="h-5 w-5" />
                                    </button>
                                    {!role.is_system && (
                                      <button
                                        onClick={() => handleDeleteRole(role.id)}
                                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                      >
                                        <Trash2 className="h-5 w-5" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Permissões */}
                            {editingRole?.id === role.id ? (
                              <div className="space-y-6">
                                {Object.entries(groupPermissions(editingRole.permissions)).map(([group, perms]) => (
                                  <div key={group} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                    <h6 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                      {group === 'Tickets' && <FileText className="h-4 w-4" />}
                                      {group === 'Base de Conhecimento' && <Eye className="h-4 w-4" />}
                                      {group === 'Apontamentos' && <Clock className="h-4 w-4" />}
                                      {group === 'Sistema' && <Settings className="h-4 w-4" />}
                                      {group}
                                    </h6>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {perms.map(perm => (
                                        <div 
                                          key={perm}
                                          className="relative group"
                                        >
                                          <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <input
                                              type="checkbox"
                                              checked={editingRole.permissions[perm as keyof Role['permissions']]}
                                              onChange={() => togglePermission(editingRole, perm as keyof Role['permissions'])}
                                              className="mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                              disabled={role.is_system}
                                            />
                                            <div className="flex-1">
                                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                                                {getPermissionLabel(perm)}
                                              </span>
                                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
                                                {getPermissionTooltip(perm).substring(0, 50)}...
                                              </span>
                                            </div>
                                          </label>
                                          
                                          {/* Tooltip completo */}
                                          <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded-lg p-3 w-64 bottom-full left-0 mb-2 pointer-events-none">
                                            <div className="font-semibold mb-1">{getPermissionLabel(perm)}</div>
                                            <div>{getPermissionTooltip(perm)}</div>
                                            <div className="absolute bottom-0 left-6 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-3 mt-4">
                                {/* Mostrar estado do Analytics de forma destacada */}
                                {(role.permissions.timesheets_analytics || role.permissions.timesheets_analytics_full) && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                    <h6 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Analytics de Apontamentos</h6>
                                    <div className="flex flex-wrap gap-2">
                                      {role.permissions.timesheets_analytics && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded text-xs">
                                          <BarChart3 className="h-3 w-3" />
                                          {role.permissions.timesheets_analytics_full ? 'Ver Analytics Completo' : 'Ver Analytics Próprio'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Grid de outras permissões */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {Object.entries(role.permissions)
                                    .filter(([perm, value]) => value && !perm.includes('analytics'))
                                    .map(([perm]) => (
                                      <div key={perm} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        {getPermissionIcon(perm)}
                                        <span>{getPermissionLabel(perm)}</span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto transition-colors"
                    onClick={onClose}
                  >
                    Fechar
                  </button>
                </div>
          </div>
        </div>
      </div>
    </>
  )
}