'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
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
  Loader2
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
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [dateRange, setDateRange] = useState('30days')
  const [selectedMetric, setSelectedMetric] = useState('tickets')

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Dados não disponíveis
        </h3>
      </div>
    )
  }

  // Chart configurations
  const ticketsTrendData = {
    labels: analyticsData.ticketsTrend.map(t => {
      const date = new Date(t.date)
      return `${date.getDate()}/${date.getMonth() + 1}`
    }),
    datasets: [
      {
        label: 'Tickets Criados',
        data: analyticsData.ticketsTrend.map(t => t.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }

  // Dynamic status distribution using real database data
  const statusDistributionData = {
    labels: analyticsData.ticketsByStatusDetailed
      .filter(status => status.count > 0) // Only show status with tickets
      .map(status => status.name),
    datasets: [
      {
        data: analyticsData.ticketsByStatusDetailed
          .filter(status => status.count > 0) // Only show status with tickets
          .map(status => status.count),
        backgroundColor: analyticsData.ticketsByStatusDetailed
          .filter(status => status.count > 0) // Only show status with tickets
          .map(status => status.color || '#6b7280'),
        borderWidth: 0
      }
    ]
  }

  // Dynamic priority distribution - only show priorities with tickets
  const priorityData = [
    { name: 'Baixa', value: analyticsData.ticketsByPriority.low, color: 'rgba(156, 163, 175, 0.8)', borderColor: 'rgb(156, 163, 175)' },
    { name: 'Média', value: analyticsData.ticketsByPriority.medium, color: 'rgba(59, 130, 246, 0.8)', borderColor: 'rgb(59, 130, 246)' },
    { name: 'Alta', value: analyticsData.ticketsByPriority.high, color: 'rgba(251, 146, 60, 0.8)', borderColor: 'rgb(251, 146, 60)' },
    { name: 'Crítica', value: analyticsData.ticketsByPriority.critical, color: 'rgba(239, 68, 68, 0.8)', borderColor: 'rgb(239, 68, 68)' }
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
    labels: analyticsData.ticketsByCategory
      .filter(c => c.count > 0) // Only show categories with tickets
      .map(c => c.name),
    datasets: [
      {
        label: 'Tickets por Categoria',
        data: analyticsData.ticketsByCategory
          .filter(c => c.count > 0) // Only show categories with tickets
          .map(c => c.count),
        backgroundColor: analyticsData.ticketsByCategory
          .filter(c => c.count > 0) // Only show categories with tickets
          .map(c => c.color || '#6b7280'),
        borderWidth: 0
      }
    ]
  }

  const peakHoursData = {
    labels: analyticsData.peakHours.map(h => `${h.hour}h`),
    datasets: [
      {
        label: 'Tickets por Hora',
        data: analyticsData.peakHours.map(h => h.count),
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
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Análise completa do desempenho e métricas do sistema
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
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
          <button className="p-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Tickets"
          value={analyticsData.overview.totalTickets}
          icon={TicketIcon}
          trend={analyticsData.overview.totalTicketsTrend > 0 ? 'up' : analyticsData.overview.totalTicketsTrend < 0 ? 'down' : 'neutral'}
          trendValue={`${Math.abs(analyticsData.overview.totalTicketsTrend)}% vs período anterior`}
          color="bg-blue-600"
        />
        <StatCard
          title="Tempo Médio de Resolução"
          value={analyticsData.overview.avgResolutionTime}
          icon={Clock}
          trend={analyticsData.overview.avgResolutionTrend < 0 ? 'up' : analyticsData.overview.avgResolutionTrend > 0 ? 'down' : 'neutral'}
          trendValue={`${Math.abs(analyticsData.overview.avgResolutionTrend)}% vs período anterior`}
          color="bg-purple-600"
          subtitle="Média geral"
        />
        <StatCard
          title="Taxa de Satisfação"
          value={`${analyticsData.overview.satisfactionRate}%`}
          icon={Award}
          trend={analyticsData.overview.satisfactionTrend > 0 ? 'up' : analyticsData.overview.satisfactionTrend < 0 ? 'down' : 'neutral'}
          trendValue={`${Math.abs(analyticsData.overview.satisfactionTrend)}% vs período anterior`}
          color="bg-green-600"
        />
        <StatCard
          title="Usuários Ativos"
          value={analyticsData.overview.activeUsers}
          icon={Users}
          trend={analyticsData.overview.activeUsersTrend > 0 ? 'up' : analyticsData.overview.activeUsersTrend < 0 ? 'down' : 'neutral'}
          trendValue={`${Math.abs(analyticsData.overview.activeUsersTrend)}% vs período anterior`}
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
              {analyticsData.performanceMetrics.firstResponseTime}
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
              {analyticsData.performanceMetrics.resolutionRate}%
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
              {analyticsData.performanceMetrics.reopenRate}%
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
              {analyticsData.performanceMetrics.escalationRate}%
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
                {analyticsData.userActivity.length > 0 ? (
                  analyticsData.userActivity.slice(0, 5).map((user, index) => (
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