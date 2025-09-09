'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import apiClient from '@/lib/api-client'
import { format, startOfMonth, endOfMonth, parseISO, eachDayOfInterval, startOfWeek, endOfWeek, subMonths } from 'date-fns'
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
  ChevronUp,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  Zap,
  Briefcase,
  Hash,
  FolderOpen,
  GitBranch
} from 'lucide-react'

interface TicketDetails {
  id: string
  ticket_number: number
  title: string
  priority?: string
  category?: string
  status?: string
}

interface TimeSheetData {
  id: string
  ticket_id: string
  user_id: string
  hours_worked: number
  description?: string
  activity_description?: string
  work_date: string
  status: 'pending' | 'approved' | 'rejected'
  ticket: TicketDetails
  user: {
    id: string
    name: string
    email: string
  }
}

interface UserHoursData {
  name: string
  totalHours: number
  approvedHours: number
  pendingHours: number
  rejectedHours: number
  ticketCount: number
  averageHoursPerTicket: number
  lastActivity: string
}

interface CategoryData {
  category: string
  hours: number
  percentage: number
  ticketCount: number
}

interface PriorityData {
  priority: string
  hours: number
  percentage: number
  ticketCount: number
  averageHours: number
}

interface Analytics {
  // Totais gerais
  totalHours: number
  approvedHours: number
  pendingHours: number
  rejectedHours: number
  totalTimesheets: number
  
  // Colaboradores
  totalCollaborators: number // Quantidade de colaboradores que apontaram
  userHoursData: UserHoursData[] // Total de horas por colaborador
  
  // Chamados e categorias
  uniqueTickets: number
  categoryDistribution: CategoryData[] // Horas por categoria
  priorityDistribution: PriorityData[] // Horas por prioridade
  
  // Médias e tendências
  averageHoursPerDay: number
  averageHoursPerUser: number
  averageHoursPerTicket: number
  
  // Top consumidores de tempo
  topTickets: Array<{ ticket: string; title: string; hours: number; percentage: number }>
  topCategories: Array<{ category: string; hours: number }>
  
  // Dados temporais
  dailyData: Array<{ date: string; hours: number; approved: number; pending: number }>
  weeklyData: Array<{ week: string; hours: number; users: number }>
  monthlyTrend: Array<{ month: string; hours: number; growth: number }>
  
  // Eficiência
  approvalRate: number
  rejectionRate: number
  pendingRate: number
  productivityScore: number
}

export default function TimesheetsAnalyticsPage() {
  const { data: session } = useSession()
  const [timesheets, setTimesheets] = useState<TimeSheetData[]>([])
  const [tickets, setTickets] = useState<TicketDetails[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'trends'>('overview')
  
  // Filter states
  const [filterStartDate, setFilterStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [filterEndDate, setFilterEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterUser, setFilterUser] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [filterStartDate, filterEndDate, filterStatus, filterUser, filterCategory])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Verificar se é admin
      const userRole = (session?.user as any)?.role
      if (userRole !== 'admin') {
        toast.error('Acesso negado. Apenas administradores podem acessar esta página.')
        return
      }
      
      // Buscar tickets para obter categorias e prioridades
      const ticketsResponse = await apiClient.get('/api/tickets')
      const ticketsData = ticketsResponse.data || []
      setTickets(ticketsData)
      
      // Buscar apontamentos com filtros
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterStartDate) params.append('start_date', filterStartDate)
      if (filterEndDate) params.append('end_date', filterEndDate)
      if (filterUser !== 'all') params.append('user_id', filterUser)
      
      const response = await apiClient.get(`/api/timesheets?${params.toString()}`)
      const data = response.data || []
      
      // Enriquecer dados com informações dos tickets
      const enrichedData = data.map((timesheet: TimeSheetData) => {
        const ticketInfo = ticketsData.find((t: TicketDetails) => t.id === timesheet.ticket_id)
        return {
          ...timesheet,
          ticket: {
            ...timesheet.ticket,
            priority: ticketInfo?.priority || 'Média',
            category: ticketInfo?.category || 'Geral',
            status: ticketInfo?.status || 'open'
          }
        }
      })
      
      setTimesheets(enrichedData)
      calculateAnalytics(enrichedData, ticketsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (data: TimeSheetData[], ticketsData: TicketDetails[]) => {
    // Totais de horas
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
    
    // Colaboradores únicos que apontaram
    const uniqueUserIds = new Set(data.map(t => t.user_id))
    const totalCollaborators = uniqueUserIds.size
    
    // Total de horas por colaborador
    interface UserHoursTemp {
      name: string
      totalHours: number
      approvedHours: number
      pendingHours: number
      rejectedHours: number
      ticketsSet: Set<string>
      lastActivity: string
    }
    
    const userMap = new Map<string, UserHoursTemp>()
    data.forEach(t => {
      const userName = t.user.name
      const current = userMap.get(userName) || {
        name: userName,
        totalHours: 0,
        approvedHours: 0,
        pendingHours: 0,
        rejectedHours: 0,
        ticketsSet: new Set<string>(),
        lastActivity: t.work_date
      }
      
      current.totalHours += parseFloat(t.hours_worked.toString())
      if (t.status === 'approved') current.approvedHours += parseFloat(t.hours_worked.toString())
      if (t.status === 'pending') current.pendingHours += parseFloat(t.hours_worked.toString())
      if (t.status === 'rejected') current.rejectedHours += parseFloat(t.hours_worked.toString())
      
      current.ticketsSet.add(t.ticket_id)
      
      if (t.work_date > current.lastActivity) {
        current.lastActivity = t.work_date
      }
      
      userMap.set(userName, current)
    })
    
    const userHoursData: UserHoursData[] = Array.from(userMap.values()).map(user => ({
      name: user.name,
      totalHours: user.totalHours,
      approvedHours: user.approvedHours,
      pendingHours: user.pendingHours,
      rejectedHours: user.rejectedHours,
      ticketCount: user.ticketsSet.size,
      averageHoursPerTicket: user.totalHours / (user.ticketsSet.size || 1),
      lastActivity: user.lastActivity
    })).sort((a, b) => b.totalHours - a.totalHours)
    
    // Distribuição por categoria
    const categoryMap = new Map<string, { hours: number; tickets: Set<string> }>()
    data.forEach(t => {
      const category = t.ticket.category || 'Sem Categoria'
      const current = categoryMap.get(category) || { hours: 0, tickets: new Set() }
      current.hours += parseFloat(t.hours_worked.toString())
      current.tickets.add(t.ticket_id)
      categoryMap.set(category, current)
    })
    
    const categoryDistribution = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      hours: data.hours,
      percentage: (data.hours / totalHours) * 100,
      ticketCount: data.tickets.size
    })).sort((a, b) => b.hours - a.hours)
    
    // Distribuição por prioridade
    const priorityMap = new Map<string, { hours: number; tickets: Set<string> }>()
    const priorityOrder = { 'Crítica': 1, 'Alta': 2, 'Média': 3, 'Baixa': 4 }
    
    data.forEach(t => {
      const priority = t.ticket.priority || 'Média'
      const current = priorityMap.get(priority) || { hours: 0, tickets: new Set() }
      current.hours += parseFloat(t.hours_worked.toString())
      current.tickets.add(t.ticket_id)
      priorityMap.set(priority, current)
    })
    
    const priorityDistribution = Array.from(priorityMap.entries()).map(([priority, data]) => ({
      priority,
      hours: data.hours,
      percentage: (data.hours / totalHours) * 100,
      ticketCount: data.tickets.size,
      averageHours: data.hours / data.tickets.size
    })).sort((a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] || 99) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 99))
    
    // Chamados únicos
    const uniqueTicketIds = new Set(data.map(t => t.ticket_id))
    const uniqueTickets = uniqueTicketIds.size
    
    // Top chamados consumidores de tempo
    const ticketHoursMap = new Map<string, { hours: number; title: string; number: number }>()
    data.forEach(t => {
      const ticketKey = t.ticket_id
      const current = ticketHoursMap.get(ticketKey) || { 
        hours: 0, 
        title: t.ticket.title,
        number: t.ticket.ticket_number
      }
      current.hours += parseFloat(t.hours_worked.toString())
      ticketHoursMap.set(ticketKey, current)
    })
    
    const topTickets = Array.from(ticketHoursMap.entries())
      .map(([id, data]) => ({
        ticket: `#${data.number}`,
        title: data.title,
        hours: data.hours,
        percentage: (data.hours / totalHours) * 100
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10)
    
    // Top categorias
    const topCategories = categoryDistribution.slice(0, 5).map(c => ({
      category: c.category,
      hours: c.hours
    }))
    
    // Dados diários
    const dailyMap = new Map<string, { hours: number; approved: number; pending: number; users: Set<string> }>()
    data.forEach(t => {
      const date = format(parseISO(t.work_date), 'yyyy-MM-dd')
      const current = dailyMap.get(date) || { hours: 0, approved: 0, pending: 0, users: new Set() }
      current.hours += parseFloat(t.hours_worked.toString())
      if (t.status === 'approved') current.approved += parseFloat(t.hours_worked.toString())
      if (t.status === 'pending') current.pending += parseFloat(t.hours_worked.toString())
      current.users.add(t.user_id)
      dailyMap.set(date, current)
    })
    
    const startDate = filterStartDate ? parseISO(filterStartDate) : startOfMonth(new Date())
    const endDate = filterEndDate ? parseISO(filterEndDate) : endOfMonth(new Date())
    const allDays = eachDayOfInterval({ start: startDate, end: endDate })
    
    const dailyData = allDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const data = dailyMap.get(dateStr)
      return {
        date: dateStr,
        hours: data?.hours || 0,
        approved: data?.approved || 0,
        pending: data?.pending || 0
      }
    })
    
    // Dados semanais
    const weeklyMap = new Map<string, { hours: number; users: Set<string> }>()
    data.forEach(t => {
      const date = parseISO(t.work_date)
      const weekStart = startOfWeek(date, { locale: ptBR })
      const weekLabel = format(weekStart, "'Semana de' dd/MM", { locale: ptBR })
      const current = weeklyMap.get(weekLabel) || { hours: 0, users: new Set() }
      current.hours += parseFloat(t.hours_worked.toString())
      current.users.add(t.user_id)
      weeklyMap.set(weekLabel, current)
    })
    
    const weeklyData = Array.from(weeklyMap.entries())
      .map(([week, data]) => ({ 
        week, 
        hours: data.hours,
        users: data.users.size
      }))
      .slice(-8) // Últimas 8 semanas
    
    // Tendência mensal
    const monthlyMap = new Map<string, number>()
    data.forEach(t => {
      const month = format(parseISO(t.work_date), 'yyyy-MM')
      const current = monthlyMap.get(month) || 0
      monthlyMap.set(month, current + parseFloat(t.hours_worked.toString()))
    })
    
    const monthlyEntries = Array.from(monthlyMap.entries()).sort()
    const monthlyTrend = monthlyEntries.map(([month, hours], index) => {
      const previousHours = index > 0 ? monthlyEntries[index - 1][1] : hours
      const growth = previousHours > 0 ? ((hours - previousHours) / previousHours) * 100 : 0
      return {
        month: format(parseISO(`${month}-01`), 'MMM/yy', { locale: ptBR }),
        hours,
        growth
      }
    })
    
    // Médias
    const daysWithWork = new Set(data.map(t => t.work_date)).size
    const averageHoursPerDay = daysWithWork > 0 ? totalHours / daysWithWork : 0
    const averageHoursPerUser = totalCollaborators > 0 ? totalHours / totalCollaborators : 0
    const averageHoursPerTicket = uniqueTickets > 0 ? totalHours / uniqueTickets : 0
    
    // Taxas de eficiência
    const approvalRate = totalHours > 0 ? (approvedHours / totalHours) * 100 : 0
    const rejectionRate = totalHours > 0 ? (rejectedHours / totalHours) * 100 : 0
    const pendingRate = totalHours > 0 ? (pendingHours / totalHours) * 100 : 0
    
    // Score de produtividade (baseado em aprovações e horas médias)
    const productivityScore = approvalRate * 0.4 + 
                             (averageHoursPerUser > 40 ? 100 : (averageHoursPerUser / 40) * 100) * 0.3 +
                             (uniqueTickets > 20 ? 100 : (uniqueTickets / 20) * 100) * 0.3
    
    setAnalytics({
      totalHours,
      approvedHours,
      pendingHours,
      rejectedHours,
      totalTimesheets: data.length,
      totalCollaborators,
      userHoursData,
      uniqueTickets,
      categoryDistribution,
      priorityDistribution,
      averageHoursPerDay,
      averageHoursPerUser,
      averageHoursPerTicket,
      topTickets,
      topCategories,
      dailyData,
      weeklyData,
      monthlyTrend,
      approvalRate,
      rejectionRate,
      pendingRate,
      productivityScore
    })
  }

  const exportToCSV = () => {
    if (!timesheets.length) {
      toast.error('Não há dados para exportar')
      return
    }
    
    const headers = ['Data', 'Usuário', 'Chamado', 'Categoria', 'Prioridade', 'Horas', 'Status', 'Descrição']
    const rows = timesheets.map(t => [
      format(parseISO(t.work_date), 'dd/MM/yyyy'),
      t.user.name,
      `#${t.ticket.ticket_number} - ${t.ticket.title}`,
      t.ticket.category || 'Sem Categoria',
      t.ticket.priority || 'Média',
      t.hours_worked.toString(),
      t.status === 'approved' ? 'Aprovado' : t.status === 'pending' ? 'Pendente' : 'Rejeitado',
      `"${(t.description || t.activity_description || '').replace(/"/g, '""')}"`
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics_timesheets_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    toast.success('Relatório exportado com sucesso!')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'crítica':
      case 'critical': 
        return 'text-red-600 bg-red-100 dark:bg-red-900/30'
      case 'alta':
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
      case 'média':
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
      case 'baixa':
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30'
      default: 
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30'
    }
  }

  const translatePriority = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'Crítica'
      case 'high': return 'Alta'
      case 'medium': return 'Média'
      case 'low': return 'Baixa'
      default: return priority
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
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
            Análise completa de horas apontadas e produtividade
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                <option value="approved">Aprovado</option>
                <option value="pending">Pendente</option>
                <option value="rejected">Rejeitado</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Colaborador
              </label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos</option>
                {analytics?.userHoursData.map(user => (
                  <option key={user.name} value={user.name}>{user.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoria
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todas</option>
                {analytics?.categoryDistribution.map(cat => (
                  <option key={cat.category} value={cat.category}>{cat.category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Colaboradores
          </button>
        </nav>
      </div>

      {analytics && (
        <>
          {/* Tab: Visão Geral */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-help group relative">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-8 w-8 text-blue-500" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics.totalHours.toFixed(1)}h
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Horas</p>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Soma de todas as horas registradas no período
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${analytics.approvalRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{analytics.approvalRate.toFixed(0)}% aprovadas</span>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-help group relative">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-8 w-8 text-purple-500" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics.totalCollaborators}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Colaboradores Ativos</p>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Quantidade de colaboradores que fizeram apontamentos
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Média: {analytics.averageHoursPerUser.toFixed(1)}h por pessoa
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-help group relative">
                  <div className="flex items-center justify-between mb-2">
                    <Ticket className="h-8 w-8 text-green-500" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics.uniqueTickets}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Chamados Trabalhados</p>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Total de chamados únicos com apontamentos
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Média: {analytics.averageHoursPerTicket.toFixed(1)}h por chamado
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-help group relative">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="h-8 w-8 text-yellow-500" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics.productivityScore.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Score de Produtividade</p>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Taxa de aprovação multiplicada pela eficiência
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                  <div className="mt-2">
                    {analytics.productivityScore >= 80 ? (
                      <span className="text-xs text-green-600">Excelente</span>
                    ) : analytics.productivityScore >= 60 ? (
                      <span className="text-xs text-yellow-600">Bom</span>
                    ) : (
                      <span className="text-xs text-red-600">Precisa Melhorar</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-help group relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribuição por Status</h3>
                    <Activity className="h-5 w-5 text-gray-400" />
                  </div>
                  {/* Tooltip */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Percentual de horas por situação de aprovação
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Aprovadas</span>
                        <span className="text-sm font-medium text-green-600">{analytics.approvedHours.toFixed(1)}h</span>
                      </div>
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${analytics.approvalRate}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Pendentes</span>
                        <span className="text-sm font-medium text-yellow-600">{analytics.pendingHours.toFixed(1)}h</span>
                      </div>
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-yellow-600 h-2 rounded-full"
                          style={{ width: `${analytics.pendingRate}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Rejeitadas</span>
                        <span className="text-sm font-medium text-red-600">{analytics.rejectedHours.toFixed(1)}h</span>
                      </div>
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${analytics.rejectionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Chamados */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2 cursor-help group relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top 5 Chamados Consumidores de Tempo</h3>
                    <Ticket className="h-5 w-5 text-gray-400" />
                  </div>
                  {/* Tooltip */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Chamados que mais consumiram horas no período
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                  <div className="space-y-2">
                    {analytics.topTickets.slice(0, 5).map((ticket, index) => (
                      <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">{ticket.ticket}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {ticket.title}
                            </span>
                          </div>
                          <div className="mt-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{ width: `${ticket.percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <span className="font-semibold text-gray-900 dark:text-white">{ticket.hours.toFixed(1)}h</span>
                          <span className="block text-xs text-gray-500">{ticket.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Horas por Categoria e Prioridade */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Horas por Categoria */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-help group relative">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Horas por Categoria
                      </h3>
                    </div>
                    <FolderOpen className="h-5 w-5 text-gray-400" />
                  </div>
                  {/* Tooltip */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Distribuição de horas por tipo de categoria
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                  <div className="space-y-3">
                    {analytics?.categoryDistribution.slice(0, 5).map((category, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {category.category}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {category.ticketCount} chamados
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {category.hours.toFixed(1)}h
                            </span>
                          </div>
                        </div>
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {category.percentage.toFixed(1)}% do total
                        </div>
                      </div>
                    ))}
                  </div>
                  {analytics?.categoryDistribution.length === 0 && (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma categoria encontrada</p>
                    </div>
                  )}
                </div>

                {/* Horas por Prioridade */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-help group relative">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Horas por Prioridade
                      </h3>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-gray-400" />
                  </div>
                  {/* Tooltip */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Distribuição de horas por nível de prioridade
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {analytics?.priorityDistribution.map((priority, index) => {
                      const getPriorityStyle = (p: string) => {
                        switch(p.toLowerCase()) {
                          case 'crítica': 
                          case 'critical': 
                            return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          case 'alta':
                          case 'high':
                            return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                          case 'média':
                          case 'medium':
                            return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                          case 'baixa':
                          case 'low':
                            return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          default:
                            return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                        }
                      }
                      
                      const getPriorityTextColor = (p: string) => {
                        switch(p.toLowerCase()) {
                          case 'crítica':
                          case 'critical':
                            return 'text-red-700 dark:text-red-300'
                          case 'alta':
                          case 'high':
                            return 'text-orange-700 dark:text-orange-300'
                          case 'média':
                          case 'medium':
                            return 'text-yellow-700 dark:text-yellow-300'
                          case 'baixa':
                          case 'low':
                            return 'text-green-700 dark:text-green-300'
                          default:
                            return 'text-gray-700 dark:text-gray-300'
                        }
                      }
                      
                      return (
                        <div key={index} className={`rounded-lg p-3 border ${getPriorityStyle(priority.priority)}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-semibold ${getPriorityTextColor(priority.priority)}`}>
                              {translatePriority(priority.priority)}
                            </span>
                            {priority.priority.toLowerCase() === 'crítica' || priority.priority.toLowerCase() === 'critical' ? <Zap className="h-4 w-4 text-red-500" /> : null}
                            {priority.priority.toLowerCase() === 'alta' || priority.priority.toLowerCase() === 'high' ? <TrendingUp className="h-4 w-4 text-orange-500" /> : null}
                            {priority.priority.toLowerCase() === 'média' || priority.priority.toLowerCase() === 'medium' ? <Activity className="h-4 w-4 text-yellow-500" /> : null}
                            {priority.priority.toLowerCase() === 'baixa' || priority.priority.toLowerCase() === 'low' ? <TrendingDown className="h-4 w-4 text-green-500" /> : null}
                          </div>
                          <div className={`text-xl font-bold ${getPriorityTextColor(priority.priority)}`}>
                            {priority.hours.toFixed(1)}h
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {priority.ticketCount} chamados
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Média: {priority.averageHours.toFixed(1)}h/chamado
                          </div>
                          <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                            <div 
                              className={`h-1 rounded-full ${priority.priority.toLowerCase() === 'crítica' || priority.priority.toLowerCase() === 'critical' ? 'bg-red-500' : priority.priority.toLowerCase() === 'alta' || priority.priority.toLowerCase() === 'high' ? 'bg-orange-500' : priority.priority.toLowerCase() === 'média' || priority.priority.toLowerCase() === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${priority.percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {priority.percentage.toFixed(1)}% do total
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {analytics?.priorityDistribution.length === 0 && (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma prioridade encontrada</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Gráfico de Tendências - Horas Diárias */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Horas Diárias - Últimos 30 dias
                  </h3>
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-[600px] h-64">
                    <div className="flex items-end justify-between h-full gap-1">
                      {analytics.dailyData.map((day, index) => {
                        const maxHours = Math.max(...analytics.dailyData.map(d => d.hours)) || 1
                        const heightPercentage = (day.hours / maxHours) * 100
                        const approvedPercentage = day.hours > 0 ? (day.approved / day.hours) * 100 : 0
                        const pendingPercentage = day.hours > 0 ? (day.pending / day.hours) * 100 : 0
                        const rejectedPercentage = day.hours > 0 ? (day.rejected / day.hours) * 100 : 0
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div className="w-full flex flex-col justify-end h-48">
                              <div 
                                className="w-full bg-gray-300 dark:bg-gray-600 rounded-t relative group cursor-pointer"
                                style={{ height: `${heightPercentage}%` }}
                              >
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  Total: {day.hours.toFixed(1)}h
                                  <br />
                                  <span className="text-green-400">Aprovadas: {day.approved.toFixed(1)}h</span>
                                  <br />
                                  <span className="text-yellow-400">Pendentes: {day.pending.toFixed(1)}h</span>
                                  {day.rejected > 0 && (
                                    <>
                                      <br />
                                      <span className="text-red-400">Rejeitadas: {day.rejected.toFixed(1)}h</span>
                                    </>
                                  )}
                                </div>
                                {/* Barra de aprovadas (verde) */}
                                <div 
                                  className="absolute bottom-0 w-full bg-green-600 rounded-t"
                                  style={{ height: `${approvedPercentage}%` }}
                                />
                                {/* Barra de pendentes (amarelo) */}
                                <div 
                                  className="absolute w-full bg-yellow-600"
                                  style={{ 
                                    height: `${pendingPercentage}%`,
                                    bottom: `${approvedPercentage}%`
                                  }}
                                />
                                {/* Barra de rejeitadas (vermelho) */}
                                {rejectedPercentage > 0 && (
                                  <div 
                                    className="absolute w-full bg-red-600"
                                    style={{ 
                                      height: `${rejectedPercentage}%`,
                                      bottom: `${approvedPercentage + pendingPercentage}%`
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 rotate-45 origin-left">
                              {format(parseISO(day.date), 'dd/MM')}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-600 rounded"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Aprovadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-600 rounded"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Pendentes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Rejeitadas</span>
                  </div>
                </div>
              </div>

              {/* Tendências Semanal e Mensal */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Tendência Semanal */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Tendência Semanal
                  </h3>
                  <div className="space-y-3">
                    {analytics.weeklyData.map((week, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {week.week}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {week.users} colaboradores
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {week.hours.toFixed(1)}h
                            </span>
                          </div>
                        </div>
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                            style={{ 
                              width: `${(week.hours / Math.max(...analytics.weeklyData.map(w => w.hours))) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evolução Mensal */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Evolução Mensal
                  </h3>
                  <div className="space-y-3">
                    {analytics.monthlyTrend.map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {month.month}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {month.hours.toFixed(0)}h
                          </span>
                          {month.growth !== 0 && (
                            <span className={`flex items-center gap-1 text-sm ${
                              month.growth > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {month.growth > 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              {Math.abs(month.growth).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Métricas de Desempenho */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Timer className="h-8 w-8 opacity-80" />
                    <span className="text-3xl font-bold">
                      {analytics.averageHoursPerDay.toFixed(1)}h
                    </span>
                  </div>
                  <p className="text-sm opacity-90">Média de Horas/Dia</p>
                  <p className="text-xs opacity-70 mt-1">
                    Dias trabalhados: {analytics.daysWorked}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="h-8 w-8 opacity-80" />
                    <span className="text-3xl font-bold">
                      {analytics.averageHoursPerTicket.toFixed(1)}h
                    </span>
                  </div>
                  <p className="text-sm opacity-90">Média por Chamado</p>
                  <p className="text-xs opacity-70 mt-1">
                    Total: {analytics.uniqueTickets} chamados
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Award className="h-8 w-8 opacity-80" />
                    <span className="text-3xl font-bold">
                      {analytics.mostProductiveDay}
                    </span>
                  </div>
                  <p className="text-sm opacity-90">Dia Mais Produtivo</p>
                  <p className="text-xs opacity-70 mt-1">
                    {analytics.mostProductiveHours.toFixed(1)}h registradas
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Colaboradores */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Total de Horas por Colaborador
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {analytics.totalCollaborators} colaboradores registraram apontamentos no período
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Colaborador
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Total Horas
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Aprovadas
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Pendentes
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Chamados
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Média/Chamado
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Última Atividade
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {analytics.userHoursData.map((user, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                              {user.totalHours.toFixed(1)}h
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-green-600 dark:text-green-400">
                              {user.approvedHours.toFixed(1)}h
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-yellow-600 dark:text-yellow-400">
                              {user.pendingHours.toFixed(1)}h
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {user.ticketCount}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {user.averageHoursPerTicket.toFixed(1)}h
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {format(parseISO(user.lastActivity), 'dd/MM', { locale: ptBR })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Gráfico de barras horizontal */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Distribuição Visual de Horas
                </h3>
                <div className="space-y-3">
                  {analytics.userHoursData.slice(0, 10).map((user, index) => {
                    const maxHours = Math.max(...analytics.userHoursData.map(u => u.totalHours))
                    const percentage = (user.totalHours / maxHours) * 100
                    return (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {user.name}
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {user.totalHours.toFixed(1)}h
                          </span>
                        </div>
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-6 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-xs text-white font-medium">
                              {((user.totalHours / analytics.totalHours) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Categories tab removed - content moved to Overview */}
          {false && (
            <div className="space-y-6">
              {/* Distribuição por Categoria */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Horas por Categoria
                  </h3>
                  <FolderOpen className="h-5 w-5 text-gray-400" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {analytics?.categoryDistribution.map((category, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {category.category}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              {category.ticketCount} chamados
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {category.hours.toFixed(1)}h
                            </span>
                          </div>
                        </div>
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {category.percentage.toFixed(1)}% do total
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Gráfico de Pizza Simulado */}
                  <div className="flex items-center justify-center">
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full transform -rotate-90">
                        {(() => {
                          let cumulativePercentage = 0
                          const colors = [
                            'text-blue-500',
                            'text-purple-500',
                            'text-green-500',
                            'text-yellow-500',
                            'text-red-500',
                            'text-indigo-500'
                          ]
                          
                          return analytics?.categoryDistribution.slice(0, 6).map((category, index) => {
                            const startAngle = (cumulativePercentage * 360) / 100
                            const endAngle = ((cumulativePercentage + category.percentage) * 360) / 100
                            cumulativePercentage += category.percentage
                            
                            const startAngleRad = (startAngle * Math.PI) / 180
                            const endAngleRad = (endAngle * Math.PI) / 180
                            
                            const x1 = 96 + 80 * Math.cos(startAngleRad)
                            const y1 = 96 + 80 * Math.sin(startAngleRad)
                            const x2 = 96 + 80 * Math.cos(endAngleRad)
                            const y2 = 96 + 80 * Math.sin(endAngleRad)
                            
                            const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
                            
                            return (
                              <path
                                key={index}
                                d={`M 96 96 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                className={`fill-current ${colors[index % colors.length]}`}
                                opacity="0.8"
                              />
                            )
                          })
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {analytics?.categoryDistribution.length}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Categorias
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Distribuição por Prioridade */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Horas por Prioridade
                  </h3>
                  <AlertTriangle className="h-5 w-5 text-gray-400" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {analytics?.priorityDistribution.map((priority, index) => (
                    <div key={index} className={`rounded-lg p-4 ${getPriorityColor(priority.priority)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-lg">
                          {priority.priority}
                        </span>
                        {priority.priority.toLowerCase() === 'crítica' && <Zap className="h-5 w-5" />}
                        {priority.priority.toLowerCase() === 'alta' && <TrendingUp className="h-5 w-5" />}
                        {priority.priority.toLowerCase() === 'média' && <Activity className="h-5 w-5" />}
                        {priority.priority.toLowerCase() === 'baixa' && <TrendingDown className="h-5 w-5" />}
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {priority.hours.toFixed(1)}h
                      </div>
                      <div className="text-sm opacity-80">
                        {priority.ticketCount} chamados
                      </div>
                      <div className="text-xs opacity-70 mt-1">
                        Média: {priority.averageHours.toFixed(1)}h/chamado
                      </div>
                      <div className="mt-2 bg-white/20 rounded-full h-1">
                        <div 
                          className="bg-current h-1 rounded-full"
                          style={{ width: `${priority.percentage}%` }}
                        />
                      </div>
                      <div className="text-xs mt-1 opacity-70">
                        {priority.percentage.toFixed(1)}% do total
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


        </>
      )}
    </div>
  )
}