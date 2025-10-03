'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import apiClient from '@/lib/api-client'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatBrazilDateTime, formatBrazilDate } from '@/lib/date-utils'
import toast from 'react-hot-toast'
import TimesheetNavigation from '@/components/TimesheetNavigation'
import { formatHoursToHHMM } from '@/lib/format-hours'
import {
  Clock,
  Calendar,
  Check,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Ticket,
  Search,
  FileDown
} from 'lucide-react'
import { exportTimesheetsPDF } from '@/lib/pdf-generator'

interface Ticket {
  id: string
  ticket_number: number
  title: string
}

interface User {
  id: string
  name: string
  email: string
}

interface Timesheet {
  id: string
  ticket_id: string
  user_id: string
  hours_worked: number
  description: string
  work_date: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by: string | null
  approval_date: string | null
  rejection_reason: string | null
  created_at: string
  ticket: Ticket
  user: User
  approver?: User
}

export default function TimesheetsAdminPage() {
  const { data: session } = useSession()
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('pending')
  const [filterUser, setFilterUser] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [filterStatus, filterUser])

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
      if (filterUser !== 'all') params.append('user_id', filterUser)
      
      const response = await apiClient.get(`/api/timesheets?${params.toString()}`)
      setTimesheets(response.data || [])
    } catch (error) {
      toast.error('Erro ao carregar apontamentos')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const response = await apiClient.post('/api/timesheets/approve', {
        id,
        action: 'approve'
      })
      
      if (response.status === 200) {
        toast.success('Apontamento aprovado!')
        setTimesheets(timesheets.map(t => 
          t.id === id ? response.data : t
        ))
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao aprovar apontamento')
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Motivo da rejeição:')
    if (!reason) return
    
    try {
      const response = await apiClient.post('/api/timesheets/approve', {
        id,
        action: 'reject',
        rejection_reason: reason
      })
      
      if (response.status === 200) {
        toast.success('Apontamento rejeitado')
        setTimesheets(timesheets.map(t => 
          t.id === id ? response.data : t
        ))
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao rejeitar apontamento')
    }
  }

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
            <CheckCircle className="h-3 w-3" />
            Aprovado
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
            <XCircle className="h-3 w-3" />
            Rejeitado
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
            <AlertCircle className="h-3 w-3" />
            Pendente
          </span>
        )
    }
  }

  // Filtrar por busca
  const filteredTimesheets = timesheets.filter(timesheet => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      timesheet.ticket.title.toLowerCase().includes(query) ||
      timesheet.ticket.ticket_number.toString().includes(query) ||
      timesheet.user.name.toLowerCase().includes(query) ||
      timesheet.description.toLowerCase().includes(query)
    )
  })

  // Estatísticas
  const stats = {
    pending: filteredTimesheets.filter(t => t.status === 'pending').length,
    approved: filteredTimesheets.filter(t => t.status === 'approved').length,
    rejected: filteredTimesheets.filter(t => t.status === 'rejected').length,
    totalHours: filteredTimesheets.reduce((sum, t) => sum + parseFloat(t.hours_worked.toString()), 0)
  }

  // Obter lista única de usuários
  const uniqueUsers = Array.from(new Set(timesheets.map(t => t.user_id)))
    .map(userId => timesheets.find(t => t.user_id === userId)?.user)
    .filter(Boolean) as User[]

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
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Navigation */}
      <TimesheetNavigation />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Aprovação de Apontamentos
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gerencie e aprove apontamentos de horas da equipe
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const success = exportTimesheetsPDF(filteredTimesheets, 'Relatório de Apontamentos - Admin')
              if (success) {
                toast.success('PDF exportado com sucesso!')
              } else {
                toast.error('Erro ao exportar PDF')
              }
            }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Rejeitados</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Usuário
              </label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos</option>
                {uniqueUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por chamado, usuário ou descrição..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                Pendentes
              </p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {stats.pending}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                Aprovadas
              </p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {stats.approved}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                Rejeitadas
              </p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {stats.rejected}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                Total de Horas
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatHoursToHHMM(stats.totalHours)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Lista de Apontamentos */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Apontamentos para Aprovação
          </h2>
        </div>
        
        {filteredTimesheets.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum apontamento encontrado
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[calc(100vh-400px)] overflow-y-auto">
            {filteredTimesheets.map((timesheet) => (
              <div key={timesheet.id} className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="space-y-3">
                  {/* Header com informações principais */}
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleRow(timesheet.id)}
                      className="mt-1 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex-shrink-0"
                    >
                      {expandedRows.has(timesheet.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          #{timesheet.ticket.ticket_number}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {timesheet.ticket.title.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{timesheet.user.name}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          {formatBrazilDate(timesheet.work_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          {formatHoursToHHMM(timesheet.hours_worked)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Ações e status */}
                  <div className="flex items-center justify-between gap-2 pl-7">
                    <div className="flex-shrink-0">
                      {getStatusBadge(timesheet.status)}
                    </div>
                    
                    {timesheet.status === 'pending' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleApprove(timesheet.id)}
                          className="p-1.5 sm:p-2 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/20 rounded-2xl transition-colors"
                          title="Aprovar"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReject(timesheet.id)}
                          className="p-1.5 sm:p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20 rounded-2xl transition-colors"
                          title="Rejeitar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {expandedRows.has(timesheet.id) && (
                  <div className="mt-4 pl-12 space-y-2">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Descrição do Trabalho:
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {timesheet.description}
                      </p>
                    </div>
                    
                    {timesheet.status === 'approved' && timesheet.approver && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-3">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          <span className="font-medium">Aprovado por:</span> {timesheet.approver.name}
                        </p>
                        {timesheet.approval_date && (
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            <span className="font-medium">Data:</span> {formatBrazilDateTime(timesheet.approval_date)}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {timesheet.status === 'rejected' && timesheet.rejection_reason && (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-3">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          <span className="font-medium">Motivo da Rejeição:</span> {timesheet.rejection_reason}
                        </p>
                        {timesheet.approver && (
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                            <span className="font-medium">Rejeitado por:</span> {timesheet.approver.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}