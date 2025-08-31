'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
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
  Folder,
  Cpu,
  Wifi,
  Printer,
  Code,
  Mail,
  Shield,
  Phone
} from 'lucide-react'
import { getIcon } from '@/lib/icons'

interface Stats {
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  resolvedTickets: number
  cancelledTickets: number
  ticketsTrend: string
}

interface CategoryStat {
  id: string
  nome: string
  icon: string | null
  color: string | null
  quantidade: number
  percentual: number
  status_breakdown: {
    open: number
    in_progress: number
    resolved: number
    cancelled: number
  }
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

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>
        <p className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        {trend && (
          <p className={`mt-2 text-xs sm:text-sm flex items-center ${
            trend.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            {trend}
          </p>
        )}
      </div>
      <div className={`p-2 sm:p-3 rounded-lg ${color}`}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </div>
    </div>
  </div>
)

const CategoryCard = ({ category }: { category: CategoryStat }) => {
  const Icon = getIcon(category.icon)
  const backgroundColor = category.color ? `${category.color}20` : '#E5E7EB'
  const borderColor = category.color || '#6B7280'
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-6"
      style={{ borderLeft: `4px solid ${borderColor}` }}
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
      
      {/* Status breakdown bar */}
      <div className="mt-3 sm:mt-4">
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
          {category.status_breakdown.open > 0 && (
            <div 
              className="bg-blue-500 transition-all duration-300" 
              style={{ width: `${(category.status_breakdown.open / category.quantidade) * 100}%` }}
              title={`Abertos: ${category.status_breakdown.open}`}
            />
          )}
          {category.status_breakdown.in_progress > 0 && (
            <div 
              className="bg-yellow-500 transition-all duration-300" 
              style={{ width: `${(category.status_breakdown.in_progress / category.quantidade) * 100}%` }}
              title={`Em Progresso: ${category.status_breakdown.in_progress}`}
            />
          )}
          {category.status_breakdown.resolved > 0 && (
            <div 
              className="bg-green-500 transition-all duration-300" 
              style={{ width: `${(category.status_breakdown.resolved / category.quantidade) * 100}%` }}
              title={`Resolvidos: ${category.status_breakdown.resolved}`}
            />
          )}
          {category.status_breakdown.cancelled > 0 && (
            <div 
              className="bg-red-500 transition-all duration-300" 
              style={{ width: `${(category.status_breakdown.cancelled / category.quantidade) * 100}%` }}
              title={`Cancelados: ${category.status_breakdown.cancelled}`}
            />
          )}
        </div>
        <div className="flex justify-between mt-1.5 sm:mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="truncate">A: {category.status_breakdown.open}</span>
          <span className="truncate">P: {category.status_breakdown.in_progress}</span>
          <span className="truncate">R: {category.status_breakdown.resolved}</span>
          <span className="truncate">C: {category.status_breakdown.cancelled}</span>
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
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  }
  
  const labels: Record<string, string> = {
    open: 'Aberto',
    in_progress: 'Em Progresso',
    resolved: 'Resolvido',
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

export default function DashboardPage() {
  const { session } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  
  // Get current month dates as default
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
  
  const [stats, setStats] = useState<Stats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    cancelledTickets: 0,
    ticketsTrend: '+0%'
  })
  
  const [categoryStats, setCategoryStats] = useState<{
    total_tickets: number
    periodo: { data_inicio: string; data_fim: string }
    categorias: CategoryStat[]
    status_summary: {
      open: number
      in_progress: number
      resolved: number
      cancelled: number
    }
    average_resolution_time: string
  } | null>(null)
  
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([])

  useEffect(() => {
    setMounted(true)
    fetchDashboardData()
    fetchCategoryStats()
  }, [])

  useEffect(() => {
    fetchCategoryStats()
  }, [periodFilter])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/dashboard/stats')
      
      if (response.data) {
        setStats(response.data.stats)
        setRecentTickets(response.data.recentTickets)
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
      console.log('Fetching stats with filter:', periodFilter)
      
      const params = new URLSearchParams({
        start_date: periodFilter.start_date,
        end_date: periodFilter.end_date
      })
      
      console.log('Query params:', params.toString())
      
      const response = await axios.get(`/api/dashboard/categories-stats?${params}`)
      
      if (response.data) {
        console.log('Received data:', response.data.periodo)
        console.log('Total tickets:', response.data.total_tickets)
        setCategoryStats(response.data)
      }
    } catch (error: any) {
      console.error('Error fetching category stats:', error)
      toast.error('Erro ao carregar estatísticas por categoria')
    }
  }

  const handleApplyFilter = () => {
    console.log('Applying filter:', tempFilter)
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

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Bem-vindo de volta, {session?.user?.name}! Aqui está um resumo do sistema.
          </p>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
      </div>

      {/* Filter Panel */}
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

      {/* Period Info - Responsive */}
      {categoryStats && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
            <span className="font-medium block sm:inline">Período analisado:</span>
            <span className="block sm:inline sm:ml-1">
              {formatDateShort(categoryStats.periodo.data_inicio)} até {formatDateShort(categoryStats.periodo.data_fim)}
            </span>
            <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
              • <strong>{categoryStats.total_tickets}</strong> tickets no período
            </span>
          </p>
        </div>
      )}

      {/* Status Stats Grid - MOVED TO TOP */}
      {categoryStats && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total no Período"
            value={categoryStats.total_tickets}
            icon={TicketIcon}
            color="bg-blue-600"
          />
          <StatCard
            title="Abertos"
            value={categoryStats.status_summary.open}
            icon={AlertCircle}
            color="bg-yellow-600"
          />
          <StatCard
            title="Em Progresso"
            value={categoryStats.status_summary.in_progress}
            icon={Clock}
            color="bg-orange-600"
          />
          <StatCard
            title="Resolvidos"
            value={categoryStats.status_summary.resolved}
            icon={CheckCircle}
            color="bg-green-600"
          />
          <StatCard
            title="Cancelados"
            value={categoryStats.status_summary.cancelled}
            icon={XCircle}
            color="bg-red-600"
          />
        </div>
      )}

      {/* Category Stats Grid - MOVED AFTER STATUS STATS */}
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

      {/* Recent Tickets (not affected by filter) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Chamados Recentes
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Últimos tickets criados (não afetado pelo filtro de período)
          </p>
        </div>
        
        {recentTickets.length > 0 ? (
          <>
            {/* Desktop Table */}
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

            {/* Mobile Cards */}
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
                    {ticket.title}
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

      {/* View All Button */}
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

function formatDateShort(date: string) {
  // Handle invalid dates
  if (!date) return 'N/A'
  
  // Parse the date string safely
  const parts = date.split('-')
  if (parts.length !== 3) {
    // Try to parse as ISO date
    const dateObj = new Date(date)
    if (!isNaN(dateObj.getTime())) {
      const day = String(dateObj.getDate()).padStart(2, '0')
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const year = dateObj.getFullYear()
      return `${day}/${month}/${year}`
    }
    return 'N/A'
  }
  
  const [year, month, day] = parts.map(Number)
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return 'N/A'
  }
  
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}