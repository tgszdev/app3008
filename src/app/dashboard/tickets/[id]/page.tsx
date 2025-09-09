'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Clock, User, Tag, AlertCircle, MessageSquare, Paperclip, Edit, Trash2, Send, CheckCircle, XCircle, AlertTriangle, ChevronDown, Lock, Eye, EyeOff, Image as ImageIcon } from 'lucide-react'
import { getIcon } from '@/lib/icons'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { getAttachmentUrl, isImageFile } from '@/lib/storage-utils'
import { SimplePrintButton as PrintButton } from '@/components/SimplePrintButton'
import ImageModal from '@/components/ImageModal'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Comment {
  id: string
  content: string
  created_at: string
  user: User
  is_internal: boolean
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
  is_internal?: boolean // Novo campo para tickets internos
  created_at: string
  updated_at: string
  due_date?: string
  resolution_notes?: string
  created_by_user?: User
  assigned_to_user?: User
  comments?: Comment[]
}

const statusConfig = {
  open: { label: 'Aberto', color: 'bg-blue-500', icon: AlertCircle },
  in_progress: { label: 'Em Progresso', color: 'bg-yellow-500', icon: Clock },
  resolved: { label: 'Resolvido', color: 'bg-green-500', icon: CheckCircle },
  closed: { label: 'Fechado', color: 'bg-gray-500', icon: XCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: XCircle }
}

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-gray-500', icon: ChevronDown },
  medium: { label: 'Média', color: 'bg-blue-500', icon: AlertCircle },
  high: { label: 'Alta', color: 'bg-orange-500', icon: AlertTriangle },
  critical: { label: 'Crítica', color: 'bg-red-500', icon: AlertTriangle }
}

interface Attachment {
  id: string
  file_name: string
  file_size: number
  file_type: string
  file_url: string
  storage_path?: string
  created_at: string
  uploader?: User
}

export default function TicketDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const ticketId = params?.id as string
  
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [isInternalComment, setIsInternalComment] = useState(false)
  const [editingStatus, setEditingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('')
  const [users, setUsers] = useState<User[]>([])
  const [editingAssignee, setEditingAssignee] = useState(false)
  const [newAssignee, setNewAssignee] = useState<string>('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showReactivateModal, setShowReactivateModal] = useState(false)
  const [reactivateReason, setReactivateReason] = useState('')
  const [selectedImage, setSelectedImage] = useState<{url: string, name: string, size?: number, type?: string} | null>(null)
  
  useEffect(() => {
    if (ticketId) {
      fetchTicket()
      fetchUsers()
      fetchAttachments()
    }
  }, [ticketId])

  const fetchTicket = async () => {
    try {
      console.log('=== DEBUG PÁGINA TICKET ===')
      console.log('Buscando ticket com ID:', ticketId)
      
      const response = await axios.get(`/api/tickets/${ticketId}`)
      
      console.log('Resposta da API:', response.data)
      console.log('Título recebido:', response.data.title)
      
      setTicket(response.data)
      setNewStatus(response.data.status)
      setNewAssignee(response.data.assigned_to || '')
    } catch (error) {
      console.error('Erro ao buscar ticket:', error)
      toast.error('Erro ao carregar ticket')
      router.push('/dashboard/tickets')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users')
      setUsers(response.data.filter((u: User) => u.role === 'analyst' || u.role === 'admin'))
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    }
  }

  const fetchAttachments = async () => {
    try {
      const response = await axios.get(`/api/tickets/upload?ticketId=${ticketId}`)
      setAttachments(response.data)
    } catch (error) {
      console.error('Erro ao buscar anexos:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !ticket) return

    // Block non-admin users from uploading to cancelled tickets
    if (ticket.status === 'cancelled' && session?.user && 'role' in session.user && session.user.role !== 'admin') {
      toast.error('Apenas administradores podem anexar arquivos em tickets cancelados')
      event.target.value = ''
      return
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo permitido: 10MB')
      return
    }

    setUploadingFile(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('ticketId', ticket.id)
    formData.append('userId', session?.user?.id || '')

    try {
      const response = await axios.post('/api/tickets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        toast.success('Arquivo enviado com sucesso!')
        fetchAttachments()
      } else if (response.data.warning) {
        toast(response.data.warning, { icon: '⚠️' })
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      toast.error(error.response?.data?.error || 'Erro ao enviar arquivo')
    } finally {
      setUploadingFile(false)
      // Limpar input
      event.target.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleStatusUpdate = async () => {
    if (!ticket || newStatus === ticket.status) {
      setEditingStatus(false)
      return
    }

    // Check if trying to cancel - only admin can cancel
    if (newStatus === 'cancelled') {
      if (session?.user?.role !== 'admin') {
        toast.error('Apenas administradores podem cancelar tickets')
        setEditingStatus(false)
        return
      }
      // Show cancel modal to get reason
      setShowCancelModal(true)
      setEditingStatus(false)
      return
    }

    // Check if trying to change from cancelled - only admin can reactivate
    if (ticket.status === 'cancelled') {
      if (session?.user?.role !== 'admin') {
        toast.error('Apenas administradores podem reativar tickets cancelados')
        setEditingStatus(false)
        return
      }
      // Show reactivate modal to get reason
      setShowReactivateModal(true)
      setEditingStatus(false)
      return
    }

    try {
      console.log('=== DEBUG UPDATE STATUS ===')
      console.log('ID do ticket:', ticket.id)
      console.log('Novo status:', newStatus)
      console.log('User ID:', session?.user?.id)
      
      const response = await axios.put('/api/tickets', {
        id: ticket.id,
        status: newStatus,
        updated_by: session?.user?.id
      })
      
      console.log('Resposta da atualização:', response.data)
      
      toast.success('Status atualizado com sucesso!')
      setEditingStatus(false)
      fetchTicket()
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      console.error('Detalhes do erro:', error.response?.data)
      toast.error(error.response?.data?.error || 'Erro ao atualizar status')
    }
  }

  const handleCancelTicket = async () => {
    if (!cancelReason.trim()) {
      toast.error('Por favor, informe o motivo do cancelamento')
      return
    }

    try {
      // Update status to cancelled
      await axios.put('/api/tickets', {
        id: ticket?.id,
        status: 'cancelled',
        updated_by: session?.user?.id
      })

      // Add comment with cancel reason
      await axios.post('/api/tickets/comments', {
        ticket_id: ticket?.id,
        user_id: session?.user?.id,
        content: `[TICKET CANCELADO] Motivo: ${cancelReason}`,
        is_internal: false
      })

      toast.success('Ticket cancelado com sucesso!')
      setShowCancelModal(false)
      setCancelReason('')
      fetchTicket()
    } catch (error: any) {
      console.error('Erro ao cancelar ticket:', error)
      toast.error('Erro ao cancelar ticket')
    }
  }

  const handleReactivateTicket = async () => {
    if (!reactivateReason.trim()) {
      toast.error('Por favor, informe o motivo da reativação')
      return
    }

    try {
      // Update status from cancelled
      await axios.put('/api/tickets', {
        id: ticket?.id,
        status: newStatus,
        updated_by: session?.user?.id
      })

      // Add comment with reactivation reason
      await axios.post('/api/tickets/comments', {
        ticket_id: ticket?.id,
        user_id: session?.user?.id,
        content: `[TICKET REATIVADO] Novo status: ${statusConfig[newStatus as keyof typeof statusConfig].label}. Motivo: ${reactivateReason}`,
        is_internal: false
      })

      toast.success('Ticket reativado com sucesso!')
      setShowReactivateModal(false)
      setReactivateReason('')
      setNewStatus('')
      fetchTicket()
    } catch (error: any) {
      console.error('Erro ao reativar ticket:', error)
      toast.error('Erro ao reativar ticket')
    }
  }

  const handleAssigneeUpdate = async () => {
    if (!ticket) {
      setEditingAssignee(false)
      return
    }

    // Block non-admin users from changing assignee on cancelled tickets
    if (ticket.status === 'cancelled' && session?.user?.role !== 'admin') {
      toast.error('Apenas administradores podem alterar o responsável de tickets cancelados')
      setEditingAssignee(false)
      return
    }

    try {
      await axios.put('/api/tickets', {
        id: ticket.id,
        assigned_to: newAssignee || null,
        updated_by: session?.user?.id
      })
      
      toast.success('Responsável atualizado com sucesso!')
      setEditingAssignee(false)
      fetchTicket()
    } catch (error) {
      console.error('Erro ao atualizar responsável:', error)
      toast.error('Erro ao atualizar responsável')
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !ticket) return

    // Block non-admin users from commenting on cancelled tickets
    if (ticket.status === 'cancelled' && session?.user?.role !== 'admin') {
      toast.error('Apenas administradores podem comentar em tickets cancelados')
      return
    }

    setSubmittingComment(true)
    try {
      await axios.post('/api/tickets/comments', {
        ticket_id: ticket.id,
        user_id: session?.user?.id,
        content: comment,
        is_internal: isInternalComment
      })
      
      toast.success(isInternalComment ? 'Comentário interno adicionado!' : 'Comentário adicionado!')
      setComment('')
      setIsInternalComment(false)
      fetchTicket()
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
      toast.error('Erro ao adicionar comentário')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDelete = async () => {
    if (!ticket) return
    
    if (!confirm('Tem certeza que deseja excluir este chamado?')) return

    try {
      await axios.delete(`/api/tickets?id=${ticket.id}`)
      toast.success('Chamado excluído com sucesso!')
      router.push('/dashboard/tickets')
    } catch (error) {
      console.error('Erro ao excluir chamado:', error)
      toast.error('Erro ao excluir chamado')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Chamado não encontrado</h2>
        <button
          onClick={() => router.push('/dashboard/tickets')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Voltar para Chamados
        </button>
      </div>
    )
  }

  const StatusIcon = statusConfig[ticket.status].icon
  const PriorityIcon = priorityConfig[ticket.priority].icon

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => router.push('/dashboard/tickets')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm sm:text-base"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Voltar para Chamados</span>
            <span className="sm:hidden">Voltar</span>
          </button>
          
          {/* Botão Gerar PDF - Disponível para todos */}
          <PrintButton ticket={ticket} loading={loading} />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold break-all">
                Chamado #{ticket.ticket_number?.toString().padStart(10, '0') || ticket.id.slice(0, 8)}
              </h1>
              {ticket.is_internal && (
                <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                  <Lock className="h-4 w-4 mr-1" />
                  Interno
                </span>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Criado em {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          
          <div className="flex gap-2">
            {/* Status - Apenas admin e analyst podem alterar */}
            <div className="relative">
              {editingStatus && (session?.user?.role === 'admin' || session?.user?.role === 'analyst') ? (
                <div className="flex gap-2">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="px-3 py-1 rounded-lg border dark:bg-gray-700"
                  >
                    <option value="open">Aberto</option>
                    <option value="in_progress">Em Progresso</option>
                    <option value="resolved">Resolvido</option>
                    <option value="closed">Fechado</option>
                    {/* Only show cancelled option for admin */}
                    {session?.user?.role === 'admin' && (
                      <option value="cancelled">Cancelado</option>
                    )}
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditingStatus(false)}
                    className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    // Apenas admin e analyst podem alterar status (mas se cancelado, apenas admin)
                    if (ticket.status === 'cancelled' && session?.user?.role !== 'admin') {
                      toast.error('Apenas administradores podem alterar o status de tickets cancelados')
                      return
                    }
                    if (session?.user?.role === 'admin' || session?.user?.role === 'analyst') {
                      setEditingStatus(true)
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${statusConfig[ticket.status].color} ${
                    (session?.user?.role === 'admin' || session?.user?.role === 'analyst') && 
                    (ticket.status !== 'cancelled' || session?.user?.role === 'admin') 
                      ? 'hover:opacity-90 cursor-pointer' 
                      : 'cursor-default'
                  }`}
                  disabled={session?.user?.role === 'user'}
                >
                  <StatusIcon size={16} />
                  {statusConfig[ticket.status].label}
                </button>
              )}
            </div>
            
            {/* Priority */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${priorityConfig[ticket.priority].color}`}>
              <PriorityIcon size={16} />
              {priorityConfig[ticket.priority].label}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content - Order 2 on mobile, Order 1 on desktop */}
        <div className="order-2 lg:order-1 lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Ticket Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4 break-words">{ticket.title.toUpperCase()}</h2>
            
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Descrição</h3>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {ticket.resolution_notes && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="text-sm font-semibold text-green-800 dark:text-green-400 mb-2">Notas de Resolução</h3>
                <p className="text-green-700 dark:text-green-300">{ticket.resolution_notes}</p>
              </div>
            )}
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Paperclip size={20} />
                Anexos ({attachments.length})
              </h2>
              
              <div className="space-y-2">
                {attachments.map((attachment) => {
                  // Verificar se é uma imagem
                  const isImage = isImageFile(attachment.file_name, attachment.file_type)
                  
                  // Obter URL correta do arquivo
                  const fileUrl = getAttachmentUrl(attachment)
                  
                  return (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <div className="flex items-center gap-3">
                        {isImage ? (
                          <ImageIcon className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Paperclip className="h-4 w-4 text-gray-400" />
                        )}
                        <div>
                          {isImage ? (
                            <button
                              onClick={() => setSelectedImage({
                                url: fileUrl,
                                name: attachment.file_name,
                                size: attachment.file_size,
                                type: attachment.file_type
                              })}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline text-left"
                            >
                              {attachment.file_name}
                            </button>
                          ) : (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
                            >
                              {attachment.file_name}
                            </a>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(attachment.file_size)} • {format(new Date(attachment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      {attachment.uploader && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {attachment.uploader.name}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare size={20} />
              Comentários
            </h2>
            
            {/* Comments List */}
            <div className="space-y-4 mb-6">
              {ticket.comments && ticket.comments.length > 0 ? (
                ticket.comments.map((comment) => (
                  <div key={comment.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{comment.user.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      {comment.is_internal && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded">
                          Interno
                        </span>
                      )}
                    </div>
                    <p className="mt-2">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Nenhum comentário ainda.</p>
              )}
            </div>

            {/* Add Comment Form - Disabled for cancelled tickets unless admin */}
            {ticket.status === 'cancelled' && session?.user?.role !== 'admin' ? (
              <div className="border-t pt-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    🔒 Este ticket está cancelado. Apenas administradores podem adicionar comentários.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddComment} className="border-t pt-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Adicionar comentário..."
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 resize-none"
                  rows={3}
                  disabled={ticket.status === 'cancelled' && session?.user?.role !== 'admin'}
                />
                <div className="flex justify-between items-center mt-2">
                  {/* Checkbox para comentário interno - apenas para admin e analyst */}
                  {(session?.user?.role === 'admin' || session?.user?.role === 'analyst') && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                      <span className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                        <Lock className="h-3 w-3" />
                        Comentário Interno
                      </span>
                    </label>
                  )}
                  <div className={!session?.user?.role || session?.user?.role === 'user' ? 'w-full flex justify-end' : ''}>
                    <button
                      type="submit"
                      disabled={submittingComment || !comment.trim() || (ticket.status === 'cancelled' && session?.user?.role !== 'admin')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={16} />
                      {isInternalComment ? 'Enviar Interno' : 'Enviar'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Apontamentos de Horas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Clock size={20} />
                Apontamentos de Horas
              </h2>
              <a
                href={`/dashboard/timesheets?ticket_id=${ticketId}`}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Ver todos →
              </a>
            </div>
            
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Visualize e gerencie apontamentos na página dedicada</p>
              <a
                href="/dashboard/timesheets"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ir para Apontamentos
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar - Order 1 on mobile, Order 2 on desktop */}
        <div className="order-1 lg:order-2 space-y-4 sm:space-y-6">
          {/* Ticket Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Informações</h2>
            
            <div className="space-y-4">
              {/* Solicitante */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Solicitante</p>
                <p className="font-semibold">{ticket.created_by_user?.name || 'Desconhecido'}</p>
                <p className="text-sm text-gray-500">{ticket.created_by_user?.email}</p>
              </div>

              {/* Responsável - Apenas admin e analyst podem alterar */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Responsável</p>
                {editingAssignee && (session?.user?.role === 'admin' || session?.user?.role === 'analyst') ? (
                  <div className="space-y-2">
                    <select
                      value={newAssignee}
                      onChange={(e) => setNewAssignee(e.target.value)}
                      className="w-full px-3 py-1 rounded-lg border dark:bg-gray-700"
                    >
                      <option value="">Não atribuído</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAssigneeUpdate}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditingAssignee(false)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => {
                      // Apenas admin e analyst podem alterar responsável (mas se cancelado, apenas admin)
                      if (ticket.status === 'cancelled' && session?.user?.role !== 'admin') {
                        toast.error('Apenas administradores podem alterar o responsável de tickets cancelados')
                        return
                      }
                      if (session?.user?.role === 'admin' || session?.user?.role === 'analyst') {
                        setEditingAssignee(true)
                      }
                    }}
                    className={`${
                      (session?.user?.role === 'admin' || session?.user?.role === 'analyst') && 
                      (ticket.status !== 'cancelled' || session?.user?.role === 'admin')
                        ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' 
                        : 'cursor-default'
                    } p-2 -m-2 rounded`}
                  >
                    {ticket.assigned_to_user ? (
                      <>
                        <p className="font-semibold">{ticket.assigned_to_user.name}</p>
                        <p className="text-sm text-gray-500">{ticket.assigned_to_user.email}</p>
                      </>
                    ) : (
                      <p className="text-gray-500">Não atribuído</p>
                    )}
                  </div>
                )}
              </div>

              {/* Categoria */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Categoria</p>
                {(() => {
                  // Obter informações da categoria
                  const categoryInfo = ticket.category_info
                  const category = Array.isArray(categoryInfo) ? categoryInfo[0] : categoryInfo
                  
                  if (category) {
                    const Icon = getIcon(category.icon)
                    return (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: category.color + '20', color: category.color }}
                        >
                          <Icon size={14} />
                        </div>
                        <p className="font-semibold">{category.name}</p>
                      </div>
                    )
                  }
                  
                  // Fallback para categoria em texto
                  return <p className="font-semibold capitalize">{ticket.category || 'Geral'}</p>
                })()}
              </div>

              {/* SLA */}
              {ticket.due_date && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">SLA</p>
                  <p className="font-semibold">
                    {format(new Date(ticket.due_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}

              {/* Última atualização */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Última atualização</p>
                <p className="font-semibold">
                  {format(new Date(ticket.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Ações</h2>
            
            <div className="space-y-2">
              {/* Botões de Ação - Apenas admin e analyst (mas se cancelado, apenas admin) */}
              {((session?.user?.role === 'admin' || session?.user?.role === 'analyst') && 
                (ticket.status !== 'cancelled' || session?.user?.role === 'admin')) && (
                <>
                  <button
                    onClick={() => setEditingStatus(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Alterar Status
                  </button>
                  
                  <button
                    onClick={() => setEditingAssignee(true)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Atribuir Responsável
                  </button>
                </>
              )}
              
              {/* File Upload - Disabled for cancelled tickets unless admin */}
              {ticket.status === 'cancelled' && session?.user?.role !== 'admin' ? (
                <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                  <Paperclip size={16} />
                  <span className="text-gray-600 dark:text-gray-400">Anexos bloqueados</span>
                </div>
              ) : (
                <label className="w-full">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploadingFile || (ticket.status === 'cancelled' && session?.user?.role !== 'admin')}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.zip,.rar"
                  />
                  <div className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center gap-2 cursor-pointer ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Paperclip size={16} />
                    {uploadingFile ? 'Enviando...' : 'Adicionar Anexo'}
                  </div>
                </label>
              )}
              
              {/* Botão de Excluir - Apenas admin */}
              {session?.user?.role === 'admin' && (
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Excluir Chamado
                </button>
              )}
              
              {/* Mensagem especial para tickets cancelados */}
              {ticket.status === 'cancelled' && session?.user?.role !== 'admin' && (
                <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-lg text-center border border-red-300 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-300 font-semibold">
                    🔒 Ticket Cancelado - Acesso Restrito
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                    Este ticket foi cancelado e está bloqueado para alterações.
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Apenas administradores podem:
                  </p>
                  <ul className="text-xs text-red-600 dark:text-red-400 mt-1">
                    <li>• Reativar o ticket</li>
                    <li>• Adicionar comentários</li>
                    <li>• Anexar arquivos</li>
                    <li>• Fazer alterações</li>
                  </ul>
                </div>
              )}
              
              {/* Mensagem para usuários sem permissão */}
              {session?.user?.role === 'user' && ticket.status !== 'cancelled' && (
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Você pode adicionar comentários e anexos ao chamado.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Para alterações de status ou atribuição, contate um analista ou administrador.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Cancelamento */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Cancelar Ticket</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Para cancelar este ticket, você deve informar o motivo do cancelamento.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Digite o motivo do cancelamento..."
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelReason('')
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleCancelTicket}
                disabled={!cancelReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reativação */}
      {showReactivateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Reativar Ticket</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Para reativar este ticket cancelado, você deve informar o motivo da reativação.
            </p>
            <textarea
              value={reactivateReason}
              onChange={(e) => setReactivateReason(e.target.value)}
              placeholder="Digite o motivo da reativação..."
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowReactivateModal(false)
                  setReactivateReason('')
                  setNewStatus('')
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleReactivateTicket}
                disabled={!reactivateReason.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Reativação
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          fileName={selectedImage.name}
          fileSize={selectedImage.size}
          fileType={selectedImage.type}
        />
      )}
    </div>
  )
}