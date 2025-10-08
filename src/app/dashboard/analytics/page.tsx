'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/contexts/OrganizationContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Filter,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  Activity,
  Target,
  Award,
  Zap,
  Eye,
  PieChart,
  LineChart,
  Timer,
  UserCheck,
  TicketIcon,
  Loader2,
  Building,
  ChevronDown,
  ChevronUp,
  X,
  Check
} from 'lucide-react'
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Interface para multi-client analytics
interface ClientData {
  context: {
    id: string
    name: string
    type: string
    slug: string
  }
  summary: {
    total_tickets: number
    avg_resolution_time: string
    period: {
      start_date: string
      end_date: string
    }
  }
  status_stats: Array<{
    id: string
    name: string
    slug: string
    color: string
    count: number
    order_index: number
  }>
  category_stats: Array<{
    id: string
    name: string
    slug: string
    color: string
    icon: string
    is_global: boolean
    context_id: string
    total: number
    percentage: number
    status_breakdown: Record<string, number>
    status_breakdown_detailed: Array<{
      slug: string
      name: string
      color: string
      count: number
      order_index: number
    }>
  }>
  tickets: Array<{
    id: string
    ticket_number: string
    title: string
    status: string
    priority: string
    created_at: string
  }>
}

interface MultiClientAnalytics {
  clients: ClientData[]
  consolidated: {
    total_tickets: number
    period: {
      start_date: string
      end_date: string
    }
    avg_resolution_time: string
    status_distribution: Array<{
      slug: string
      name: string
      color: string
      count: number
      order_index: number
    }>
    priority_distribution: {
      low: number
      medium: number
      high: number
      critical: number
    }
    category_distribution: Array<{
      name: string
      count: number
      color: string
    }>
    tickets_trend: Array<{
      date: string
      count: number
    }>
    peak_hours: Array<{
      hour: number
      count: number
    }>
    user_activity: Array<{
      name: string
      ticketsCreated: number
      ticketsResolved: number
      avgTime: string
    }>
    performance_metrics: {
      firstResponseTime: string
      resolutionRate: number
      reopenRate: number
      escalationRate: number
    }
  }
}

interface AnalyticsData {
  overview: {
    totalTickets: number
    totalTicketsTrend: number
    avgResolutionTime: string
    avgResolutionTrend: number
    satisfactionRate: number
    satisfactionTrend: number
    activeUsers: number
    activeUsersTrend: number
  }
  ticketsByStatus: {
    open: number
    in_progress: number
    resolved: number
    cancelled: number
  }
  ticketsByStatusDetailed: Array<{
    slug: string
    name: string
    color: string
    count: number
    order_index: number
  }>
  availableStatuses: Array<{
    id: string
    name: string
    slug: string
    color: string
    order_index: number
  }>
  ticketsByPriority: {
    low: number
    medium: number
    high: number
    critical: number
  }
  ticketsByCategory: Array<{
    name: string
    count: number
    color: string
  }>
  ticketsTrend: Array<{
    date: string
    count: number
  }>
  performanceMetrics: {
    firstResponseTime: string
    resolutionRate: number
    reopenRate: number
    escalationRate: number
  }
  userActivity: Array<{
    name: string
    ticketsCreated: number
    ticketsResolved: number
    avgTime: string
  }>
  peakHours: Array<{
    hour: number
    count: number
  }>
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  color, 
  subtitle 
}: {
  title: string
  value: string | number
  icon: any
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color: string
  subtitle?: string
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>
        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        {subtitle && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
        {trendValue && (
          <p className={`mt-2 text-sm flex items-center ${
            trend === 'up' ? 'text-green-600 dark:text-green-400' : 
            trend === 'down' ? 'text-red-600 dark:text-red-400' : 
            'text-gray-600 dark:text-gray-400'
          }`}>
            {trend === 'up' ? <ArrowUp className="h-4 w-4 mr-1" /> :
             trend === 'down' ? <ArrowDown className="h-4 w-4 mr-1" /> :
             <Minus className="h-4 w-4 mr-1" />}
            {trendValue}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-2xl ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
)

export default function AnalyticsPage() {
  const { session } = useAuth()
  const { 
    isMatrixUser, 
    isContextUser, 
    availableContexts, 
    currentContext,
    isLoading: contextLoading 
  } = useOrganization()
  
  // Estados para single-client analytics
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [dateRange, setDateRange] = useState('30days')
  const [selectedMetric, setSelectedMetric] = useState('tickets')
  
  // Estados para multi-client analytics
  const [multiClientData, setMultiClientData] = useState<MultiClientAnalytics | null>(null)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [showClientPopup, setShowClientPopup] = useState(false)
  const [myTicketsOnly, setMyTicketsOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [periodFilter, setPeriodFilter] = useState('30days')
  const [tempFilter, setTempFilter] = useState('30days')
  const clientPopupRef = useRef<HTMLDivElement>(null)
  const filtersPopupRef = useRef<HTMLDivElement>(null)
  
  // Determinar se deve usar multi-client ou single-client
  const isMultiClient = isMatrixUser && selectedClients.length > 0

  useEffect(() => {
    if (contextLoading) return
    
    if (isMatrixUser) {
      // Carregar clientes disponíveis do localStorage
      const savedClients = localStorage.getItem('selectedClients')
      if (savedClients) {
        const clients = JSON.parse(savedClients)
        setSelectedClients(clients)
      }
    } else {
      // Usuário context: carregar analytics single-client
      fetchAnalyticsData()
    }
  }, [isMatrixUser, contextLoading])

  useEffect(() => {
    if (isMultiClient) {
      fetchMultiClientData()
    }
  }, [selectedClients, periodFilter, myTicketsOnly, isMultiClient])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/dashboard/analytics?range=${dateRange}`)
      setAnalyticsData(response.data)
    } catch (error) {
      toast.error('Erro ao carregar análises')
    } finally {
      setLoading(false)
    }
  }

  const fetchMultiClientData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        context_ids: selectedClients.join(','),
        start_date: getDateRangeStart(periodFilter),
        end_date: getDateRangeEnd(periodFilter)
      })
      
      if (myTicketsOnly && session?.user?.id) {
        params.append('myTickets', session.user.id)
      }
      
      const response = await axios.get(`/api/dashboard/multi-client-analytics?${params}`)
      setMultiClientData(response.data)
    } catch (error) {
      toast.error('Erro ao carregar análises multi-cliente')
    } finally {
      setLoading(false)
    }
  }

  const getDateRangeStart = (range: string) => {
    const now = new Date()
    switch (range) {
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      case '90days':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      case '1year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  }

  const getDateRangeEnd = (range: string) => {
    return new Date().toISOString().split('T')[0]
  }

  const handleClientSelectionChange = (selectedIds: string[]) => {
    setSelectedClients(selectedIds)
    localStorage.setItem('selectedClients', JSON.stringify(selectedIds))
  }

  const toggleMyTickets = () => {
    setMyTicketsOnly(!myTicketsOnly)
  }

  const handleApplyFilter = () => {
    setPeriodFilter(tempFilter)
    setShowFilters(false)
  }

  const handleResetFilter = () => {
    setTempFilter('30days')
    setPeriodFilter('30days')
    setMyTicketsOnly(false)
    setShowFilters(false)
  }

  // Fechar popup ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Verificar se clicou fora do popup de clientes
      if (clientPopupRef.current && !clientPopupRef.current.contains(target)) {
        setShowClientPopup(false)
      }
      
      // Verificar se clicou fora do popup de filtros
      if (filtersPopupRef.current && !filtersPopupRef.current.contains(target)) {
        setShowFilters(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (loading || contextLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Mensagem para usuários matrix sem clientes selecionados
  if (isMatrixUser && selectedClients.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analytics & Insights
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Análise completa do desempenho e métricas do sistema
            </p>
          </div>
        </div>

        {/* Seletor de Clientes */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Selecione os Clientes para Análise
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Escolha um ou mais clientes para visualizar as análises consolidadas
            </p>
            
            <button
              onClick={() => setShowClientPopup(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors"
            >
              <Building className="h-4 w-4 mr-2" />
              Selecionar Clientes
            </button>
          </div>
        </div>

        {/* Popup de Seleção de Clientes */}
        {showClientPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div ref={clientPopupRef} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Seleção Rápida
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowClientPopup(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                  {availableContexts.length > 0 ? (
                    availableContexts
                      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                      .map((context) => (
                      <label key={context.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors rounded-xl">
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(context.id)}
                          onChange={() => {
                            if (selectedClients.includes(context.id)) {
                              handleClientSelectionChange(selectedClients.filter(id => id !== context.id))
                            } else {
                              handleClientSelectionChange([...selectedClients, context.id])
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {context.name}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-xl font-medium ${
                              context.type === 'organization' 
                                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" 
                                : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                            }`}>
                              {context.type === 'organization' ? 'Cliente' : 'Dept'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {context.slug}
                          </div>
                        </div>
                        {selectedClients.includes(context.id) && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      Nenhum cliente disponível
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedClients.length} de {availableContexts.length} selecionados
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleClientSelectionChange(availableContexts.map(c => c.id))}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => {
                        handleClientSelectionChange([])
                        localStorage.removeItem('selectedClients')
                      }}
                      className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 font-medium transition-colors"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!analyticsData && !multiClientData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Dados não disponíveis
        </h3>
      </div>
    )
  }

  // Determinar dados a usar (multi-client ou single-client)
  const currentData = isMultiClient ? multiClientData?.consolidated : analyticsData
  const ticketsTrend = isMultiClient ? multiClientData?.consolidated.tickets_trend || [] : analyticsData?.ticketsTrend || []
  const statusDistribution = isMultiClient ? multiClientData?.consolidated.status_distribution || [] : analyticsData?.ticketsByStatusDetailed || []
  const priorityDistribution = isMultiClient ? multiClientData?.consolidated.priority_distribution : analyticsData?.ticketsByPriority
  const categoryDistribution = isMultiClient ? multiClientData?.consolidated.category_distribution || [] : analyticsData?.ticketsByCategory || []
  const peakHours = isMultiClient ? multiClientData?.consolidated.peak_hours || [] : analyticsData?.peakHours || []
  const userActivity = isMultiClient ? multiClientData?.consolidated.user_activity || [] : analyticsData?.userActivity || []
  const performanceMetrics = isMultiClient ? multiClientData?.consolidated.performance_metrics : analyticsData?.performanceMetrics

  // Chart configurations
  const ticketsTrendData = {
    labels: ticketsTrend.map(t => {
      const date = new Date(t.date)
      return `${date.getDate()}/${date.getMonth() + 1}`
    }),
    datasets: [
      {
        label: 'Tickets Criados',
        data: ticketsTrend.map(t => t.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }

  // Dynamic status distribution using real database data
  const statusDistributionData = {
    labels: statusDistribution
      .filter(status => status.count > 0) // Only show status with tickets
      .map(status => status.name),
    datasets: [
      {
        data: statusDistribution
          .filter(status => status.count > 0) // Only show status with tickets
          .map(status => status.count),
        backgroundColor: statusDistribution
          .filter(status => status.count > 0) // Only show status with tickets
          .map(status => status.color || '#6b7280'),
        borderWidth: 0
      }
    ]
  }

  // Dynamic priority distribution - only show priorities with tickets
  const priorityData = [
    { name: 'Baixa', value: priorityDistribution?.low || 0, color: 'rgba(156, 163, 175, 0.8)', borderColor: 'rgb(156, 163, 175)' },
    { name: 'Média', value: priorityDistribution?.medium || 0, color: 'rgba(59, 130, 246, 0.8)', borderColor: 'rgb(59, 130, 246)' },
    { name: 'Alta', value: priorityDistribution?.high || 0, color: 'rgba(251, 146, 60, 0.8)', borderColor: 'rgb(251, 146, 60)' },
    { name: 'Crítica', value: priorityDistribution?.critical || 0, color: 'rgba(239, 68, 68, 0.8)', borderColor: 'rgb(239, 68, 68)' }
  ].filter(priority => priority.value > 0) // Only show priorities with tickets

  const priorityDistributionData = {
    labels: priorityData.map(p => p.name),
    datasets: [
      {
        label: 'Tickets por Prioridade',
        data: priorityData.map(p => p.value),
        backgroundColor: priorityData.map(p => p.color),
        borderColor: priorityData.map(p => p.borderColor),
        borderWidth: 1
      }
    ]
  }

  // Dynamic category distribution - only show categories with tickets
  const categoryDistributionData = {
    labels: categoryDistribution
      .filter(c => c.count > 0) // Only show categories with tickets
      .map(c => c.name),
    datasets: [
      {
        label: 'Tickets por Categoria',
        data: categoryDistribution
          .filter(c => c.count > 0) // Only show categories with tickets
          .map(c => c.count),
        backgroundColor: categoryDistribution
          .filter(c => c.count > 0) // Only show categories with tickets
          .map(c => c.color || '#6b7280'),
        borderWidth: 0
      }
    ]
  }

  const peakHoursData = {
    labels: peakHours.map(h => `${h.hour}h`),
    datasets: [
      {
        label: 'Tickets por Hora',
        data: peakHours.map(h => h.count),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics & Insights
            {isMultiClient && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({selectedClients.length} cliente{selectedClients.length !== 1 ? 's' : ''} selecionado{selectedClients.length !== 1 ? 's' : ''})
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {isMultiClient 
              ? 'Análise consolidada de múltiplos clientes' 
              : 'Análise completa do desempenho e métricas do sistema'
            }
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          {/* Seletor de Clientes para usuários Matrix */}
          {isMatrixUser && (
            <div className="relative w-full sm:w-auto">
              {/* Botão principal com bordas animadas */}
              <button
                onClick={() => setShowClientPopup(!showClientPopup)}
                className="w-full sm:w-auto sm:min-w-[180px] h-12 px-3 sm:px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden whitespace-nowrap"
              >
                <Building className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">
                  {selectedClients.length === 0 
                    ? 'Selecionar Clientes' 
                    : selectedClients.length === 1 
                      ? availableContexts.find(c => c.id === selectedClients[0])?.name || 'Cliente'
                      : `${selectedClients.length} clientes`
                  }
                </span>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
                {/* Bordas animadas */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse"></div>
              </button>
              
              {/* Popup de seleção de clientes */}
              {showClientPopup && (
                <div 
                  ref={clientPopupRef}
                  className="absolute top-full left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 z-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">Seleção Rápida</span>
                    </div>
                    <button
                      onClick={() => setShowClientPopup(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {availableContexts
                      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                      .map((context) => (
                      <label
                        key={context.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors rounded-xl"
                      >
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(context.id)}
                          onChange={() => {
                            if (selectedClients.includes(context.id)) {
                              handleClientSelectionChange(selectedClients.filter(id => id !== context.id))
                            } else {
                              handleClientSelectionChange([...selectedClients, context.id])
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {context.name}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-xl font-medium ${
                              context.type === 'organization' 
                                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" 
                                : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                            }`}>
                              {context.type === 'organization' ? 'Cliente' : 'Dept'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {context.slug}
                          </div>
                        </div>
                        {selectedClients.includes(context.id) && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </label>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedClients.length} de {availableContexts.length} selecionados
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleClientSelectionChange(availableContexts.map(c => c.id))}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => {
                          handleClientSelectionChange([])
                          localStorage.removeItem('selectedClients')
                        }}
                        className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 font-medium transition-colors"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filtros para usuários Matrix */}
          {isMatrixUser && selectedClients.length > 0 && (
            <div className="relative" ref={filtersPopupRef}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </button>

              {showFilters && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Filtros Avançados
                      </h3>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Período
                        </label>
                        <select
                          value={tempFilter}
                          onChange={(e) => setTempFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                        >
                          <option value="7days">Últimos 7 dias</option>
                          <option value="30days">Últimos 30 dias</option>
                          <option value="90days">Últimos 90 dias</option>
                          <option value="1year">Último ano</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={myTicketsOnly}
                            onChange={toggleMyTickets}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Apenas meus tickets
                          </span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={handleApplyFilter}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Aplicar
                      </button>
                      <button
                        onClick={handleResetFilter}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        Resetar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Seletor de período para usuários Context */}
          {isContextUser && (
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-sm"
            >
              <option value="7days">Últimos 7 dias</option>
              <option value="30days">Últimos 30 dias</option>
              <option value="90days">Últimos 90 dias</option>
              <option value="1year">Último ano</option>
            </select>
          )}

          <button className="p-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Tickets"
          value={isMultiClient ? (multiClientData?.consolidated.total_tickets || 0) : (analyticsData?.overview.totalTickets || 0)}
          icon={TicketIcon}
          trend={isMultiClient ? 'neutral' : (analyticsData?.overview.totalTicketsTrend || 0) > 0 ? 'up' : (analyticsData?.overview.totalTicketsTrend || 0) < 0 ? 'down' : 'neutral'}
          trendValue={isMultiClient ? 'N/A' : `${Math.abs(analyticsData?.overview.totalTicketsTrend || 0)}% vs período anterior`}
          color="bg-blue-600"
        />
        <StatCard
          title="Tempo Médio de Resolução"
          value={isMultiClient ? (multiClientData?.consolidated.avg_resolution_time || 'N/A') : (analyticsData?.overview.avgResolutionTime || 'N/A')}
          icon={Clock}
          trend={isMultiClient ? 'neutral' : (analyticsData?.overview.avgResolutionTrend || 0) < 0 ? 'up' : (analyticsData?.overview.avgResolutionTrend || 0) > 0 ? 'down' : 'neutral'}
          trendValue={isMultiClient ? 'N/A' : `${Math.abs(analyticsData?.overview.avgResolutionTrend || 0)}% vs período anterior`}
          color="bg-purple-600"
          subtitle="Média geral"
        />
        <StatCard
          title="Taxa de Satisfação"
          value={isMultiClient ? 'N/A' : `${analyticsData?.overview.satisfactionRate || 0}%`}
          icon={Award}
          trend={isMultiClient ? 'neutral' : (analyticsData?.overview.satisfactionTrend || 0) > 0 ? 'up' : (analyticsData?.overview.satisfactionTrend || 0) < 0 ? 'down' : 'neutral'}
          trendValue={isMultiClient ? 'N/A' : `${Math.abs(analyticsData?.overview.satisfactionTrend || 0)}% vs período anterior`}
          color="bg-green-600"
        />
        <StatCard
          title="Usuários Ativos"
          value={isMultiClient ? 'N/A' : (analyticsData?.overview.activeUsers || 0)}
          icon={Users}
          trend={isMultiClient ? 'neutral' : (analyticsData?.overview.activeUsersTrend || 0) > 0 ? 'up' : (analyticsData?.overview.activeUsersTrend || 0) < 0 ? 'down' : 'neutral'}
          trendValue={isMultiClient ? 'N/A' : `${Math.abs(analyticsData?.overview.activeUsersTrend || 0)}% vs período anterior`}
          color="bg-orange-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tendência de Tickets
            </h2>
            <LineChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Line data={ticketsTrendData} options={chartOptions} />
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Distribuição por Status
            </h2>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Doughnut data={statusDistributionData} options={pieOptions} />
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Distribuição por Prioridade
            </h2>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Bar data={priorityDistributionData} options={chartOptions} />
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tickets por Categoria
            </h2>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Pie data={categoryDistributionData} options={pieOptions} />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Métricas de Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full mb-3">
              <Timer className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {isMultiClient ? (multiClientData?.consolidated.performance_metrics?.firstResponseTime || 'N/A') : (analyticsData?.performanceMetrics?.firstResponseTime || 'N/A')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Tempo de Primeira Resposta
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full mb-3">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {isMultiClient ? (multiClientData?.consolidated.performance_metrics?.resolutionRate || 0) : (analyticsData?.performanceMetrics?.resolutionRate || 0)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Taxa de Resolução
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full mb-3">
              <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {isMultiClient ? (multiClientData?.consolidated.performance_metrics?.reopenRate || 0) : (analyticsData?.performanceMetrics?.reopenRate || 0)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Taxa de Reabertura
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full mb-3">
              <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {isMultiClient ? (multiClientData?.consolidated.performance_metrics?.escalationRate || 0) : (analyticsData?.performanceMetrics?.escalationRate || 0)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Taxa de Escalonamento
            </p>
          </div>
        </div>
      </div>

      {/* Peak Hours & User Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Horários de Pico
            </h2>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Bar data={peakHoursData} options={chartOptions} />
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Atividade por Usuário
            </h2>
            <UserCheck className="h-5 w-5 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="pb-3">Usuário</th>
                  <th className="pb-3 text-center">Criados</th>
                  <th className="pb-3 text-center">Resolvidos</th>
                  <th className="pb-3 text-right">Tempo Médio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {userActivity.length > 0 ? (
                  userActivity.slice(0, 5).map((user, index) => (
                    <tr key={index}>
                      <td className="py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </p>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {user.ticketsCreated}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {user.ticketsResolved}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {user.avgTime}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      Nenhuma atividade de usuário no período selecionado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-sm p-6 text-white">
        <div className="flex items-center mb-4">
          <Zap className="h-6 w-6 mr-2" />
          <h2 className="text-lg font-semibold">Insights Rápidos</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
            <p className="text-sm opacity-90 mb-1">Melhor dia da semana</p>
            <p className="text-xl font-bold">Segunda-feira</p>
            <p className="text-xs opacity-75 mt-1">Menor volume de tickets</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
            <p className="text-sm opacity-90 mb-1">Categoria mais problemática</p>
            <p className="text-xl font-bold">Hardware</p>
            <p className="text-xs opacity-75 mt-1">35% dos tickets</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
            <p className="text-sm opacity-90 mb-1">Técnico destaque</p>
            <p className="text-xl font-bold">João Silva</p>
            <p className="text-xs opacity-75 mt-1">98% taxa de resolução</p>
          </div>
        </div>
      </div>
    </div>
  )
}