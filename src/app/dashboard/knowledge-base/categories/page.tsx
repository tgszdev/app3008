'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
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
  Palette,
  GripVertical,
  Search,
  ChevronDown,
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
  Folder
} from 'lucide-react'
import { getIcon } from '@/lib/icons'
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

// Lista de ícones disponíveis com foco em logística e WMS
const iconsList = [
  // WMS - Warehouse Management System
  { value: 'warehouse', label: 'Armazém', icon: 'Warehouse' },
  { value: 'package', label: 'Pacote', icon: 'Package' },
  { value: 'package-2', label: 'Caixa Aberta', icon: 'Package2' },
  { value: 'package-check', label: 'Pacote Verificado', icon: 'PackageCheck' },
  { value: 'package-x', label: 'Pacote Rejeitado', icon: 'PackageX' },
  { value: 'package-search', label: 'Buscar Pacote', icon: 'PackageSearch' },
  { value: 'package-plus', label: 'Adicionar Pacote', icon: 'PackagePlus' },
  { value: 'package-minus', label: 'Remover Pacote', icon: 'PackageMinus' },
  { value: 'boxes', label: 'Múltiplas Caixas', icon: 'Boxes' },
  { value: 'container', label: 'Container', icon: 'Container' },
  { value: 'pallet', label: 'Palete', icon: 'Package' },
  { value: 'barcode', label: 'Código de Barras', icon: 'ScanLine' },
  { value: 'qr-code', label: 'QR Code', icon: 'QrCode' },
  { value: 'scan', label: 'Scanner', icon: 'Scan' },
  { value: 'forklift', label: 'Empilhadeira', icon: 'Truck' },
  
  // Logística e Transporte
  { value: 'truck', label: 'Caminhão', icon: 'Truck' },
  { value: 'truck-delivery', label: 'Entrega', icon: 'Truck' },
  { value: 'shopping-cart', label: 'Carrinho', icon: 'ShoppingCart' },
  { value: 'shopping-bag', label: 'Sacola', icon: 'ShoppingBag' },
  { value: 'archive', label: 'Arquivo', icon: 'Archive' },
  { value: 'box', label: 'Caixa', icon: 'Box' },
  { value: 'map', label: 'Mapa', icon: 'Map' },
  { value: 'navigation', label: 'Navegação', icon: 'Navigation' },
  { value: 'compass', label: 'Bússola', icon: 'Compass' },
  { value: 'plane', label: 'Avião', icon: 'Plane' },
  { value: 'ship', label: 'Navio', icon: 'Ship' },
  { value: 'car', label: 'Carro', icon: 'Car' },
  { value: 'bike', label: 'Bicicleta', icon: 'Bike' },
  { value: 'route', label: 'Rota', icon: 'Route' },
  { value: 'map-pin', label: 'Local', icon: 'MapPin' },
  
  // Inventário e Estoque
  { value: 'clipboard-list', label: 'Lista de Inventário', icon: 'ClipboardList' },
  { value: 'clipboard-check', label: 'Checklist', icon: 'ClipboardCheck' },
  { value: 'list-checks', label: 'Lista de Tarefas', icon: 'ListChecks' },
  { value: 'layers', label: 'Camadas/Níveis', icon: 'Layers' },
  { value: 'layout-grid', label: 'Grade de Layout', icon: 'LayoutGrid' },
  { value: 'grid-3x3', label: 'Grade 3x3', icon: 'Grid3x3' },
  
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
  const [showIconDropdown, setShowIconDropdown] = useState(false)
  const [iconSearchTerm, setIconSearchTerm] = useState('')
  
  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('file-text')
  const [color, setColor] = useState('#6366F1')
  const [displayOrder, setDisplayOrder] = useState(999)

  const { hasPermission } = usePermissions()
  
  // Verificar permissão específica para gerenciar categorias
  const canManageCategories = hasPermission('kb_manage_categories')
  
  // Fallback para compatibilidade
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
    setIcon('file-text')
    setColor('#6366F1')
    setDisplayOrder(999)
    setEditingCategory(null)
    setShowForm(false)
    setShowIconDropdown(false)
    setIconSearchTerm('')
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
      console.error('Response:', error.response)
      
      const errorMessage = error.response?.data?.error || 'Erro ao salvar categoria'
      const errorDetails = error.response?.data?.details || ''
      const errorHint = error.response?.data?.hint || ''
      
      if (errorDetails || errorHint) {
        toast.error(
          <div>
            <p className="font-semibold">{errorMessage}</p>
            {errorDetails && <p className="text-sm mt-1">{errorDetails}</p>}
            {errorHint && <p className="text-sm mt-1 italic">{errorHint}</p>}
          </div>,
          { duration: 6000 }
        )
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category: Category) => {
    const articleCount = category.article_count || 0
    if (articleCount > 0) {
      toast.error(`Esta categoria possui ${articleCount} artigo(s) e não pode ser excluída`)
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
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowIconDropdown(!showIconDropdown)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    {icon ? (
                      <>
                        {(() => {
                          const IconComponent = getIcon(icon)
                          return <IconComponent className="h-4 w-4" />
                        })()}
                        <span>{iconsList.find(i => i.value === icon)?.label || icon}</span>
                      </>
                    ) : (
                      <span className="text-gray-500">Selecione...</span>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {showIconDropdown && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Overlay */}
                    <div 
                      className="fixed inset-0 bg-black bg-opacity-50" 
                      onClick={() => {
                        setShowIconDropdown(false)
                        setIconSearchTerm('')
                      }}
                    />
                    
                    {/* Popup Modal */}
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                      {/* Header */}
                      <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Selecionar Ícone</h3>
                          <button
                            type="button"
                            onClick={() => {
                              setShowIconDropdown(false)
                              setIconSearchTerm('')
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        
                        {/* Search Bar */}
                        <div className="mt-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Buscar ícone..."
                              value={iconSearchTerm}
                              onChange={(e) => setIconSearchTerm(e.target.value)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              autoFocus
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Icons Grid */}
                      <div className="p-4 overflow-y-auto max-h-[60vh]">
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {iconsList
                            .filter(iconItem => 
                              iconItem.label.toLowerCase().includes(iconSearchTerm.toLowerCase()) ||
                              iconItem.value.toLowerCase().includes(iconSearchTerm.toLowerCase())
                            )
                            .map(iconItem => {
                              const IconComponent = getIcon(iconItem.value)
                              const isSelected = icon === iconItem.value
                              return (
                                <button
                                  key={iconItem.value}
                                  type="button"
                                  onClick={() => {
                                    setIcon(iconItem.value)
                                    setShowIconDropdown(false)
                                    setIconSearchTerm('')
                                  }}
                                  className={`
                                    flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                                    ${isSelected 
                                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }
                                  `}
                                  title={iconItem.label}
                                >
                                  <IconComponent className={`h-6 w-6 mb-1 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
                                  <span className={`text-xs ${isSelected ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {iconItem.label}
                                  </span>
                                </button>
                              )
                            })}
                        </div>
                        
                        {iconsList.filter(iconItem => 
                          iconItem.label.toLowerCase().includes(iconSearchTerm.toLowerCase()) ||
                          iconItem.value.toLowerCase().includes(iconSearchTerm.toLowerCase())
                        ).length === 0 && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            Nenhum ícone encontrado para "{iconSearchTerm}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
              const IconComponent = getIcon(category.icon)
              
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
                      disabled={!!category.article_count && category.article_count > 0}
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