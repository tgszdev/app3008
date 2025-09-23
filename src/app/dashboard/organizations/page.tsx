'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Building, Plus, Edit, Trash2, Users, Settings, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

interface Organization {
  id: string
  name: string
  slug: string
  type: 'organization' | 'department'
  description?: string
  settings?: Record<string, any>
  created_at: string
  updated_at: string
  user_count?: number
}

export default function OrganizationsPage() {
  const { session } = useAuth()
  const { isMatrixUser, userType, isLoading: contextLoading } = useOrganization()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'organization' as 'organization' | 'department',
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Debug info
  console.log('OrganizationsPage Debug:', {
    session: session?.user,
    isMatrixUser,
    userType,
    contextLoading
  })

  useEffect(() => {
    if (isMatrixUser) {
      fetchOrganizations()
    }
  }, [isMatrixUser])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/organizations')
      setOrganizations(response.data.organizations || [])
    } catch (error) {
      console.error('Erro ao buscar organizações:', error)
      toast.error('Erro ao carregar organizações')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta organização?')) {
      return
    }

    try {
      await axios.delete(`/api/organizations/${id}`)
      toast.success('Organização excluída com sucesso')
      fetchOrganizations()
    } catch (error: any) {
      console.error('Erro ao excluir organização:', error)
      toast.error(error.response?.data?.error || 'Erro ao excluir organização')
    }
  }

  const handleEdit = (org: Organization) => {
    setEditingOrg(org)
    setFormData({
      name: org.name,
      type: org.type,
      description: org.description || ''
    })
    setShowCreateModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    setSubmitting(true)
    
    try {
      if (editingOrg) {
        // Atualizar organização existente
        await axios.put(`/api/organizations/${editingOrg.id}`, formData)
        toast.success('Organização atualizada com sucesso')
      } else {
        // Criar nova organização
        await axios.post('/api/organizations', formData)
        toast.success('Organização criada com sucesso')
      }
      
      setShowCreateModal(false)
      setEditingOrg(null)
      setFormData({ name: '', type: 'organization', description: '' })
      fetchOrganizations()
    } catch (error: any) {
      console.error('Erro ao salvar organização:', error)
      toast.error(error.response?.data?.error || 'Erro ao salvar organização')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingOrg(null)
    setFormData({ name: '', type: 'organization', description: '' })
  }

  if (!isMatrixUser) {
    return (
      <div className="text-center py-12">
        <Building className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Acesso Restrito
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Apenas usuários da matriz podem gerenciar organizações.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Organizações
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gerencie organizações e departamentos do sistema
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Organização
        </button>
      </div>

      {/* Organizations Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org) => (
          <div
            key={org.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  org.type === 'organization' 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {org.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {org.type === 'organization' ? 'Organização' : 'Departamento'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(org)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Editar organização"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(org.id)}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Excluir organização"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {org.description && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                {org.description}
              </p>
            )}
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{org.user_count || 0} usuários</span>
                </div>
              </div>
              
              <div className="text-xs text-gray-400">
                Criado em {new Date(org.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {organizations.length === 0 && (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Nenhuma organização encontrada
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comece criando sua primeira organização.
          </p>
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingOrg ? 'Editar Organização' : 'Nova Organização'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome da organização"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'organization' | 'department' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="organization">Organização</option>
                  <option value="department">Departamento</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descrição da organização (opcional)"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </div>
                  ) : (
                    editingOrg ? 'Atualizar' : 'Criar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
