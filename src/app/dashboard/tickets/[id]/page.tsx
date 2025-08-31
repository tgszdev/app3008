'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Clock, User, Tag, AlertCircle, MessageSquare, Paperclip, Edit, Trash2, Send, CheckCircle, XCircle, AlertTriangle, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'

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

interface Ticket {
  id: string
  ticket_number: number
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string
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
  const [editingStatus, setEditingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('')
  const [users, setUsers] = useState<User[]>([])
  const [editingAssignee, setEditingAssignee] = useState(false)
  const [newAssignee, setNewAssignee] = useState<string>('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)

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

  const handleAssigneeUpdate = async () => {
    if (!ticket) {
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

    setSubmittingComment(true)
    try {
      await axios.post('/api/tickets/comments', {
        ticket_id: ticket.id,
        user_id: session?.user?.id,
        content: comment,
        is_internal: false
      })
      
      toast.success('Comentário adicionado!')
      setComment('')
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/tickets')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Chamado #{ticket.ticket_number?.toString().padStart(10, '0') || ticket.id.slice(0, 8)}
            </h1>
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
                    <option value="cancelled">Cancelado</option>
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
                    // Apenas admin e analyst podem alterar status
                    if (session?.user?.role === 'admin' || session?.user?.role === 'analyst') {
                      setEditingStatus(true)
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${statusConfig[ticket.status].color} ${
                    session?.user?.role === 'admin' || session?.user?.role === 'analyst' ? 'hover:opacity-90 cursor-pointer' : 'cursor-default'
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">{ticket.title}</h2>
            
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
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <div className="flex items-center gap-3">
                      <Paperclip className="h-4 w-4 text-gray-400" />
                      <div>
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          {attachment.file_name}
                        </a>
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
                ))}
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

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="border-t pt-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Adicionar comentário..."
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submittingComment || !comment.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Informações</h2>
            
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
                      // Apenas admin e analyst podem alterar responsável
                      if (session?.user?.role === 'admin' || session?.user?.role === 'analyst') {
                        setEditingAssignee(true)
                      }
                    }}
                    className={`${
                      session?.user?.role === 'admin' || session?.user?.role === 'analyst' 
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

              {/* Módulo/Categoria */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Módulo</p>
                <p className="font-semibold capitalize">{ticket.category}</p>
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
              {/* Botões de Ação - Apenas admin e analyst */}
              {(session?.user?.role === 'admin' || session?.user?.role === 'analyst') && (
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
              
              <label className="w-full">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.zip,.rar"
                />
                <div className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center gap-2 cursor-pointer ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Paperclip size={16} />
                  {uploadingFile ? 'Enviando...' : 'Adicionar Anexo'}
                </div>
              </label>
              
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
              
              {/* Mensagem para usuários sem permissão */}
              {session?.user?.role === 'user' && (
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
    </div>
  )
}