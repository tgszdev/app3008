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
  FileDown
} from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { getIcon } from '@/lib/icons'
import { ClientSelector } from '@/components/ClientSelector'
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

// =====================================================
// COMPONENTES DE CARD (REUTILIZADOS)
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

// =====================================================
// COMPONENTE PRINCIPAL - HYBRID DASHBOARD ALTERNATIVA 1
// =====================================================

export default function HybridDashboardAlternativa1() {
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
  
  // Estados específicos da Alternativa 1
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [clientGroups, setClientGroups] = useState<ClientGroup[]>([])
  const [viewMode, setViewMode] = useState<'grouped' | 'filtered'>('grouped')
  
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
  }, [mounted, contextLoading, periodFilter, myTicketsOnly, selectedClientId])

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
    setViewMode(clientId ? 'filtered' : 'grouped')
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
      {/* Header com Seletor de Cliente */}
      <div className="flex flex-col gap-4">
        {/* Primeira linha: Título e Seletor de Cliente */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard {myTicketsOnly && '- Meus Tickets'} {selectedClientId && '- Cliente Específico'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Bem-vindo de volta, {session?.user?.name}!
              {selectedClientId 
                ? ' Visualizando tickets do cliente selecionado.'
                : ' Visualizando todos os clientes agrupados.'
              }
            </p>
          </div>
          
          {/* Seletor de Cliente (apenas para matriz) */}
          {isMatrixUser && (
            <ClientSelector 
              onClientChange={handleClientChange}
              selectedClientId={selectedClientId}
              className="w-full sm:w-auto"
            />
          )}
        </div>
        
        {/* Segunda linha: Informações e botões */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Informações do modo de visualização */}
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Modo: 
              <span className="font-medium ml-1 text-gray-900 dark:text-white">
                {selectedClientId ? 'Filtrado por Cliente' : 'Agrupado por Cliente'}
              </span>
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Botão Meus Tickets */}
            <button
              onClick={toggleMyTickets}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border rounded-lg transition-colors ${
                myTicketsOnly 
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm">Meus Tickets</span>
            </button>
          
            {/* Botão Filtro de Data */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">
                {periodFilter.start_date === getCurrentMonthDates().start_date && 
                 periodFilter.end_date === getCurrentMonthDates().end_date
                  ? 'Mês Atual'
                  : `${formatDateShort(periodFilter.start_date)} - ${formatDateShort(periodFilter.end_date)}`
                }
              </span>
              <Filter className="h-4 w-4 flex-shrink-0" />
            </button>
            
            {/* Botão Export PDF */}
            <button
              onClick={handleExportPDF}
              disabled={isGeneratingPDF}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="text-xs sm:text-sm">
                {isGeneratingPDF ? 'Gerando...' : 'Exportar PDF'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtros de Período */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Filtrar por Período
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={tempFilter.start_date}
                onChange={(e) => setTempFilter({ ...tempFilter, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={tempFilter.end_date}
                onChange={(e) => setTempFilter({ ...tempFilter, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button
              onClick={handleApplyFilter}
              className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium"
            >
              Aplicar Filtro
            </button>
            <button
              onClick={handleResetFilter}
              className="flex-1 sm:flex-initial px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-800 transition-colors text-sm font-medium"
            >
              Limpar Filtro
            </button>
          </div>
        </div>
      )}

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

      {/* Cards de Status */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        <StatCard
          title="Total no Período"
          value={stats.totalTickets}
          icon={TicketIcon}
          color="bg-blue-600"
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

      {/* Tickets por Cliente */}
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
