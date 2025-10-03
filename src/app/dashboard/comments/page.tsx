'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Calendar,
  User,
  Clock,
  Ticket,
  Eye,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  MessageCircle,
  Hash,
  ArrowUpRight,
  FileText,
  Paperclip
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatBrazilDateTime, formatRelativeTime } from '@/lib/date-utils'
import RichTextRenderer from '@/components/RichTextRenderer'

interface User {
  id: string
  name: string
  email: string
  avatar_url?: string
}

interface Ticket {
  id: string
  ticket_number: number
  title: string
  status: string
  priority: string
}

interface Attachment {
  id: string
  filename: string
  file_url: string
  file_size: number
  mime_type: string
}

interface Comment {
  id: string
  content: string
  is_internal: boolean
  attachments: Attachment[]
  created_at: string
  updated_at: string
  ticket_id: string
  user_id: string
  user: User
  ticket: Ticket
}

// Função helper para obter ícone de status
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'open':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    case 'in_progress':
      return <Clock className="h-4 w-4 text-blue-500" />
    case 'resolved':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'closed':
      return <XCircle className="h-4 w-4 text-gray-500" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-400" />
  }
}

// Função helper para obter cor de prioridade
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
    case 'high':
      return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'low':
      return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
    default:
      return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400'
  }
}

// Função helper para traduzir prioridade
const translatePriority = (priority: string) => {
  const translations: Record<string, string> = {
    urgent: 'Urgente',
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa'
  }
  return translations[priority] || priority
}

// Função helper para traduzir status
const translateStatus = (status: string) => {
  const translations: Record<string, string> = {
    open: 'Aberto',
    in_progress: 'Em Progresso',
    resolved: 'Resolvido',
    closed: 'Fechado',
    cancelled: 'Cancelado'
  }
  return translations[status] || status
}

// Função helper para formatar tamanho de arquivo
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export default function CommentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTicket, setFilterTicket] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [showInternalOnly, setShowInternalOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent')
  const [page, setPage] = useState(1)
  const [totalComments, setTotalComments] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const commentsPerPage = 20

  // Buscar comentários
  const fetchComments = async (showLoader = true) => {
    if (showLoader) setLoading(true)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: commentsPerPage.toString(),
        sort: sortBy,
        ...(searchTerm && { search: searchTerm }),
        ...(filterTicket && { ticket_id: filterTicket }),
        ...(filterUser && { user_id: filterUser }),
        ...(showInternalOnly && { internal_only: 'true' })
      })

      const response = await axios.get(`/api/comments?${params}`)
      
      if (response.data.error) {
        toast.error(response.data.error + (response.data.details ? ': ' + response.data.details : ''))
      } else {
        setComments(response.data.comments || [])
        setTotalComments(response.data.total || 0)
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Erro ao carregar comentários'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Carregar comentários ao montar o componente
  useEffect(() => {
    fetchComments()
  }, [page, sortBy, filterTicket, filterUser, showInternalOnly])

  // Busca com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        setPage(1)
        fetchComments()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Função para atualizar comentários
  const handleRefresh = () => {
    setRefreshing(true)
    fetchComments(false)
  }

  // Função para navegar para o ticket
  const navigateToTicket = (ticketId: string) => {
    router.push(`/dashboard/tickets/${ticketId}`)
  }

  // Cálculo de paginação
  const totalPages = Math.ceil(totalComments / commentsPerPage)
  const startIndex = (page - 1) * commentsPerPage + 1
  const endIndex = Math.min(page * commentsPerPage, totalComments)

  // Filtrar comentários localmente baseado na busca
  const filteredComments = comments.filter(comment => {
    if (searchTerm && comment) {
      const search = searchTerm.toLowerCase()
      return (
        (comment.content && comment.content.toLowerCase().includes(search)) ||
        (comment.user?.name && comment.user.name.toLowerCase().includes(search)) ||
        (comment.ticket?.title && comment.ticket.title.toLowerCase().includes(search)) ||
        (comment.ticket?.ticket_number && comment.ticket.ticket_number.toString().includes(search))
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-7 w-7" />
            Comentários
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Histórico completo de comentários em todos os chamados
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Comentários</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {totalComments.toLocaleString('pt-BR')}
              </p>
            </div>
            <MessageCircle className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Comentários Hoje</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {Array.isArray(comments) ? comments.filter(c => {
                  if (!c?.created_at) return false
                  const today = new Date().toDateString()
                  return new Date(c.created_at).toDateString() === today
                }).length : 0}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Com Anexos</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {Array.isArray(comments) ? comments.filter(c => c?.attachments && Array.isArray(c.attachments) && c.attachments.length > 0).length : 0}
              </p>
            </div>
            <Paperclip className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Internos</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {Array.isArray(comments) ? comments.filter(c => c?.is_internal).length : 0}
              </p>
            </div>
            <Eye className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="space-y-4">
          {/* Busca */}
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Buscar comentários
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Buscar por conteúdo, usuário, ticket..."
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ordenação */}
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ordenar por
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'oldest')}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="recent">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
              </select>
            </div>

            {/* Filtro de comentários internos */}
            <div className="flex items-end">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={showInternalOnly}
                  onChange={(e) => setShowInternalOnly(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-25"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Apenas internos
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Comentários */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Nenhum comentário encontrado
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm 
                ? 'Tente ajustar os filtros ou termos de busca'
                : 'Ainda não há comentários no sistema'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredComments.map((comment) => (
              <div key={comment.id} className="p-3 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start space-x-2 sm:space-x-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0 hidden sm:block">
                    {comment.user.avatar_url ? (
                      <img
                        src={comment.user.avatar_url}
                        alt={comment.user.name}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {comment.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    {/* Header do comentário */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {comment.user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {comment.user.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {comment.is_internal && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                            Interno
                          </span>
                        )}
                        <time className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatRelativeTime(comment.created_at)}
                        </time>
                      </div>
                    </div>

                    {/* Informações do Ticket */}
                    <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <button
                        onClick={() => navigateToTicket(comment.ticket_id)}
                        className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 min-w-0"
                      >
                        <Hash className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="flex-shrink-0">{comment.ticket.ticket_number}</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400 truncate">
                          {comment.ticket.title}
                        </span>
                        <ArrowUpRight className="h-3 w-3 ml-1 flex-shrink-0" />
                      </button>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          {getStatusIcon(comment.ticket.status)}
                          <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {translateStatus(comment.ticket.status)}
                          </span>
                        </span>
                        
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getPriorityColor(comment.ticket.priority)}`}>
                          {translatePriority(comment.ticket.priority)}
                        </span>
                      </div>
                    </div>

                    {/* Conteúdo do comentário */}
                    <div className="mt-3 overflow-hidden break-words">
                      <RichTextRenderer content={comment.content} />
                    </div>

                    {/* Anexos */}
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {comment.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-2xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 max-w-full"
                          >
                            <Paperclip className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{attachment.filename}</span>
                            <span className="ml-1 text-gray-500 flex-shrink-0">
                              ({formatFileSize(attachment.file_size)})
                            </span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Data de criação completa */}
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatBrazilDateTime(comment.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-2xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-2xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando <span className="font-medium">{startIndex}</span> até{' '}
                <span className="font-medium">{endIndex}</span> de{' '}
                <span className="font-medium">{totalComments}</span> comentários
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5 rotate-180" />
                </button>
                
                {[...Array(totalPages)].map((_, i) => {
                  const pageNumber = i + 1
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= page - 1 && pageNumber <= page + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNumber === page
                            ? 'z-10 bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  } else if (
                    (pageNumber === page - 2 && page > 3) ||
                    (pageNumber === page + 2 && page < totalPages - 2)
                  ) {
                    return (
                      <span
                        key={pageNumber}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        ...
                      </span>
                    )
                  }
                  return null
                })}
                
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}