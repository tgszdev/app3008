'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  TicketIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  BarChart,
  Activity,
  XCircle,
  Loader2,
  Calendar,
  Filter,
  PieChart as PieChartIcon,
  Building,
  Cpu,
  Wifi,
  Printer,
  Code,
  Mail,
  Shield,
  Phone,
  User,
  FileDown,
  Eye,
  EyeOff,
  Search,
  Settings,
  Grid3X3,
  Layout,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { getIcon } from '@/lib/icons'
import { ClientWidgetSelector } from '@/components/ClientWidgetSelector'
import { ClientGroupedTickets } from '@/components/dashboard/ClientGroupedTickets'

// =====================================================
// TIPOS E INTERFACES
// =====================================================

interface Stats {
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  resolvedTickets: number
  cancelledTickets: number
  ticketsTrend: string
}

interface StatusInfo {
  slug: string
  name: string
  color: string
  count: number
  order_index: number
}

interface CategoryStat {
  id: string
  nome: string
  icon: string | null
  color: string | null
  quantidade: number
  percentual: number
  status_breakdown: Record<string, number>
  status_breakdown_detailed: StatusInfo[]
}

interface DashboardData {
  total_tickets: number
  periodo: { data_inicio: string; data_fim: string }
  categorias: CategoryStat[]
  status_summary: {
    open: number
    in_progress: number
    resolved: number
    cancelled: number
  }
  status_summary_detailed: StatusInfo[]
  available_status: StatusInfo[]
  average_resolution_time: string
}

interface RecentTicket {
  id: string
  ticket_number: string
  title: string
  status: string
  priority: string
  requester: string
  created_at: string
}

interface PeriodFilter {
  start_date: string
  end_date: string
}

interface ClientGroup {
  clientId: string
  clientName: string
  tickets: RecentTicket[]
  stats: {
    total: number
    open: number
    inProgress: number
    resolved: number
    cancelled: number
  }
}

interface WidgetConfig {
  id: string
  name: string
  icon: React.ComponentType<any>
  visible: boolean
  type: 'chart' | 'table' | 'stats' | 'list'
  component: React.ComponentType<any>
}

// =====================================================
// COMPONENTES DE CARD (REUTILIZADOS DO TEMPLATE)
// =====================================================

const StatCard = ({ title, value, icon: Icon, trend, color, statusColor }: any) => {
  const getCardColor = (statusColor: string, title: string) => {
    if (statusColor && statusColor !== '#6b7280') {
      return statusColor
    }
    
    if (title.includes('Total')) return '#2563eb'
    if (title.includes('Aberto') || title.includes('Open')) return '#3b82f6'
    if (title.includes('Progresso') || title.includes('Progress') || title.includes('Aguardando') || title.includes('Deploy')) return '#f59e0b'
    if (title.includes('Resolvido') || title.includes('Resolved') || title.includes('Fechado') || title.includes('Closed')) return '#10b981'
    if (title.includes('Cancelado') || title.includes('Cancelled')) return '#ef4444'
    return '#6b7280'
  }
  
  const cardColor = getCardColor(statusColor, title)
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow duration-200"
      style={{
        borderLeftColor: cardColor,
        borderLeftWidth: '3px'
      }}
    >
      <div className="text-center">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <p 
          className="text-xl font-bold"
          style={{ color: cardColor }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

const CategoryCard = ({ category }: { category: CategoryStat }) => {
  const Icon = getIcon(category.icon)
  const backgroundColor = category.color ? `${category.color}20` : '#E5E7EB'
  const borderColor = category.color || '#6B7280'
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-6"
      style={{ borderLeft: `6px solid ${borderColor}` }}
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center flex-1 min-w-0">
          <div 
            className="p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0"
            style={{ backgroundColor, color: borderColor }}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
              {category.nome}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
              {category.percentual}% do total
            </p>
          </div>
        </div>
        <div className="text-right ml-2 flex-shrink-0">
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {category.quantidade}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            tickets
          </p>
        </div>
      </div>
      
      <div className="mt-3 sm:mt-4">
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
          {category.status_breakdown_detailed.map((status, index) => {
            if (status.count <= 0) return null
            
            return (
              <div 
                key={status.slug}
                className="transition-all duration-300" 
                style={{ 
                  width: `${(status.count / category.quantidade) * 100}%`,
                  backgroundColor: status.color
                }}
                title={`${status.name}: ${status.count}`}
              />
            )
          })}
        </div>
        
        <div className="mt-3 space-y-1">
          {category.status_breakdown_detailed
            .filter(status => status.count > 0)
            .map((status) => (
              <div key={status.slug} className="flex items-center justify-between text-xs">
                <div className="flex items-center">
                  <div 
                    className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-gray-600 dark:text-gray-400 truncate">
                    {status.name}
                  </span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white ml-2">
                  {status.count}
                </span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

// =====================================================
// WIDGETS ESPECÍFICOS
// =====================================================

const StatsWidget = ({ stats }: { stats: Stats }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
    <div className="flex items-center gap-2 mb-4">
      <BarChart3 className="w-5 h-5 text-blue-600" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Estatísticas Gerais
      </h3>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard
        title="Total"
        value={stats.totalTickets}
        icon={TicketIcon}
        statusColor="#2563eb"
      />
      <StatCard
        title="Abertos"
        value={stats.openTickets}
        icon={AlertCircle}
        statusColor="#3b82f6"
      />
      <StatCard
        title="Em Progresso"
        value={stats.inProgressTickets}
        icon={Clock}
        statusColor="#f59e0b"
      />
      <StatCard
        title="Resolvidos"
        value={stats.resolvedTickets}
        icon={CheckCircle}
        statusColor="#10b981"
      />
      <StatCard
        title="Cancelados"
        value={stats.cancelledTickets}
        icon={XCircle}
        statusColor="#ef4444"
      />
    </div>
  </div>
)

const RecentTicketsWidget = ({ tickets }: { tickets: RecentTicket[] }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
    <div className="flex items-center gap-2 mb-4">
      <TrendingUp className="w-5 h-5 text-green-600" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Tickets Recentes
      </h3>
    </div>
    <div className="space-y-3">
      {tickets.slice(0, 5).map((ticket) => (
        <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              #{ticket.ticket_number} - {ticket.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {ticket.requester} • {formatDateShort(ticket.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
              ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {ticket.status}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              ticket.priority === 'critical' ? 'bg-red-100 text-red-800' :
              ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
              ticket.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {ticket.priority}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const CategoriesWidget = ({ categories }: { categories: CategoryStat[] }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
    <div className="flex items-center gap-2 mb-4">
      <PieChart className="w-5 h-5 text-purple-600" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Por Categoria
      </h3>
    </div>
    <div className="space-y-3">
      {categories.slice(0, 5).map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  </div>
)

// =====================================================
// COMPONENTE PRINCIPAL - HYBRID DASHBOARD ALTERNATIVA 3
// =====================================================

export default function HybridDashboardAlternativa3() {
  const { session } = useAuth()
  const { 
    currentContext, 
    isMatrixUser, 
    isContextUser,
    contextType,
    isLoading: contextLoading 
  } = useOrganization()
  const router = useRouter()
  
  // Estados
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  
  // Estados específicos da Alternativa 3
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [clientGroups, setClientGroups] = useState<ClientGroup[]>([])
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'analytics'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Configuração dos widgets
  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    { 
      id: 'stats', 
      name: 'Estatísticas Gerais', 
      icon: BarChart3, 
      visible: true, 
      type: 'stats',
      component: StatsWidget
    },
    { 
      id: 'recent', 
      name: 'Tickets Recentes', 
      icon: TrendingUp, 
      visible: true, 
      type: 'list',
      component: RecentTicketsWidget
    },
    { 
      id: 'categories', 
      name: 'Por Categoria', 
      icon: PieChart, 
      visible: true, 
      type: 'chart',
      component: CategoriesWidget
    }
  ])
  
  // Filtros de período
  const getCurrentMonthDates = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    return {
      start_date: firstDay.toISOString().split('T')[0],
      end_date: lastDay.toISOString().split('T')[0]
    }
  }
  
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(getCurrentMonthDates())
  const [tempFilter, setTempFilter] = useState<PeriodFilter>(getCurrentMonthDates())
  const [myTicketsOnly, setMyTicketsOnly] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  
  // Dados do dashboard
  const [stats, setStats] = useState<Stats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    cancelledTickets: 0,
    ticketsTrend: '+0%'
  })
  
  const [categoryStats, setCategoryStats] = useState<DashboardData | null>(null)
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([])

  // =====================================================
  // EFEITOS
  // =====================================================

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !contextLoading) {
      fetchClientTickets()
      fetchCategoryStats()
    }
  }, [mounted, contextLoading, periodFilter, myTicketsOnly, selectedClientId, viewMode])

  // =====================================================
  // FUNÇÕES DE FETCH DE DADOS
  // =====================================================

  const fetchClientTickets = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        start_date: periodFilter.start_date,
        end_date: periodFilter.end_date
      })
      
      // Adicionar filtro de cliente se selecionado
      if (selectedClientId) {
        params.append('client_id', selectedClientId)
      }
      
      // Adicionar filtro de usuário se ativo
      if (myTicketsOnly && session?.user?.id) {
        params.append('user_id', session.user.id)
      }
      
      const response = await axios.get(`/api/dashboard/client-tickets?${params}`)
      
      if (response.data) {
        setClientGroups(response.data.clientGroups || [])
        
        // Calcular estatísticas gerais
        const totalTickets = response.data.totalTickets || 0
        const openTickets = response.data.clientGroups?.reduce((sum: number, group: ClientGroup) => sum + group.stats.open, 0) || 0
        const inProgressTickets = response.data.clientGroups?.reduce((sum: number, group: ClientGroup) => sum + group.stats.inProgress, 0) || 0
        const resolvedTickets = response.data.clientGroups?.reduce((sum: number, group: ClientGroup) => sum + group.stats.resolved, 0) || 0
        const cancelledTickets = response.data.clientGroups?.reduce((sum: number, group: ClientGroup) => sum + group.stats.cancelled, 0) || 0
        
        setStats({
          totalTickets,
          openTickets,
          inProgressTickets,
          resolvedTickets,
          cancelledTickets,
          ticketsTrend: '+0%'
        })

        // Preparar tickets recentes
        const allTickets = response.data.clientGroups?.flatMap((group: ClientGroup) => group.tickets) || []
        setRecentTickets(allTickets.slice(0, 10))
      }
    } catch (error: any) {
      console.error('Error fetching client tickets:', error)
      toast.error('Erro ao carregar tickets por cliente')
      
      if (error.response?.status === 401) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCategoryStats = async () => {
    try {
      const params = new URLSearchParams({
        start_date: periodFilter.start_date,
        end_date: periodFilter.end_date
      })
      
      // Adicionar contexto se disponível
      if (currentContext) {
        params.append('context_id', currentContext.id)
      }
      
      // Adicionar filtro de usuário se ativo
      if (myTicketsOnly && session?.user?.id) {
        params.append('user_id', session.user.id)
      }
      
      const response = await axios.get(`/api/dashboard/categories-stats?${params}`)
      
      if (response.data) {
        setCategoryStats(response.data)
      }
    } catch (error) {
      console.error('Error fetching category stats:', error)
      toast.error('Erro ao carregar estatísticas por categoria')
    }
  }

  // =====================================================
  // FUNÇÕES DE HANDLERS
  // =====================================================

  const handleClientChange = (clientId: string | null) => {
    setSelectedClientId(clientId)
  }

  const handleViewModeChange = (mode: 'overview' | 'detailed' | 'analytics') => {
    setViewMode(mode)
  }

  const handleWidgetToggle = (widgetId: string, visible: boolean) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, visible }
        : widget
    ))
  }

  const handleApplyFilter = () => {
    setPeriodFilter(tempFilter)
    setShowFilters(false)
  }

  const handleResetFilter = () => {
    const defaultDates = getCurrentMonthDates()
    setTempFilter(defaultDates)
    setPeriodFilter(defaultDates)
    setShowFilters(false)
  }

  const handleTicketClick = (ticketId: string) => {
    router.push(`/dashboard/tickets/${ticketId}`)
  }

  const toggleMyTickets = () => {
    setMyTicketsOnly(!myTicketsOnly)
  }

  // =====================================================
  // FUNÇÃO DE EXPORT PDF (SIMPLIFICADA)
  // =====================================================

  const handleExportPDF = async () => {
    try {
      setIsGeneratingPDF(true)
      toast.success('Funcionalidade de PDF será implementada em breve!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Erro ao gerar PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // =====================================================
  // RENDERIZAÇÃO CONDICIONAL
  // =====================================================

  if (!mounted || contextLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // =====================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =====================================================

  return (
    <div id="dashboard-content" className="space-y-4 sm:space-y-6">
      {/* Header com Seletor de Cliente Avançado */}
      <ClientWidgetSelector 
        onClientChange={handleClientChange}
        selectedClientId={selectedClientId}
        onViewModeChange={handleViewModeChange}
        onWidgetToggle={handleWidgetToggle}
        className="w-full"
      />

      {/* Informações do Período */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
          <span className="font-medium block sm:inline">Período analisado:</span>
          <span className="block sm:inline sm:ml-1">
            {formatDateShort(periodFilter.start_date)} até {formatDateShort(periodFilter.end_date)}
          </span>
          <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
            • <strong>{stats.totalTickets}</strong> {myTicketsOnly ? 'seus tickets' : 'tickets'} no período
          </span>
          {selectedClientId && (
            <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
              • <span className="font-medium">Filtrado por cliente específico</span>
            </span>
          )}
          {myTicketsOnly && (
            <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
              • <span className="font-medium">Filtrado por: Meus Tickets</span>
            </span>
          )}
        </p>
      </div>

      {/* Widgets Configuráveis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {widgets
          .filter(widget => widget.visible)
          .map((widget) => {
            const WidgetComponent = widget.component
            
            return (
              <div key={widget.id} className="col-span-1">
                <WidgetComponent 
                  stats={stats}
                  tickets={recentTickets}
                  categories={categoryStats?.categorias || []}
                />
              </div>
            )
          })}
      </div>

      {/* Tickets por Cliente (Modo Detalhado) */}
      {viewMode === 'detailed' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {selectedClientId ? 'Tickets do Cliente Selecionado' : 'Tickets Agrupados por Cliente'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {selectedClientId 
                ? 'Visualizando apenas tickets do cliente selecionado'
                : 'Visualizando todos os tickets agrupados por cliente'
              }
            </p>
          </div>
          
          <div className="p-4 sm:p-6">
            <ClientGroupedTickets 
              clientGroups={clientGroups}
              onTicketClick={handleTicketClick}
            />
          </div>
        </div>
      )}

      {/* Botão Ver Todos */}
      {clientGroups.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => router.push('/dashboard/tickets')}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Ver todos os chamados →
          </button>
        </div>
      )}
    </div>
  )
}

// =====================================================
// FUNÇÃO AUXILIAR PARA FORMATAR DATAS
// =====================================================

function formatDateShort(date: string | null | undefined) {
  if (!date) {
    return 'N/A'
  }
  
  if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
  }
  
  const dateObj = new Date(date)
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toLocaleDateString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
  
  const parts = date.split('-')
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number)
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
    }
  }
  
  return 'N/A'
}
