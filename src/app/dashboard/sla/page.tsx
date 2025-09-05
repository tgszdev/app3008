'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Clock, AlertTriangle, Settings, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  color: string
  icon: string
}

interface SLAConfiguration {
  id: string
  name: string
  description?: string
  category_id?: string
  category?: Category
  priority: 'low' | 'medium' | 'high' | 'critical'
  first_response_time: number
  resolution_time: number
  business_hours_only: boolean
  business_hours_start: string
  business_hours_end: string
  working_days: string
  alert_percentage: number
  is_active: boolean
}

const priorityLabels = {
  low: { label: 'Baixa', color: 'bg-gray-500' },
  medium: { label: 'Média', color: 'bg-blue-500' },
  high: { label: 'Alta', color: 'bg-orange-500' },
  critical: { label: 'Crítica', color: 'bg-red-500' }
}

export default function SLAConfigurationPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [configurations, setConfigurations] = useState<SLAConfiguration[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState<SLAConfiguration | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    priority: 'medium' as const,
    first_response_time: 60,
    resolution_time: 240,
    business_hours_only: true,
    business_hours_start: '08:00',
    business_hours_end: '18:00',
    working_days: '1,2,3,4,5',
    alert_percentage: 80
  })

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      toast.error('Acesso negado. Apenas administradores podem configurar SLA.')
      router.push('/dashboard')
      return
    }
    
    fetchConfigurations()
    fetchCategories()
  }, [session, router])

  const fetchConfigurations = async () => {
    try {
      const response = await axios.get('/api/sla/configurations')
      setConfigurations(response.data)
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
      toast.error('Erro ao carregar configurações de SLA')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories')
      setCategories(response.data)
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingConfig) {
        await axios.put(`/api/sla/configurations/${editingConfig.id}`, formData)
        toast.success('Configuração atualizada com sucesso!')
      } else {
        await axios.post('/api/sla/configurations', formData)
        toast.success('Configuração criada com sucesso!')
      }
      
      fetchConfigurations()
      resetForm()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar configuração')
    }
  }

  const handleEdit = (config: SLAConfiguration) => {
    setEditingConfig(config)
    setFormData({
      name: config.name,
      description: config.description || '',
      category_id: config.category_id || '',
      priority: config.priority,
      first_response_time: config.first_response_time,
      resolution_time: config.resolution_time,
      business_hours_only: config.business_hours_only,
      business_hours_start: config.business_hours_start.slice(0, 5),
      business_hours_end: config.business_hours_end.slice(0, 5),
      working_days: config.working_days,
      alert_percentage: config.alert_percentage
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja desativar esta configuração?')) return
    
    try {
      await axios.delete(`/api/sla/configurations/${id}`)
      toast.success('Configuração desativada com sucesso!')
      fetchConfigurations()
    } catch (error) {
      toast.error('Erro ao desativar configuração')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category_id: '',
      priority: 'medium',
      first_response_time: 60,
      resolution_time: 240,
      business_hours_only: true,
      business_hours_start: '08:00',
      business_hours_end: '18:00',
      working_days: '1,2,3,4,5',
      alert_percentage: 80
    })
    setEditingConfig(null)
    setShowForm(false)
  }

  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Configuração de SLA
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure os tempos de resposta e resolução para cada prioridade
        </p>
      </div>

      {/* Botão Adicionar */}
      <div className="mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nova Configuração
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingConfig ? 'Editar Configuração' : 'Nova Configuração'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome*</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Prioridade*</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  required
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tempo de Primeira Resposta (minutos)*
                </label>
                <input
                  type="number"
                  value={formData.first_response_time}
                  onChange={(e) => setFormData({ ...formData, first_response_time: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tempo de Resolução (minutos)*
                </label>
                <input
                  type="number"
                  value={formData.resolution_time}
                  onChange={(e) => setFormData({ ...formData, resolution_time: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Porcentagem de Alerta (%)
                </label>
                <input
                  type="number"
                  value={formData.alert_percentage}
                  onChange={(e) => setFormData({ ...formData, alert_percentage: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.business_hours_only}
                  onChange={(e) => setFormData({ ...formData, business_hours_only: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium">Considerar apenas horário comercial</span>
              </label>
            </div>
            
            {formData.business_hours_only && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-1">Horário Inicial</label>
                  <input
                    type="time"
                    value={formData.business_hours_start}
                    onChange={(e) => setFormData({ ...formData, business_hours_start: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Horário Final</label>
                  <input
                    type="time"
                    value={formData.business_hours_end}
                    onChange={(e) => setFormData({ ...formData, business_hours_end: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Dias Úteis</label>
                  <div className="flex gap-1">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
                      <label key={index} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.working_days.includes(String(index === 0 ? 7 : index))}
                          onChange={(e) => {
                            const dayNum = index === 0 ? 7 : index
                            const days = formData.working_days.split(',').filter(Boolean).map(Number)
                            if (e.target.checked) {
                              days.push(dayNum)
                            } else {
                              const idx = days.indexOf(dayNum)
                              if (idx > -1) days.splice(idx, 1)
                            }
                            setFormData({ ...formData, working_days: days.sort().join(',') })
                          }}
                          className="sr-only"
                        />
                        <span className={`
                          w-8 h-8 flex items-center justify-center rounded cursor-pointer text-xs font-medium
                          ${formData.working_days.includes(String(index === 0 ? 7 : index))
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700'
                          }
                        `}>
                          {day}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingConfig ? 'Atualizar' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Configurações */}
      <div className="grid gap-4">
        {configurations.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhuma configuração de SLA encontrada
            </p>
          </div>
        ) : (
          configurations.map(config => (
            <div
              key={config.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{config.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${priorityLabels[config.priority].color}`}>
                      {priorityLabels[config.priority].label}
                    </span>
                    {config.category && (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-200 dark:bg-gray-700">
                        {config.category.name}
                      </span>
                    )}
                  </div>
                  
                  {config.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {config.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Primeira Resposta:</span>
                      <p className="font-medium">{formatMinutes(config.first_response_time)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Resolução:</span>
                      <p className="font-medium">{formatMinutes(config.resolution_time)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Alerta em:</span>
                      <p className="font-medium">{config.alert_percentage}%</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Horário:</span>
                      <p className="font-medium">
                        {config.business_hours_only
                          ? `${config.business_hours_start.slice(0, 5)} - ${config.business_hours_end.slice(0, 5)}`
                          : '24/7'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(config)}
                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(config.id)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                    title="Desativar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}