'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import axios from 'axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface User {
  id: string
  name: string
  email: string
  role?: string
}

interface Ticket {
  id: string
  ticket_number: number
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string
  created_by: string
  assigned_to: string | null
  created_by_user: User
  assigned_to_user: User | null
  comment_count?: number
  created_at: string
  updated_at: string
  resolved_at?: string
  closed_at?: string
  due_date?: string
}

const statusConfig = {
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
      toast.error('Erro ao excluir chamado')
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
    const now = new Date()
    const created = new Date(date)
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Agora mesmo'
    if (diffInHours < 24) return `${diffInHours}h atrás`
    if (diffInHours < 48) return 'Ontem'
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} dias atrás`
    return format(created, "dd 'de' MMM", { locale: ptBR })
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
              <option value="open">Aberto</option>
              <option value="in_progress">Em Andamento</option>
              <option value="resolved">Resolvido</option>
              <option value="closed">Fechado</option>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tickets.length}</p>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <AlertCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Abertos</p>
              <p className="text-2xl font-bold text-blue-600">
                {tickets.filter(t => t.status === 'open').length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Em Andamento</p>
              <p className="text-2xl font-bold text-yellow-600">
                {tickets.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resolvidos</p>
              <p className="text-2xl font-bold text-green-600">
                {tickets.filter(t => t.status === 'resolved').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Título / Solicitante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Prioridade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Criado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
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
                  const status = statusConfig[ticket.status]
                  const priority = priorityConfig[ticket.priority]
                  const StatusIcon = status.icon

                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                          #{ticket.ticket_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <Link
                            href={`/dashboard/tickets/${ticket.id}`}
                            className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {ticket.title}
                          </Link>
                          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <User className="h-3 w-3 mr-1" />
                            {ticket.created_by_user?.name || 'Desconhecido'}
                            {(ticket.comment_count ?? 0) > 0 && (
                              <>
                                <span className="mx-2">•</span>
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {ticket.comment_count ?? 0} {(ticket.comment_count ?? 0) === 1 ? 'comentário' : 'comentários'}
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                          status.color
                        )}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                          priority.color
                        )}>
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {ticket.assigned_to_user ? (
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1 text-gray-400" />
                              {ticket.assigned_to_user.name}
                            </div>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">
                              Não atribuído
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {getTimeAgo(ticket.created_at)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/tickets/${ticket.id}`}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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