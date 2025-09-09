'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import apiClient from '@/lib/api-client'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import TimesheetNavigation from '@/components/TimesheetNavigation'
import {
  Clock,
  Calendar,
  Check,
  X,
  Plus,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Ticket,
  Shield,
  BarChart3,
  Settings
} from 'lucide-react'

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

interface TimesheetPermission {
  can_submit: boolean
  can_approve: boolean
}

export default function TimesheetsPage() {
  const { data: session } = useSession()
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [permissions, setPermissions] = useState<TimesheetPermission>({ can_submit: true, can_approve: false })
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  // Form states
  const [selectedTicket, setSelectedTicket] = useState('')
  const [hoursWorked, setHoursWorked] = useState('')
  const [description, setDescription] = useState('')
  const [workDate, setWorkDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [submitting, setSubmitting] = useState(false)
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTicket, setFilterTicket] = useState<string>('all')
  const [filterStartDate, setFilterStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [filterEndDate, setFilterEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  
  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [filterStatus, filterTicket, filterStartDate, filterEndDate])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Buscar permissões - com fallback se falhar
      try {
        const permResponse = await apiClient.get('/api/timesheets/permissions')
        if (permResponse.data) {
          setPermissions(permResponse.data)
        }
      } catch (permError) {
        console.log('Usando permissões padrão')
        // Usar permissões padrão se falhar
        setPermissions({ 
          can_submit: true, 
          can_approve: (session?.user as any)?.role === 'admin' 
        })
      }
      
      // Buscar tickets disponíveis
      try {
        const ticketsResponse = await apiClient.get('/api/tickets')
        setTickets(ticketsResponse.data || [])
      } catch (ticketError) {
        console.error('Erro ao buscar tickets:', ticketError)
        setTickets([])
      }
      
      // Buscar apontamentos com filtros
      try {
        const params = new URLSearchParams()
        if (filterStatus !== 'all') params.append('status', filterStatus)
        if (filterTicket !== 'all') params.append('ticket_id', filterTicket)
        if (filterStartDate) params.append('start_date', filterStartDate)
        if (filterEndDate) params.append('end_date', filterEndDate)
        
        const timesheetsResponse = await apiClient.get(`/api/timesheets?${params.toString()}`)
        // Mapear activity_description para description se necessário
        const mappedTimesheets = (timesheetsResponse.data || []).map((t: any) => ({
          ...t,
          description: t.description || t.activity_description || ''
        }))
        setTimesheets(mappedTimesheets)
      } catch (timesheetError) {
        console.error('Erro ao buscar apontamentos:', timesheetError)
        setTimesheets([])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTicket || !hoursWorked || !description) {
      toast.error('Por favor, preencha todos os campos')
      return
    }
    
    if (description.trim().length < 10) {
      toast.error('A descrição deve ter no mínimo 10 caracteres')
      return
    }
    
    try {
      setSubmitting(true)
      
      const response = await apiClient.post('/api/timesheets', {
        ticket_id: selectedTicket,
        hours_worked: parseFloat(hoursWorked),
        description,
        work_date: workDate
      })
      
      if (response.status === 201) {
        toast.success('Apontamento adicionado com sucesso!')
        // Mapear activity_description para description se necessário
        const newTimesheet = {
          ...response.data,
          description: response.data.description || response.data.activity_description || ''
        }
        setTimesheets([newTimesheet, ...timesheets])
        
        // Limpar formulário
        setSelectedTicket('')
        setHoursWorked('')
        setDescription('')
        setWorkDate(format(new Date(), 'yyyy-MM-dd'))
        setShowAddForm(false)
      }
    } catch (error: any) {
      console.error('Error submitting timesheet:', error)
      toast.error(error.response?.data?.error || 'Erro ao adicionar apontamento')
    } finally {
      setSubmitting(false)
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
        // Mapear activity_description para description
        const updatedTimesheet = {
          ...response.data,
          description: response.data.description || response.data.activity_description || ''
        }
        setTimesheets(timesheets.map(t => 
          t.id === id ? updatedTimesheet : t
        ))
      }
    } catch (error: any) {
      console.error('Error approving timesheet:', error)
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
        // Mapear activity_description para description
        const updatedTimesheet = {
          ...response.data,
          description: response.data.description || response.data.activity_description || ''
        }
        setTimesheets(timesheets.map(t => 
          t.id === id ? updatedTimesheet : t
        ))
      }
    } catch (error: any) {
      console.error('Error rejecting timesheet:', error)
      toast.error(error.response?.data?.error || 'Erro ao rejeitar apontamento')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este apontamento?')) return
    
    try {
      await apiClient.delete(`/api/timesheets?id=${id}`)
      toast.success('Apontamento excluído')
      setTimesheets(timesheets.filter(t => t.id !== id))
    } catch (error: any) {
      console.error('Error deleting timesheet:', error)
      toast.error(error.response?.data?.error || 'Erro ao excluir apontamento')
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

  // Calcular estatísticas
  const totalHours = timesheets.reduce((sum, t) => sum + parseFloat(t.hours_worked.toString()), 0)
  const approvedHours = timesheets
    .filter(t => t.status === 'approved')
    .reduce((sum, t) => sum + parseFloat(t.hours_worked.toString()), 0)
  const pendingHours = timesheets
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + parseFloat(t.hours_worked.toString()), 0)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
            Apontamentos de Horas
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gerencie seus apontamentos de horas trabalhadas
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
          
          {permissions.can_submit && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Adicionar Apontamento
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <option value="pending">Pendente</option>
                <option value="approved">Aprovado</option>
                <option value="rejected">Rejeitado</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Chamado
              </label>
              <select
                value={filterTicket}
                onChange={(e) => setFilterTicket(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos</option>
                {tickets.map(ticket => (
                  <option key={ticket.id} value={ticket.id}>
                    #{ticket.ticket_number} - {ticket.title.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            
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
          </div>
        </div>
      )}

      {/* Cards de Tickets com Apontamentos */}
      {tickets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Agrupar apontamentos por ticket */}
          {(() => {
            const ticketsWithTimesheets = tickets.filter(ticket => {
              const ticketTimesheets = timesheets.filter(t => t.ticket_id === ticket.id)
              return ticketTimesheets.length > 0
            }).map(ticket => {
            const ticketTimesheets = timesheets.filter(t => t.ticket_id === ticket.id)
            const totalHours = ticketTimesheets.reduce((sum, t) => sum + parseFloat(t.hours_worked.toString()), 0)
            const approvedHours = ticketTimesheets
              .filter(t => t.status === 'approved')
              .reduce((sum, t) => sum + parseFloat(t.hours_worked.toString()), 0)
            const pendingHours = ticketTimesheets
              .filter(t => t.status === 'pending')
              .reduce((sum, t) => sum + parseFloat(t.hours_worked.toString()), 0)
            const rejectedHours = ticketTimesheets
              .filter(t => t.status === 'rejected')
              .reduce((sum, t) => sum + parseFloat(t.hours_worked.toString()), 0)
            const percentComplete = totalHours > 0 ? Math.round((approvedHours / totalHours) * 100) : 0
            
            return {
              ticket,
              timesheets: ticketTimesheets,
              totalHours,
              approvedHours,
              pendingHours,
              rejectedHours,
              percentComplete,
              approvedCount: ticketTimesheets.filter(t => t.status === 'approved').length,
              pendingCount: ticketTimesheets.filter(t => t.status === 'pending').length,
              rejectedCount: ticketTimesheets.filter(t => t.status === 'rejected').length
            }
          })
          
          if (ticketsWithTimesheets.length === 0) {
            return (
              <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum apontamento encontrado
                </p>
                {permissions.can_submit && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Adicionar primeiro apontamento
                  </button>
                )}
              </div>
            )
          }
          
          return ticketsWithTimesheets.map(({ ticket, timesheets: ticketTimesheets, totalHours, approvedHours, pendingHours, rejectedHours, percentComplete, approvedCount, pendingCount, rejectedCount }) => (
            <div key={ticket.id} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl border border-slate-700 overflow-hidden">
              {/* Header do Card */}
              <div className="p-6 pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">CHAMADO</p>
                    <h3 className="text-2xl font-bold text-white">#{ticket.ticket_number}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{ticketTimesheets.length}</div>
                    <div className="text-xs text-slate-400">apontamentos</div>
                  </div>
                </div>
                
                {/* Título do Ticket */}
                <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                  {ticket.title.toUpperCase()}
                </p>
                
                {/* Barra de Progresso */}
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400">Progresso</span>
                    <span className="text-sm font-semibold text-white">{percentComplete}% aprovado</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentComplete}%` }}
                    />
                  </div>
                </div>
                
                {/* Estatísticas */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-700/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-xs text-slate-400 mb-1">Aprovadas</div>
                    <div className="text-lg font-bold text-green-400">{approvedCount}</div>
                  </div>
                  <div className="text-center border-x border-slate-600">
                    <div className="text-xs text-slate-400 mb-1">Pendentes</div>
                    <div className="text-lg font-bold text-yellow-400">{pendingCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-400 mb-1">Rejeitadas</div>
                    <div className="text-lg font-bold text-red-400">{rejectedCount}</div>
                  </div>
                </div>
                
                {/* Botões de Ação */}
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => {
                      setSelectedTicket(ticket.id)
                      setShowAddForm(true)
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Apontamento
                  </button>
                  <button
                    onClick={() => toggleRow(ticket.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    {expandedRows.has(ticket.id) ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Ocultar Apontamentos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Ver Apontamentos
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Lista de Apontamentos Expandida */}
              {expandedRows.has(ticket.id) && (
                <div className="border-t border-slate-700 bg-slate-800/50">
                  <div className="p-4">
                    <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-3">HISTÓRICO DE APONTAMENTOS</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {ticketTimesheets.map((timesheet) => (
                        <div key={timesheet.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white">
                                  {timesheet.user.name}
                                </span>
                                {getStatusBadge(timesheet.status)}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(parseISO(timesheet.work_date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {timesheet.hours_worked}h
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {timesheet.status === 'pending' && permissions.can_approve && (
                                <>
                                  <button
                                    onClick={() => handleApprove(timesheet.id)}
                                    className="p-1 text-green-400 hover:bg-green-400/20 rounded transition-colors"
                                    title="Aprovar"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleReject(timesheet.id)}
                                    className="p-1 text-red-400 hover:bg-red-400/20 rounded transition-colors"
                                    title="Rejeitar"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {timesheet.status === 'pending' && timesheet.user_id === session?.user?.id && (
                                <button
                                  onClick={() => handleDelete(timesheet.id)}
                                  className="p-1 text-slate-400 hover:bg-slate-600 rounded transition-colors"
                                  title="Excluir"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-slate-300 mt-2">
                            {timesheet.description}
                          </p>
                          {timesheet.status === 'rejected' && timesheet.rejection_reason && (
                            <div className="mt-2 p-2 bg-red-900/20 rounded border border-red-800">
                              <p className="text-xs text-red-400">
                                <span className="font-semibold">Motivo:</span> {timesheet.rejection_reason}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between text-sm">
                      <span className="text-slate-400">Total de apontamentos: {ticketTimesheets.length}</span>
                      <span className="text-slate-300 font-semibold">Total: {totalHours.toFixed(1)}h</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        })()}
        </div>
      )}
      
      {/* Mensagem quando não há tickets */}
      {tickets.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum ticket disponível para apontamento
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Crie tickets primeiro para poder adicionar apontamentos de horas
          </p>
        </div>
      )}

      {/* Formulário de Adicionar */}
      {showAddForm && permissions.can_submit && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Novo Apontamento
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ticket *
                </label>
                <select
                  value={selectedTicket}
                  onChange={(e) => setSelectedTicket(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Selecione um ticket</option>
                  {tickets.map(ticket => (
                    <option key={ticket.id} value={ticket.id}>
                      #{ticket.ticket_number} - {ticket.title.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data do Trabalho *
                </label>
                <input
                  type="date"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Não é possível adicionar apontamentos para datas futuras
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Horas Trabalhadas *
              </label>
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                placeholder="Ex: 2.5"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição do Trabalho *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                minLength={10}
                placeholder="Descreva detalhadamente o trabalho realizado (mínimo 10 caracteres)..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                A descrição é obrigatória e deve conter no mínimo 10 caracteres
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Salvar Apontamento
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista Completa de Apontamentos (apenas se houver filtros ativos) */}
      {(filterStatus !== 'all' || filterTicket !== 'all' || filterStartDate || filterEndDate) && timesheets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Resultados Filtrados
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {timesheets.map((timesheet) => (
              <div key={timesheet.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleRow(timesheet.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        {expandedRows.has(timesheet.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            #{timesheet.ticket.ticket_number}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {timesheet.ticket.title.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(timesheet.work_date), "dd 'de' MMMM", { locale: ptBR })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timesheet.hours_worked}h
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {timesheet.user.name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(timesheet.status)}
                        
                        {timesheet.status === 'pending' && (
                          <>
                            {timesheet.user_id === session?.user?.id && (
                              <button
                                onClick={() => handleDelete(timesheet.id)}
                                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="Excluir"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                            
                            {permissions.can_approve && (
                              <>
                                <button
                                  onClick={() => handleApprove(timesheet.id)}
                                  className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                  title="Aprovar"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(timesheet.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title="Rejeitar"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {expandedRows.has(timesheet.id) && (
                  <div className="mt-4 pl-9 space-y-2">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Descrição do Trabalho:
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {timesheet.description}
                      </p>
                    </div>
                    
                    {timesheet.status === 'approved' && timesheet.approver && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Aprovado por {timesheet.approver.name} em{' '}
                        {format(parseISO(timesheet.approval_date!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    )}
                    
                    {timesheet.status === 'rejected' && timesheet.rejection_reason && (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                        <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                          Motivo da Rejeição:
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {timesheet.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}