'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import apiClient from '@/lib/api-client'
import { format, startOfMonth, endOfMonth, parseISO, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import TimesheetNavigation from '@/components/TimesheetNavigation'
import {
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Ticket,
  BarChart3,
  PieChart,
  Activity,
  Loader2,
  AlertCircle,
  Download,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface TimeSheetData {
  id: string
  ticket_id: string
  user_id: string
  hours_worked: number
  description: string
  work_date: string
  status: 'pending' | 'approved' | 'rejected'
  ticket: {
    id: string
    ticket_number: number
    title: string
  }
  user: {
    id: string
    name: string
    email: string
  }
}

interface Analytics {
  totalHours: number
  approvedHours: number
  pendingHours: number
  rejectedHours: number
  totalTimesheets: number
  uniqueUsers: number
  uniqueTickets: number
  averageHoursPerDay: number
  averageHoursPerUser: number
  topUsers: Array<{ user: string; hours: number }>
  topTickets: Array<{ ticket: string; hours: number }>
  dailyData: Array<{ date: string; hours: number }>
  weeklyData: Array<{ week: string; hours: number }>
}

export default function TimesheetsAnalyticsPage() {
  const { data: session } = useSession()
  const [timesheets, setTimesheets] = useState<TimeSheetData[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter states
  const [filterStartDate, setFilterStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [filterEndDate, setFilterEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [filterStartDate, filterEndDate, filterStatus])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Verificar se é admin
      const userRole = (session?.user as any)?.role
      if (userRole !== 'admin') {
        toast.error('Acesso negado. Apenas administradores podem acessar esta página.')
        return
      }
      
      // Buscar apontamentos com filtros
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterStartDate) params.append('start_date', filterStartDate)
      if (filterEndDate) params.append('end_date', filterEndDate)
      
      const response = await apiClient.get(`/api/timesheets?${params.toString()}`)
      const data = response.data || []
      setTimesheets(data)
      
      // Calcular analytics
      calculateAnalytics(data)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (data: TimeSheetData[]) => {
    const totalHours = data.reduce((sum, t) => sum + parseFloat(t.hours_worked.toString()), 0)
    const approvedHours = data
      .filter(t => t.status === 'approved')
      .reduce((sum, t) => sum + parseFloat(t.hours_worked.toString()), 0)
    const pendingHours = data
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + parseFloat(t.hours_worked.toString()), 0)
    const rejectedHours = data
      .filter(t => t.status === 'rejected')
      .reduce((sum, t) => sum + parseFloat(t.hours_worked.toString()), 0)
    
    // Usuários únicos
    const uniqueUserIds = new Set(data.map(t => t.user_id))
    const uniqueUsers = uniqueUserIds.size
    
    // Tickets únicos
    const uniqueTicketIds = new Set(data.map(t => t.ticket_id))
    const uniqueTickets = uniqueTicketIds.size
    
    // Top usuários
    const userHours = new Map<string, number>()
    data.forEach(t => {
      const current = userHours.get(t.user.name) || 0
      userHours.set(t.user.name, current + parseFloat(t.hours_worked.toString()))
    })
    const topUsers = Array.from(userHours.entries())
      .map(([user, hours]) => ({ user, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5)
    
    // Top tickets
    const ticketHours = new Map<string, number>()
    data.forEach(t => {
      const ticketLabel = `#${t.ticket.ticket_number}`
      const current = ticketHours.get(ticketLabel) || 0
      ticketHours.set(ticketLabel, current + parseFloat(t.hours_worked.toString()))
    })
    const topTickets = Array.from(ticketHours.entries())
      .map(([ticket, hours]) => ({ ticket, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5)
    
    // Dados diários
    const dailyMap = new Map<string, number>()
    data.forEach(t => {
      const date = format(parseISO(t.work_date), 'yyyy-MM-dd')
      const current = dailyMap.get(date) || 0
      dailyMap.set(date, current + parseFloat(t.hours_worked.toString()))
    })
    
    const startDate = filterStartDate ? parseISO(filterStartDate) : startOfMonth(new Date())
    const endDate = filterEndDate ? parseISO(filterEndDate) : endOfMonth(new Date())
    const allDays = eachDayOfInterval({ start: startDate, end: endDate })
    
    const dailyData = allDays.map(day => ({
      date: format(day, 'yyyy-MM-dd'),
      hours: dailyMap.get(format(day, 'yyyy-MM-dd')) || 0
    }))
    
    // Dados semanais
    const weeklyMap = new Map<string, number>()
    data.forEach(t => {
      const date = parseISO(t.work_date)
      const weekStart = startOfWeek(date, { locale: ptBR })
      const weekLabel = format(weekStart, "'Semana de' dd/MM", { locale: ptBR })
      const current = weeklyMap.get(weekLabel) || 0
      weeklyMap.set(weekLabel, current + parseFloat(t.hours_worked.toString()))
    })
    const weeklyData = Array.from(weeklyMap.entries())
      .map(([week, hours]) => ({ week, hours }))
      .slice(-4)
    
    // Médias
    const daysWithWork = new Set(data.map(t => t.work_date)).size
    const averageHoursPerDay = daysWithWork > 0 ? totalHours / daysWithWork : 0
    const averageHoursPerUser = uniqueUsers > 0 ? totalHours / uniqueUsers : 0
    
    setAnalytics({
      totalHours,
      approvedHours,
      pendingHours,
      rejectedHours,
      totalTimesheets: data.length,
      uniqueUsers,
      uniqueTickets,
      averageHoursPerDay,
      averageHoursPerUser,
      topUsers,
      topTickets,
      dailyData,
      weeklyData
    })
  }

  const exportToCSV = () => {
    if (!timesheets.length) {
      toast.error('Não há dados para exportar')
      return
    }
    
    const headers = ['Data', 'Usuário', 'Ticket', 'Horas', 'Status', 'Descrição']
    const rows = timesheets.map(t => [
      format(parseISO(t.work_date), 'dd/MM/yyyy'),
      t.user.name,
      `#${t.ticket.ticket_number} - ${t.ticket.title}`,
      t.hours_worked.toString(),
      t.status === 'approved' ? 'Aprovado' : t.status === 'pending' ? 'Pendente' : 'Rejeitado',
      `"${t.description.replace(/"/g, '""')}"`
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `apontamentos_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    toast.success('Relatório exportado com sucesso!')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const userRole = (session?.user as any)?.role
  if (userRole !== 'admin') {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Acesso Negado
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <TimesheetNavigation />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics de Apontamentos
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Visualize métricas e tendências dos apontamentos
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos</option>
                <option value="approved">Aprovados</option>
                <option value="pending">Pendentes</option>
                <option value="rejected">Rejeitados</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {analytics && (
        <>
          {/* Cards de Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-8 w-8 opacity-80" />
                <span className="text-xs uppercase tracking-wider opacity-80">Total</span>
              </div>
              <p className="text-3xl font-bold">{analytics.totalHours.toFixed(1)}h</p>
              <p className="text-sm opacity-90 mt-1">Horas registradas</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-8 w-8 opacity-80" />
                <span className="text-xs uppercase tracking-wider opacity-80">Aprovadas</span>
              </div>
              <p className="text-3xl font-bold">{analytics.approvedHours.toFixed(1)}h</p>
              <p className="text-sm opacity-90 mt-1">
                {analytics.totalHours > 0 
                  ? `${Math.round((analytics.approvedHours / analytics.totalHours) * 100)}% do total`
                  : '0% do total'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 opacity-80" />
                <span className="text-xs uppercase tracking-wider opacity-80">Equipe</span>
              </div>
              <p className="text-3xl font-bold">{analytics.uniqueUsers}</p>
              <p className="text-sm opacity-90 mt-1">Usuários ativos</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Ticket className="h-8 w-8 opacity-80" />
                <span className="text-xs uppercase tracking-wider opacity-80">Tickets</span>
              </div>
              <p className="text-3xl font-bold">{analytics.uniqueTickets}</p>
              <p className="text-sm opacity-90 mt-1">Com apontamentos</p>
            </div>
          </div>

          {/* Métricas Secundárias */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Médias
                </h3>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Por dia trabalhado</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics.averageHoursPerDay.toFixed(1)}h
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Por usuário</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics.averageHoursPerUser.toFixed(1)}h
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Status dos Apontamentos
                </h3>
                <PieChart className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600 dark:text-green-400">Aprovados</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {analytics.approvedHours.toFixed(1)}h
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">Pendentes</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {analytics.pendingHours.toFixed(1)}h
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-600 dark:text-red-400">Rejeitados</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {analytics.rejectedHours.toFixed(1)}h
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Resumo
                </h3>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total de Apontamentos</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {analytics.totalTimesheets}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de Aprovação</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {analytics.totalHours > 0 
                      ? `${Math.round((analytics.approvedHours / analytics.totalHours) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de Rejeição</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {analytics.totalHours > 0 
                      ? `${Math.round((analytics.rejectedHours / analytics.totalHours) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Usuários */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Colaboradores
              </h3>
              <div className="space-y-3">
                {analytics.topUsers.map((item, index) => (
                  <div key={item.user} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                        ${index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                          index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100' :
                          index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100' :
                          'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}
                      `}>
                        {index + 1}º
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.user}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.hours.toFixed(1)}h
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Tickets */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Tickets com Mais Horas
              </h3>
              <div className="space-y-3">
                {analytics.topTickets.map((item, index) => (
                  <div key={item.ticket} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                        ${index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                          index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100' :
                          index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100' :
                          'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}
                      `}>
                        {index + 1}º
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.ticket}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.hours.toFixed(1)}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}