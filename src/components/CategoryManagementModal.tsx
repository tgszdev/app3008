'use client'

import { useState, useEffect, useRef } from 'react'
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
  Hash,
  Palette,
  Type,
  FileText,
  Eye,
  EyeOff,
  Folder,
  Package,
  Truck,
  ShoppingCart,
  ShoppingBag,
  Archive,
  Box,
  Container,
  Map,
  Navigation,
  Compass,
  Plane,
  Ship,
  Car,
  Bike,
  Route,
  MapPin,
  Clipboard,
  BookOpen,
  Briefcase,
  HelpCircle,
  Info,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  Settings,
  Wrench,
  Shield,
  Lock,
  Key,
  Database,
  Server,
  Cloud,
  Wifi,
  Cpu,
  Monitor,
  Mail,
  Phone,
  MessageSquare,
  Send,
  DollarSign,
  CreditCard,
  BarChart,
  TrendingUp,
  Users,
  User,
  UserCheck,
  Home,
  Star,
  Flag,
  Tag,
  Zap,
  Activity
} from 'lucide-react'
import { getIcon } from '@/lib/icons'

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

interface CategoryManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CategoryManagementModal({ isOpen, onClose }: CategoryManagementModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showIconDropdown, setShowIconDropdown] = useState(false)
  const [iconSearchTerm, setIconSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '#3B82F6',
    is_active: true,
    display_order: 0
  })

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  // Handle click outside of dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowIconDropdown(false)
        setIconSearchTerm('')
      }
    }

    if (showIconDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showIconDropdown])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Categories data:', data)
      
      // Tratar diferentes formatos de resposta
      if (Array.isArray(data)) {
        setCategories(data)
      } else if (data.categories) {
        setCategories(data.categories)
      } else {
        setCategories([])
      }
    } catch (error: any) {
      console.error('Erro ao buscar categorias:', error)
      
      // Se for erro 404 ou similar, ainda mostrar interface vazia
      if (error.message.includes('404') || error.message.includes('Not found')) {
        setCategories([])
      } else {
        toast.error('Erro ao carregar categorias: ' + (error.message || 'Erro desconhecido'))
        setCategories([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingCategory 
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories'
      
      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar categoria')
      }
      
      toast.success(editingCategory ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!')
      
      setShowCategoryModal(false)
      setShowIconDropdown(false)
      setIconSearchTerm('')
      setEditingCategory(null)
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: '',
        color: '#3B82F6',
        is_active: true,
        display_order: 0
      })
      fetchCategories()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar categoria')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '#3B82F6',
      is_active: category.is_active,
      display_order: category.display_order || 0
    })
    setShowCategoryModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return
    
    setDeletingId(id)
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir categoria')
      }
      
      toast.success('Categoria excluída com sucesso!')
      fetchCategories()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir categoria')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (category: Category) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...category,
          is_active: !category.is_active
        })
      })
      
      if (!response.ok) {
        throw new Error('Erro ao alterar status')
      }
      
      toast.success(`Categoria ${!category.is_active ? 'ativada' : 'desativada'} com sucesso!`)
      fetchCategories()
    } catch (error) {
      toast.error('Erro ao alterar status da categoria')
    }
  }

  const handleReorder = async (category: Category, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === category.id)
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (newIndex < 0 || newIndex >= categories.length) return
    
    const newCategories = [...categories]
    const temp = newCategories[currentIndex]
    newCategories[currentIndex] = newCategories[newIndex]
    newCategories[newIndex] = temp
    
    // Update display_order for both categories
    try {
      await Promise.all([
        fetch(`/api/categories/${newCategories[currentIndex].id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...newCategories[currentIndex],
            display_order: currentIndex
          })
        }),
        fetch(`/api/categories/${newCategories[newIndex].id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...newCategories[newIndex],
            display_order: newIndex
          })
        })
      ])
      
      fetchCategories()
      toast.success('Ordem atualizada com sucesso!')
    } catch (error) {
      toast.error('Erro ao reordenar categorias')
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Lista de ícones disponíveis com foco em logística e operações
  const iconsList = [
    // Logística e Transporte
    { value: 'package', label: 'Pacote', icon: 'Package' },
    { value: 'truck', label: 'Caminhão', icon: 'Truck' },
    { value: 'shopping-cart', label: 'Carrinho', icon: 'ShoppingCart' },
    { value: 'shopping-bag', label: 'Sacola', icon: 'ShoppingBag' },
    { value: 'archive', label: 'Arquivo', icon: 'Archive' },
    { value: 'box', label: 'Caixa', icon: 'Box' },
    { value: 'container', label: 'Container', icon: 'Container' },
    { value: 'map', label: 'Mapa', icon: 'Map' },
    { value: 'navigation', label: 'Navegação', icon: 'Navigation' },
    { value: 'compass', label: 'Bússola', icon: 'Compass' },
    { value: 'plane', label: 'Avião', icon: 'Plane' },
    { value: 'ship', label: 'Navio', icon: 'Ship' },
    { value: 'car', label: 'Carro', icon: 'Car' },
    { value: 'bike', label: 'Bicicleta', icon: 'Bike' },
    { value: 'route', label: 'Rota', icon: 'Route' },
    { value: 'map-pin', label: 'Local', icon: 'MapPin' },
    
    // Documentação e Gestão
    { value: 'file-text', label: 'Documento', icon: 'FileText' },
    { value: 'clipboard', label: 'Prancheta', icon: 'Clipboard' },
    { value: 'book-open', label: 'Manual', icon: 'BookOpen' },
    { value: 'folder', label: 'Pasta', icon: 'Folder' },
    { value: 'briefcase', label: 'Maleta', icon: 'Briefcase' },
    
    // Status e Alertas
    { value: 'help-circle', label: 'Ajuda', icon: 'HelpCircle' },
    { value: 'info', label: 'Informação', icon: 'Info' },
    { value: 'alert-circle', label: 'Alerta', icon: 'AlertCircle' },
    { value: 'check-circle', label: 'Concluído', icon: 'CheckCircle' },
    { value: 'clock', label: 'Tempo', icon: 'Clock' },
    { value: 'calendar', label: 'Calendário', icon: 'Calendar' },
    
    // Ferramentas e Configurações
    { value: 'settings', label: 'Configurações', icon: 'Settings' },
    { value: 'tool', label: 'Ferramenta', icon: 'Wrench' },
    { value: 'wrench', label: 'Chave Inglesa', icon: 'Wrench' },
    { value: 'shield', label: 'Segurança', icon: 'Shield' },
    { value: 'lock', label: 'Bloqueado', icon: 'Lock' },
    { value: 'key', label: 'Chave', icon: 'Key' },
    
    // Tecnologia
    { value: 'database', label: 'Banco de Dados', icon: 'Database' },
    { value: 'server', label: 'Servidor', icon: 'Server' },
    { value: 'cloud', label: 'Nuvem', icon: 'Cloud' },
    { value: 'wifi', label: 'Wi-Fi', icon: 'Wifi' },
    { value: 'cpu', label: 'Processador', icon: 'Cpu' },
    { value: 'monitor', label: 'Monitor', icon: 'Monitor' },
    
    // Comunicação
    { value: 'mail', label: 'E-mail', icon: 'Mail' },
    { value: 'phone', label: 'Telefone', icon: 'Phone' },
    { value: 'message-square', label: 'Mensagem', icon: 'MessageSquare' },
    { value: 'send', label: 'Enviar', icon: 'Send' },
    
    // Finanças
    { value: 'dollar-sign', label: 'Financeiro', icon: 'DollarSign' },
    { value: 'credit-card', label: 'Cartão', icon: 'CreditCard' },
    { value: 'bar-chart', label: 'Gráfico', icon: 'BarChart' },
    { value: 'trending-up', label: 'Crescimento', icon: 'TrendingUp' },
    
    // Usuários
    { value: 'users', label: 'Equipe', icon: 'Users' },
    { value: 'user', label: 'Usuário', icon: 'User' },
    { value: 'user-check', label: 'Usuário Verificado', icon: 'UserCheck' },
    
    // Outros
    { value: 'home', label: 'Início', icon: 'Home' },
    { value: 'star', label: 'Favorito', icon: 'Star' },
    { value: 'flag', label: 'Bandeira', icon: 'Flag' },
    { value: 'tag', label: 'Etiqueta', icon: 'Tag' },
    { value: 'zap', label: 'Energia', icon: 'Zap' },
    { value: 'activity', label: 'Atividade', icon: 'Activity' }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Folder className="h-6 w-6 mr-2 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Gerenciamento de Categorias
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Search and Add */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => {
                  setEditingCategory(null)
                  setFormData({
                    name: '',
                    slug: '',
                    description: '',
                    icon: '',
                    color: '#3B82F6',
                    is_active: true,
                    display_order: categories.length
                  })
                  setShowCategoryModal(true)
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nova Categoria
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-5 sm:p-6 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  Nenhuma categoria encontrada
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Comece criando uma nova categoria.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredCategories.map((category, index) => {
                  const Icon = getIcon(category.icon)
                  return (
                    <div
                      key={category.id}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            <Icon className="h-5 w-5" style={{ color: category.color }} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {category.name}
                              </h3>
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                                {category.slug}
                              </span>
                              {!category.is_active && (
                                <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                                  Inativa
                                </span>
                              )}
                            </div>
                            {category.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleReorder(category, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReorder(category, 'down')}
                            disabled={index === filteredCategories.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(category)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {category.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            disabled={deletingId === category.id}
                            className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          >
                            {deletingId === category.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Category Form Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 z-60 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => {
                  setShowCategoryModal(false)
                  setShowIconDropdown(false)
                  setIconSearchTerm('')
                }}
              />
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleSubmit}>
                  <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Type className="inline h-4 w-4 mr-1" />
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
                              slug: editingCategory ? formData.slug : generateSlug(e.target.value)
                            })
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Hash className="inline h-4 w-4 mr-1" />
                          Slug
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <FileText className="inline h-4 w-4 mr-1" />
                          Descrição
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Ícone
                          </label>
                          <div className="relative" ref={dropdownRef}>
                            <button
                              type="button"
                              onClick={() => setShowIconDropdown(!showIconDropdown)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-2">
                                {formData.icon ? (
                                  <>
                                    {(() => {
                                      const IconComponent = getIcon(formData.icon)
                                      return <IconComponent className="h-4 w-4" />
                                    })()}
                                    <span>{iconsList.find(i => i.value === formData.icon)?.label || formData.icon}</span>
                                  </>
                                ) : (
                                  <span className="text-gray-500">Selecione...</span>
                                )}
                              </div>
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            
                            {showIconDropdown && (
                              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                                  <input
                                    type="text"
                                    placeholder="Buscar ícone..."
                                    value={iconSearchTerm}
                                    onChange={(e) => setIconSearchTerm(e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div className="p-1">
                                  {iconsList
                                    .filter(icon => 
                                      icon.label.toLowerCase().includes(iconSearchTerm.toLowerCase()) ||
                                      icon.value.toLowerCase().includes(iconSearchTerm.toLowerCase())
                                    )
                                    .map(icon => {
                                      const IconComponent = getIcon(icon.value)
                                      return (
                                        <button
                                          key={icon.value}
                                          type="button"
                                          onClick={() => {
                                            setFormData({ ...formData, icon: icon.value })
                                            setShowIconDropdown(false)
                                            setIconSearchTerm('')
                                          }}
                                          className="w-full px-2 py-2 flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-left"
                                        >
                                          <IconComponent className="h-4 w-4 flex-shrink-0" />
                                          <span className="text-sm">{icon.label}</span>
                                        </button>
                                      )
                                    })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Palette className="inline h-4 w-4 mr-1" />
                            Cor
                          </label>
                          <input
                            type="color"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="is_active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Categoria ativa
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {editingCategory ? 'Atualizar' : 'Criar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryModal(false)
                        setShowIconDropdown(false)
                        setIconSearchTerm('')
                      }}
                      className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}