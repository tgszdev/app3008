'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/hooks/usePermissions'
import { useStatuses } from '@/hooks/useStatuses'
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
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const fetchTickets = async (showLoader = true) => {
    if (showLoader) setLoading(true)
    else setRefreshing(true)

    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)

      const response = await axios.get(`/api/tickets?${params.toString()}`)
      setTickets(response.data)
    } catch (error: any) {
      console.error('Erro ao buscar tickets:', error)
      toast.error('Erro ao carregar tickets')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTickets()
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
              {availableStatuses.map((status) => (
                <option key={status.id} value={status.slug}>
                  {status.name}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{tickets.length}</p>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <AlertCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Abertos</p>
              <p className="text-xl font-bold text-blue-600">
                {tickets.filter(t => t.status === 'open').length}
              </p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Em Andamento</p>
              <p className="text-xl font-bold text-yellow-600">
                {tickets.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Resolvidos</p>
              <p className="text-xl font-bold text-green-600">
                {tickets.filter(t => t.status === 'resolved').length}
              </p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Cancelados</p>
              <p className="text-xl font-bold text-red-600">
                {tickets.filter(t => t.status === 'cancelled').length}
              </p>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
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
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  #
                </th>
                <th className="w-80 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Título
                </th>
                <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Prioridade
                </th>
                <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="w-48 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="w-48 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Solicitante
                </th>
                <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Criado
                </th>
                <th className="w-20 px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-400 font-medium">
                          #{ticket.ticket_number}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/dashboard/tickets/${ticket.id}`}
                          className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate"
                          title={ticket.title}
                        >
                          {ticket.title}
                        </Link>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full",
                          status.color
                        )}>
                          <StatusIcon className="h-3 w-3 mr-2" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full",
                          priority.color
                        )}>
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {(() => {
                          const categoryInfo = getCategoryInfo(ticket)
                          const Icon = categoryInfo.IconComponent
                          return (
                            <span 
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full"
                              style={{ 
                                backgroundColor: categoryInfo.color + '20', 
                                color: categoryInfo.color 
                              }}
                            >
                              <Icon className="h-3 w-3 mr-2" />
                              {categoryInfo.name}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {ticket.assigned_to_user ? (
                            <div className="flex items-center">
                              <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="text-blue-600 dark:text-blue-300 font-medium text-xs">
                                  {ticket.assigned_to_user.name.substring(0, 1).toUpperCase()}
                                </span>
                              </div>
                              <span className="truncate" title={ticket.assigned_to_user.name}>
                                {ticket.assigned_to_user.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">
                              Não atribuído
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {ticket.created_by_user ? (
                            <div className="flex items-center">
                              <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="text-gray-600 dark:text-gray-300 font-medium text-xs">
                                  {ticket.created_by_user.name.substring(0, 1).toUpperCase()}
                                </span>
                              </div>
                              <span className="truncate" title={ticket.created_by_user.name}>
                                {ticket.created_by_user.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">
                              Desconhecido
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400" title={ticket.created_at ? formatBrazilDateTime(ticket.created_at) : 'Data não disponível'}>
                          {ticket.created_at ? getTimeAgo(ticket.created_at) : '—'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/dashboard/tickets/${ticket.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-all duration-200 rounded-lg"
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