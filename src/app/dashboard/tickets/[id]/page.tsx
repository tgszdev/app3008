'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, User, Calendar, Tag, MessageSquare, Paperclip, Send } from 'lucide-react'
import toast from 'react-hot-toast'

// Mock data
const ticketData = {
  id: '1',
  ticket_number: '202412001',
  title: 'Problema com impressora do 3º andar',
  description: `A impressora HP LaserJet Pro M404dn localizada no 3º andar não está imprimindo documentos coloridos. 
  
  Detalhes do problema:
  - Impressões em preto e branco funcionam normalmente
  - Ao tentar imprimir colorido, a impressora faz o processo mas sai em branco
  - Já tentei reiniciar a impressora mas o problema persiste
  - O problema começou hoje pela manhã
  
  Modelo: HP LaserJet Pro M404dn
  Localização: 3º andar, sala 302
  Número de série: BR123456789`,
  status: 'in_progress',
  priority: 'high',
  module: 'Hardware',
  requester: {
    name: 'João Silva',
    email: 'joao.silva@example.com',
    department: 'Recursos Humanos'
  },
  assigned_to: {
    name: 'Carlos Souza',
    email: 'carlos.souza@example.com'
  },
  created_at: '2024-12-01T10:00:00',
  updated_at: '2024-12-01T14:00:00',
  sla_deadline: '2024-12-02T10:00:00',
  tags: ['impressora', 'hardware', '3-andar'],
  comments: [
    {
      id: '1',
      user: 'Carlos Souza',
      content: 'Vou verificar a impressora agora. Pode ser problema com os cartuchos de tinta.',
      created_at: '2024-12-01T14:00:00',
      is_internal: false
    },
    {
      id: '2',
      user: 'Carlos Souza',
      content: 'Verificar estoque de cartuchos no almoxarifado.',
      created_at: '2024-12-01T14:30:00',
      is_internal: true
    }
  ]
}

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { color: string; label: string }> = {
    open: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', label: 'Aberto' },
    in_progress: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', label: 'Em Progresso' },
    waiting: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', label: 'Aguardando' },
    resolved: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', label: 'Resolvido' },
    closed: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300', label: 'Fechado' },
  }
  
  const { color, label } = config[status] || config.open
  
  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${color}`}>
      {label}
    </span>
  )
}

const PriorityBadge = ({ priority }: { priority: string }) => {
  const config: Record<string, { color: string; label: string }> = {
    low: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300', label: 'Baixa' },
    medium: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', label: 'Média' },
    high: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', label: 'Alta' },
    critical: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', label: 'Crítica' },
  }
  
  const { color, label } = config[priority] || config.medium
  
  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${color}`}>
      {label}
    </span>
  )
}

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [status, setStatus] = useState(ticketData.status)
  const [showStatusModal, setShowStatusModal] = useState(false)

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error('Digite um comentário')
      return
    }

    toast.success('Comentário adicionado com sucesso!')
    setNewComment('')
  }

  const handleUpdateStatus = (newStatus: string) => {
    setStatus(newStatus)
    setShowStatusModal(false)
    toast.success(`Status atualizado para: ${newStatus}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Chamado #{ticketData.ticket_number}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Criado em {new Date(ticketData.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <PriorityBadge priority={ticketData.priority} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {ticketData.title}
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {ticketData.description}
              </p>
            </div>
            
            {/* Tags */}
            <div className="mt-4 flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-500" />
              {ticketData.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Comentários
            </h3>
            
            <div className="space-y-4 mb-6">
              {ticketData.comments.map((comment) => (
                <div key={comment.id} className={`p-4 rounded-lg ${comment.is_internal ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : 'bg-gray-50 dark:bg-gray-700'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {comment.user}
                    </span>
                    <div className="flex items-center gap-2">
                      {comment.is_internal && (
                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs rounded">
                          Interno
                        </span>
                      )}
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(comment.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Add Comment */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicionar comentário..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="mt-3 flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Comentário interno
                  </span>
                </label>
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Solicitante</p>
                <p className="font-medium text-gray-900 dark:text-white">{ticketData.requester.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{ticketData.requester.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Responsável</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {ticketData.assigned_to ? ticketData.assigned_to.name : 'Não atribuído'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Módulo</p>
                <p className="font-medium text-gray-900 dark:text-white">{ticketData.module}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">SLA</p>
                <p className="font-medium text-gray-900 dark:text-white flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date(ticketData.sla_deadline).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Ações
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowStatusModal(true)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Alterar Status
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors">
                Atribuir Responsável
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors">
                <Paperclip className="inline h-4 w-4 mr-2" />
                Adicionar Anexo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Alterar Status
            </h3>
            <div className="space-y-2">
              {['open', 'in_progress', 'waiting', 'resolved', 'closed'].map((s) => (
                <button
                  key={s}
                  onClick={() => handleUpdateStatus(s)}
                  className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                    status === s 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <StatusBadge status={s} />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowStatusModal(false)}
              className="mt-4 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}