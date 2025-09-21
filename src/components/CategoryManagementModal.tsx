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
  Package,
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
  ArchiveRestore,
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
  MinusSquare
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

  // Categorias organizadas para melhor UX
  const iconCategories = [
    {
      name: '💼 E-commerce & Vendas',
      color: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      icons: [
        { value: 'store', label: 'Loja', icon: 'Store' },
        { value: 'shopping-cart', label: 'Carrinho', icon: 'ShoppingCart' },
        { value: 'shopping-bag', label: 'Sacola', icon: 'ShoppingBag' },
        { value: 'credit-card', label: 'Cartão', icon: 'CreditCard' },
        { value: 'dollar-sign', label: 'Dinheiro', icon: 'DollarSign' },
        { value: 'badge-dollar-sign', label: 'Badge $', icon: 'BadgeDollarSign' },
        { value: 'receipt', label: 'Recibo', icon: 'Receipt' },
        { value: 'wallet', label: 'Carteira', icon: 'Wallet' },
        { value: 'banknote', label: 'Nota', icon: 'Banknote' },
        { value: 'gift', label: 'Presente', icon: 'Gift' },
        { value: 'percent', label: 'Desconto', icon: 'Percent' }
      ]
    },
    {
      name: '📦 WMS & Armazém',
      color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      icons: [
        { value: 'warehouse', label: 'Armazém', icon: 'Warehouse' },
        { value: 'package', label: 'Pacote', icon: 'Package' },
        { value: 'package-2', label: 'Pacote 2', icon: 'Package2' },
        { value: 'package-open', label: 'Pacote Aberto', icon: 'PackageOpen' },
        { value: 'boxes', label: 'Caixas', icon: 'Boxes' },
        { value: 'archive', label: 'Arquivo', icon: 'Archive' },
        { value: 'archive-restore', label: 'Restaurar', icon: 'ArchiveRestore' },
        { value: 'scan', label: 'Scanner', icon: 'Scan' },
        { value: 'scan-barcode', label: 'Código Barras', icon: 'ScanBarcode' },
        { value: 'qr-code', label: 'QR Code', icon: 'QrCode' }
      ]
    },
    {
      name: '📥 Recebimento',
      color: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
      icons: [
        { value: 'truck-icon', label: 'Entrega', icon: 'TruckIcon' },
        { value: 'package-check', label: 'Conferir', icon: 'PackageCheck' },
        { value: 'clipboard-check', label: 'Checklist', icon: 'ClipboardCheck' },
        { value: 'file-check', label: 'Verificar', icon: 'FileCheck' },
        { value: 'check-square', label: 'Aprovar', icon: 'CheckSquare' },
        { value: 'shield-check', label: 'Validar', icon: 'ShieldCheck' }
      ]
    },
    {
      name: '📤 Expedição',
      color: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
      icons: [
        { value: 'send', label: 'Enviar', icon: 'Send' },
        { value: 'package-search', label: 'Localizar', icon: 'PackageSearch' },
        { value: 'map-pin', label: 'Destino', icon: 'MapPin' },
        { value: 'calendar', label: 'Agendar', icon: 'Calendar' },
        { value: 'clock', label: 'Prazo', icon: 'Clock' },
        { value: 'truck', label: 'Transporte', icon: 'Truck' }
      ]
    },
    {
      name: '📊 Inventário',
      color: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800',
      icons: [
        { value: 'list-checks', label: 'Contagem', icon: 'ListChecks' },
        { value: 'calculator', label: 'Calcular', icon: 'Calculator' },
        { value: 'file-spreadsheet', label: 'Planilha', icon: 'FileSpreadsheet' },
        { value: 'bar-chart-4', label: 'Relatório', icon: 'BarChart4' },
        { value: 'plus-square', label: 'Adicionar', icon: 'PlusSquare' },
        { value: 'minus-square', label: 'Remover', icon: 'MinusSquare' },
        { value: 'clipboard', label: 'Inventário', icon: 'Clipboard' },
        { value: 'clipboard-pen', label: 'Ajustar', icon: 'ClipboardPen' }
      ]
    },
    {
      name: '🔗 Integração',
      color: 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800',
      icons: [
        { value: 'workflow', label: 'Fluxo', icon: 'Workflow' },
        { value: 'network', label: 'Rede', icon: 'Network' },
        { value: 'share-2', label: 'Sincronizar', icon: 'Share2' },
        { value: 'refresh-ccw', label: 'Atualizar', icon: 'RefreshCcw' },
        { value: 'arrow-left-right', label: 'Trocar', icon: 'ArrowLeftRight' },
        { value: 'repeat', label: 'Repetir', icon: 'Repeat' },
        { value: 'shuffle', label: 'Reorganizar', icon: 'Shuffle' },
        { value: 'git-merge', label: 'Unificar', icon: 'GitMerge' }
      ]
    },
    {
      name: '🚛 Logística & TMS',
      color: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
      icons: [
        { value: 'forklift', label: 'Empilhadeira', icon: 'Forklift' },
        { value: 'route', label: 'Rota', icon: 'Route' },
        { value: 'navigation', label: 'GPS', icon: 'Navigation' },
        { value: 'plane', label: 'Avião', icon: 'Plane' },
        { value: 'plane-takeoff', label: 'Decolagem', icon: 'PlaneTakeoff' },
        { value: 'ship', label: 'Navio', icon: 'Ship' },
        { value: 'ship-wheel', label: 'Timão', icon: 'ShipWheel' },
        { value: 'car', label: 'Carro', icon: 'Car' },
        { value: 'car-front', label: 'Veículo', icon: 'CarFront' },
        { value: 'bus-front', label: 'Ônibus', icon: 'BusFront' },
        { value: 'train', label: 'Trem', icon: 'Train' },
        { value: 'bike', label: 'Bicicleta', icon: 'Bike' }
      ]
    },
    {
      name: '💻 Tecnologia',
      color: 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700',
      icons: [
        { value: 'monitor', label: 'Monitor', icon: 'Monitor' },
        { value: 'cpu', label: 'CPU', icon: 'Cpu' },
        { value: 'memory-stick', label: 'Memória', icon: 'MemoryStick' },
        { value: 'circuit-board', label: 'Placa', icon: 'CircuitBoard' },
        { value: 'server', label: 'Servidor', icon: 'Server' },
        { value: 'cloud', label: 'Nuvem', icon: 'Cloud' },
        { value: 'wifi', label: 'WiFi', icon: 'Wifi' },
        { value: 'router', label: 'Roteador', icon: 'Router' },
        { value: 'cable', label: 'Cabo', icon: 'Cable' },
        { value: 'mouse-pointer', label: 'Mouse', icon: 'MousePointer' },
        { value: 'keyboard', label: 'Teclado', icon: 'Keyboard' },
        { value: 'smartphone', label: 'Celular', icon: 'Smartphone' },
        { value: 'settings', label: 'Config', icon: 'Settings' }
      ]
    },
    {
      name: '📊 Dados & Analytics',
      color: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      icons: [
        { value: 'database', label: 'Database', icon: 'Database' },
        { value: 'database-zap', label: 'DB Ativo', icon: 'DatabaseZap' },
        { value: 'hard-drive', label: 'HD', icon: 'HardDrive' },
        { value: 'disc', label: 'Disco', icon: 'Disc' },
        { value: 'table-properties', label: 'Tabela', icon: 'TableProperties' },
        { value: 'bar-chart', label: 'Gráfico', icon: 'BarChart' },
        { value: 'bar-chart-2', label: 'Chart 2', icon: 'BarChart2' },
        { value: 'bar-chart-3', label: 'Chart 3', icon: 'BarChart3' },
        { value: 'pie-chart', label: 'Pizza', icon: 'PieChart' },
        { value: 'line-chart', label: 'Linha', icon: 'LineChart' },
        { value: 'trending-up', label: 'Crescimento', icon: 'TrendingUp' },
        { value: 'gauge', label: 'Medidor', icon: 'Gauge' },
        { value: 'binary', label: 'Binário', icon: 'Binary' }
      ]
    },
    {
      name: '🎧 Suporte',
      color: 'bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800',
      icons: [
        { value: 'headset', label: 'Suporte', icon: 'Headset' },
        { value: 'life-buoy', label: 'Ajuda', icon: 'LifeBuoy' },
        { value: 'help-circle', label: 'Dúvida', icon: 'HelpCircle' },
        { value: 'phone', label: 'Telefone', icon: 'Phone' },
        { value: 'phone-outgoing', label: 'Ligar', icon: 'PhoneOutgoing' },
        { value: 'phone-incoming', label: 'Receber', icon: 'PhoneIncoming' },
        { value: 'message-square', label: 'Chat', icon: 'MessageSquare' },
        { value: 'message-circle', label: 'Mensagem', icon: 'MessageCircle' },
        { value: 'mail', label: 'Email', icon: 'Mail' },
        { value: 'user-round', label: 'Usuário', icon: 'UserRound' },
        { value: 'users', label: 'Equipe', icon: 'Users' },
        { value: 'users-2', label: 'Grupo', icon: 'Users2' },
        { value: 'user', label: 'Pessoa', icon: 'User' }
      ]
    },
    {
      name: '🔧 Geral',
      color: 'bg-slate-50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-700',
      icons: [
        { value: 'home', label: 'Início', icon: 'Home' },
        { value: 'building', label: 'Empresa', icon: 'Building' },
        { value: 'briefcase', label: 'Negócios', icon: 'Briefcase' },
        { value: 'target', label: 'Meta', icon: 'Target' },
        { value: 'star', label: 'Estrela', icon: 'Star' },
        { value: 'award', label: 'Prêmio', icon: 'Award' },
        { value: 'flag', label: 'Bandeira', icon: 'Flag' },
        { value: 'lightbulb', label: 'Ideia', icon: 'Lightbulb' },
        { value: 'heart', label: 'Coração', icon: 'Heart' },
        { value: 'globe', label: 'Global', icon: 'Globe' },
        { value: 'search', label: 'Busca', icon: 'Search' },
        { value: 'filter', label: 'Filtro', icon: 'Filter' },
        { value: 'tag', label: 'Tag', icon: 'Tag' },
        { value: 'hash', label: 'Hash', icon: 'Hash' },
        { value: 'check-circle', label: 'OK', icon: 'CheckCircle' },
        { value: 'alert-circle', label: 'Alerta', icon: 'AlertCircle' },
        { value: 'alert-triangle', label: 'Atenção', icon: 'AlertTriangle' },
        { value: 'info', label: 'Info', icon: 'Info' },
        { value: 'bell', label: 'Sino', icon: 'Bell' },
        { value: 'zap', label: 'Energia', icon: 'Zap' },
        { value: 'activity', label: 'Atividade', icon: 'Activity' }
      ]
    }
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
                                    <span>{iconsList.find(i => i.value === formData.icon)?.label || formData.icon}</span>
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
                                  className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
                                  onClick={() => setShowIconDropdown(false)}
                                />
                                
                                {/* Modal Responsivo */}
                                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl mx-auto overflow-hidden">
                                  {/* Header Melhorado */}
                                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Selecionar Ícone</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Escolha um ícone para representar esta categoria</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setShowIconDropdown(false)}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                      >
                                        <X className="h-6 w-6" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Conteúdo por Categorias */}
                                  <div className="max-h-[70vh] overflow-y-auto">
                                    {iconCategories.map((category, categoryIndex) => (
                                      <div key={categoryIndex} className="p-4 sm:p-6">
                                        {/* Título da Categoria */}
                                        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium mb-4 ${category.color}`}>
                                          {category.name}
                                        </div>
                                        
                                        {/* Grid de Ícones Responsivo */}
                                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14 gap-2 sm:gap-3">
                                          {category.icons.map(icon => {
                                            const IconComponent = getIcon(icon.value)
                                            const isSelected = formData.icon === icon.value
                                            return (
                                              <button
                                                key={icon.value}
                                                type="button"
                                                onClick={() => {
                                                  setFormData({ ...formData, icon: icon.value })
                                                  setShowIconDropdown(false)
                                                }}
                                                className={`
                                                  group relative flex items-center justify-center p-2 sm:p-3 rounded-xl border-2 transition-all duration-200
                                                  w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14
                                                  ${isSelected 
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg scale-105' 
                                                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                                  } hover:shadow-lg hover:scale-105 active:scale-95
                                                `}
                                              >
                                                <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`} />
                                                
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                  {icon.label}
                                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                                                </div>
                                                
                                                {/* Indicador de Seleção */}
                                                {isSelected && (
                                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <CheckCircle className="w-3 h-3 text-white" />
                                                  </div>
                                                )}
                                              </button>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Footer com Info */}
                                  <div className="bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                      {iconCategories.reduce((total, cat) => total + cat.icons.length, 0)} ícones disponíveis • Organizados por categoria para facilitar a seleção
                                    </p>
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