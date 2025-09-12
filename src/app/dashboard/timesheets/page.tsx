'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import TimesheetNavigation from '@/components/TimesheetNavigation'
import { formatHoursToHHMM } from '@/lib/format-hours'
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
  assigned_to?: string | null
  assigned_to_user?: {
    id: string
    name: string
    email: string
  } | null
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
  
  // Helper function to format ticket title consistently
  const formatTicketTitle = (title: string, maxLength: number = 50) => {
    const upperTitle = title.toUpperCase()
    if (upperTitle.length > maxLength) {
      return upperTitle.substring(0, maxLength) + '...'
    }
    return upperTitle
  }
  
  // Form states
  const [selectedTicket, setSelectedTicket] = useState('')
  const [hoursWorked, setHoursWorked] = useState('0:00')
  const [description, setDescription] = useState('')
  const [workDate, setWorkDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [submitting, setSubmitting] = useState(false)
  
  // New hour type states
  const [hourType, setHourType] = useState<'normal' | 'extra'>('normal')
  const [overtimeRequester, setOvertimeRequester] = useState('')
  const [overtimeApprover, setOvertimeApprover] = useState('')
  
  // Ticket search states
  const [ticketSearch, setTicketSearch] = useState('')
  const [showTicketSuggestions, setShowTicketSuggestions] = useState(false)
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTicket, setFilterTicket] = useState<string>('all')
  const [filterStartDate, setFilterStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [filterEndDate, setFilterEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [quickSearchTicket, setQuickSearchTicket] = useState<string>('') // Busca rápida por número de chamado
  
  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [filterStatus, filterTicket, filterStartDate, filterEndDate])

  // Fechar modal com ESC e limpar formulário
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddForm) {
          setShowAddForm(false)
        }
        if (showTicketSuggestions) {
          setShowTicketSuggestions(false)
        }
      }
    }
    
    // Fechar sugestões ao clicar fora
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.ticket-search-container')) {
        setShowTicketSuggestions(false)
      }
    }
    
    window.addEventListener('keydown', handleEsc)
    window.addEventListener('click', handleClickOutside)
    
    return () => {
      window.removeEventListener('keydown', handleEsc)
      window.removeEventListener('click', handleClickOutside)
    }
  }, [showAddForm, showTicketSuggestions])
  
  // Limpar formulário quando o modal fechar
  useEffect(() => {
    if (!showAddForm) {
      setSelectedTicket('')
      setTicketSearch('')
      setHoursWorked('')
      setDescription('')
      setWorkDate(format(new Date(), 'yyyy-MM-dd'))
      setHourType('normal')
      setOvertimeRequester('')
      setOvertimeApprover('')
      setShowTicketSuggestions(false)
    }
  }, [showAddForm])

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
      
      // Buscar tickets disponíveis - filtrar apenas os atribuídos ao usuário logado
      try {
        const ticketsResponse = await apiClient.get('/api/tickets')
        const allTickets = ticketsResponse.data || []
        
        // Filtrar apenas tickets onde o usuário logado é o responsável
        const userTickets = allTickets.filter((ticket: Ticket) => 
          ticket.assigned_to === session?.user?.id
        )
        
        setTickets(userTickets)
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
    
    // Validar campos de hora extra
    if (hourType === 'extra' && (!overtimeRequester || !overtimeApprover)) {
      toast.error('Para hora extra, informe o solicitante e aprovador')
      return
    }
    
    // Converter formato de horas HH:MM para decimal
    let hoursDecimal = 0
    if (hoursWorked.includes(':')) {
      const [hours, minutes] = hoursWorked.split(':').map(Number)
      hoursDecimal = hours + (minutes / 60)
    } else {
      hoursDecimal = parseFloat(hoursWorked)
    }
    
    // Validar horas
    if (isNaN(hoursDecimal) || hoursDecimal <= 0 || hoursDecimal > 24) {
      toast.error('Horas inválidas. Digite um valor entre 0:01 e 24:00')
      return
    }
    
    try {
      setSubmitting(true)
      
      // Preparar descrição com informações de hora extra se necessário
      let finalDescription = description
      if (hourType === 'extra') {
        finalDescription = `[HORA EXTRA] ${description}\n\nSolicitante: ${overtimeRequester}\nAprovador: ${overtimeApprover}`
      }
      
      const response = await apiClient.post('/api/timesheets', {
        ticket_id: selectedTicket,
        hours_worked: hoursDecimal,
        description: finalDescription,
        work_date: workDate,
        hour_type: hourType,
        overtime_requester: hourType === 'extra' ? overtimeRequester : null,
        overtime_approver: hourType === 'extra' ? overtimeApprover : null
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
        setTicketSearch('')
        setHoursWorked('0:00')
        setDescription('')
        setWorkDate(format(new Date(), 'yyyy-MM-dd'))
        setHourType('normal')
        setOvertimeRequester('')
        setOvertimeApprover('')
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

  // Helper para detectar hora extra
  const isOvertime = (description: string) => {
    return description?.includes('[HORA EXTRA]') || false
  }
  
  // Helper para formatar horas decimais para HH:MM
  const formatHoursToTime = (decimal: number) => {
    const hours = Math.floor(decimal)
    const minutes = Math.round((decimal - hours) * 60)
    return `${hours}:${minutes.toString().padStart(2, '0')}`
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Apontamentos de Horas
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gerencie seus apontamentos de horas trabalhadas
          </p>
        </div>
        
        <div className="flex gap-2 w-auto">
          {/* Busca Rápida por Número de Chamado - Design Aprimorado */}
          <div className="relative group">
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all duration-200">
              <Ticket className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="#chamado"
                value={quickSearchTicket}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '')
                  setQuickSearchTicket(value)
                  if (value) {
                    const foundTicket = tickets.find(t => t.ticket_number.toString() === value)
                    if (foundTicket) {
                      setFilterTicket(foundTicket.id)
                    } else {
                      setFilterTicket('all')
                    }
                  } else {
                    setFilterTicket('all')
                  }
                }}
                className="w-16 sm:w-20 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:w-24 sm:focus:w-32 transition-all duration-200"
              />
              {quickSearchTicket && (
                <button
                  onClick={() => {
                    setQuickSearchTicket('')
                    setFilterTicket('all')
                  }}
                  className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Limpar busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {/* Tooltip indicativo */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-10">
              <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md py-1 px-2 whitespace-nowrap">
                Buscar por número
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 dark:border-b-gray-700"></div>
            </div>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {permissions.can_submit && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar</span>
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
                onChange={(e) => {
                  setFilterTicket(e.target.value)
                  // Atualizar busca rápida se selecionar um ticket específico
                  if (e.target.value !== 'all') {
                    const ticket = tickets.find(t => t.id === e.target.value)
                    if (ticket) {
                      setQuickSearchTicket(ticket.ticket_number.toString())
                    }
                  } else {
                    setQuickSearchTicket('')
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos</option>
                {tickets.map(ticket => (
                  <option key={ticket.id} value={ticket.id}>
                    #{String(ticket.ticket_number).padStart(3, '0')} - {formatTicketTitle(ticket.title, 30)}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
            <div key={ticket.id} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors w-full">
              {/* Card Compacto */}
              <div className="p-4">
                {/* Header Minimalista */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Link 
                      href={`/dashboard/tickets/${ticket.id}`}
                      className="text-lg font-semibold text-white hover:text-blue-400 transition-colors"
                    >
                      #{ticket.ticket_number}
                    </Link>
                  </div>
                  <span className="text-xs sm:text-sm text-slate-500 whitespace-nowrap">
                    {ticketTimesheets.length} {ticketTimesheets.length === 1 ? 'apontamento' : 'apontamentos'}
                  </span>
                </div>
                
                {/* Barra de Progresso Inline */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${percentComplete}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                    {percentComplete}% aprovado
                  </span>
                </div>
                
                {/* Estatísticas Inline */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm flex-wrap">
                    <span className="text-green-400 whitespace-nowrap">
                      <span className="font-semibold">{approvedCount}</span>
                      <span className="text-xs text-slate-500 ml-0.5 hidden sm:inline">aprovadas</span>
                      <span className="text-xs text-slate-500 ml-0.5 sm:hidden">aprov.</span>
                    </span>
                    <span className="text-yellow-400 whitespace-nowrap">
                      <span className="font-semibold">{pendingCount}</span>
                      <span className="text-xs text-slate-500 ml-0.5 hidden sm:inline">pendentes</span>
                      <span className="text-xs text-slate-500 ml-0.5 sm:hidden">pend.</span>
                    </span>
                    <span className="text-red-400 whitespace-nowrap">
                      <span className="font-semibold">{rejectedCount}</span>
                      <span className="text-xs text-slate-500 ml-0.5 hidden sm:inline">rejeitadas</span>
                      <span className="text-xs text-slate-500 ml-0.5 sm:hidden">rejeit.</span>
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 whitespace-nowrap">
                    {formatHoursToHHMM(totalHours)} total
                  </div>
                </div>
                
                {/* Botões Compactos */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedTicket(ticket.id)
                      setTicketSearch(`#${ticket.ticket_number} - ${formatTicketTitle(ticket.title)}`)
                      setShowAddForm(true)
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar
                  </button>
                  <button
                    onClick={() => toggleRow(ticket.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-700 text-slate-300 text-sm rounded hover:bg-slate-600 transition-colors"
                  >
                    {expandedRows.has(ticket.id) ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                    {expandedRows.has(ticket.id) ? 'Ocultar' : 'Detalhes'}
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
                        <div key={timesheet.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-white truncate">
                                  {timesheet.user.name}
                                </span>
                                {getStatusBadge(timesheet.status)}
                                {isOvertime(timesheet.description) && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100">
                                    <Clock className="h-3 w-3" />
                                    Extra
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                                <span className="flex items-center gap-1 whitespace-nowrap">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  {format(parseISO(timesheet.work_date), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 flex-shrink-0" />
                                  {formatHoursToTime(timesheet.hours_worked)}h
                                </span>
                              </div>
                            </div>
                            <div className="flex items-start gap-1">
                              {timesheet.status === 'pending' && permissions.can_approve && (
                                <>
                                  <button
                                    onClick={() => handleApprove(timesheet.id)}
                                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors group"
                                    title="Aprovar"
                                    aria-label="Aprovar apontamento"
                                  >
                                    <CheckCircle className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleReject(timesheet.id)}
                                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors group"
                                    title="Rejeitar"
                                    aria-label="Rejeitar apontamento"
                                  >
                                    <XCircle className="h-5 w-5" />
                                  </button>
                                </>
                              )}
                              {timesheet.status === 'pending' && timesheet.user_id === session?.user?.id && (
                                <button
                                  onClick={() => handleDelete(timesheet.id)}
                                  className="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors group"
                                  title="Excluir"
                                  aria-label="Excluir apontamento"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-slate-300 mt-3 break-words">
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
                      <span className="text-slate-300 font-semibold">Total: {formatHoursToHHMM(totalHours)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        })()}
        </div>
      )}
      
      {/* Mensagem quando não há chamados */}
      {tickets.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum chamado atribuído a você
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Você só pode adicionar apontamentos em chamados onde é o responsável
          </p>
        </div>
      )}

      {/* Modal de Adicionar Apontamento */}
      {showAddForm && permissions.can_submit && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80"
              onClick={() => setShowAddForm(false)}
            />
            
            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Novo Apontamento
                  </h2>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative ticket-search-container">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chamado *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={ticketSearch}
                    onChange={(e) => {
                      setTicketSearch(e.target.value)
                      setShowTicketSuggestions(true)
                      // Se limpar o campo, limpa também a seleção
                      if (e.target.value === '') {
                        setSelectedTicket('')
                      }
                    }}
                    onFocus={() => setShowTicketSuggestions(true)}
                    placeholder="Digite o número ou título do chamado..."
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10 ${
                      selectedTicket 
                        ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required={!selectedTicket}
                  />
                  {selectedTicket && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTicket('')
                        setTicketSearch('')
                        setShowTicketSuggestions(false)
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Sugestões de chamados */}
                {showTicketSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-80 overflow-hidden">
                    {/* Header da lista */}
                    {tickets.length > 0 && (
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                          {ticketSearch ? 'Resultados da busca' : 'Seus chamados atribuídos'}
                        </p>
                      </div>
                    )}
                    
                    <div className="max-h-64 overflow-y-auto">
                    {tickets.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                        Nenhum chamado atribuído a você
                      </div>
                    ) : (
                      <>
                        {tickets
                          .filter(ticket => {
                            const searchLower = ticketSearch.toLowerCase()
                            return (
                              ticket.ticket_number.toString().includes(searchLower) ||
                              ticket.title.toLowerCase().includes(searchLower)
                            )
                          })
                          .slice(0, 10) // Limitar a 10 sugestões
                          .map(ticket => (
                            <button
                              key={ticket.id}
                              type="button"
                              onClick={() => {
                                setSelectedTicket(ticket.id)
                                setTicketSearch(`#${ticket.ticket_number} - ${formatTicketTitle(ticket.title)}`)
                                setShowTicketSuggestions(false)
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-0 group relative"
                              title={ticket.title.toUpperCase()}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <Ticket className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                                  #{String(ticket.ticket_number).padStart(3, '0')}
                                </span>
                                {/* Tooltip flutuante com título completo */}
                                <div className="absolute left-16 -top-8 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[100] whitespace-nowrap max-w-xs">
                                  {ticket.title.toUpperCase()}
                                  <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                                </div>
                              </div>
                            </button>
                          ))}
                        {tickets.filter(ticket => {
                          const searchLower = ticketSearch.toLowerCase()
                          return (
                            ticket.ticket_number.toString().includes(searchLower) ||
                            ticket.title.toLowerCase().includes(searchLower)
                          )
                        }).length === 0 && (
                          <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                            Nenhum chamado encontrado com "{ticketSearch}"
                          </div>
                        )}
                      </>
                    )}
                    </div>
                  </div>
                )}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tempo Trabalhado *
                </label>
                
                {/* Campo compacto e elegante para entrada de horas */}
                <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 border border-slate-700 dark:border-slate-600">
                  <div className="flex items-center justify-center gap-3">
                    <Clock className="h-5 w-5 text-blue-400" />
                    <input
                      type="text"
                      value={hoursWorked}
                      onChange={(e) => {
                        let value = e.target.value
                        
                        // Permitir apenas números e dois pontos
                        value = value.replace(/[^0-9:]/g, '')
                        
                        // Garantir formato H:MM ou HH:MM
                        setHoursWorked(value)
                      }}
                      onKeyDown={(e) => {
                        const value = e.currentTarget.value
                        const key = e.key
                        
                        // Auto-adicionar : após digitar horas
                        if (key >= '0' && key <= '9' && !value.includes(':')) {
                          if (value.length === 1 && parseInt(value + key) > 23) {
                            e.preventDefault()
                            setHoursWorked(value + ':' + key)
                          } else if (value.length === 2) {
                            e.preventDefault()
                            setHoursWorked(value + ':' + key)
                          }
                        }
                      }}
                      onBlur={(e) => {
                        let value = e.target.value
                        if (value && value.includes(':')) {
                          const [h, m] = value.split(':')
                          const hours = parseInt(h) || 0
                          const minutes = parseInt(m) || 0
                          const finalHours = Math.min(23, hours)
                          const finalMinutes = Math.min(59, minutes)
                          setHoursWorked(`${finalHours}:${finalMinutes.toString().padStart(2, '0')}`)
                        } else if (value) {
                          const num = parseInt(value) || 0
                          if (num <= 23) {
                            setHoursWorked(`${num}:00`)
                          } else {
                            setHoursWorked('0:00')
                          }
                        } else {
                          setHoursWorked('0:00')
                        }
                      }}
                      placeholder="0:00"
                      className="text-3xl font-semibold bg-transparent border-0 text-white text-center focus:outline-none focus:ring-0 w-32 placeholder-slate-500 tabular-nums"
                      pattern="[0-9]{1,2}:[0-9]{2}"
                      inputMode="numeric"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Hora *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="hourType"
                      value="normal"
                      checked={hourType === 'normal'}
                      onChange={(e) => setHourType(e.target.value as 'normal' | 'extra')}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Hora Normal</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="hourType"
                      value="extra"
                      checked={hourType === 'extra'}
                      onChange={(e) => setHourType(e.target.value as 'normal' | 'extra')}
                      className="mr-2 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Hora Extra</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Campos adicionais para Hora Extra */}
            {hourType === 'extra' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Solicitante da Hora Extra *
                  </label>
                  <input
                    type="text"
                    value={overtimeRequester}
                    onChange={(e) => setOvertimeRequester(e.target.value)}
                    placeholder="Nome do solicitante"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required={hourType === 'extra'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Aprovador da Hora Extra *
                  </label>
                  <input
                    type="text"
                    value={overtimeApprover}
                    onChange={(e) => setOvertimeApprover(e.target.value)}
                    placeholder="Nome do aprovador"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required={hourType === 'extra'}
                  />
                </div>
              </div>
            )}
            
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
            
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
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
            </div>
          </div>
        </div>
      )}

      {/* Seção de Resultados Filtrados removida - os resultados já aparecem nos cards acima */}
      {false && (
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
                            {formatHoursToHHMM(timesheet.hours_worked)}
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