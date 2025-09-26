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
import { OrganizationSelector } from '@/components/OrganizationSelector'
import { MultiClientSelector, SelectedClientsTags } from '@/components/MultiClientSelector'

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

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  }
  
  const labels: Record<string, string> = {
    open: 'Aberto',
    in_progress: 'Em Progresso',
    resolved: 'Resolvido',
    closed: 'Fechado',
    cancelled: 'Cancelado',
  }
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || colors.open}`}>
      {labels[status] || status}
    </span>
  )
}

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  }
  
  const labels: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    critical: 'Crítica',
  }
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority] || colors.medium}`}>
      {labels[priority] || priority}
    </span>
  )
}

// =====================================================
// COMPONENTE PRINCIPAL - HYBRID DASHBOARD
// =====================================================

export default function HybridDashboard() {
  const { session } = useAuth()
  const { 
    currentContext, 
    availableContexts,
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
  
  // Estados para seleção múltipla de clientes (gerenciados pelo pai)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  
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

  // Carregar seleções do localStorage na inicialização
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedClients')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            setSelectedClients(parsed)
            console.log('🔄 Carregando seleções do localStorage:', parsed)
          }
        } catch (error) {
          console.error('Erro ao carregar seleções do localStorage:', error)
        }
      }
    }
  }, [])

  // Salvar seleções no localStorage sempre que mudarem
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedClients', JSON.stringify(selectedClients))
      console.log('🔄 Salvando seleções no localStorage:', selectedClients)
    }
  }, [selectedClients])

  // =====================================================
  // EFEITOS
  // =====================================================

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !contextLoading) {
      fetchDashboardData()
      fetchCategoryStats()
    }
  }, [mounted, contextLoading, periodFilter, myTicketsOnly, selectedClients])

  // =====================================================
  // FUNÇÕES DE FETCH DE DADOS
  // =====================================================

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      console.log('🔄 fetchDashboardData chamado com selectedClients:', selectedClients)
      
      // Escolher API baseada na seleção de clientes
      let apiUrl = '/api/dashboard/stats'
      const params = new URLSearchParams({
        start_date: periodFilter.start_date,
        end_date: periodFilter.end_date
      })
      
      // Se tem clientes selecionados, usar API stats com filtro no frontend
      if (selectedClients.length > 0) {
        apiUrl = '/api/dashboard/stats'
        // Adicionar contexto selecionado aos parâmetros
        if (selectedClients.length === 1) {
          params.append('context_id', selectedClients[0])
          console.log('✅ Adicionando context_id único:', selectedClients[0])
        } else {
          console.log('⚠️ Múltiplos clientes selecionados, não enviando context_id')
        }
        // O filtro será aplicado no frontend após receber os dados
      } else if (currentContext) {
        // Se não tem seleção múltipla, usar contexto atual
        params.append('context_id', currentContext.id)
        console.log('✅ Usando contexto atual:', currentContext.id)
      } else {
        // Se não tem seleção nem contexto, mostrar dados vazios
        console.log('⚠️ Nenhum contexto selecionado, mostrando dados vazios')
        setStats({
          totalTickets: 0,
          openTickets: 0,
          inProgressTickets: 0,
          resolvedTickets: 0,
          cancelledTickets: 0,
          ticketsTrend: '+0%'
        })
        setRecentTickets([])
        setCategoryStats(null)
        return
      }
      
      // Adicionar filtro de usuário se ativo
      if (myTicketsOnly && session?.user?.id) {
        params.append('user_id', session.user.id)
      }
      
      const response = await axios.get(`${apiUrl}?${params}`)
      
      if (response.data) {
        let statsData = response.data.stats || {
          totalTickets: response.data.total_tickets || 0,
          openTickets: response.data.open_tickets || 0,
          inProgressTickets: response.data.in_progress_tickets || 0,
          resolvedTickets: response.data.resolved_tickets || 0,
          cancelledTickets: response.data.cancelled_tickets || 0,
          ticketsTrend: response.data.tickets_trend || '+0%'
        }
        
        let recentTicketsData = response.data.recentTickets || response.data.recent_tickets || []
        
        // A API já retorna dados filtrados quando context_id é enviado
        // Não precisamos aplicar filtros adicionais no frontend
        console.log('✅ Usando dados filtrados da API:', {
          totalTickets: statsData.totalTickets,
          recentTickets: recentTicketsData.length
        })
        
        setStats(statsData)
        setRecentTickets(recentTicketsData)
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Erro ao carregar dados do dashboard')
      
      if (error.response?.status === 401) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCategoryStats = async () => {
    try {
      console.log('🔄 fetchCategoryStats chamado com selectedClients:', selectedClients)
      
      const params = new URLSearchParams({
        start_date: periodFilter.start_date,
        end_date: periodFilter.end_date
      })
      
      // Adicionar contexto selecionado se disponível
      if (selectedClients.length > 0) {
        // Para múltiplos clientes, usar o primeiro (ou implementar lógica específica)
        params.append('context_id', selectedClients[0])
        console.log('✅ Adicionando context_id para categories:', selectedClients[0])
      } else if (currentContext) {
        params.append('context_id', currentContext.id)
        console.log('✅ Usando contexto atual para categories:', currentContext.id)
      }
      
      // Adicionar filtro de usuário se ativo
      if (myTicketsOnly && session?.user?.id) {
        params.append('user_id', session.user.id)
      }
      
      const response = await axios.get(`/api/dashboard/categories-stats?${params}`)
      
      if (response.data) {
        setCategoryStats(response.data)
      }
    } catch (error: any) {
      console.error('Error fetching category stats:', error)
      toast.error('Erro ao carregar estatísticas por categoria')
    }
  }

  const fetchMultiClientData = async (selectedIds: string[]) => {
    try {
      setLoading(true)
      
      // Usar API multi-client para múltiplas seleções
      const apiUrl = '/api/dashboard/multi-client-stats'
      const params = new URLSearchParams({
        start_date: periodFilter.start_date,
        end_date: periodFilter.end_date,
        context_ids: selectedIds.join(',')
      })
      
      // Adicionar filtro de usuário se ativo
      if (myTicketsOnly && session?.user?.id) {
        params.append('user_id', session.user.id)
      }
      
      const response = await axios.get(`${apiUrl}?${params}`)
      
      if (response.data) {
        setStats(response.data.stats || {
          totalTickets: response.data.total_tickets || 0,
          openTickets: response.data.open_tickets || 0,
          inProgressTickets: response.data.in_progress_tickets || 0,
          resolvedTickets: response.data.resolved_tickets || 0,
          cancelledTickets: response.data.cancelled_tickets || 0,
          ticketsTrend: response.data.tickets_trend || '+0%'
        })
        setRecentTickets(response.data.recentTickets || response.data.recent_tickets || [])
      }
    } catch (error: any) {
      console.error('Erro ao buscar dados multi-client:', error)
      toast.error('Erro ao carregar dados dos clientes selecionados')
    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // FUNÇÕES DE HANDLERS
  // =====================================================

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
  // FUNÇÕES PARA SELEÇÃO MÚLTIPLA DE CLIENTES
  // =====================================================

  const handleClientSelectionChange = (selectedIds: string[]) => {
    try {
      console.log('🔄 Mudança de seleção de clientes:', selectedIds)
      console.log('🔄 selectedClients antes:', selectedClients)
      setSelectedClients(selectedIds)
      console.log('🔄 selectedClients depois:', selectedIds)
      // O useEffect vai automaticamente recarregar os dados
    } catch (error) {
      console.error('Erro ao processar mudança de seleção:', error)
    }
  }

  const handleRemoveClient = (clientId: string) => {
    // Esta função será chamada pelo MultiClientSelector
    // Não precisamos fazer nada aqui pois o MultiClientSelector gerencia seu próprio estado
    console.log('🔄 Removendo cliente:', clientId)
  }

  const handleClearAllClients = () => {
    // Esta função será chamada pelo MultiClientSelector
    // Não precisamos fazer nada aqui pois o MultiClientSelector gerencia seu próprio estado
    console.log('🔄 Limpando todos os clientes')
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
      {/* Header com Contexto */}
      <div className="flex flex-col gap-4">
        {/* Primeira linha: Título e Seletor */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard {myTicketsOnly && '- Meus Tickets'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Bem-vindo de volta, {session?.user?.name}!
              {myTicketsOnly 
                ? ' Visualizando apenas seus tickets.'
                : ' Aqui está um resumo do sistema.'
              }
            </p>
          </div>
          
          {/* Seletor Múltiplo de Clientes (apenas para matriz) */}
          {isMatrixUser && (
            <div className="space-y-3">
              <MultiClientSelector
                variant="default"
                selectedClients={selectedClients}
                onSelectionChange={handleClientSelectionChange}
                className="w-full"
              />
              
              {/* Tags dos clientes selecionados serão gerenciadas pelo MultiClientSelector */}
            </div>
          )}
        </div>
        
        {/* Segunda linha: Informações do contexto e botões */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Informações do contexto */}
          {currentContext && (
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {currentContext.type === 'organization' ? 'Cliente' : 'Departamento'}: 
                <span className="font-medium ml-1 text-gray-900 dark:text-white">{currentContext.name}</span>
              </span>
            </div>
          )}
          
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
      {categoryStats && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
            <span className="font-medium block sm:inline">Período analisado:</span>
            <span className="block sm:inline sm:ml-1">
              {formatDateShort(categoryStats.periodo.data_inicio)} até {formatDateShort(categoryStats.periodo.data_fim)}
            </span>
            <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
              • <strong>{categoryStats.total_tickets}</strong> {myTicketsOnly ? 'seus tickets' : 'tickets'} no período
            </span>
            {myTicketsOnly && (
              <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
                • <span className="font-medium">Filtrado por: Meus Tickets</span>
              </span>
            )}
          </p>
        </div>
      )}

      {/* Cards de Status */}
      {categoryStats && categoryStats.status_summary_detailed && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
          <StatCard
            title="Total no Período"
            value={categoryStats.total_tickets}
            icon={TicketIcon}
            color="bg-blue-600"
            statusColor="#2563eb"
          />
          {categoryStats.status_summary_detailed
            .filter(status => status.count > 0)
            .map((status) => {
              const getStatusIcon = (slug: string) => {
                if (slug.includes('aberto') || slug.includes('open')) return AlertCircle
                if (slug.includes('progresso') || slug.includes('progress') || slug.includes('aguardando') || slug.includes('deploy')) return Clock
                if (slug.includes('resolvido') || slug.includes('resolved') || slug.includes('fechado') || slug.includes('closed')) return CheckCircle
                if (slug.includes('cancelled') || slug.includes('cancelado')) return XCircle
                return TicketIcon
              }
              
              const Icon = getStatusIcon(status.slug)
              
              return (
                <StatCard
                  key={status.slug}
                  title={status.name}
                  value={status.count}
                  icon={Icon}
                  statusColor={status.color}
                />
              )
            })}
        </div>
      )}

      {/* Cards de Categorias */}
      {categoryStats && categoryStats.categorias.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Tickets por Categoria
          </h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categoryStats.categorias.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      )}

      {/* Tickets Recentes */}
      <div id="recent-tickets-section" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            {myTicketsOnly ? 'Meus Chamados Recentes' : 'Chamados Recentes'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Últimos {myTicketsOnly ? 'seus' : ''} tickets criados {myTicketsOnly ? '' : '(não afetado pelo filtro de período)'}
          </p>
        </div>
        
        {recentTickets.length > 0 ? (
          <>
            {/* Tabela Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Prioridade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Solicitante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentTickets.map((ticket) => (
                    <tr 
                      key={ticket.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                      onClick={() => handleTicketClick(ticket.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        #{ticket.ticket_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div className="truncate max-w-xs" title={ticket.title}>
                          {ticket.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {ticket.requester}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDateShort(ticket.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards Mobile */}
            <div className="sm:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                  onClick={() => handleTicketClick(ticket.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      #{ticket.ticket_number}
                    </span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {ticket.title.toUpperCase()}
                  </h3>
                  <div className="flex justify-between items-center">
                    <PriorityBadge priority={ticket.priority} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateShort(ticket.created_at)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    Solicitante: {ticket.requester}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum chamado encontrado
            </p>
          </div>
        )}
      </div>

      {/* Botão Ver Todos */}
      {recentTickets.length > 0 && (
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
