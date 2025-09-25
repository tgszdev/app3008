'use client'

import { useState, useEffect } from 'react'
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
  Package2,
  PackageCheck,
  PackageX,
  PackageSearch,
  PackagePlus,
  PackageMinus,
  Boxes,
  Warehouse,
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
  ClipboardList,
  ClipboardCheck,
  ListChecks,
  Layers,
  LayoutGrid,
  Grid3x3,
  ScanLine,
  QrCode,
  Scan,
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
  Activity,
  Building,
  Cog,
  Filter,
  Globe,
  Heart,
  Image,
  Lightbulb,
  Printer,
  Smartphone,
  Target,
  Headphones,
  Camera,
  Video,
  Store,
  ShoppingCart,
  CreditCard,
  Truck,
  Warehouse,
  BarChart3,
  PieChart,
  TrendingUp,
  Layers,
  Database,
  Server,
  Code,
  Terminal,
  Bug,
  GitBranch,
  Shield,
  Lock,
  Key,
  HardDrive,
  Disc,
  // Expansão completa de ícones
  BadgeDollarSign,
  Receipt,
  Wallet,
  Banknote,
  ShoppingBag,
  Gift,
  Percent,
  Forklift,
  PlaneTakeoff,
  ShipWheel,
  CarFront,
  BusFront,
  Train,
  MemoryStick,
  Router,
  Cable,
  MousePointer,
  Keyboard,
  FileCode,
  Braces,
  CommandIcon,
  PackageOpen,
  FileJson,
  FileX,
  Merge,
  TableProperties,
  BarChart2,
  LineChart,
  Gauge,
  CircuitBoard,
  Binary,
  DatabaseZap,
  Headset,
  PhoneOutgoing,
  PhoneIncoming,
  LifeBuoy,
  UserRound,
  Users2,
  Package2,
  ClipboardPen,
  ScanBarcode,
  // Novos ícones específicos
  Workflow,
  Network,
  Share2,
  RefreshCcw,
  ArrowLeftRight,
  Repeat,
  Shuffle,
  GitMerge,
  TruckIcon,
  FileCheck,
  CheckSquare,
  ShieldCheck,
  ListChecks,
  Calculator,
  FileSpreadsheet,
  BarChart4,
  PlusSquare,
  MinusSquare,
  FolderTree
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
  context_id?: string
  is_global: boolean
  parent_category_id?: string
  created_at: string
  updated_at: string
  created_by_user?: {
    id: string
    name: string
    email: string
  }
  contexts?: {
    id: string
    name: string
    type: string
    slug: string
  }
  parent_category?: {
    id: string
    name: string
    slug: string
  }
}

interface CategoryManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CategoryManagementModal({ isOpen, onClose }: CategoryManagementModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [contexts, setContexts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [organizationFilter, setOrganizationFilter] = useState('')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showIconDropdown, setShowIconDropdown] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '#3B82F6',
    is_active: true,
    display_order: 0,
    context_id: '',
    is_global: false,
    parent_category_id: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])



  const fetchCategories = async () => {
    setLoading(true)
    try {
      // Buscar categorias e contextos em paralelo
      const [categoriesResponse, contextsResponse] = await Promise.all([
        fetch('/api/categories', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }),
        fetch('/api/contexts/for-categories', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
      ])
      
      // Processar categorias
      if (!categoriesResponse.ok) {
        const errorData = await categoriesResponse.json()
        throw new Error(errorData.error || `HTTP error! status: ${categoriesResponse.status}`)
      }
      
      const categoriesData = await categoriesResponse.json()
      console.log('Categories data:', categoriesData)
      
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData)
      } else if (categoriesData.categories) {
        setCategories(categoriesData.categories)
      } else {
        setCategories([])
      }
      
      // Processar contextos
      if (contextsResponse.ok) {
        const contextsData = await contextsResponse.json()
        console.log('Contexts data:', contextsData)
        setContexts(contextsData.all || [])
      } else {
        console.warn('Erro ao carregar contextos, continuando sem eles')
        setContexts([])
      }
      
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error)
      
      if (error.message.includes('404') || error.message.includes('Not found')) {
        setCategories([])
        setContexts([])
      } else {
        toast.error('Erro ao carregar dados: ' + (error.message || 'Erro desconhecido'))
        setCategories([])
        setContexts([])
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
      setEditingCategory(null)
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: '',
        color: '#3B82F6',
        is_active: true,
        display_order: 0,
        context_id: '',
        is_global: false,
        parent_category_id: ''
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
      display_order: category.display_order || 0,
      context_id: category.context_id || '',
      is_global: category.is_global || false,
      parent_category_id: category.parent_category_id || ''
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

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesOrganization = !organizationFilter || 
                               (organizationFilter === 'global' && category.is_global) ||
                               (organizationFilter === 'specific' && !category.is_global) ||
                               (organizationFilter !== 'global' && organizationFilter !== 'specific' && 
                                category.contexts?.id === organizationFilter)
    
    return matchesSearch && matchesOrganization
  })

  // Lista minimalista de ícones - organizada de forma simples
  const allIcons = [
    // BÁSICOS E ESSENCIAIS
    'home', 'settings', 'user', 'users', 'folder', 'file-text', 'search', 'bell', 'heart', 'star', 'info', 'help-circle', 'target', 'award', 'flag',
    
    // HELP DESK E SUPORTE 
    'headset', 'life-buoy', 'phone', 'message-square', 'mail', 'chat', 'user-round', 'users-2', 'message-circle', 'phone-call', 'headphones', 'mic',
    
    // NEGÓCIOS E VENDAS
    'shop', 'cart', 'bag', 'money', 'card', 'wallet', 'receipt', 'percent', 'growth', 'decline', 'chart', 'graph', 'analytics', 'trophy', 'crown', 'gem',
    
    // WAREHOUSE E LOGÍSTICA
    'warehouse', 'package', 'package-2', 'boxes', 'archive', 'truck', 'forklift', 'delivery', 'plane', 'ship', 'car', 'train', 'bike', 'route', 'navigation',
    
    // RECEBIMENTO E EXPEDIÇÃO
    'truck-icon', 'package-check', 'clipboard-check', 'file-check', 'check-square', 'shield-check', 'send', 'package-search', 'map-pin', 'calendar', 'clock',
    
    // INVENTÁRIO E DADOS
    'list-checks', 'calculator', 'file-spreadsheet', 'bar-chart-4', 'plus-square', 'minus-square', 'clipboard', 'clipboard-pen', 'database', 'hard-drive',
    
    // IMPRESSORAS E EQUIPAMENTOS ZEBRA  
    'printer', 'scan-line', 'qr-code', 'tag', 'hash', 'radio', 'smartphone', 'tablet', 'bluetooth', 'wifi', 'usb', 'battery', 'power', 'memory-stick',
    
    // TECNOLOGIA E SISTEMAS
    'monitor', 'cpu', 'server', 'cloud', 'router', 'cable', 'keyboard', 'mouse-pointer', 'app-window', 'terminal', 'command', 'layout', 'layout-grid', 'layout-dashboard',
    
    // ARQUIVOS E DOCUMENTOS
    'file-code-2', 'file-image', 'file-spreadsheet', 'file-text', 'folder', 'folder-open', 'archive', 'download', 'upload', 'copy', 'move', 'trash-2',
    
    // COMUNICAÇÃO E ALERTAS
    'warning', 'alert', 'success', 'error', 'bell-off', 'mic-off', 'volume-up', 'volume-off', 'refresh-cw', 'rotate-cw', 'activity', 'zap', 'lightbulb',
    
    // INTEGRAÇÃO E WORKFLOW
    'workflow', 'network', 'share-2', 'refresh-ccw', 'arrow-left-right', 'repeat', 'shuffle', 'git-merge', 'git-branch', 'merge',
    
    // EMPRESA E ESCRITÓRIO
    'building', 'office', 'factory', 'briefcase', 'globe', 'filter', 'code', 'wrench', 'shield', 'lock', 'key', 'eye', 'eye-off'
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
              <select
                value={organizationFilter}
                onChange={(e) => setOrganizationFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
              >
                <option value="">Todas as organizações</option>
                <option value="global">Categorias Globais</option>
                <option value="specific">Categorias Específicas</option>
                {contexts.map((context) => (
                  <option key={context.id} value={context.id}>
                    {context.name} ({context.type === 'organization' ? 'Organização' : 'Departamento'})
                  </option>
                ))}
              </select>
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
            {/* Resumo das categorias */}
            {!loading && categories.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Resumo das Categorias
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-600 dark:text-gray-400">Globais:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {categories.filter(c => c.is_global).length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-green-600" />
                    <span className="text-gray-600 dark:text-gray-400">Específicas:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {categories.filter(c => !c.is_global).length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package2 className="h-4 w-4 text-orange-600" />
                    <span className="text-gray-600 dark:text-gray-400">Total:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {categories.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-green-600" />
                    <span className="text-gray-600 dark:text-gray-400">Ativas:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {categories.filter(c => c.is_active).length}
                    </span>
                  </div>
                </div>
              </div>
            )}

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
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {category.name}
                              </h3>
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                                {category.slug}
                              </span>
                              {category.is_global ? (
                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  Global
                                </span>
                              ) : category.contexts ? (
                                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400 flex items-center gap-1">
                                  <Box className="h-3 w-3" />
                                  {category.contexts.name}
                                  <span className="text-xs opacity-75">
                                    ({category.contexts.type === 'organization' ? 'Org' : 'Dept'})
                                  </span>
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/20 rounded-full text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                  <Package2 className="h-3 w-3" />
                                  Específica
                                </span>
                              )}
                              {!category.is_active && (
                                <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center gap-1">
                                  <EyeOff className="h-3 w-3" />
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

                      {/* Campos de Contexto */}
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                          <Building className="inline h-4 w-4 mr-1" />
                          Contexto da Categoria
                        </h4>
                        
                        <div className="space-y-4">
                          {/* Tipo de Categoria */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Tipo
                            </label>
                            <div className="flex space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="category_type"
                                  value="global"
                                  checked={formData.is_global}
                                  onChange={(e) => setFormData({ 
                                    ...formData, 
                                    is_global: true, 
                                    context_id: '' 
                                  })}
                                  className="mr-2"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  Global (todas as organizações)
                                </span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="category_type"
                                  value="specific"
                                  checked={!formData.is_global}
                                  onChange={(e) => setFormData({ 
                                    ...formData, 
                                    is_global: false 
                                  })}
                                  className="mr-2"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  Específica
                                </span>
                              </label>
                            </div>
                          </div>

                          {/* Seleção de Contexto (apenas se não for global) */}
                          {!formData.is_global && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Building className="inline h-4 w-4 mr-1" />
                                Organização/Departamento
                              </label>
                              <select
                                value={formData.context_id}
                                onChange={(e) => setFormData({ ...formData, context_id: e.target.value })}
                                required={!formData.is_global}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Selecione uma organização/departamento</option>
                                {contexts.map((context) => (
                                  <option key={context.id} value={context.id}>
                                    {context.name} ({context.type === 'organization' ? 'Organização' : 'Departamento'})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Categoria Pai */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              <FolderTree className="inline h-4 w-4 mr-1" />
                              Categoria Pai (opcional)
                            </label>
                            <select
                              value={formData.parent_category_id}
                              onChange={(e) => setFormData({ ...formData, parent_category_id: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Nenhuma (categoria raiz)</option>
                              {categories
                                .filter(cat => cat.id !== editingCategory?.id) // Evitar auto-referência
                                .map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name} {category.contexts ? `(${category.contexts.name})` : category.is_global ? '(Global)' : ''}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Ícone
                          </label>
                          <div className="relative">
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
                                    <span>{formData.icon}</span>
                                  </>
                                ) : (
                                  <span className="text-gray-500">Selecione...</span>
                                )}
                              </div>
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            
                            {showIconDropdown && (
                              <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
                                {/* Overlay */}
                                <div 
                                  className="fixed inset-0 bg-black bg-opacity-50" 
                                  onClick={() => setShowIconDropdown(false)}
                                />
                                
                                {/* Modal Minimalista */}
                                <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[700px] overflow-hidden">
                                  {/* Header Simples */}
                                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Selecionar Ícone</h3>
                                    <button
                                      type="button"
                                      onClick={() => setShowIconDropdown(false)}
                                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                      <X className="h-5 w-5" />
                                    </button>
                                  </div>
                                  
                                  {/* Grid Fixo de Ícones */}
                                  <div 
                                    className="p-6 overflow-y-auto overflow-x-hidden" 
                                    style={{ 
                                      height: '600px',
                                      scrollbarWidth: 'thin',
                                      scrollbarColor: '#9CA3AF #E5E7EB'
                                    }}
                                  >
                                    <div className="flex justify-center px-4">
                                      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-4 w-fit mx-auto">
                                      {allIcons.map((iconName) => {
                                        const IconComponent = getIcon(iconName)
                                        const isSelected = formData.icon === iconName
                                        return (
                                          <button
                                            key={iconName}
                                            type="button"
                                            onClick={() => {
                                              setFormData({ ...formData, icon: iconName })
                                              setShowIconDropdown(false)
                                            }}
                                            className={`
                                              flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded border transition-colors flex-shrink-0
                                              ${isSelected 
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                                                : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                              }
                                            `}
                                            title={iconName}
                                          >
                                            <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                                          </button>
                                        )
                                      })}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Footer com contador */}
                                  <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {allIcons.length} ícones disponíveis
                                    </span>
                                  </div>
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