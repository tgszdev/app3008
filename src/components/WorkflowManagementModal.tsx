"use client"

import { useEffect, useState } from 'react'
import { X, Plus, Play, Pause, Settings, Trash2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

type WorkflowRule = {
  id: string
  name: string
  description?: string | null
  is_active: boolean
  priority: number
  conditions: any
  actions: any
  created_at: string
  updated_at: string
}

type Category = {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  is_active: boolean
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

type WorkflowFormData = {
  name: string
  description: string
  is_active: boolean
  conditions: {
    category?: string
    priority?: string
    status?: string
    assigned_to?: string | null
    created_by_role?: string
    time_since_creation?: string
  }
  actions: {
    assign_to?: string
    set_priority?: string
    set_status?: string
    add_comment?: string
    notify?: string[]
  }
}

type User = {
  id: string
  name: string
  email: string
  role: string
}

export default function WorkflowManagementModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [rules, setRules] = useState<WorkflowRule[]>([])
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [statuses, setStatuses] = useState<Status[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState<WorkflowFormData>({
    name: '',
    description: '',
    is_active: true,
    conditions: {},
    actions: {}
  })

  useEffect(() => {
    if (!isOpen) return
    loadRules()
    loadCategories()
    loadStatuses()
    loadUsers()
  }, [isOpen])

  const loadRules = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/workflows')
      const data = await res.json()
      if (res.ok) {
        setRules(data || [])
      } else {
        toast.error(data?.error || 'Erro ao carregar regras')
      }
    } catch (error) {
      toast.error('Erro ao carregar regras')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories?active_only=true')
      const data = await res.json()
      if (res.ok) {
        setCategories(data || [])
      } else {
        console.error('Erro ao carregar categorias:', data?.error)
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
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

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (res.ok) {
        // Filtrar apenas usuários que podem ser atribuídos (analyst e admin)
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
      conditions: {},
      actions: {}
    })
    setEditingRule(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      return toast.error('Nome é obrigatório')
    }

    if (Object.keys(form.conditions).length === 0) {
      return toast.error('Pelo menos uma condição deve ser definida')
    }

    if (Object.keys(form.actions).length === 0) {
      return toast.error('Pelo menos uma ação deve ser definida')
    }

    setLoading(true)
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        is_active: form.is_active,
        conditions: form.conditions,
        actions: form.actions
      }

      const url = editingRule ? `/api/workflows/${editingRule.id}` : '/api/workflows'
      const method = editingRule ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      
      if (res.ok) {
        toast.success(editingRule ? 'Regra atualizada' : 'Regra criada')
        await loadRules()
        resetForm()
      } else {
        toast.error(data?.error || 'Erro ao salvar regra')
      }
    } catch (error) {
      toast.error('Erro ao salvar regra')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (rule: WorkflowRule) => {
    setEditingRule(rule)
    setForm({
      name: rule.name,
      description: rule.description || '',
      is_active: rule.is_active,
      conditions: rule.conditions || {},
      actions: rule.actions || {}
    })
    setShowForm(true)
  }

  const handleToggleActive = async (rule: WorkflowRule) => {
    try {
      const res = await fetch(`/api/workflows/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !rule.is_active })
      })

      if (res.ok) {
        toast.success(rule.is_active ? 'Regra desativada' : 'Regra ativada')
        await loadRules()
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Erro ao atualizar regra')
      }
    } catch (error) {
      toast.error('Erro ao atualizar regra')
    }
  }

  const handleDelete = async (rule: WorkflowRule) => {
    if (!confirm(`Tem certeza que deseja excluir a regra "${rule.name}"?`)) return

    try {
      const res = await fetch(`/api/workflows/${rule.id}`, { method: 'DELETE' })
      
      if (res.ok) {
        toast.success('Regra excluída')
        await loadRules()
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Erro ao excluir regra')
      }
    } catch (error) {
      toast.error('Erro ao excluir regra')
    }
  }

  const updateCondition = (key: string, value: any) => {
    setForm(f => ({
      ...f,
      conditions: { ...f.conditions, [key]: value }
    }))
  }

  const updateAction = (key: string, value: any) => {
    setForm(f => ({
      ...f,
      actions: { ...f.actions, [key]: value }
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Automação de Workflows
          </h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-4rem)]">
          {/* Lista de regras */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowForm(true)}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra
              </button>
            </div>

            <div className="p-4 overflow-y-auto h-full">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma regra cadastrada</div>
              ) : (
                <div className="space-y-3">
                  {rules.map(rule => (
                    <div
                      key={rule.id}
                      className="p-4 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {rule.name}
                            </h4>
                            {rule.is_active ? (
                              <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Ativa
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                                <Pause className="h-3 w-3 mr-1" />
                                Inativa
                              </span>
                            )}
                          </div>
                          {rule.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {rule.description}
                            </p>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            Prioridade: {rule.priority}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-4">
                          <button
                            onClick={() => handleToggleActive(rule)}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title={rule.is_active ? 'Desativar' : 'Ativar'}
                          >
                            {rule.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleEdit(rule)}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Editar"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rule)}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
                            title="Excluir"
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
          <div className="w-1/2">
            {showForm ? (
              <div className="p-6 overflow-y-auto h-full">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    {editingRule ? 'Editar Regra' : 'Nova Regra'}
                  </h4>
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Informações básicas */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome da Regra</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                      placeholder="Ex: Hardware para Técnico"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Descrição</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                      rows={2}
                      placeholder="Descrição opcional da regra"
                    />
                  </div>

                  <div>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Regra ativa</span>
                    </label>
                  </div>

                  {/* Condições */}
                  <div>
                    <h5 className="text-md font-medium mb-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Condições (SE)
                    </h5>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm mb-1">Categoria</label>
                        <select
                          value={form.conditions.category || ''}
                          onChange={e => updateCondition('category', e.target.value || undefined)}
                          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                        >
                          <option value="">Qualquer categoria</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.slug}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm mb-1">Prioridade</label>
                        <select
                          value={form.conditions.priority || ''}
                          onChange={e => updateCondition('priority', e.target.value || undefined)}
                          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                        >
                          <option value="">Qualquer prioridade</option>
                          <option value="low">Baixa</option>
                          <option value="medium">Média</option>
                          <option value="high">Alta</option>
                          <option value="critical">Urgente</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm mb-1">Status</label>
                        <select
                          value={form.conditions.status || ''}
                          onChange={e => updateCondition('status', e.target.value || undefined)}
                          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
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
                        <label className="block text-sm mb-1">Atribuição</label>
                        <select
                          value={form.conditions.assigned_to === null ? 'null' : form.conditions.assigned_to || ''}
                          onChange={e => {
                            const value = e.target.value
                            updateCondition('assigned_to', value === 'null' ? null : value === '' ? undefined : value)
                          }}
                          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                        >
                          <option value="">Qualquer atribuição</option>
                          <option value="null">Não atribuído</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm mb-1">Tempo desde criação</label>
                        <select
                          value={form.conditions.time_since_creation || ''}
                          onChange={e => updateCondition('time_since_creation', e.target.value || undefined)}
                          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                        >
                          <option value="">Qualquer tempo</option>
                          <option value="> 1 hour">Mais de 1 hora</option>
                          <option value="> 2 hours">Mais de 2 horas</option>
                          <option value="> 4 hours">Mais de 4 horas</option>
                          <option value="> 24 hours">Mais de 24 horas</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div>
                    <h5 className="text-md font-medium mb-3 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Ações (ENTÃO)
                    </h5>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm mb-1">Atribuir para</label>
                        <select
                          value={form.actions.assign_to || ''}
                          onChange={e => updateAction('assign_to', e.target.value || undefined)}
                          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                        >
                          <option value="">Não alterar</option>
                          <option value="auto">Auto-atribuição por categoria</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name} ({user.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm mb-1">Definir prioridade</label>
                        <select
                          value={form.actions.set_priority || ''}
                          onChange={e => updateAction('set_priority', e.target.value || undefined)}
                          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                        >
                          <option value="">Não alterar</option>
                          <option value="low">Baixa</option>
                          <option value="medium">Média</option>
                          <option value="high">Alta</option>
                          <option value="critical">Urgente</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm mb-1">Definir status</label>
                        <select
                          value={form.actions.set_status || ''}
                          onChange={e => updateAction('set_status', e.target.value || undefined)}
                          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                        >
                          <option value="">Não alterar</option>
                          {statuses.map(status => (
                            <option key={status.id} value={status.slug}>
                              {status.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm mb-1">Adicionar comentário</label>
                        <input
                          value={form.actions.add_comment || ''}
                          onChange={e => updateAction('add_comment', e.target.value || undefined)}
                          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                          placeholder="Comentário automático (opcional)"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Salvando...' : editingRule ? 'Atualizar' : 'Criar Regra'}
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma regra para editar ou crie uma nova</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
