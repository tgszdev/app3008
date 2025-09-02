'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  Grid,
  FileText,
  Rocket,
  BookOpen,
  Wrench,
  HelpCircle,
  Lightbulb,
  Shield,
  Code,
  TrendingUp,
  BookMarked,
  Palette,
  GripVertical
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  display_order: number
  article_count?: number
  created_at: string
}

const AVAILABLE_ICONS = [
  { name: 'FileText', icon: FileText },
  { name: 'Rocket', icon: Rocket },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Wrench', icon: Wrench },
  { name: 'HelpCircle', icon: HelpCircle },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Shield', icon: Shield },
  { name: 'Code', icon: Code },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'BookMarked', icon: BookMarked },
  { name: 'Grid', icon: Grid }
]

const PRESET_COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#84CC16', // Lime
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6B7280'  // Gray
]

export default function CategoriesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('FileText')
  const [color, setColor] = useState('#6366F1')
  const [displayOrder, setDisplayOrder] = useState(999)

  const isAdmin = (session?.user as any)?.role === 'admin'

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem gerenciar categorias')
      router.push('/dashboard/knowledge-base')
      return
    }

    fetchCategories()
  }, [isAdmin])

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/knowledge-base/categories')
      setCategories(response.data.categories || [])
    } catch (error: any) {
      console.error('Erro ao buscar categorias:', error)
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const resetForm = () => {
    setName('')
    setSlug('')
    setDescription('')
    setIcon('FileText')
    setColor('#6366F1')
    setDisplayOrder(999)
    setEditingCategory(null)
    setShowForm(false)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setName(category.name)
    setSlug(category.slug)
    setDescription(category.description)
    setIcon(category.icon)
    setColor(category.color)
    setDisplayOrder(category.display_order)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!name || !slug) {
      toast.error('Nome e slug são obrigatórios')
      return
    }

    setSaving(true)
    try {
      if (editingCategory) {
        // Atualizar categoria existente
        const response = await axios.put(`/api/knowledge-base/categories/${editingCategory.id}`, {
          name,
          slug,
          description,
          icon,
          color,
          display_order: displayOrder
        })
        
        toast.success('Categoria atualizada com sucesso!')
      } else {
        // Criar nova categoria
        const response = await axios.post('/api/knowledge-base/categories', {
          name,
          slug,
          description,
          icon,
          color,
          display_order: displayOrder
        })
        
        toast.success('Categoria criada com sucesso!')
      }

      resetForm()
      fetchCategories()
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error)
      toast.error(error.response?.data?.error || 'Erro ao salvar categoria')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category: Category) => {
    if (category.article_count && category.article_count > 0) {
      toast.error(`Esta categoria possui ${category.article_count} artigo(s) e não pode ser excluída`)
      return
    }

    if (!confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) {
      return
    }

    try {
      await axios.delete(`/api/knowledge-base/categories/${category.id}`)
      toast.success('Categoria excluída com sucesso!')
      fetchCategories()
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error)
      toast.error('Erro ao excluir categoria')
    }
  }

  const getIconComponent = (iconName: string) => {
    const iconData = AVAILABLE_ICONS.find(i => i.name === iconName)
    return iconData?.icon || FileText
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/knowledge-base')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gerenciar Categorias
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Organize os artigos da base de conhecimento em categorias
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showForm ? (
              <>
                <X className="h-5 w-5 mr-2" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Nova Categoria
              </>
            )}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (!editingCategory && !slug) {
                    setSlug(generateSlug(e.target.value))
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Tutoriais"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slug (URL) *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Ex: tutoriais"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Breve descrição da categoria"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ícone
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVAILABLE_ICONS.map((iconData) => {
                  const IconComponent = iconData.icon
                  return (
                    <button
                      key={iconData.name}
                      type="button"
                      onClick={() => setIcon(iconData.name)}
                      className={`p-2 rounded-lg border-2 transition-colors ${
                        icon === iconData.name
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      title={iconData.name}
                    >
                      <IconComponent className="h-5 w-5 mx-auto" style={{ color: icon === iconData.name ? color : undefined }} />
                    </button>
                  )
                })}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cor
              </label>
              <div className="space-y-2">
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_COLORS.map((presetColor) => (
                    <button
                      key={presetColor}
                      type="button"
                      onClick={() => setColor(presetColor)}
                      className={`h-10 w-full rounded-lg border-2 transition-colors ${
                        color === presetColor
                          ? 'border-gray-900 dark:border-white'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: presetColor }}
                      title={presetColor}
                    />
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-gray-400" />
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-full border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm w-32"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ordem de Exibição
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 999)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="999"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Menor número aparece primeiro
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de Categorias */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Categorias Existentes
          </h2>
        </div>
        
        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <Grid className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Nenhuma categoria cadastrada
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Crie a primeira categoria para organizar os artigos
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map((category) => {
              const IconComponent = getIconComponent(category.icon)
              
              return (
                <div
                  key={category.id}
                  className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-gray-400">
                      <GripVertical className="h-5 w-5" />
                      <span className="ml-2 text-sm font-medium">
                        {category.display_order}
                      </span>
                    </div>
                    
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <IconComponent 
                        className="h-6 w-6" 
                        style={{ color: category.color }}
                      />
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {category.description || 'Sem descrição'}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Slug: {category.slug}</span>
                        <span>{category.article_count || 0} artigos</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(category)}
                      disabled={category.article_count && category.article_count > 0}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={category.article_count && category.article_count > 0 ? 'Categoria possui artigos' : 'Excluir'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}