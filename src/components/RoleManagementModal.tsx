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
  Database,
  Info
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
    tickets_create_internal: boolean // Criar tickets internos
    tickets_edit_own: boolean
    tickets_edit_all: boolean
    tickets_delete: boolean
    tickets_assign: boolean
    tickets_close: boolean
    tickets_change_priority: boolean
    tickets_change_status: boolean // Alterar status
    tickets_view_internal: boolean // Ver tickets internos
    tickets_export: boolean // Exportar tickets
    tickets_bulk_actions: boolean // Ações em massa
    
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
    
    // Organizations/Contexts
    organizations_view: boolean
    organizations_create: boolean
    organizations_edit: boolean
    organizations_delete: boolean
    contexts_manage: boolean
    
    // SLA
    sla_view: boolean
    sla_create: boolean
    sla_edit: boolean
    sla_delete: boolean
    sla_override: boolean // Quebrar/ignorar SLA manualmente
    
    // Satisfaction
    satisfaction_view_results: boolean
    satisfaction_create_survey: boolean
    satisfaction_edit_survey: boolean
    satisfaction_delete_survey: boolean
    satisfaction_export_data: boolean
    
    // Comments
    comments_view_all: boolean
    comments_edit_any: boolean
    comments_delete_any: boolean
    comments_moderate: boolean
    
    // Reports
    reports_view: boolean
    reports_export: boolean
    reports_create_custom: boolean
    reports_schedule: boolean // Agendar relatórios automáticos
    
    // API/Integrations
    api_access: boolean
    api_create_token: boolean
    api_revoke_token: boolean
    integrations_manage: boolean
    webhooks_manage: boolean
    
    // Notifications
    notifications_manage_global: boolean
    notifications_send_broadcast: boolean
    
    // System
    system_settings: boolean
    system_users: boolean
    system_roles: boolean
    system_backup: boolean
    system_logs: boolean
    system_audit_view: boolean // Ver logs de auditoria
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
  // Tickets
  tickets_view: false,
  tickets_create: false,
  tickets_create_internal: false,
  tickets_edit_own: false,
  tickets_edit_all: false,
  tickets_delete: false,
  tickets_assign: false,
  tickets_close: false,
  tickets_change_priority: false,
  tickets_change_status: false,
  tickets_view_internal: false,
  tickets_export: false,
  tickets_bulk_actions: false,
  
  // Knowledge Base
  kb_view: false,
  kb_create: false,
  kb_edit: false,
  kb_delete: false,
  kb_manage_categories: false,
  
  // Timesheets
  timesheets_view_own: false,
  timesheets_view_all: false,
  timesheets_create: false,
  timesheets_edit_own: false,
  timesheets_edit_all: false,
  timesheets_approve: false,
  timesheets_analytics: false,
  timesheets_analytics_full: false,
  
  // Organizations/Contexts
  organizations_view: false,
  organizations_create: false,
  organizations_edit: false,
  organizations_delete: false,
  contexts_manage: false,
  
  // SLA
  sla_view: false,
  sla_create: false,
  sla_edit: false,
  sla_delete: false,
  sla_override: false,
  
  // Satisfaction
  satisfaction_view_results: false,
  satisfaction_create_survey: false,
  satisfaction_edit_survey: false,
  satisfaction_delete_survey: false,
  satisfaction_export_data: false,
  
  // Comments
  comments_view_all: false,
  comments_edit_any: false,
  comments_delete_any: false,
  comments_moderate: false,
  
  // Reports
  reports_view: false,
  reports_export: false,
  reports_create_custom: false,
  reports_schedule: false,
  
  // API/Integrations
  api_access: false,
  api_create_token: false,
  api_revoke_token: false,
  integrations_manage: false,
  webhooks_manage: false,
  
  // Notifications
  notifications_manage_global: false,
  notifications_send_broadcast: false,
  
  // System
  system_settings: false,
  system_users: false,
  system_roles: false,
  system_backup: false,
  system_logs: false,
  system_audit_view: false
}

// Permissões padrão para os roles existentes
const systemRolesPermissions = {
  admin: {
    ...defaultPermissions,
    // Tickets - FULL ACCESS
    tickets_view: true,
    tickets_create: true,
    tickets_create_internal: true,
    tickets_edit_own: true,
    tickets_edit_all: true,
    tickets_delete: true,
    tickets_assign: true,
    tickets_close: true,
    tickets_change_priority: true,
    tickets_change_status: true,
    tickets_view_internal: true,
    tickets_export: true,
    tickets_bulk_actions: true,
    
    // KB - FULL ACCESS
    kb_view: true,
    kb_create: true,
    kb_edit: true,
    kb_delete: true,
    kb_manage_categories: true,
    
    // Timesheets - FULL ACCESS
    timesheets_view_own: true,
    timesheets_view_all: true,
    timesheets_create: true,
    timesheets_edit_own: true,
    timesheets_edit_all: true,
    timesheets_approve: true,
    timesheets_analytics: true,
    timesheets_analytics_full: true,
    
    // Organizations - FULL ACCESS
    organizations_view: true,
    organizations_create: true,
    organizations_edit: true,
    organizations_delete: true,
    contexts_manage: true,
    
    // SLA - FULL ACCESS
    sla_view: true,
    sla_create: true,
    sla_edit: true,
    sla_delete: true,
    sla_override: true,
    
    // Satisfaction - FULL ACCESS
    satisfaction_view_results: true,
    satisfaction_create_survey: true,
    satisfaction_edit_survey: true,
    satisfaction_delete_survey: true,
    satisfaction_export_data: true,
    
    // Comments - FULL ACCESS
    comments_view_all: true,
    comments_edit_any: true,
    comments_delete_any: true,
    comments_moderate: true,
    
    // Reports - FULL ACCESS
    reports_view: true,
    reports_export: true,
    reports_create_custom: true,
    reports_schedule: true,
    
    // API/Integrations - FULL ACCESS
    api_access: true,
    api_create_token: true,
    api_revoke_token: true,
    integrations_manage: true,
    webhooks_manage: true,
    
    // Notifications - FULL ACCESS
    notifications_manage_global: true,
    notifications_send_broadcast: true,
    
    // System - FULL ACCESS
    system_settings: true,
    system_users: true,
    system_roles: true,
    system_backup: true,
    system_logs: true,
    system_audit_view: true
  },
  developer: {
    ...defaultPermissions,
    // Tickets - ADVANCED ACCESS
    tickets_view: true,
    tickets_create: true,
    tickets_create_internal: true,
    tickets_edit_own: true,
    tickets_edit_all: true,
    tickets_delete: false,
    tickets_assign: true,
    tickets_close: true,
    tickets_change_priority: true,
    tickets_change_status: true,
    tickets_view_internal: true,
    tickets_export: true,
    tickets_bulk_actions: false,
    
    // KB - ADVANCED ACCESS
    kb_view: true,
    kb_create: true,
    kb_edit: true,
    kb_delete: false,
    kb_manage_categories: false,
    
    // Timesheets
    timesheets_view_own: true,
    timesheets_view_all: true,
    timesheets_create: true,
    timesheets_edit_own: true,
    timesheets_edit_all: false,
    timesheets_approve: false,
    timesheets_analytics: true,
    timesheets_analytics_full: false,
    
    // Organizations - VIEW ONLY
    organizations_view: true,
    organizations_create: false,
    organizations_edit: false,
    organizations_delete: false,
    contexts_manage: false,
    
    // SLA - VIEW ONLY
    sla_view: true,
    sla_create: false,
    sla_edit: false,
    sla_delete: false,
    sla_override: false,
    
    // Satisfaction - VIEW ONLY
    satisfaction_view_results: true,
    satisfaction_create_survey: false,
    satisfaction_edit_survey: false,
    satisfaction_delete_survey: false,
    satisfaction_export_data: false,
    
    // Comments - MODERATE
    comments_view_all: true,
    comments_edit_any: false,
    comments_delete_any: false,
    comments_moderate: true,
    
    // Reports - VIEW & EXPORT
    reports_view: true,
    reports_export: true,
    reports_create_custom: false,
    reports_schedule: false,
    
    // API - NO ACCESS
    api_access: false,
    api_create_token: false,
    api_revoke_token: false,
    integrations_manage: false,
    webhooks_manage: false,
    
    // Notifications - NO ACCESS
    notifications_manage_global: false,
    notifications_send_broadcast: false,
    
    // System - NO ACCESS
    system_settings: false,
    system_users: false,
    system_roles: false,
    system_backup: false,
    system_logs: false,
    system_audit_view: false
  },
  analyst: {
    ...defaultPermissions,
    // Tickets - MANAGEMENT ACCESS
    tickets_view: true,
    tickets_create: true,
    tickets_create_internal: true,
    tickets_edit_own: true,
    tickets_edit_all: true,
    tickets_delete: false,
    tickets_assign: true,
    tickets_close: true,
    tickets_change_priority: true,
    tickets_change_status: true,
    tickets_view_internal: true,
    tickets_export: true,
    tickets_bulk_actions: true,
    
    // KB - MANAGEMENT ACCESS
    kb_view: true,
    kb_create: true,
    kb_edit: true,
    kb_delete: false,
    kb_manage_categories: true,
    
    // Timesheets - MANAGEMENT ACCESS
    timesheets_view_own: true,
    timesheets_view_all: true,
    timesheets_create: true,
    timesheets_edit_own: true,
    timesheets_edit_all: false,
    timesheets_approve: true,
    timesheets_analytics: true,
    timesheets_analytics_full: false,
    
    // Organizations - VIEW ONLY
    organizations_view: true,
    organizations_create: false,
    organizations_edit: false,
    organizations_delete: false,
    contexts_manage: false,
    
    // SLA - MANAGEMENT ACCESS
    sla_view: true,
    sla_create: true,
    sla_edit: true,
    sla_delete: false,
    sla_override: false,
    
    // Satisfaction - MANAGEMENT ACCESS
    satisfaction_view_results: true,
    satisfaction_create_survey: true,
    satisfaction_edit_survey: true,
    satisfaction_delete_survey: false,
    satisfaction_export_data: true,
    
    // Comments - MODERATE
    comments_view_all: true,
    comments_edit_any: false,
    comments_delete_any: true,
    comments_moderate: true,
    
    // Reports - MANAGEMENT ACCESS
    reports_view: true,
    reports_export: true,
    reports_create_custom: true,
    reports_schedule: false,
    
    // API - NO ACCESS
    api_access: false,
    api_create_token: false,
    api_revoke_token: false,
    integrations_manage: false,
    webhooks_manage: false,
    
    // Notifications - BROADCAST
    notifications_manage_global: false,
    notifications_send_broadcast: true,
    
    // System - NO ACCESS
    system_settings: false,
    system_users: false,
    system_roles: false,
    system_backup: false,
    system_logs: false,
    system_audit_view: false
  },
  user: {
    ...defaultPermissions,
    // Tickets - BASIC ACCESS
    tickets_view: true,
    tickets_create: true,
    tickets_create_internal: false,
    tickets_edit_own: true,
    tickets_edit_all: false,
    tickets_delete: false,
    tickets_assign: false,
    tickets_close: false,
    tickets_change_priority: false,
    tickets_change_status: false,
    tickets_view_internal: false,
    tickets_export: false,
    tickets_bulk_actions: false,
    
    // KB - VIEW ONLY
    kb_view: true,
    kb_create: false,
    kb_edit: false,
    kb_delete: false,
    kb_manage_categories: false,
    
    // Timesheets - BASIC ACCESS
    timesheets_view_own: true,
    timesheets_view_all: false,
    timesheets_create: true,
    timesheets_edit_own: true,
    timesheets_edit_all: false,
    timesheets_approve: false,
    timesheets_analytics: false,
    timesheets_analytics_full: false,
    
    // Organizations - NO ACCESS
    organizations_view: false,
    organizations_create: false,
    organizations_edit: false,
    organizations_delete: false,
    contexts_manage: false,
    
    // SLA - NO ACCESS
    sla_view: false,
    sla_create: false,
    sla_edit: false,
    sla_delete: false,
    sla_override: false,
    
    // Satisfaction - VIEW ONLY (own)
    satisfaction_view_results: false,
    satisfaction_create_survey: false,
    satisfaction_edit_survey: false,
    satisfaction_delete_survey: false,
    satisfaction_export_data: false,
    
    // Comments - VIEW OWN
    comments_view_all: false,
    comments_edit_any: false,
    comments_delete_any: false,
    comments_moderate: false,
    
    // Reports - NO ACCESS
    reports_view: false,
    reports_export: false,
    reports_create_custom: false,
    reports_schedule: false,
    
    // API - NO ACCESS
    api_access: false,
    api_create_token: false,
    api_revoke_token: false,
    integrations_manage: false,
    webhooks_manage: false,
    
    // Notifications - NO ACCESS
    notifications_manage_global: false,
    notifications_send_broadcast: false,
    
    // System - NO ACCESS
    system_settings: false,
    system_users: false,
    system_roles: false,
    system_backup: false,
    system_logs: false,
    system_audit_view: false
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

  // Função para migrar perfis existentes com novas permissões (V2.0)
  const migrateRolesPermissions = (roles: Role[]): Role[] => {
    return roles.map(role => {
      // Pegar permissões padrão do perfil do sistema correspondente
      const systemPermissions = systemRolesPermissions[role.name as keyof typeof systemRolesPermissions] || systemRolesPermissions.user
      
      // Mesclar permissões existentes com novas permissões padrão
      const updatedPermissions = { ...defaultPermissions } // Começar com todas como false
      
      // Copiar permissões existentes do perfil
      Object.keys(role.permissions).forEach(key => {
        if (role.permissions[key as keyof typeof role.permissions] !== undefined) {
          updatedPermissions[key as keyof typeof updatedPermissions] = role.permissions[key as keyof typeof role.permissions]
        }
      })
      
      // Adicionar NOVAS permissões baseado no tipo de perfil
      // Apenas adiciona se ainda não existir
      Object.keys(systemPermissions).forEach(key => {
        if (updatedPermissions[key as keyof typeof updatedPermissions] === undefined || 
            updatedPermissions[key as keyof typeof updatedPermissions] === false) {
          // Usar valor padrão do sistema apenas para novas permissões
          updatedPermissions[key as keyof typeof updatedPermissions] = systemPermissions[key as keyof typeof systemPermissions]
        }
      })
      
      return {
        ...role,
        permissions: updatedPermissions
      }
    })
  }

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/roles')
      
      if (!response.data || response.data.length === 0) {
        console.error('[ROLES] ❌ ERRO: API retornou dados vazios!')
        toast.error('Nenhum perfil encontrado no banco de dados. Configure os perfis no Supabase.')
        setRoles([])
        return
      }
      
      // Aplicar migration automática para TODAS as novas permissões
      const migratedRoles = migrateRolesPermissions(response.data)
      
      console.log('[ROLES] ✅ Perfis carregados do BANCO:', {
        total: migratedRoles.length,
        roles: migratedRoles.map(r => r.name)
      })
      
      setRoles(migratedRoles)
    } catch (error: any) {
      console.error('[ROLES] ❌ ERRO CRÍTICO ao buscar perfis:', error)
      console.error('[ROLES] Detalhes:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      })
      
      // NÃO usar dados mockados! Mostrar erro real
      toast.error(`ERRO: Não foi possível carregar perfis do banco. ${error.message}`)
      setRoles([])
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRole = async (role: Role) => {
    try {
      setSaving(true)
      console.log('[ROLES] Salvando perfil:', role.name, role.id)
      
      const response = await apiClient.put(`/api/roles/${role.id}`, role)
      
      if (response.status === 200) {
        console.log('[ROLES] ✅ Perfil salvo no banco')
        toast.success('Perfil atualizado com sucesso!')
        setEditingRole(null)
        fetchRoles() // Recarregar do banco
      }
    } catch (error: any) {
      console.error('[ROLES] ❌ ERRO ao salvar perfil:', error)
      console.error('[ROLES] Detalhes:', {
        roleId: role.id,
        roleName: role.name,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      
      // NÃO salvar localmente! Mostrar erro real
      toast.error(`ERRO ao salvar perfil: ${error.response?.data?.error || error.message}`)
      // Manter modal aberto para usuário tentar novamente
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
      toast.error('Erro ao criar perfil. O perfil foi salvo localmente.')
      
      // Criar localmente
      const localRole: Role = {
        id: Date.now().toString(),
        name: newRole.name!.toLowerCase().replace(/\s+/g, '_'),
        display_name: newRole.display_name!,
        description: newRole.description || '',
        permissions: newRole.permissions!,
        is_system: false,
        // created_at gerenciado automaticamente pelo Supabase
        // updated_at gerenciado automaticamente pelo Supabase
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
      console.log('[ROLES] Deletando perfil:', roleId)
      
      const response = await apiClient.delete(`/api/roles/${roleId}`)
      
      if (response.status === 200) {
        console.log('[ROLES] ✅ Perfil deletado no banco')
        toast.success('Perfil excluído com sucesso!')
        fetchRoles() // Recarregar do banco
      }
    } catch (error: any) {
      console.error('[ROLES] ❌ ERRO ao deletar perfil:', error)
      console.error('[ROLES] Detalhes:', {
        roleId,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      
      // NÃO fazer nada localmente! Mostrar erro real
      toast.error(`ERRO ao deletar perfil: ${error.response?.data?.error || error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleApplyMigration = async () => {
    if (!confirm('Aplicar migration de permissões para TODOS os perfis no banco de dados?\n\nIsso irá:\n✅ Adicionar as 48 novas permissões\n✅ Manter permissões existentes\n✅ Aplicar valores padrão baseados no tipo de perfil')) {
      return
    }

    try {
      setSaving(true)
      let successCount = 0
      let errorCount = 0
      
      // Aplicar migration em cada perfil
      for (const role of roles) {
        try {
          const response = await apiClient.put(`/api/roles/${role.id}`, role)
          if (response.status === 200) {
            successCount++
          }
        } catch (error) {
          errorCount++
          console.error(`Erro ao migrar perfil ${role.name}:`, error)
        }
      }
      
      if (successCount > 0) {
        toast.success(`Migration aplicada com sucesso! ${successCount} perfis atualizados.`)
        
        // Limpar cache automaticamente
        try {
          await apiClient.post('/api/admin/clear-cache')
          toast.success('Cache limpo! Faça logout e login para aplicar as mudanças.')
        } catch (error) {
          toast.error('Erro ao limpar cache. Limpe manualmente.')
        }
        
        fetchRoles()
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} perfis falharam ao atualizar. Verifique o console.`)
      }
    } catch (error: any) {
      toast.error('Erro ao aplicar migration')
      console.error('[MIGRATION ERROR]', error)
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
      tickets_create_internal: 'Criar Tickets Internos',
      tickets_edit_own: 'Editar Próprios Tickets',
      tickets_edit_all: 'Editar Todos os Tickets',
      tickets_delete: 'Excluir Tickets',
      tickets_assign: 'Atribuir Tickets',
      tickets_close: 'Fechar Tickets',
      tickets_change_priority: 'Alterar Criticidade',
      tickets_change_status: 'Alterar Status',
      tickets_view_internal: 'Ver Tickets Internos',
      tickets_export: 'Exportar Tickets',
      tickets_bulk_actions: 'Ações em Massa',
      
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
      
      // Organizations
      organizations_view: 'Visualizar Organizações',
      organizations_create: 'Criar Organizações',
      organizations_edit: 'Editar Organizações',
      organizations_delete: 'Excluir Organizações',
      contexts_manage: 'Gerenciar Contextos',
      
      // SLA
      sla_view: 'Visualizar SLA',
      sla_create: 'Criar SLA',
      sla_edit: 'Editar SLA',
      sla_delete: 'Excluir SLA',
      sla_override: 'Quebrar SLA',
      
      // Satisfaction
      satisfaction_view_results: 'Ver Resultados de Satisfação',
      satisfaction_create_survey: 'Criar Pesquisas',
      satisfaction_edit_survey: 'Editar Pesquisas',
      satisfaction_delete_survey: 'Excluir Pesquisas',
      satisfaction_export_data: 'Exportar Dados',
      
      // Comments
      comments_view_all: 'Ver Todos os Comentários',
      comments_edit_any: 'Editar Qualquer Comentário',
      comments_delete_any: 'Excluir Qualquer Comentário',
      comments_moderate: 'Moderar Comentários',
      
      // Reports
      reports_view: 'Visualizar Relatórios',
      reports_export: 'Exportar Relatórios',
      reports_create_custom: 'Criar Relatórios Personalizados',
      reports_schedule: 'Agendar Relatórios',
      
      // API/Integrations
      api_access: 'Acesso à API',
      api_create_token: 'Criar Tokens de API',
      api_revoke_token: 'Revogar Tokens',
      integrations_manage: 'Gerenciar Integrações',
      webhooks_manage: 'Gerenciar Webhooks',
      
      // Notifications
      notifications_manage_global: 'Gerenciar Notificações Globais',
      notifications_send_broadcast: 'Enviar Notificações em Massa',
      
      // System
      system_settings: 'Configurações do Sistema',
      system_users: 'Gerenciar Usuários',
      system_roles: 'Gerenciar Perfis',
      system_backup: 'Backup e Restauração',
      system_logs: 'Visualizar Logs',
      system_audit_view: 'Ver Logs de Auditoria'
    }
    
    return labels[permission] || permission
  }

  const getPermissionTooltip = (permission: string) => {
    const tooltips: Record<string, string> = {
      // Tickets
      tickets_view: 'Permite visualizar todos os tickets do sistema',
      tickets_create: 'Permite criar novos tickets',
      tickets_create_internal: 'Permite criar tickets internos (visíveis apenas para equipe interna)',
      tickets_edit_own: 'Permite editar apenas tickets criados pelo próprio usuário',
      tickets_edit_all: 'Permite editar todos os tickets do sistema',
      tickets_delete: 'Permite excluir tickets permanentemente',
      tickets_assign: 'Permite atribuir ou alterar o responsável por tickets',
      tickets_close: 'Permite fechar tickets resolvidos',
      tickets_change_priority: 'Permite alterar a criticidade (prioridade) de tickets',
      tickets_change_status: 'Permite alterar o status de tickets (aberto, em andamento, etc)',
      tickets_view_internal: 'Permite visualizar tickets marcados como internos',
      tickets_export: 'Permite exportar listagem de tickets (Excel, CSV, PDF)',
      tickets_bulk_actions: 'Permite executar ações em múltiplos tickets simultaneamente',
      
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
      
      // Organizations
      organizations_view: 'Permite visualizar organizações e suas informações',
      organizations_create: 'Permite criar novas organizações/clientes',
      organizations_edit: 'Permite editar informações de organizações',
      organizations_delete: 'Permite excluir organizações do sistema',
      contexts_manage: 'Permite gerenciar contextos e associações de usuários',
      
      // SLA
      sla_view: 'Permite visualizar políticas de SLA configuradas',
      sla_create: 'Permite criar novas políticas de SLA',
      sla_edit: 'Permite editar políticas de SLA existentes',
      sla_delete: 'Permite excluir políticas de SLA',
      sla_override: 'Permite quebrar/ignorar SLA em casos excepcionais',
      
      // Satisfaction
      satisfaction_view_results: 'Permite visualizar resultados de pesquisas de satisfação',
      satisfaction_create_survey: 'Permite criar novas pesquisas de satisfação',
      satisfaction_edit_survey: 'Permite editar pesquisas existentes',
      satisfaction_delete_survey: 'Permite excluir pesquisas de satisfação',
      satisfaction_export_data: 'Permite exportar dados e resultados das pesquisas',
      
      // Comments
      comments_view_all: 'Permite visualizar comentários de todos os tickets',
      comments_edit_any: 'Permite editar comentários de qualquer usuário',
      comments_delete_any: 'Permite excluir comentários de qualquer usuário',
      comments_moderate: 'Permite moderar comentários (aprovar, reprovar, marcar spam)',
      
      // Reports
      reports_view: 'Permite visualizar relatórios disponíveis',
      reports_export: 'Permite exportar relatórios (Excel, PDF, CSV)',
      reports_create_custom: 'Permite criar relatórios personalizados',
      reports_schedule: 'Permite agendar envio automático de relatórios',
      
      // API/Integrations
      api_access: 'Permite acesso às APIs do sistema',
      api_create_token: 'Permite criar tokens de API para integrações',
      api_revoke_token: 'Permite revogar tokens de API existentes',
      integrations_manage: 'Permite gerenciar integrações com sistemas externos',
      webhooks_manage: 'Permite criar e gerenciar webhooks',
      
      // Notifications
      notifications_manage_global: 'Permite gerenciar configurações globais de notificações',
      notifications_send_broadcast: 'Permite enviar notificações em massa para múltiplos usuários',
      
      // System
      system_settings: 'Permite configurar parâmetros gerais do sistema',
      system_users: 'Permite criar, editar e desativar usuários',
      system_roles: 'Permite gerenciar perfis e suas permissões',
      system_backup: 'Permite fazer backup e restaurar dados do sistema',
      system_logs: 'Permite visualizar logs do sistema',
      system_audit_view: 'Permite visualizar logs de auditoria detalhados'
    }
    
    return tooltips[permission] || 'Sem descrição disponível'
  }

  const groupPermissions = (permissions: Role['permissions']) => {
    const groups = {
      'Tickets': [] as string[],
      'Base de Conhecimento': [] as string[],
      'Apontamentos': [] as string[],
      'Organizações': [] as string[],
      'SLA': [] as string[],
      'Satisfação': [] as string[],
      'Comentários': [] as string[],
      'Relatórios': [] as string[],
      'API/Integrações': [] as string[],
      'Notificações': [] as string[],
      'Sistema': [] as string[]
    }
    
    Object.keys(permissions).forEach(perm => {
      if (perm.startsWith('tickets_')) groups['Tickets'].push(perm)
      else if (perm.startsWith('kb_')) groups['Base de Conhecimento'].push(perm)
      else if (perm.startsWith('timesheets_')) groups['Apontamentos'].push(perm)
      else if (perm.startsWith('organizations_') || perm.startsWith('contexts_')) groups['Organizações'].push(perm)
      else if (perm.startsWith('sla_')) groups['SLA'].push(perm)
      else if (perm.startsWith('satisfaction_')) groups['Satisfação'].push(perm)
      else if (perm.startsWith('comments_')) groups['Comentários'].push(perm)
      else if (perm.startsWith('reports_')) groups['Relatórios'].push(perm)
      else if (perm.startsWith('api_') || perm.startsWith('integrations_') || perm.startsWith('webhooks_')) groups['API/Integrações'].push(perm)
      else if (perm.startsWith('notifications_')) groups['Notificações'].push(perm)
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
          <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
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
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
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
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-colors"
                          >
                            <Plus className="h-5 w-5" />
                            Criar Novo Perfil
                          </button>
                          <button
                            onClick={handleApplyMigration}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-colors disabled:opacity-50"
                            title="Aplicar migration V2.0 (adiciona 48 novas permissões)"
                          >
                            <Shield className="h-5 w-5" />
                            {saving ? 'Migrando...' : 'Migration V2.0'}
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
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-2xl hover:bg-gray-700 transition-colors"
                            title="Limpar cache de permissões"
                          >
                            <Database className="h-5 w-5" />
                            Limpar Cache
                          </button>
                        </div>
                      )}

                      {/* Formulário de criação */}
                      {isCreating && (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 space-y-4">
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
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>

                          {/* Permissões do novo perfil */}
                          <div className="space-y-6">
                            <h5 className="font-medium text-gray-900 dark:text-white">Permissões</h5>
                            {Object.entries(groupPermissions(newRole.permissions!)).map(([group, perms]) => (
                              <div key={group} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
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
                                      <label className="flex items-start gap-2 cursor-pointer p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
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
                                      <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded-2xl p-3 w-64 bottom-full left-0 mb-2 pointer-events-none">
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
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-colors disabled:opacity-50"
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
                              className="px-4 py-2 bg-gray-500 text-white rounded-2xl hover:bg-gray-600 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Lista de perfis existentes */}
                      <div className="space-y-4">
                        {roles.map(role => (
                          <div key={role.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
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
                                      className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-2xl transition-colors"
                                    >
                                      <Save className="h-5 w-5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingRole(null)}
                                      className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-colors"
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
                                      className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-2xl transition-colors"
                                    >
                                      <Edit2 className="h-5 w-5" />
                                    </button>
                                    {!role.is_system && (
                                      <button
                                        onClick={() => handleDeleteRole(role.id)}
                                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-2xl transition-colors"
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
                                  <div key={group} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
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
                                          <label className="flex items-start gap-2 cursor-pointer p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
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
                                          <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded-2xl p-3 w-64 bottom-full left-0 mb-2 pointer-events-none">
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
                                {/* Grid de permissões agrupadas por categoria */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {Object.entries(groupPermissions(role.permissions)).map(([group, perms]) => {
                                    const activePerms = perms.filter(p => role.permissions[p as keyof Role['permissions']])
                                    if (activePerms.length === 0) return null
                                    
                                    return (
                                      <div key={group} className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-3">
                                        <h6 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                                          {group === 'Tickets' && <FileText className="h-3 w-3" />}
                                          {group === 'Base de Conhecimento' && <Eye className="h-3 w-3" />}
                                          {group === 'Apontamentos' && <Clock className="h-3 w-3" />}
                                          {group === 'Sistema' && <Settings className="h-3 w-3" />}
                                          {group}
                                        </h6>
                                        <div className="space-y-1">
                                          {activePerms.map(perm => (
                                            <div key={perm} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                              <Check className="h-3 w-3 text-green-500" />
                                              <span>{getPermissionLabel(perm)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )
                                  })}
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