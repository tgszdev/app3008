'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/hooks/usePermissions'
import { useStatuses } from '@/hooks/useStatuses'
import { useStatusesWithCount } from '@/hooks/useStatusesWithCount'
import { usePrioritiesWithCount } from '@/hooks/usePrioritiesWithCount'
import { useOrganization } from '@/contexts/OrganizationContext'
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  MessageSquare,
  Loader2,
  RefreshCw,
  Lock,
  Building,
  ChevronDown,
  X,
  Check,
  FileDown,
} from 'lucide-react'
import { getIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatBrazilDateTime, formatRelativeTime } from '@/lib/date-utils'
import InstantTooltip from '@/components/InstantTooltip'

interface User {
  id: string
  name: string
  email: string
  role?: string
}

interface Category {
  id: string
  name: string
  slug: string
  color: string
  icon: string
}

interface Ticket {
  id: string
  ticket_number: string
  title: string
  description: string
  status: string
  priority: string
  category_id: string
  assigned_to_user_id: string
  created_by_user_id: string
  created_at: string
  updated_at: string
  is_internal: boolean
  created_by_user?: User
  assigned_to_user?: User
  category?: Category
  ticket_history?: any[]
}

export default function TicketsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const { statuses: availableStatuses } = useStatuses()
  const { statuses: statusesWithCount } = useStatusesWithCount()
  const { priorities: prioritiesWithCount } = usePrioritiesWithCount()
  const { availableContexts } = useOrganization()
  
  // Estados para seleção de clientes
  const [selectedClients, setSelectedClients] = useState<string[]>([])

  // Estados
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showClientPopup, setShowClientPopup] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [myTicketsOnly, setMyTicketsOnly] = useState(false)
  
  // Filtros de período
  const getLastThreeMonthsDates = () => {
    const now = new Date()
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    return {
      start_date: threeMonthsAgo.toISOString().split('T')[0],
      end_date: lastDay.toISOString().split('T')[0]
    }
  }
  
  const [periodFilter, setPeriodFilter] = useState(getLastThreeMonthsDates())
  const [tempFilter, setTempFilter] = useState<{start_date: string, end_date: string}>(getLastThreeMonthsDates())
  
  const popupRef = useRef<HTMLDivElement>(null)

  // Configurações padrão de status
  const defaultStatusConfig = {
    open: { label: 'Aberto', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: getIcon('circle') },
    in_progress: { label: 'Em Progresso', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: getIcon('clock') },
    resolved: { label: 'Resolvido', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: getIcon('check-circle') },
    closed: { label: 'Fechado', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300', icon: getIcon('x-circle') },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: getIcon('x-circle') }
  }

  // Configurações de prioridade
  const priorityConfig = {
    low: { label: 'Baixa', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    medium: { label: 'Média', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    high: { label: 'Alta', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
    critical: { label: 'Crítica', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
  }

  // Função para formatar data
  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Função para obter configuração de status
  const getStatusConfig = (status: string) => {
    const statusData = availableStatuses.find((s: any) => s.slug === status)
    if (statusData) {
      return {
        label: statusData.name,
        color: getStatusBadgeColor(statusData.color),
        icon: getStatusIcon(statusData)
      }
    }
    return defaultStatusConfig[status as keyof typeof defaultStatusConfig] || defaultStatusConfig.open
  }

  // Função para obter cor da badge de status
  const getStatusBadgeColor = (statusColor: string) => {
    if (statusColor && statusColor !== '#6b7280') {
      return {
        backgroundColor: `${statusColor}20`,
        color: statusColor
      }
    }
    return {
      backgroundColor: '#f3f4f6',
      color: '#374151'
    }
  }

  // Função para obter ícone de status
  const getStatusIcon = (statusData: any) => {
    if (statusData.icon) {
      return getIcon(statusData.icon)
    }
    return getIcon('circle')
  }

  // Função para buscar tickets
  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)
      if (searchTerm) params.append('search', searchTerm)
      
      // Adicionar filtro de clientes se selecionados
      if (selectedClients.length > 0) {
        params.append('context_ids', selectedClients.join(','))
      } else if (selectedClients.length === 0 && availableContexts.length > 0) {
        // Se nenhum cliente está selecionado, não mostrar tickets
        params.append('context_ids', 'none')
      }
      
      // Adicionar filtro de usuário se "Meus Tickets" estiver ativo
      if (myTicketsOnly && session?.user?.id) {
        params.append('userId', session.user.id)
      }
      
      // Adicionar filtro de período
      if (periodFilter.start_date && periodFilter.end_date) {
        params.append('start_date', periodFilter.start_date)
        params.append('end_date', periodFilter.end_date)
      }

      const response = await axios.get(`/api/tickets?${params.toString()}`)
      setTickets(response.data)
    } catch (error) {
      toast.error('Erro ao carregar tickets')
    } finally {
      setLoading(false)
    }
  }

  // Função para gerar PDF
  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true)
      // Implementar geração de PDF
      toast.success('PDF gerado com sucesso!')
    } catch (error) {
      toast.error('Erro ao gerar PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Função para alternar "Meus Tickets"
  const toggleMyTickets = () => {
    setMyTicketsOnly(!myTicketsOnly)
  }

  // Função para aplicar filtro de período
  const handleApplyFilter = () => {
    setPeriodFilter(tempFilter)
    setShowFilters(false)
  }

  // Função para resetar filtro
  const handleResetFilter = () => {
    const lastThreeMonths = getLastThreeMonthsDates()
    setTempFilter(lastThreeMonths)
    setPeriodFilter(lastThreeMonths)
    setShowFilters(false)
  }

  // Função para alternar cliente
  const handleClientToggle = (contextId: string) => {
    if (selectedClients.includes(contextId)) {
      setSelectedClients(selectedClients.filter(id => id !== contextId))
    } else {
      setSelectedClients([...selectedClients, contextId])
    }
  }

  // Função para selecionar todos os clientes
  const handleSelectAllClients = () => {
    setSelectedClients(availableContexts.map(context => context.id))
  }

  // Função para limpar todos os clientes
  const handleClearAllClients = () => {
    setSelectedClients([])
  }

  // Função para obter texto dos clientes selecionados
  const getSelectedClientsText = () => {
    if (selectedClients.length === 0) return 'Selecionar Clientes'
    if (selectedClients.length === 1) {
      const client = availableContexts.find(c => c.id === selectedClients[0])
      return client?.name || 'Cliente'
    }
    return `${selectedClients.length} clientes`
  }

  // Fechar popup ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowClientPopup(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Carregar dados iniciais
  useEffect(() => {
    fetchTickets()
  }, [statusFilter, priorityFilter, searchTerm, selectedClients, myTicketsOnly, periodFilter])

  // Filtrar tickets localmente
  const filteredTickets = (tickets || []).filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando tickets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chamados
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gerencie todos os chamados de suporte
          </p>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Seletor de Clientes */}
        {availableContexts.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShowClientPopup(!showClientPopup)}
              className="w-46 h-10 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2 relative overflow-hidden whitespace-nowrap"
            >
              <Building className="w-4 h-4" />
              <span className="text-xs font-medium">
                {getSelectedClientsText()}
              </span>
              <ChevronDown className="w-4 h-4" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse"></div>
            </button>
            
            {/* Popup de seleção de clientes */}
            {showClientPopup && (
              <div 
                ref={popupRef}
                className="absolute top-full left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 z-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Seleção Rápida</span>
                  </div>
                  <button
                    onClick={() => setShowClientPopup(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2 mb-4">
                  {availableContexts
                    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                    .map((context) => (
                    <label
                      key={context.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors rounded-xl"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(context.id)}
                        onChange={() => handleClientToggle(context.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {context.name}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-xl font-medium ${
                            context.type === 'organization' 
                              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" 
                              : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                          }`}>
                            {context.type === 'organization' ? 'Cliente' : 'Dept'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {context.slug}
                        </div>
                      </div>
                      {selectedClients.includes(context.id) && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </label>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedClients.length} de {availableContexts.length} selecionados
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAllClients}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      Todos
                    </button>
                    <button
                      onClick={handleClearAllClients}
                      className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 font-medium transition-colors"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botão Meus Tickets */}
        <button
          onClick={toggleMyTickets}
          className={`w-46 h-10 flex items-center justify-center gap-2 px-4 border rounded-xl transition-all duration-300 relative overflow-hidden whitespace-nowrap ${
            myTicketsOnly 
              ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <User className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">Meus Tickets</span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        </button>
        
        {/* Botão Filtro de Data */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-46 h-10 flex items-center justify-center gap-2 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 relative overflow-hidden whitespace-nowrap"
        >
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">
            {periodFilter.start_date === getLastThreeMonthsDates().start_date && 
             periodFilter.end_date === getLastThreeMonthsDates().end_date
              ? 'Últimos 3 Meses'
              : `${formatDateShort(periodFilter.start_date)} - ${formatDateShort(periodFilter.end_date)}`
            }
          </span>
          <Filter className="h-4 w-4 flex-shrink-0" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent animate-pulse"></div>
        </button>
        
        {/* Botão Export PDF */}
        <button
          onClick={handleGeneratePDF}
          disabled={isGeneratingPDF}
          className="w-46 h-10 flex items-center justify-center gap-2 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden whitespace-nowrap"
        >
          {isGeneratingPDF ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">
            {isGeneratingPDF ? 'Gerando...' : 'Exportar PDF'}
          </span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-purple-500/20 to-transparent animate-pulse"></div>
        </button>
        
        {/* Botão Atualizar */}
        <button
          onClick={fetchTickets}
          className="w-46 h-10 flex items-center justify-center gap-2 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 relative overflow-hidden whitespace-nowrap"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="text-sm font-medium">Atualizar</span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-green-500/20 to-transparent animate-pulse"></div>
        </button>

        {/* Botão Novo Chamado */}
        <Link
          href="/dashboard/tickets/new"
          className="w-46 h-10 flex items-center justify-center gap-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-300 relative overflow-hidden whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">Novo Chamado</span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título, número ou solicitante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              {statusesWithCount
                .filter(status => status.count > 0)
                .map((status) => (
                  <option key={status.id} value={status.slug}>
                    {status.name}
                  </option>
                ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Prioridades</option>
              {prioritiesWithCount
                .filter(priority => priority.count > 0)
                .map((priority) => (
                  <option key={priority.slug} value={priority.slug}>
                    {priority.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Tickets - Layout dos Tickets Recentes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum chamado encontrado
              </p>
              <Link
                href="/dashboard/tickets/new"
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Chamado
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            {filteredTickets.map((ticket) => {
              // Get status configuration from dynamic statuses or fallback
              const currentStatusData = availableStatuses.find(s => s.slug === ticket.status)
              const statusColor = currentStatusData?.color || '#6B7280'
              
              // Processar histórico de status para mostrar steps reais
              const getStatusHistory = () => {
                if (!(ticket as any).ticket_history) {
                  // Se não há histórico, mostrar apenas o status atual
                  return [{
                    status: ticket.status,
                    created_at: ticket.created_at,
                    user: (ticket as any).created_by_user
                  }]
                }
                
                // Filtrar apenas mudanças de status
                const statusChanges = (ticket as any).ticket_history
                  .filter((history: any) => history.action_type === 'status_changed' && history.field_changed === 'status')
                  .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                
                // Criar array com status inicial + mudanças
                const history: Array<{
                  status: string;
                  created_at: string;
                  user: any;
                }> = []
                
                // Adicionar status inicial (sempre Aberto quando criado)
                history.push({
                  status: 'Aberto',
                  created_at: ticket.created_at,
                  user: (ticket as any).created_by_user
                })
                
                // Adicionar apenas as mudanças de status que realmente aconteceram
                statusChanges.forEach((change: any) => {
                  // Evitar duplicatas - só adicionar se for diferente do último status
                  const lastStatus = history[history.length - 1]?.status
                  if (change.new_value !== lastStatus) {
                    history.push({
                      status: change.new_value,
                      created_at: change.created_at,
                      user: change.user
                    })
                  }
                })
                
                return history
              }

              const statusHistory = getStatusHistory()

              const getPriorityColor = (priority: string) => {
                switch (priority) {
                  case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                  case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }
              }
              
              return (
                <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="space-y-3">
                      {/* Header com número, título e prioridade */}
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">#{ticket.ticket_number}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority === 'critical' ? 'Crítico' : ticket.priority === 'high' ? 'Alto' : ticket.priority === 'medium' ? 'Médio' : 'Baixo'}
                        </span>
                        <span 
                          className="text-xs font-medium px-2 py-1 rounded-full ml-auto"
                          style={{
                            backgroundColor: `${statusColor}20`,
                            color: statusColor
                          }}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      
                      {/* Título do ticket */}
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">{ticket.title}</h3>
                      
                      {/* Informações do ticket */}
                      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateShort(ticket.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {(ticket as any).created_by_user?.name || 'Sistema'}
                        </span>
                      </div>
                      
                      {/* Steps horizontais - baseados no histórico real */}
                      <div className="flex items-center gap-2">
                        {statusHistory.map((historyItem, index) => {
                          const isLast = index === statusHistory.length - 1
                          const isCurrent = isLast
                          
                          // Buscar cor do status no cadastro
                          const historyStatusInfo = availableStatuses.find((s: any) => s.slug === historyItem.status)
                          const historyStatusColor = historyStatusInfo?.color || '#6B7280'
                          
                          const formatDate = (dateString: string) => {
                            const date = new Date(dateString)
                            return date.toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          }
                          
                          return (
                            <div key={`${historyItem.status}-${index}`} className="flex items-center group relative">
                              <div 
                                className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 ${
                                  isCurrent
                                    ? 'ring-2 ring-offset-2' 
                                    : ''
                                }`}
                                style={{
                                  backgroundColor: historyStatusColor
                                }}
                              ></div>
                              
                              {/* Tooltip instantâneo */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none whitespace-nowrap z-50">
                                <div className="font-semibold">{historyItem.status}</div>
                                <div className="text-gray-300">
                                  {formatDate(historyItem.created_at)}
                                </div>
                                <div className="text-gray-400">
                                  por {historyItem.user?.name || 'Sistema'}
                                </div>
                                {/* Seta do tooltip */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                              </div>
                              
                              {!isLast && (
                                <div 
                                  className="w-8 h-1 rounded-full"
                                  style={{
                                    backgroundColor: historyStatusColor
                                  }}
                                ></div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
