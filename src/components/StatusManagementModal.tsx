'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Edit2,
  Check,
  AlertCircle,
  Loader2,
  Circle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Status {
  id: string
  name: string
  slug: string
  color: string
  description: string
  type: 'default' | 'final' | 'internal'
  is_active: boolean
  display_order: number
}

interface StatusManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

const DEFAULT_STATUSES: Omit<Status, 'id'>[] = [
  {
    name: 'Aberto',
    slug: 'aberto',
    color: '#3B82F6',
    description: 'Chamado aberto/novo',
    type: 'default',
    is_active: true,
    display_order: 1
  },
  {
    name: 'Em Progresso',
    slug: 'em-progresso',
    color: '#8B5CF6',
    description: 'Atendimento em andamento',
    type: 'default',
    is_active: true,
    display_order: 2
  },
  {
    name: 'Aguardando Cliente',
    slug: 'aguardando-cliente',
    color: '#F59E0B',
    description: 'Pausado aguardando retorno do cliente',
    type: 'default',
    is_active: true,
    display_order: 3
  },
  {
    name: 'Resolvido',
    slug: 'resolvido',
    color: '#10B981',
    description: 'Solução aplicada, aguardando validação/fechamento',
    type: 'final',
    is_active: true,
    display_order: 4
  },
  {
    name: 'Fechado',
    slug: 'fechado',
    color: '#6B7280',
    description: 'Chamado concluído/encerrado',
    type: 'final',
    is_active: true,
    display_order: 5
  }
]

export default function StatusManagementModal({ isOpen, onClose }: StatusManagementModalProps) {
  const [statuses, setStatuses] = useState<Status[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingStatus, setEditingStatus] = useState<Status | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    color: '#3B82F6',
    description: '',
    type: 'default' as 'default' | 'final' | 'internal',
    is_active: true
  })

  useEffect(() => {
    if (isOpen) {
      fetchStatuses()
    }
  }, [isOpen])

  const fetchStatuses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/statuses', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setStatuses(data.statuses || [])
      } else {
        // Use default statuses if API fails
        setStatuses(DEFAULT_STATUSES.map((s, index) => ({
          ...s,
          id: `default-${index}`
        })))
      }
    } catch (error) {
      console.error('Error fetching statuses:', error)
      // Use default statuses
      setStatuses(DEFAULT_STATUSES.map((s, index) => ({
        ...s,
        id: `default-${index}`
      })))
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const statusData = {
        ...formData,
        display_order: editingStatus?.display_order || statuses.length + 1
      }
      
      const url = editingStatus 
        ? `/api/statuses/${editingStatus.id}`
        : '/api/statuses'
      
      const response = await fetch(url, {
        method: editingStatus ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(statusData)
      })
      
      if (!response.ok) {
        throw new Error('Erro ao salvar status')
      }
      
      toast.success(editingStatus ? 'Status atualizado!' : 'Status criado!')
      
      setShowForm(false)
      setEditingStatus(null)
      setFormData({
        name: '',
        slug: '',
        color: '#3B82F6',
        description: '',
        type: 'default',
        is_active: true
      })
      fetchStatuses()
    } catch (error) {
      toast.error('Erro ao salvar status')
    }
  }

  const handleEdit = (status: Status) => {
    setEditingStatus(status)
    setFormData({
      name: status.name,
      slug: status.slug,
      color: status.color,
      description: status.description || '',
      type: status.type,
      is_active: status.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este status?')) return
    
    try {
      const response = await fetch(`/api/statuses/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Erro ao excluir status')
      }
      
      toast.success('Status excluído!')
      fetchStatuses()
    } catch (error) {
      toast.error('Erro ao excluir status')
    }
  }

  const handleToggleActive = async (status: Status) => {
    try {
      const response = await fetch(`/api/statuses/${status.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...status,
          is_active: !status.is_active
        })
      })
      
      if (!response.ok) {
        throw new Error('Erro ao alterar status')
      }
      
      toast.success(`Status ${!status.is_active ? 'ativado' : 'desativado'}!`)
      fetchStatuses()
    } catch (error) {
      toast.error('Erro ao alterar status')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={() => !showForm && onClose()}
        />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Circle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Gerenciar Status dos Chamados
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Configure os status disponíveis para os chamados
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {showForm ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ 
                          ...formData, 
                          name: e.target.value,
                          slug: !editingStatus ? generateSlug(e.target.value) : formData.slug
                        })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Em Progresso"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Slug
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="em-progresso"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cor
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="h-10 w-20 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value="default"
                          checked={formData.type === 'default'}
                          onChange={(e) => setFormData({ ...formData, type: 'default' })}
                          className="mr-2"
                        />
                        <span className="text-sm">Padrão</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value="final"
                          checked={formData.type === 'final'}
                          onChange={(e) => setFormData({ ...formData, type: 'final' })}
                          className="mr-2"
                        />
                        <span className="text-sm">Final</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value="internal"
                          checked={formData.type === 'internal'}
                          onChange={(e) => setFormData({ ...formData, type: 'internal' })}
                          className="mr-2"
                        />
                        <span className="text-sm">Interno</span>
                      </label>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Descrição do status..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingStatus(null)
                      setFormData({
                        name: '',
                        slug: '',
                        color: '#3B82F6',
                        description: '',
                        type: 'default',
                        is_active: true
                      })
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingStatus ? 'Atualizar' : 'Criar'} Status</span>
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="mb-4 flex justify-between items-center">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    Status Cadastrados
                  </h4>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Status</span>
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : statuses.length === 0 ? (
                  <div className="text-center py-8">
                    <Circle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhum status cadastrado
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {statuses.map((status) => (
                      <div
                        key={status.id}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div
                                className="w-4 h-4 rounded-full border-2"
                                style={{ 
                                  backgroundColor: status.color,
                                  borderColor: status.color 
                                }}
                              />
                              <h5 className="text-lg font-medium text-gray-900 dark:text-white">
                                {status.name}
                              </h5>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                ({status.slug})
                              </span>
                              <div className="flex space-x-2">
                                {status.type === 'default' && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                    Padrão
                                  </span>
                                )}
                                {status.type === 'final' && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    Final
                                  </span>
                                )}
                                {status.type === 'internal' && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
                                    Interno
                                  </span>
                                )}
                                {!status.is_active && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                    Inativo
                                  </span>
                                )}
                              </div>
                            </div>
                            {status.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {status.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleToggleActive(status)}
                              className={`p-2 rounded-lg transition-colors ${
                                status.is_active
                                  ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                              title={status.is_active ? 'Desativar' : 'Ativar'}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(status)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(status.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
              </>
            )}
          </div>

          {/* Footer */}
          {!showForm && (
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}