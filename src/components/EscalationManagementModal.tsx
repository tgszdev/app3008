'use client'

import { useEffect, useState } from 'react'
import { X, Plus, AlertTriangle, CheckCircle2, Trash2, Edit, ToggleLeft, ToggleRight, Clock, Bell, Users, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface EscalationRule {
  id: string
  name: string
  description?: string
  is_active: boolean
  priority: number
  conditions: any
  actions: any
  time_condition: 'unassigned_time' | 'no_response_time' | 'resolution_time' | 'custom_time'
  time_threshold: number
  time_unit: 'minutes' | 'hours' | 'days'
  business_hours_only: boolean
  business_hours_start: string
  business_hours_end: string
  working_days: number[]
  repeat_escalation: boolean
  repeat_interval: number
  max_repeats: number
  created_at: string
  updated_at: string
}

interface EscalationFormData {
  name: string
  description: string
  is_active: boolean
  priority: number
  conditions: any
  actions: any
  time_condition: 'unassigned_time' | 'no_response_time' | 'resolution_time' | 'custom_time'
  time_threshold: number
  time_unit: 'minutes' | 'hours' | 'days'
  business_hours_only: boolean
  business_hours_start: string
  business_hours_end: string
  working_days: number[]
  repeat_escalation: boolean
  repeat_interval: number
  max_repeats: number
}

interface EscalationManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

type Status = {
  id: string
  name: string
  slug: string
  color?: string
  description?: string
  is_default: boolean
  is_final: boolean
  is_internal: boolean
  order_index: number
}

type EscalationAction = {
  id: string
  name: string
  display_name: string
  description?: string
  action_type: string
  is_active: boolean
  requires_config: boolean
  config_schema?: any
}

type User = {
  id: string
  name: string
  email: string
  role: string
}

export default function EscalationManagementModal({ isOpen, onClose }: EscalationManagementModalProps) {
  const [loading, setLoading] = useState(false)
  const [rules, setRules] = useState<EscalationRule[]>([])
  const [editingRule, setEditingRule] = useState<EscalationRule | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [statuses, setStatuses] = useState<Status[]>([])
  const [actions, setActions] = useState<EscalationAction[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedActionConfig, setSelectedActionConfig] = useState<string | null>(null)
  const [form, setForm] = useState<EscalationFormData>({
    name: '',
    description: '',
    is_active: true,
    priority: 1,
    conditions: {},
    actions: {},
    time_condition: 'unassigned_time',
    time_threshold: 60,
    time_unit: 'minutes',
    business_hours_only: true,
    business_hours_start: '08:00',
    business_hours_end: '18:00',
    working_days: [1, 2, 3, 4, 5],
    repeat_escalation: false,
    repeat_interval: 60,
    max_repeats: 3
  })

  useEffect(() => {
    if (isOpen) {
      loadRules()
      loadStatuses()
      loadActions()
      loadUsers()
    }
  }, [isOpen])

  const loadRules = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/escalation')
      const data = await res.json()
      
      if (res.ok) {
        setRules(data || [])
      } else {
        console.error('Erro ao carregar regras de escalação:', data?.error)
        toast.error('Erro ao carregar regras de escalação')
      }
    } catch (error) {
      console.error('Erro ao carregar regras de escalação:', error)
      toast.error('Erro ao carregar regras de escalação')
    } finally {
      setLoading(false)
    }
  }

  const loadStatuses = async () => {
    try {
      const res = await fetch('/api/statuses')
      const data = await res.json()
      if (res.ok) {
        setStatuses(data || [])
      } else {
        console.error('Erro ao carregar status:', data?.error)
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error)
    }
  }

  const loadActions = async () => {
    try {
      const res = await fetch('/api/escalation/actions')
      const data = await res.json()
      if (res.ok) {
        setActions(data || [])
      } else {
        console.error('Erro ao carregar ações:', data?.error)
      }
    } catch (error) {
      console.error('Erro ao carregar ações:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (res.ok) {
        // Filtrar apenas usuários que podem ser notificados (analysts e admins)
        const assignableUsers = data.filter((user: User) => 
          user.role === 'analyst' || user.role === 'admin'
        )
        setUsers(assignableUsers || [])
      } else {
        console.error('Erro ao carregar usuários:', data?.error)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      is_active: true,
      priority: 1,
      conditions: {},
      actions: {},
      time_condition: 'unassigned_time',
      time_threshold: 60,
      time_unit: 'minutes',
      business_hours_only: true,
      business_hours_start: '08:00',
      business_hours_end: '18:00',
      working_days: [1, 2, 3, 4, 5],
      repeat_escalation: false,
      repeat_interval: 60,
      max_repeats: 3
    })
    setEditingRule(null)
    setShowForm(false)
  }

  const updateCondition = (key: string, value: any) => {
    setForm(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [key]: value
      }
    }))
  }

  const updateAction = (key: string, value: any) => {
    setForm(prev => ({
      ...prev,
      actions: {
        ...prev.actions,
        [key]: value
      }
    }))
  }

  const updateActionConfig = (actionName: string, configKey: string, value: any) => {
    setForm(prev => ({
      ...prev,
      actions: {
        ...prev.actions,
        [actionName]: {
          ...prev.actions[actionName],
          [configKey]: value
        }
      }
    }))
  }

  const handleCreate = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/escalation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (res.ok) {
        toast.success('Regra de escalação criada com sucesso!')
        await loadRules()
        resetForm()
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Erro ao criar regra')
      }
    } catch (error) {
      console.error('Erro ao criar regra:', error)
      toast.error('Erro ao criar regra')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingRule) return

    try {
      setLoading(true)
      const res = await fetch(`/api/escalation/${editingRule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (res.ok) {
        toast.success('Regra de escalação atualizada com sucesso!')
        await loadRules()
        resetForm()
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Erro ao atualizar regra')
      }
    } catch (error) {
      console.error('Erro ao atualizar regra:', error)
      toast.error('Erro ao atualizar regra')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (rule: EscalationRule) => {
    if (!confirm(`Tem certeza que deseja deletar a regra "${rule.name}"?`)) return

    try {
      setLoading(true)
      const res = await fetch(`/api/escalation/${rule.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Regra de escalação deletada com sucesso!')
        await loadRules()
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Erro ao deletar regra')
      }
    } catch (error) {
      console.error('Erro ao deletar regra:', error)
      toast.error('Erro ao deletar regra')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (rule: EscalationRule) => {
    try {
      const res = await fetch(`/api/escalation/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !rule.is_active })
      })

      if (res.ok) {
        toast.success(`Regra ${rule.is_active ? 'desativada' : 'ativada'} com sucesso!`)
        await loadRules()
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Erro ao alterar status da regra')
      }
    } catch (error) {
      console.error('Erro ao alterar status da regra:', error)
      toast.error('Erro ao alterar status da regra')
    }
  }

  const startEdit = (rule: EscalationRule) => {
    setEditingRule(rule)
    setForm({
      name: rule.name,
      description: rule.description || '',
      is_active: rule.is_active,
      priority: rule.priority,
      conditions: rule.conditions,
      actions: rule.actions,
      time_condition: rule.time_condition,
      time_threshold: rule.time_threshold,
      time_unit: rule.time_unit,
      business_hours_only: rule.business_hours_only,
      business_hours_start: rule.business_hours_start,
      business_hours_end: rule.business_hours_end,
      working_days: rule.working_days,
      repeat_escalation: rule.repeat_escalation,
      repeat_interval: rule.repeat_interval,
      max_repeats: rule.max_repeats
    })
    setShowForm(true)
  }

  const getTimeConditionLabel = (condition: string) => {
    const labels = {
      'unassigned_time': 'Tempo sem atribuição',
      'no_response_time': 'Tempo sem resposta',
      'resolution_time': 'Tempo de resolução',
      'custom_time': 'Tempo personalizado'
    }
    return labels[condition as keyof typeof labels] || condition
  }

  const getActionLabel = (action: string) => {
    const labels = {
      'notify_supervisor': 'Notificar supervisor',
      'escalate_to_management': 'Escalar para gerência',
      'increase_priority': 'Aumentar prioridade',
      'auto_assign': 'Atribuir automaticamente',
      'add_comment': 'Adicionar comentário'
    }
    return labels[action as keyof typeof labels] || action
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Gerenciar Escalação por Tempo
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure regras automáticas de escalação baseadas em tempo
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Lista de Regras */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Regras de Escalação
                </h3>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Carregando...</p>
                </div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Nenhuma regra de escalação configurada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {rule.name}
                            </h4>
                            {rule.is_active ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {rule.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getTimeConditionLabel(rule.time_condition)}
                            </span>
                            <span>
                              {rule.time_threshold} {rule.time_unit}
                            </span>
                            <span>
                              Prioridade: {rule.priority}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <button
                            onClick={() => handleToggleActive(rule)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title={rule.is_active ? 'Desativar' : 'Ativar'}
                          >
                            {rule.is_active ? (
                              <ToggleRight className="h-4 w-4 text-green-500" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={() => startEdit(rule)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rule)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Deletar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Formulário */}
          <div className="w-1/2 overflow-y-auto">
            {showForm ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {editingRule ? 'Editar Regra' : 'Nova Regra de Escalação'}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Informações Básicas</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome da Regra *
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: Escalação - 1h sem atribuição"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Descrição
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Descreva o que esta regra faz..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Prioridade
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={form.priority}
                          onChange={(e) => setForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Ativa</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Configuração de Tempo */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Configuração de Tempo</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Condição de Tempo *
                      </label>
                      <select
                        value={form.time_condition}
                        onChange={(e) => setForm(prev => ({ ...prev, time_condition: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="unassigned_time">Tempo sem atribuição</option>
                        <option value="no_response_time">Tempo sem resposta</option>
                        <option value="resolution_time">Tempo de resolução</option>
                        <option value="custom_time">Tempo personalizado</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Limite de Tempo *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={form.time_threshold}
                          onChange={(e) => setForm(prev => ({ ...prev, time_threshold: parseInt(e.target.value) || 1 }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Unidade
                        </label>
                        <select
                          value={form.time_unit}
                          onChange={(e) => setForm(prev => ({ ...prev, time_unit: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="minutes">Minutos</option>
                          <option value="hours">Horas</option>
                          <option value="days">Dias</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Condições */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Condições</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status do Ticket
                      </label>
                      <select
                        value={form.conditions.status || ''}
                        onChange={(e) => updateCondition('status', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Qualquer status</option>
                        {statuses.map(status => (
                          <option key={status.id} value={status.slug}>
                            {status.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Prioridade
                      </label>
                      <select
                        value={form.conditions.priority || ''}
                        onChange={(e) => updateCondition('priority', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Qualquer prioridade</option>
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                        <option value="critical">Crítica</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Atribuição
                      </label>
                      <select
                        value={form.conditions.assigned_to === null ? 'null' : (form.conditions.assigned_to || '')}
                        onChange={(e) => updateCondition('assigned_to', e.target.value === 'null' ? null : (e.target.value || undefined))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Qualquer atribuição</option>
                        <option value="null">Não atribuído</option>
                        <option value="assigned">Atribuído</option>
                      </select>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Ações</h4>
                    
                    <div className="space-y-4">
                      {actions.map(action => (
                        <div key={action.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={form.actions[action.name] || false}
                              onChange={(e) => {
                                updateAction(action.name, e.target.checked)
                                if (e.target.checked && action.requires_config) {
                                  setSelectedActionConfig(action.name)
                                } else if (!e.target.checked) {
                                  setSelectedActionConfig(null)
                                }
                              }}
                              className="mr-2"
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {action.display_name}
                              </span>
                              {action.description && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {action.description}
                                </span>
                              )}
                            </div>
                          </label>

                          {/* Configuração da ação */}
                          {action.requires_config && form.actions[action.name] && (
                            <div className="mt-3 ml-6 space-y-3">
                              {action.name === 'notify_supervisor' && (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      Destinatários *
                                    </label>
                                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-2">
                                      {users.map(user => (
                                        <label key={user.id} className="flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={form.actions[action.name]?.recipients?.includes(user.id) || false}
                                            onChange={(e) => {
                                              const currentRecipients = form.actions[action.name]?.recipients || []
                                              const newRecipients = e.target.checked
                                                ? [...currentRecipients, user.id]
                                                : currentRecipients.filter((id: string) => id !== user.id)
                                              updateActionConfig(action.name, 'recipients', newRecipients)
                                            }}
                                            className="mr-2"
                                          />
                                          <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {user.name} ({user.email}) - {user.role}
                                          </span>
                                        </label>
                                      ))}
                                    </div>
                                    {form.actions[action.name]?.recipients?.length === 0 && (
                                      <p className="text-xs text-red-500 mt-1">
                                        Selecione pelo menos um destinatário
                                      </p>
                                    )}
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Tipo de Notificação
                                    </label>
                                    <select
                                      value={form.actions[action.name]?.notification_type || 'both'}
                                      onChange={(e) => updateActionConfig(action.name, 'notification_type', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      <option value="both">Email + Notificação no Sistema</option>
                                      <option value="email">Apenas Email</option>
                                      <option value="in_app">Apenas Notificação no Sistema</option>
                                    </select>
                                  </div>
                                </>
                              )}

                              {action.name === 'add_comment' && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Comentário Automático *
                                  </label>
                                  <textarea
                                    value={form.actions[action.name]?.comment_text || ''}
                                    onChange={(e) => updateActionConfig(action.name, 'comment_text', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Digite o comentário que será adicionado automaticamente..."
                                  />
                                </div>
                              )}

                              {action.name === 'set_status' && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Status de Destino *
                                  </label>
                                  <select
                                    value={form.actions[action.name]?.target_status || ''}
                                    onChange={(e) => updateActionConfig(action.name, 'target_status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">Selecione um status</option>
                                    {statuses.map(status => (
                                      <option key={status.id} value={status.slug}>
                                        {status.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {action.name === 'assign_to_user' && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Usuário para Atribuição *
                                  </label>
                                  <select
                                    value={form.actions[action.name]?.user_id || ''}
                                    onChange={(e) => updateActionConfig(action.name, 'user_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">Selecione um usuário</option>
                                    {users.map(user => (
                                      <option key={user.id} value={user.id}>
                                        {user.name} ({user.email}) - {user.role}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                  </div>

                  {/* Configurações de Horário */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Configurações de Horário</h4>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={form.business_hours_only}
                        onChange={(e) => setForm(prev => ({ ...prev, business_hours_only: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Apenas em horário comercial</span>
                    </label>

                    {form.business_hours_only && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Início
                          </label>
                          <input
                            type="time"
                            value={form.business_hours_start}
                            onChange={(e) => setForm(prev => ({ ...prev, business_hours_start: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fim
                          </label>
                          <input
                            type="time"
                            value={form.business_hours_end}
                            onChange={(e) => setForm(prev => ({ ...prev, business_hours_end: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botões */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={editingRule ? handleUpdate : handleCreate}
                      disabled={loading || !form.name || !form.time_threshold}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Salvando...' : (editingRule ? 'Atualizar' : 'Criar')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Configurar Escalação por Tempo
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Crie regras automáticas para escalar tickets baseadas em tempo decorrido
                </p>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <Bell className="h-4 w-4" />
                    <span>Notificar supervisores</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Escalar para gerência</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Aumentar prioridade</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
