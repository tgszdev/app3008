'use client'

import React, { forwardRef } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
  category?: string
  category_info?: Category[] | Category
  is_internal?: boolean
  created_at: string
  updated_at: string
  due_date?: string
  resolution_notes?: string
  creator?: User
  assigned_to?: User
  comments?: Comment[]
}

interface TicketPDFProps {
  ticket: Ticket
}

// Componente para impressão com forwardRef
export const TicketPDF = forwardRef<HTMLDivElement, TicketPDFProps>(
  ({ ticket }, ref) => {
    const getStatusLabel = (status: string) => {
      const labels: Record<string, string> = {
        open: 'Aberto',
        in_progress: 'Em Progresso',
        resolved: 'Resolvido',
        closed: 'Fechado',
        cancelled: 'Cancelado'
      }
      return labels[status] || status
    }

    const getPriorityLabel = (priority: string) => {
      const labels: Record<string, string> = {
        low: 'Baixa',
        medium: 'Média',
        high: 'Alta',
        critical: 'Crítica'
      }
      return labels[priority] || priority
    }

    const getCategoryInfo = () => {
      if (Array.isArray(ticket.category_info) && ticket.category_info.length > 0) {
        return ticket.category_info[0]
      }
      if (ticket.category_info && !Array.isArray(ticket.category_info)) {
        return ticket.category_info
      }
      return null
    }

    const category = getCategoryInfo()

    return (
      <div ref={ref} className="ticket-pdf-content">
        {/* Estilos específicos para impressão */}
        <style jsx>{`
          @media print {
            @page {
              size: A4;
              margin: 25mm; /* Margem de 2.5cm em todos os lados */
            }
            
            .ticket-pdf-content {
              width: 100%;
              font-family: 'Arial', sans-serif;
              color: #000;
              background: white;
              font-size: 11pt;
              line-height: 1.6;
            }
            
            .page-break {
              page-break-before: always;
            }
            
            .no-break {
              page-break-inside: avoid;
            }
          }
        `}</style>

        {/* Cabeçalho */}
        <div className="mb-8 border-b-2 border-gray-800 pb-4">
          <h1 className="text-3xl font-bold mb-2">
            Ticket #{ticket.ticket_number}
          </h1>
          <div className="text-sm text-gray-600">
            Gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
        </div>

        {/* Informações Principais */}
        <div className="mb-6 no-break">
          <h2 className="text-xl font-bold mb-3 border-b border-gray-400 pb-1">
            Informações do Ticket
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Título:</strong>
              <div>{ticket.title}</div>
            </div>
            
            <div>
              <strong>Status:</strong>
              <div>{getStatusLabel(ticket.status)}</div>
            </div>
            
            <div>
              <strong>Prioridade:</strong>
              <div>{getPriorityLabel(ticket.priority)}</div>
            </div>
            
            {category && (
              <div>
                <strong>Categoria:</strong>
                <div>{category.name}</div>
              </div>
            )}
            
            <div>
              <strong>Criado em:</strong>
              <div>{format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
            </div>
            
            {ticket.due_date && (
              <div>
                <strong>Prazo:</strong>
                <div>{format(new Date(ticket.due_date), "dd/MM/yyyy", { locale: ptBR })}</div>
              </div>
            )}
            
            {ticket.creator && (
              <div>
                <strong>Criado por:</strong>
                <div>{ticket.creator.name}</div>
              </div>
            )}
            
            {ticket.assigned_to && (
              <div>
                <strong>Atribuído a:</strong>
                <div>{ticket.assigned_to.name}</div>
              </div>
            )}
          </div>
        </div>

        {/* Descrição */}
        <div className="mb-6 no-break">
          <h2 className="text-xl font-bold mb-3 border-b border-gray-400 pb-1">
            Descrição
          </h2>
          <div className="whitespace-pre-wrap">
            {ticket.description || 'Sem descrição'}
          </div>
        </div>

        {/* Notas de Resolução */}
        {ticket.resolution_notes && (
          <div className="mb-6 no-break">
            <h2 className="text-xl font-bold mb-3 border-b border-gray-400 pb-1">
              Notas de Resolução
            </h2>
            <div className="whitespace-pre-wrap">
              {ticket.resolution_notes}
            </div>
          </div>
        )}

        {/* Comentários */}
        {ticket.comments && ticket.comments.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 border-b border-gray-400 pb-1">
              Histórico de Comentários
            </h2>
            
            <div className="space-y-4">
              {ticket.comments.map((comment, index) => (
                <div key={comment.id} className="no-break border-l-2 border-gray-300 pl-4">
                  <div className="mb-2">
                    <strong>{comment.user.name}</strong>
                    {comment.is_internal && (
                      <span className="ml-2 text-xs bg-yellow-200 px-2 py-1 rounded">
                        Interno
                      </span>
                    )}
                    <div className="text-sm text-gray-600">
                      {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap">
                    {comment.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-8 pt-4 border-t border-gray-400 text-sm text-gray-600">
          <div className="text-center">
            Sistema de Suporte - Documento gerado automaticamente
          </div>
        </div>
      </div>
    )
  }
)

TicketPDF.displayName = 'TicketPDF'

export default TicketPDF