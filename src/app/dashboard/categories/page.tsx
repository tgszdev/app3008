'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronUp,
  ChevronDown,
  Loader2,
  X,
  Folder,
  Hash,
  Palette,
  Type,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
  created_by_user?: {
    id: string
    name: string
    email: string
  }
}

export default function CategoriesPage() {
  const { session } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'folder',
    color: '#6B7280'
  })

  useEffect(() => {
    // Verificar se é admin
    if (session?.user?.role !== 'admin') {
      toast.error('Acesso negado - Apenas administradores')
      router.push('/dashboard')
      return
    }
    
    fetchCategories()
  }, [session, router])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/categories')
      setCategories(response.data)
    } catch (error: any) {
      console.error('Error fetching categories:', error)
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast.error('Nome é obrigatório')
      return
    }

    try {
      if (editingCategory) {
        // Atualizar categoria
        await axios.put('/api/categories', {
          id: editingCategory.id,
          ...formData
        })
        toast.success('Categoria atualizada com sucesso!')
      } else {
        // Criar nova categoria
        await axios.post('/api/categories', formData)
        toast.success('Categoria criada com sucesso!')
      }

      setShowModal(false)
      setEditingCategory(null)
      setFormData({
        name: '',
        description: '',
        icon: 'folder',
        color: '#6B7280'
      })
      fetchCategories()
    } catch (error: any) {
      console.error('Error saving category:', error)
      toast.error(error.response?.data?.error || 'Erro ao salvar categoria')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'folder',
      color: category.color || '#6B7280'
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return
    }

    try {
      await axios.delete(`/api/categories?id=${id}`)
      toast.success('Categoria excluída com sucesso!')
      fetchCategories()
    } catch (error: any) {
      console.error('Error deleting category:', error)
      toast.error(error.response?.data?.error || 'Erro ao excluir categoria')
    }
  }

  const handleToggleActive = async (category: Category) => {
    try {
      await axios.put('/api/categories', {
        id: category.id,
        is_active: !category.is_active
      })
      toast.success(`Categoria ${!category.is_active ? 'ativada' : 'desativada'} com sucesso!`)
      fetchCategories()
    } catch (error: any) {
      console.error('Error toggling category:', error)
      toast.error('Erro ao alterar status da categoria')
    }
  }

  const handleMoveOrder = async (category: Category, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === category.id)
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (newIndex < 0 || newIndex >= categories.length) return

    const otherCategory = categories[newIndex]

    try {
      // Trocar as ordens
      await Promise.all([
        axios.put('/api/categories', {
          id: category.id,
          display_order: otherCategory.display_order
        }),
        axios.put('/api/categories', {
          id: otherCategory.id,
          display_order: category.display_order
        })
      ])

      toast.success('Ordem alterada com sucesso!')
      fetchCategories()
    } catch (error) {
      console.error('Error reordering categories:', error)
      toast.error('Erro ao reordenar categorias')
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Ícones disponíveis
  const availableIcons = [
    'folder', 'help-circle', 'cpu', 'code', 'wifi', 'printer',
    'mail', 'shield', 'phone', 'monitor', 'database', 'server',
    'globe', 'settings', 'tool', 'package', 'zap', 'activity'
  ]

  // Cores predefinidas
  const presetColors = [
    '#6B7280', '#EF4444', '#3B82F6', '#10B981', '#F59E0B',
    '#8B5CF6', '#DC2626', '#06B6D4', '#0EA5E9', '#059669',
    '#EC4899', '#F97316', '#84CC16', '#14B8A6', '#A855F7'
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Categorias
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gerencie as categorias de tickets
          </p>
        </div>
        
        <button
          onClick={() => {
            setEditingCategory(null)
            setFormData({
              name: '',
              description: '',
              icon: 'folder',
              color: '#6B7280'
            })
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Nova Categoria
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar categorias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ordem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCategories.map((category, index) => (
                <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMoveOrder(category, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => handleMoveOrder(category, 'down')}
                        disabled={index === filteredCategories.length - 1}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronDown size={16} />
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {category.display_order}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: category.color + '20', color: category.color }}
                      >
                        <Folder size={16} />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                      {category.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {category.description || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(category)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        category.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                      }`}
                    >
                      {category.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                      {category.is_active ? 'Ativa' : 'Inativa'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        <Edit size={16} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Nenhuma categoria encontrada
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Type size={16} className="inline mr-1" />
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Ex: Hardware"
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <FileText size={16} className="inline mr-1" />
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Descrição opcional da categoria"
                  rows={3}
                />
              </div>

              {/* Ícone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Hash size={16} className="inline mr-1" />
                  Ícone
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  {availableIcons.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>

              {/* Cor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Palette size={16} className="inline mr-1" />
                  Cor
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="#6B7280"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className="w-6 h-6 rounded border-2 border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCategory ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}