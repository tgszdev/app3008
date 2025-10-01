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
  FileDown,
  ChevronDown,
  ChevronUp,
  Check,
  Building2,
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
  const { availableContexts } = useOrganization()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [allTickets, setAllTickets] = useState<Ticket[]>([]) // Para contagem nos cards
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [myTicketsOnly, setMyTicketsOnly] = useState(false)
  const [showClientSelector, setShowClientSelector] = useState(false)
  
  // Função para obter últimos 2 meses completos
  const getLast2MonthsDates = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      start_date: firstDay.toISOString().split('T')[0],
      end_date: lastDay.toISOString().split('T')[0]
    }
  }
  
  const [periodFilter, setPeriodFilter] = useState(getLast2MonthsDates())
  const [tempFilter, setTempFilter] = useState({ start_date: '', end_date: '' })
  const [showDateFilters, setShowDateFilters] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const clientSelectorRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detectar mobile para limitar steps
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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


  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // Funções dos botões
  const toggleMyTickets = () => {
    setMyTicketsOnly(!myTicketsOnly)
  }

  const handleApplyFilter = () => {
    setPeriodFilter(tempFilter)
    setShowDateFilters(false)
  }

  const handleResetFilter = () => {
    const last2Months = getLast2MonthsDates()
    setTempFilter(last2Months)
    setPeriodFilter(last2Months)
    setShowDateFilters(false)
  }

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true)
    try {
      toast.success('Funcionalidade de exportação em desenvolvimento')
    } catch (error) {
      toast.error('Erro ao gerar PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleClientSelectionChange = (clientIds: string[]) => {
    console.log('🔄 Mudança de seleção de clientes:', clientIds)
    setSelectedClients(clientIds)
  }

  // Carregar seleções do localStorage na inicialização
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedClients')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedClients(parsed)
          }
        } catch (e) {
          console.error('Erro ao parsear selectedClients:', e)
        }
      }

      const savedMyTickets = localStorage.getItem('myTicketsOnly')
      if (savedMyTickets) {
        setMyTicketsOnly(savedMyTickets === 'true')
      }

      const savedPeriodFilter = localStorage.getItem('periodFilter')
      if (savedPeriodFilter) {
        try {
          const parsed = JSON.parse(savedPeriodFilter)
          setPeriodFilter(parsed)
          setTempFilter(parsed)
        } catch (e) {
          console.error('Erro ao parsear periodFilter:', e)
        }
      }
    }
  }, [])

  // Salvar seleções no localStorage sempre que mudarem
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedClients.length > 0) {
        localStorage.setItem('selectedClients', JSON.stringify(selectedClients))
        console.log('🔄 Salvando seleções no localStorage:', selectedClients)
      } else {
        localStorage.removeItem('selectedClients')
        console.log('🔄 Removendo seleções do localStorage (lista vazia)')
      }
    }
  }, [selectedClients])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('myTicketsOnly', myTicketsOnly.toString())
    }
  }, [myTicketsOnly])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('periodFilter', JSON.stringify(periodFilter))
    }
  }, [periodFilter])

  // Fechar seletor ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientSelectorRef.current && !clientSelectorRef.current.contains(event.target as Node)) {
        setShowClientSelector(false)
      }
    }

    if (showClientSelector) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showClientSelector])

  const fetchTickets = async (showLoader = true) => {
    if (showLoader) setLoading(true)
    else setRefreshing(true)

    try {
      const params = new URLSearchParams()
      
      // Filtro de clientes
      if (selectedClients.length > 0) {
        params.append('context_ids', selectedClients.join(','))
        console.log('🔍 Filtrando por clientes:', selectedClients)
      }

      // Filtro de "Meus Chamados" (criador OU responsável)
      if (myTicketsOnly && session?.user?.id) {
        params.append('myTickets', session.user.id)
        console.log('🔍 Filtrando por meus chamados (criador OU responsável):', session.user.id)
      }

      // Filtro de período
      if (periodFilter.start_date && periodFilter.end_date) {
        params.append('start_date', periodFilter.start_date)
        params.append('end_date', periodFilter.end_date)
        console.log('🔍 Filtrando por período:', periodFilter)
      }

      // Filtro de status
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      // Filtro de prioridade
      if (priorityFilter !== 'all') {
        params.append('priority', priorityFilter)
      }

      const url = `/api/tickets?${params.toString()}`
      console.log('🔍 Fetching tickets with URL:', url)

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

  // Buscar todos os tickets para contagem nos cards (COM FILTROS)
  const fetchAllTickets = async () => {
    try {
      // Construir URL com os mesmos filtros de clientes e período
      let url = '/api/tickets'
      const params = new URLSearchParams()

      // Aplicar filtro de clientes
      if (selectedClients.length > 0) {
        params.append('context_ids', selectedClients.join(','))
      }

      // Aplicar filtro de período
      if (periodFilter.start_date && periodFilter.end_date) {
        params.append('start_date', periodFilter.start_date)
        params.append('end_date', periodFilter.end_date)
      }

      // Aplicar filtro "Meus Chamados" (criador OU responsável)
      if (myTicketsOnly && session?.user?.id) {
        params.append('myTickets', session.user.id)
      }

      const queryString = params.toString()
      if (queryString) {
        url += `?${queryString}`
      }

      console.log('📊 Fetching all tickets for cards with URL:', url)
      const response = await axios.get(url)
      console.log('📊 All tickets for cards:', response.data.length)
      setAllTickets(response.data)
    } catch (error: any) {
      console.error('Erro ao buscar todos os tickets:', error)
    }
  }

  useEffect(() => {
    // IMPORTANTE: Só buscar tickets se houver clientes selecionados
    // Se não tiver nenhum cliente selecionado, não deve mostrar nada
    if (selectedClients.length > 0) {
      console.log('✅ Clientes selecionados:', selectedClients)
      fetchTickets()
      fetchAllTickets()
    } else {
      console.log('⚠️ Nenhum cliente selecionado - limpando lista de tickets')
      setTickets([])
      setAllTickets([])
      setLoading(false)
    }
  }, [statusFilter, priorityFilter, selectedClients, myTicketsOnly, periodFilter])

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
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Chamados
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Gerencie todos os chamados de suporte
          </p>
        </div>

        {/* Botões de Ação - Responsivo */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Seletor de Clientes */}
          {availableContexts && availableContexts.length > 0 && (
            <div className="w-full sm:w-auto relative" ref={clientSelectorRef}>
              <button
                onClick={() => setShowClientSelector(!showClientSelector)}
                className="w-full h-10 flex items-center justify-center gap-2 px-3 sm:px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 relative overflow-hidden whitespace-nowrap"
              >
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium truncate">
                  {selectedClients.length === 0 
                    ? 'Selecionar Clientes'
                    : selectedClients.length === 1
                      ? availableContexts.find(c => c.id === selectedClients[0])?.name || 'Cliente'
                      : `${selectedClients.length} clientes`
                  }
                </span>
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse"></div>
              </button>

              {showClientSelector && (
                <div className="absolute z-50 mt-2 left-0 right-0 sm:w-72 sm:left-auto sm:right-auto bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {availableContexts
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((context) => (
                        <label
                          key={context.id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors rounded-3xl"
                        >
                          <input
                            type="checkbox"
                            checked={selectedClients.includes(context.id)}
                            onChange={() => {
                              if (selectedClients.includes(context.id)) {
                                handleClientSelectionChange(selectedClients.filter(id => id !== context.id))
                              } else {
                                handleClientSelectionChange([...selectedClients, context.id])
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {context.name}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-3xl font-medium ${
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
                        onClick={() => handleClientSelectionChange(availableContexts.map(c => c.id))}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => {
                          handleClientSelectionChange([])
                          localStorage.removeItem('selectedClients')
                        }}
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

          {/* Botão Meus Chamados */}
          <button
            onClick={toggleMyTickets}
            className={`w-full sm:w-auto sm:min-w-[180px] h-10 flex items-center justify-center gap-2 px-3 sm:px-4 border rounded-3xl transition-all duration-300 relative overflow-hidden whitespace-nowrap ${
              myTicketsOnly 
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">Meus Chamados</span>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </button>
          
          {/* Botão Filtro de Data */}
          <button
            onClick={() => setShowDateFilters(!showDateFilters)}
            className="w-full sm:w-auto sm:min-w-[240px] h-10 flex items-center justify-center gap-2 px-3 sm:px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 relative overflow-hidden whitespace-nowrap"
          >
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">
              {periodFilter.start_date && periodFilter.end_date
                ? `${formatDateShort(periodFilter.start_date)} - ${formatDateShort(periodFilter.end_date)}`
                : 'Selecionar Período'
              }
            </span>
            <Filter className="h-4 w-4 flex-shrink-0" />
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent animate-pulse"></div>
          </button>
          
          {/* Botão Export PDF */}
          <button
            onClick={handleExportPDF}
            disabled={isGeneratingPDF}
            className="w-full sm:w-auto sm:min-w-[180px] h-10 flex items-center justify-center gap-2 px-3 sm:px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden whitespace-nowrap"
          >
            {isGeneratingPDF ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">
              {isGeneratingPDF ? 'Gerando...' : 'Exportar PDF'}
            </span>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-purple-500/20 to-transparent animate-pulse"></div>
          </button>

          {/* Botão Novo Chamado */}
          <Link
            href="/dashboard/tickets/new"
            className="w-full sm:w-auto sm:min-w-[180px] h-10 flex items-center justify-center gap-2 px-3 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-3xl transition-all duration-300 whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">Novo Chamado</span>
          </Link>
        </div>
      </div>

      {/* Barra de Informações do Período */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 dark:from-blue-950 dark:via-blue-900 dark:to-blue-950 rounded-2xl p-4 border border-blue-700 dark:border-blue-800 shadow-lg">
        <div className="flex flex-wrap items-center justify-center gap-2 text-white text-sm font-medium">
          <span>
            Período analisado: {
              periodFilter.start_date && periodFilter.end_date
                ? `${new Date(periodFilter.start_date + 'T00:00:00').toLocaleDateString('pt-BR')} até ${new Date(periodFilter.end_date + 'T00:00:00').toLocaleDateString('pt-BR')}`
                : 'Mês Atual'
            }
          </span>
          <span>•</span>
          <span>{filteredTickets.length} tickets no período</span>
          <span>•</span>
          <span>{selectedClients.length} {selectedClients.length === 1 ? 'cliente selecionado' : 'clientes selecionados'}</span>
        </div>
      </div>

      {/* Filtros de Período */}
      {showDateFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Filtrar por Período
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={tempFilter.start_date}
                onChange={(e) => setTempFilter({ ...tempFilter, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-3xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={tempFilter.end_date}
                onChange={(e) => setTempFilter({ ...tempFilter, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-3xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button
              onClick={handleApplyFilter}
              className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 text-white rounded-3xl hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium"
            >
              Aplicar Filtro
            </button>
            <button
              onClick={handleResetFilter}
              className="flex-1 sm:flex-initial px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-3xl hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-800 transition-colors text-sm font-medium"
            >
              Limpar Filtro
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título, número ou solicitante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-3xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-3xl bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>

          <div className={cn(
            "flex gap-2 sm:gap-3",
            !showFilters && "hidden lg:flex"
          )}>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-3xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Prioridades</option>
              {/* Only show priorities that have tickets (count > 0) */}
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

      {/* Dynamic Status Cards - Ordenados por order_index e respeitando filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Status dinâmicos - ordenados por order_index */}
          {statusesWithCount
            .sort((a, b) => (a.order_index || 999) - (b.order_index || 999))
            .filter(status => {
              const count = tickets.filter(t => t.status === status.slug).length
              return count > 0
            })
            .map((status) => {
              const count = tickets.filter(t => t.status === status.slug).length
              
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
                <div 
                  key={status.slug} 
                  onClick={() => setStatusFilter(status.slug)}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
                >
                  <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${statusColor}, transparent)` }}></div>
                  <div className="relative">
                    <div className="border-b border-gray-200 dark:border-gray-600 pb-2 sm:pb-3 mb-2 sm:mb-3">
                      <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 break-words">{status.name}</div>
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold text-right leading-none" style={{ color: statusColor }}>{count}</div>
                  </div>
                </div>
              )
            })}

          {/* Total no Período - sempre por último */}
          <div 
            onClick={() => setStatusFilter('all')}
            className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
            <div className="relative">
              <div className="border-b border-gray-200 dark:border-gray-600 pb-2 sm:pb-3 mb-2 sm:mb-3">
                <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 break-words">Total no Período</div>
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 text-right leading-none">{tickets.length}</div>
            </div>
          </div>

          {/* Card de Limpar Filtro - somente ícone - aparece apenas se houver filtro de status ativo */}
          {statusFilter !== 'all' && (
            <div 
              onClick={() => setStatusFilter('all')}
              className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center min-h-[100px] sm:min-h-[120px]"
            >
              <XCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 dark:text-red-400" />
            </div>
          )}
      </div>

      {/* Estado Vazio - Nenhum cliente selecionado */}
      {selectedClients.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum cliente selecionado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Selecione um ou mais clientes para visualizar os chamados
          </p>
          <button
            onClick={() => setShowClientSelector(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-3xl transition-colors"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Selecionar Clientes
          </button>
        </div>
      )}

      {/* Lista de Tickets - Layout idêntico aos Tickets Recentes */}
      {selectedClients.length > 0 && filteredTickets.length > 0 && (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            // Buscar cor do status no cadastro
            const statusInfo = availableStatuses.find(s => s.slug === ticket.status)
            const statusColor = statusInfo?.color || '#6B7280'

            // Processar histórico de status para mostrar steps reais
            const getStatusHistory = () => {
              if (!(ticket as any).ticket_history) {
                return [{
                  status: ticket.status,
                  created_at: ticket.created_at,
                  user: ticket.created_by_user
                }]
              }
              
              const statusChanges = (ticket as any).ticket_history
                .filter((history: any) => history.action_type === 'status_changed' && history.field_changed === 'status')
                .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              
              const history: Array<{
                status: string;
                created_at: string;
                user: any;
              }> = []
              
              history.push({
                status: 'Aberto',
                created_at: ticket.created_at,
                user: ticket.created_by_user
              })
              
              statusChanges.forEach((change: any) => {
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
            
            // No mobile (< 640px), mostrar sempre os últimos 5 steps
            const displayStatusHistory = isMobile && statusHistory.length > 5
              ? statusHistory.slice(-5) 
              : statusHistory

            const getPriorityColor = (priority: string) => {
              switch (priority) {
                case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }
            }

            // Obter cor da prioridade para a borda
            const getPriorityBorderColor = (priority: string) => {
              switch (priority) {
                case 'critical': return '#ef4444' // red-500
                case 'high': return '#f97316' // orange-500
                case 'medium': return '#eab308' // yellow-500
                case 'low': return '#22c55e' // green-500
                default: return '#6b7280' // gray-500
              }
            }

            return (
              <div 
                key={ticket.id} 
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                style={{ borderColor: getPriorityBorderColor(ticket.priority) }}
                onClick={() => window.location.href = `/dashboard/tickets/${ticket.id}`}
              >
                <div className="space-y-3">
                  {/* Header com número, título e prioridade */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white text-xl sm:text-2xl">#{ticket.ticket_number}</span>
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
                      {statusInfo?.name || ticket.status}
                    </span>
                  </div>
                  
                  {/* Título do ticket */}
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base line-clamp-2">{ticket.title}</h3>
                  
                  {/* Informações do ticket - Grid responsivo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        <span className="font-medium hidden sm:inline">Data de Abertura:</span>
                        <span className="font-medium sm:hidden">Abertura:</span> {getTimeAgo(ticket.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        <span className="font-medium hidden sm:inline">Autor do Chamado:</span>
                        <span className="font-medium sm:hidden">Autor:</span> {ticket.created_by_user?.name || 'Sistema'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        <span className="font-medium hidden sm:inline">Atribuído Para:</span>
                        <span className="font-medium sm:hidden">Atribuído:</span> {ticket.assigned_to_user?.name || 'Não atribuído'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        <span className="font-medium">Cliente:</span> {(ticket as any).context_info?.name || 'Não definido'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Steps horizontais - baseados no histórico real */}
                  <div 
                    className="flex items-center gap-2 ml-[10%]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {displayStatusHistory.map((historyItem, index) => {
                      const isLast = index === displayStatusHistory.length - 1
                      const isCurrent = isLast
                      
                      const historyStatusInfo = availableStatuses.find(s => s.slug === historyItem.status)
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
                              isCurrent ? 'ring-2 ring-offset-2' : ''
                            }`}
                            style={{
                              backgroundColor: historyStatusColor
                            }}
                          ></div>
                          
                          {/* Tooltip instantâneo */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none whitespace-nowrap z-[9999]">
                            <div className="font-semibold">{historyItem.status}</div>
                            <div className="text-gray-300">
                              {formatDate(historyItem.created_at)}
                            </div>
                            <div className="text-gray-400">
                              por {historyItem.user?.name || 'Sistema'}
                            </div>
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

      {/* Estado vazio */}
      {selectedClients.length > 0 && filteredTickets.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Nenhum chamado encontrado
          </p>
          <Link
            href="/dashboard/tickets/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-3xl transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Chamado
          </Link>
        </div>
      )}

    </div>
  )
}