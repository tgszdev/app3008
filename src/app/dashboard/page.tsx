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
  Loader2
} from 'lucide-react'

interface Stats {
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  resolvedTickets: number
  cancelledTickets: number
  averageResolutionTime: string
  satisfactionRate: number
  ticketsTrend: string
  usersTrend: string
  activeUsers: number
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
  const [stats, setStats] = useState<Stats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    cancelledTickets: 0,
    averageResolutionTime: '0h 0m',
    satisfactionRate: 0,
    ticketsTrend: '+0%',
    usersTrend: '+0%',
    activeUsers: 0
  })
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([])

  useEffect(() => {
    setMounted(true)
    fetchDashboardData()
  }, [])

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
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
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
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Bem-vindo de volta, {session?.user?.name}! Aqui está um resumo do sistema.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total"
          value={stats.totalTickets}
          icon={TicketIcon}
          trend={stats.ticketsTrend}
          color="bg-blue-600"
        />
        <StatCard
          title="Abertos"
          value={stats.openTickets}
          icon={AlertCircle}
          color="bg-yellow-600"
        />
        <StatCard
          title="Em Progresso"
          value={stats.inProgressTickets}
          icon={Clock}
          color="bg-orange-600"
        />
        <StatCard
          title="Resolvidos"
          value={stats.resolvedTickets}
          icon={CheckCircle}
          color="bg-green-600"
        />
        <StatCard
          title="Cancelados"
          value={stats.cancelledTickets}
          icon={XCircle}
          color="bg-red-600"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Tempo Médio de Resolução
              </p>
              <p className="mt-2 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averageResolutionTime}
              </p>
            </div>
            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Taxa de Satisfação
              </p>
              <p className="mt-2 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {stats.satisfactionRate}%
              </p>
            </div>
            <BarChart className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Usuários Ativos
              </p>
              <p className="mt-2 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {stats.activeUsers}
              </p>
              <p className={`mt-1 text-xs sm:text-sm flex items-center ${
                stats.usersTrend.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {stats.usersTrend}
              </p>
            </div>
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-600" />
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Chamados Recentes
          </h2>
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
  return new Date(date).toLocaleDateString('pt-BR')
}