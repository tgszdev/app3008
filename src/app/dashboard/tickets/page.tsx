'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/hooks/usePermissions'
import { useStatuses } from '@/hooks/useStatuses'
import { useStatusesWithCount } from '@/hooks/useStatusesWithCount'
import { usePrioritiesWithCount } from '@/hooks/usePrioritiesWithCount'
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
  ticket_number: number
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string // Mantém compatibilidade
  category_id?: string
  category_info?: Category[] | Category // Pode vir como array ou objeto
  created_by: string
  assigned_to: string | null
  created_by_user: User
  assigned_to_user: User | null
  comment_count?: number
  is_internal?: boolean // Novo campo para tickets internos
  created_at: string
  updated_at: string
  resolved_at?: string
  closed_at?: string
  due_date?: string
}

// Default status config for fallback
const defaultStatusConfig = {
  open: {
    label: 'Aberto',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    icon: AlertCircle,
  },
  in_progress: {
    label: 'Em Andamento',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    icon: Clock,
  },
  resolved: {
    label: 'Resolvido',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    icon: CheckCircle,
  },
  closed: {
    label: 'Fechado',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    icon: XCircle,
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    icon: XCircle,
  },
}

// Helper to get icon based on status characteristics
const getStatusIcon = (status: any) => {
  if (status?.is_final) return XCircle
  if (status?.slug === 'resolved') return CheckCircle
  if (status?.slug === 'in_progress') return Clock
  return AlertCircle
}

// Helper to convert hex color to Tailwind classes for badges
const getStatusBadgeColor = (hexColor: string) => {
  const colorMap: { [key: string]: string } = {
    '#2563eb': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    '#eab308': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    '#16a34a': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    '#6b7280': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    '#dc2626': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    '#9333ea': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    '#f59e0b': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
  }
  return colorMap[hexColor?.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
}

const priorityConfig = {
  low: {
    label: 'Baixa',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  },
  medium: {
    label: 'Média',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  high: {
    label: 'Alta',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  },
  critical: {
    label: 'Crítica',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
}

const categoryLabels: Record<string, string> = {
  general: 'Geral',
  technical: 'Técnico',
  billing: 'Financeiro',
  feature_request: 'Nova Funcionalidade',
  bug: 'Bug',
  other: 'Outro',
}

export default function TicketsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { hasPermission } = usePermissions()
  const { statuses: availableStatuses } = useStatuses()
  const { statuses: statusesWithCount } = useStatusesWithCount()
  const { priorities: prioritiesWithCount } = usePrioritiesWithCount()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [allTickets, setAllTickets] = useState<Ticket[]>([]) // Para contagem nos cards
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Mapeamento removido - agora usa slugs direto do banco de dados
  // Os status no dropdown já vêm com os slugs corretos do banco

  // Função para extrair iniciais do nome completo
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3) // Máximo 3 iniciais
  }

  const fetchTickets = async (showLoader = true) => {
    if (showLoader) setLoading(true)
    else setRefreshing(true)

    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        // Usar slug direto do banco de dados
        params.append('status', statusFilter)
      }
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)

      const url = `/api/tickets?${params.toString()}`
      console.log('🔍 Fetching tickets with URL:', url)
      console.log('🔍 Status filter:', statusFilter)
      console.log('🔍 Priority filter:', priorityFilter)

      const response = await axios.get(url)
      console.log('✅ Tickets received:', response.data.length)
      setTickets(response.data)
    } catch (error: any) {
      console.error('Erro ao buscar tickets:', error)
      toast.error('Erro ao carregar tickets')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Buscar todos os tickets para contagem nos cards
  const fetchAllTickets = async () => {
    try {
      const response = await axios.get('/api/tickets')
      console.log('📊 All tickets for cards:', response.data.length)
      setAllTickets(response.data)
    } catch (error: any) {
      console.error('Erro ao buscar todos os tickets:', error)
    }
  }

  useEffect(() => {
    fetchTickets()
    fetchAllTickets() // Buscar todos para os cards
  }, [statusFilter, priorityFilter])

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Tem certeza que deseja excluir este chamado?')) return

    try {
      await axios.delete(`/api/tickets?id=${ticketId}`)
      toast.success('Chamado excluído com sucesso!')
      fetchTickets(false)
    } catch (error: any) {
      console.error('Erro ao excluir ticket:', error)
      
      // Verificar se há uma mensagem específica sobre apontamentos
      if (error.response?.data?.error) {
        toast.error(error.response.data.error)
      } else {
        toast.error('Erro ao excluir chamado')
      }
    }
  }

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await axios.patch('/api/tickets', {
        id: ticketId,
        status: newStatus,
      })
      toast.success('Status atualizado com sucesso!')
      fetchTickets(false)
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number.toString().includes(searchTerm) ||
      ticket.created_by_user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const getTimeAgo = (date: string) => {
    if (!date) {
      console.warn('getTimeAgo: Data vazia ou nula recebida')
      return 'N/A'
    }
    // Debug temporário para ver o formato da data
    if (process.env.NODE_ENV === 'development') {
      console.log('getTimeAgo recebeu:', date, 'tipo:', typeof date)
    }
    const result = formatRelativeTime(date)
    if (result === 'N/A' && process.env.NODE_ENV === 'development') {
      console.error('formatRelativeTime retornou N/A para:', date)
    }
    return result
  }

  const getCategoryInfo = (ticket: Ticket) => {
    // Verifica se tem category_info do banco
    if (ticket.category_info) {
      const category = Array.isArray(ticket.category_info) 
        ? ticket.category_info[0] 
        : ticket.category_info
      
      if (category) {
        return {
          name: category.name,
          color: category.color || '#6B7280',
          icon: category.icon || 'folder',
          IconComponent: getIcon(category.icon || 'folder')
        }
      }
    }
    
    // Fallback para categoria em texto (compatibilidade)
    return {
      name: ticket.category || 'Geral',
      color: '#6B7280',
      icon: 'folder',
      IconComponent: getIcon('folder')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button
            onClick={() => fetchTickets(false)}
            className={cn(
              "inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600",
              "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700",
              "text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors",
              refreshing && "opacity-50 cursor-not-allowed"
            )}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Atualizar
          </button>
          <Link
            href="/dashboard/tickets/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo Chamado
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título, número ou solicitante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>

          <div className={cn(
            "flex gap-3",
            !showFilters && "hidden lg:flex"
          )}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              {/* Only show status that have tickets (count > 0) */}
              {statusesWithCount
                .filter(status => status.count > 0)
                .map((status) => (
                  <option key={status.id} value={status.slug}>
                    {status.name} ({status.count})
                  </option>
                ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Prioridades</option>
              {/* Only show priorities that have tickets (count > 0) */}
              {prioritiesWithCount
                .filter(priority => priority.count > 0)
                .map((priority) => (
                  <option key={priority.slug} value={priority.slug}>
                    {priority.name} ({priority.count})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats - Dynamic with zero filtering */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        {/* Total Card - Always visible */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow duration-200">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{allTickets.length}</p>
          </div>
        </div>

        {/* Dynamic Status Cards - Protótipo 35 (Layout de Tabela) - Corrigido para evitar sobreposição */}
        <div className="flex flex-wrap gap-6">
          {/* Total no Período */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden w-[280px] h-[120px] flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
            <div className="relative">
              <div className="border-b border-gray-200 dark:border-gray-600 pb-3 mb-3">
                <div className="text-base font-medium text-gray-700 dark:text-gray-300 break-words">Total no Período</div>
              </div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 text-right leading-none">{allTickets.length}</div>
            </div>
          </div>
          
          {/* Status dinâmicos - ordenados por order_index */}
          {statusesWithCount
            .filter(status => {
              const count = allTickets.filter(t => t.status === status.slug).length
              return count > 0
            })
            .map((status) => {
              const count = allTickets.filter(t => t.status === status.slug).length
              
              // Get color from database or use default based on status
              const getStatusColor = (statusColor: string, slug: string) => {
                if (statusColor && statusColor !== '#6b7280') {
                  return statusColor
                }
                
                // Fallback colors based on status type
                if (slug.includes('aberto') || slug.includes('open')) return '#3b82f6' // blue
                if (slug.includes('progresso') || slug.includes('progress') || slug.includes('aguardando') || slug.includes('deploy')) return '#f59e0b' // amber
                if (slug.includes('resolvido') || slug.includes('resolved') || slug.includes('fechado') || slug.includes('closed')) return '#10b981' // emerald
                if (slug.includes('cancelled') || slug.includes('cancelado')) return '#ef4444' // red
                return '#6b7280' // gray
              }
              
              const statusColor = getStatusColor(status.color, status.slug)
              
              return (
                <div key={status.slug} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden w-[280px] flex-shrink-0">
                  <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${statusColor}, transparent)` }}></div>
                  <div className="relative">
                    <div className="border-b border-gray-200 dark:border-gray-600 pb-3 mb-3">
                      <div className="text-base font-medium text-gray-700 dark:text-gray-300 break-words">{status.name}</div>
                    </div>
                    <div className="text-4xl font-bold text-right leading-none" style={{ color: statusColor }}>{count}</div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Mobile Cards View - Visible on small screens */}
      <div className="block lg:hidden space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Nenhum chamado encontrado
            </p>
            <Link
              href="/dashboard/tickets/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Chamado
            </Link>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            // Get status configuration from dynamic statuses or fallback
            const currentStatusData = availableStatuses.find(s => s.slug === ticket.status)
            const status = currentStatusData 
              ? {
                  label: currentStatusData.name,
                  color: getStatusBadgeColor(currentStatusData.color),
                  icon: getStatusIcon(currentStatusData)
                }
              : defaultStatusConfig[ticket.status] || defaultStatusConfig.open
            
            const priority = priorityConfig[ticket.priority]
            const StatusIcon = status.icon

            return (
              <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500">#{ticket.ticket_number}</span>
                      {ticket.is_internal && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                          <Lock className="h-3 w-3 mr-1" />
                          Interno
                        </span>
                      )}
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full",
                        status.color
                      )}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </span>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full",
                        priority.color
                      )}>
                        {priority.label}
                      </span>
                      {(() => {
                        const categoryInfo = getCategoryInfo(ticket)
                        const Icon = categoryInfo.IconComponent
                        return (
                          <span 
                            className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
                            style={{ 
                              backgroundColor: categoryInfo.color + '20', 
                              color: categoryInfo.color 
                            }}
                          >
                            <Icon className="h-3 w-3 mr-1" />
                            {categoryInfo.name}
                          </span>
                        )
                      })()}
                    </div>
                    <Link
                      href={`/dashboard/tickets/${ticket.id}`}
                      className="text-base font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2"
                    >
                      {ticket.title.toUpperCase()}
                    </Link>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{ticket.created_by_user?.name || 'Desconhecido'}</span>
                  </div>
                  
                  {ticket.assigned_to_user && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>→ {ticket.assigned_to_user.name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{getTimeAgo(ticket.created_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href={`/dashboard/tickets/${ticket.id}`}
                    className="flex-1 text-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4 inline mr-1" />
                    Ver Detalhes
                  </Link>
                  {(hasPermission('tickets_delete') || (session?.user as any)?.role === 'admin') && (
                    <button
                      onClick={() => handleDeleteTicket(ticket.id)}
                      className="p-1.5 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop Table View - Clean & Intuitive Design */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th style={{ minWidth: '60px', width: '60px' }} className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  #
                </th>
                <th style={{ minWidth: '300px' }} className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Título
                </th>
                <th style={{ minWidth: '140px', width: '140px' }} className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th style={{ minWidth: '120px', width: '120px' }} className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Prioridade
                </th>
                <th style={{ minWidth: '140px', width: '140px' }} className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoria
                </th>
                <th style={{ minWidth: '60px', width: '60px' }} className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Resp.
                </th>
                <th style={{ minWidth: '60px', width: '60px' }} className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Solic.
                </th>
                <th style={{ minWidth: '80px', width: '80px' }} className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Criado
                </th>
                <th style={{ minWidth: '60px', width: '60px' }} className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <AlertCircle className="h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Nenhum chamado encontrado
                      </p>
                      <Link
                        href="/dashboard/tickets/new"
                        className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeiro Chamado
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  // Get status configuration from dynamic statuses or fallback
                  const currentStatusData = availableStatuses.find(s => s.slug === ticket.status)
                  const status = currentStatusData 
                    ? {
                        label: currentStatusData.name,
                        color: getStatusBadgeColor(currentStatusData.color),
                        icon: getStatusIcon(currentStatusData)
                      }
                    : defaultStatusConfig[ticket.status] || defaultStatusConfig.open
                  
                  const priority = priorityConfig[ticket.priority]
                  const StatusIcon = status.icon

                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      <td style={{ minWidth: '60px', width: '60px' }} className="px-3 py-3 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-400 font-medium">
                          #{ticket.ticket_number}
                        </span>
                      </td>
                      <td style={{ minWidth: '300px' }} className="px-3 py-3">
                        <Link
                          href={`/dashboard/tickets/${ticket.id}`}
                          className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate"
                          title={ticket.title}
                        >
                          {ticket.title}
                        </Link>
                      </td>
                      <td style={{ minWidth: '140px', width: '140px' }} className="px-3 py-3 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap",
                          status.color
                        )}>
                          <StatusIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{status.label}</span>
                        </span>
                      </td>
                      <td style={{ minWidth: '120px', width: '120px' }} className="px-3 py-3 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap w-full justify-center",
                          priority.color
                        )}>
                          <span className="truncate">{priority.label}</span>
                        </span>
                      </td>
                      <td style={{ minWidth: '140px', width: '140px' }} className="px-3 py-3 whitespace-nowrap">
                        {(() => {
                          const categoryInfo = getCategoryInfo(ticket)
                          const Icon = categoryInfo.IconComponent
                          return (
                            <span 
                              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap"
                              style={{ 
                                backgroundColor: categoryInfo.color + '20', 
                                color: categoryInfo.color 
                              }}
                            >
                              <Icon className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{categoryInfo.name}</span>
                            </span>
                          )
                        })()}
                      </td>
                      <td style={{ minWidth: '60px', width: '60px' }} className="px-3 py-3 whitespace-nowrap text-center">
                        {ticket.assigned_to_user ? (
                          <InstantTooltip content={ticket.assigned_to_user.name}>
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto cursor-help flex-shrink-0">
                              <span className="text-blue-600 dark:text-blue-300 font-medium text-xs">
                                {getInitials(ticket.assigned_to_user.name)}
                              </span>
                            </div>
                          </InstantTooltip>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td style={{ minWidth: '60px', width: '60px' }} className="px-3 py-3 whitespace-nowrap text-center">
                        {ticket.created_by_user ? (
                          <InstantTooltip content={ticket.created_by_user.name}>
                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto cursor-help flex-shrink-0">
                              <span className="text-gray-600 dark:text-gray-300 font-medium text-xs">
                                {getInitials(ticket.created_by_user.name)}
                              </span>
                            </div>
                          </InstantTooltip>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td style={{ minWidth: '80px', width: '80px' }} className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate" title={ticket.created_at ? formatBrazilDateTime(ticket.created_at) : 'Data não disponível'}>
                          {ticket.created_at ? formatRelativeTime(ticket.created_at) : '—'}
                        </div>
                      </td>
                      <td style={{ minWidth: '60px', width: '60px' }} className="px-3 py-3 whitespace-nowrap text-right">
                        <Link
                          href={`/dashboard/tickets/${ticket.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-all duration-200 rounded-lg flex-shrink-0"
                          title="Visualizar ticket"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Simplificada */}
        {filteredTickets.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando <span className="font-medium">{filteredTickets.length}</span> chamados
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}