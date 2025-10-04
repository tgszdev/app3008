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
  Circle,
  ChevronUp,
  ChevronDown,
  GripVertical,
  MoreVertical
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Status {
  id: string
  name: string
  slug: string
  color: string
  description: string
  is_default: boolean
  is_final: boolean
  is_internal: boolean
  order_index: number
  created_at?: string
  updated_at?: string
}

interface StatusManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

const DEFAULT_STATUSES: Omit<Status, 'id'>[] = [
  {
    name: 'Aberto',
    slug: 'aberto',
    color: '#2563eb',
    description: 'Chamado aberto/novo',
    is_default: true,
    is_final: false,
    is_internal: false,
    order_index: 1
  },
  {
    name: 'Em Progresso',
    slug: 'em-progresso',
    color: '#9333ea',
    description: 'Atendimento em andamento',
    is_default: false,
    is_final: false,
    is_internal: false,
    order_index: 2
  },
  {
    name: 'Aguardando Cliente',
    slug: 'aguardando-cliente',
    color: '#f59e0b',
    description: 'Pausado aguardando retorno do cliente',
    is_default: false,
    is_final: false,
    is_internal: false,
    order_index: 3
  },
  {
    name: 'Resolvido',
    slug: 'resolvido',
    color: '#16a34a',
    description: 'Solução aplicada, aguardando validação/fechamento',
    is_default: false,
    is_final: true,
    is_internal: false,
    order_index: 4
  },
  {
    name: 'Fechado',
    slug: 'fechado',
    color: '#334155',
    description: 'Chamado concluído/encerrado',
    is_default: false,
    is_final: true,
    is_internal: false,
    order_index: 5
  }
]

export default function StatusManagementModal({ isOpen, onClose }: StatusManagementModalProps) {
  const [statuses, setStatuses] = useState<Status[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingStatus, setEditingStatus] = useState<Status | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    color: '#3B82F6',
    description: '',
    is_default: false,
    is_final: false,
    is_internal: false
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
        setStatuses(Array.isArray(data) ? data : (data.statuses || []))
      } else {
        setStatuses(DEFAULT_STATUSES.map((s, index) => ({
          ...s,
          id: `default-${index}`
        })))
      }
    } catch (error) {
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
      const endpoint = editingStatus 
        ? `/api/statuses/${editingStatus.id}`
        : '/api/statuses'
      
      const method = editingStatus ? 'PATCH' : 'POST'
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
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
        is_default: false,
        is_final: false,
        is_internal: false
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
      is_default: status.is_default,
      is_final: status.is_final,
      is_internal: status.is_internal
    })
    setShowForm(true)
    setOpenMenuId(null)
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
      setOpenMenuId(null)
    } catch (error) {
      toast.error('Erro ao excluir status')
    }
  }

  const handleReorder = async (statusId: string, direction: 'up' | 'down') => {
    const currentIndex = statuses.findIndex(s => s.id === statusId)
    if (currentIndex === -1) return
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= statuses.length) return
    
    const newStatuses = [...statuses]
    const temp = newStatuses[currentIndex]
    newStatuses[currentIndex] = newStatuses[newIndex]
    newStatuses[newIndex] = temp
    
    newStatuses[currentIndex].order_index = currentIndex + 1
    newStatuses[newIndex].order_index = newIndex + 1
    
    setStatuses(newStatuses)
    
    try {
      await Promise.all([
        fetch(`/api/statuses/${newStatuses[currentIndex].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ order_index: currentIndex + 1 })
        }),
        fetch(`/api/statuses/${newStatuses[newIndex].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ order_index: newIndex + 1 })
        })
      ])
      
      toast.success('Ordem atualizada!')
    } catch (error) {
      toast.error('Erro ao atualizar ordem')
      fetchStatuses()
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
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-2 sm:mx-0">
          {/* Header - Responsivo */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="bg-white/20 p-1.5 sm:p-2 rounded-2xl">
                  <Circle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    Status
                  </h3>
                  <p className="text-blue-100 text-xs sm:text-sm hidden sm:block">
                    Configure os status disponíveis
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          {/* Content - Responsivo */}
          <div className="px-4 sm:px-6 py-4 max-h-[70vh] sm:max-h-[60vh] overflow-y-auto">
            {showForm ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Formulário em grid responsivo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1">
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
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Em Progresso"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Slug
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="em-progresso"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cor
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="h-10 w-16 sm:w-20 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Status
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-start sm:items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_default}
                          onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                          className="mr-2 mt-1 sm:mt-0"
                        />
                        <span className="text-xs sm:text-sm">Status Padrão</span>
                      </label>
                      <label className="flex items-start sm:items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_final}
                          onChange={(e) => setFormData({ ...formData, is_final: e.target.checked })}
                          className="mr-2 mt-1 sm:mt-0"
                        />
                        <span className="text-xs sm:text-sm">Status Final</span>
                      </label>
                      <label className="flex items-start sm:items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_internal}
                          onChange={(e) => setFormData({ ...formData, is_internal: e.target.checked })}
                          className="mr-2 mt-1 sm:mt-0"
                        />
                        <span className="text-xs sm:text-sm">Status Interno</span>
                      </label>
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Descrição do status..."
                    />
                  </div>
                </div>

                {/* Botões responsivos */}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
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
                        is_default: false,
                        is_final: false,
                        is_internal: false
                      })
                    }}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingStatus ? 'Atualizar' : 'Criar'} Status</span>
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Header da lista responsivo */}
                <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                    Status Cadastrados ({statuses.length})
                  </h4>
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 flex items-center justify-center sm:justify-start space-x-2 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar</span>
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : statuses.length === 0 ? (
                  <div className="text-center py-8">
                    <Circle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Nenhum status cadastrado
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {statuses.map((status, index) => (
                      <div
                        key={status.id}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3 sm:p-4 border border-gray-200 dark:border-gray-600"
                      >
                        {/* Mobile Layout */}
                        <div className="flex flex-col sm:hidden space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2 flex-1">
                              <div
                                className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                                style={{ 
                                  backgroundColor: status.color,
                                  borderColor: status.color 
                                }}
                              />
                              <div className="flex-1">
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {status.name}
                                </h5>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {status.slug}
                                </span>
                              </div>
                            </div>
                            
                            {/* Mobile Menu */}
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === status.id ? null : status.id)}
                                className="p-1 text-gray-600 dark:text-gray-400"
                              >
                                <MoreVertical className="h-5 w-5" />
                              </button>
                              {openMenuId === status.id && (
                                <div className="absolute right-0 top-8 z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 w-40">
                                  {index > 0 && (
                                    <button
                                      onClick={() => {
                                        handleReorder(status.id, 'up')
                                        setOpenMenuId(null)
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                    >
                                      <ChevronUp className="h-4 w-4" />
                                      <span>Mover acima</span>
                                    </button>
                                  )}
                                  {index < statuses.length - 1 && (
                                    <button
                                      onClick={() => {
                                        handleReorder(status.id, 'down')
                                        setOpenMenuId(null)
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                    >
                                      <ChevronDown className="h-4 w-4" />
                                      <span>Mover abaixo</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleEdit(status)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                    <span>Editar</span>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(status.id)}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Excluir</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Tags e descrição mobile */}
                          <div className="flex flex-wrap gap-1">
                            {status.is_default && (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                Padrão
                              </span>
                            )}
                            {status.is_final && (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                Final
                              </span>
                            )}
                            {status.is_internal && (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
                                Interno
                              </span>
                            )}
                          </div>
                          {status.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                              {status.description}
                            </p>
                          )}
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            {/* Reorder controls - Desktop */}
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={() => handleReorder(status.id, 'up')}
                                disabled={index === 0}
                                className={`p-1 rounded transition-colors ${
                                  index === 0 
                                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                                    : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600'
                                }`}
                                title="Mover para cima"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleReorder(status.id, 'down')}
                                disabled={index === statuses.length - 1}
                                className={`p-1 rounded transition-colors ${
                                  index === statuses.length - 1
                                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                    : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600'
                                }`}
                                title="Mover para baixo"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <GripVertical className="h-5 w-5 text-gray-400" />
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div
                                  className="w-4 h-4 rounded-full border-2"
                                  style={{ 
                                    backgroundColor: status.color,
                                    borderColor: status.color 
                                  }}
                                />
                                <h5 className="text-base lg:text-lg font-medium text-gray-900 dark:text-white">
                                  {status.name}
                                </h5>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  ({status.slug})
                                </span>
                                <div className="flex space-x-2">
                                  {status.is_default && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                      Padrão
                                    </span>
                                  )}
                                  {status.is_final && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                      Final
                                    </span>
                                  )}
                                  {status.is_internal && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
                                      Interno
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
                          </div>
                          
                          {/* Action buttons - Desktop */}
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleEdit(status)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-2xl transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(status.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-2xl transition-colors"
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

          {/* Footer responsivo */}
          {!showForm && (
            <div className="bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
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