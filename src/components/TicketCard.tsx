'use client'

import { Clock, AlertCircle, CheckCircle, XCircle, User, Calendar, Eye, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
}

interface Ticket {
  id: string
  ticket_number: number
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string
  created_by: string
  assigned_to: string | null
  created_by_user: User
  assigned_to_user: User | null
  created_at: string
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
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    icon: XCircle,
  },
}

const priorityConfig = {
  low: { label: 'Baixa', color: 'text-gray-600' },
  medium: { label: 'Média', color: 'text-yellow-600' },
  high: { label: 'Alta', color: 'text-orange-600' },
  critical: { label: 'Crítica', color: 'text-red-600' },
}

interface TicketCardProps {
  ticket: Ticket
  userRole?: string
  onDelete?: (id: string) => void
  getTimeAgo?: (date: string) => string
}

export default function TicketCard({ ticket, userRole, onDelete, getTimeAgo }: TicketCardProps) {
  const status = statusConfig[ticket.status]
  const priority = priorityConfig[ticket.priority]
  const StatusIcon = status.icon

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-500">#{ticket.ticket_number}</span>
            <span className={cn(
              "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full",
              status.color
            )}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </span>
          </div>
          <Link
            href={`/dashboard/tickets/${ticket.id}`}
            className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
          >
            {ticket.title}
          </Link>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 ml-2">
          <Link
            href={`/dashboard/tickets/${ticket.id}`}
            className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            title="Visualizar"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Link
            href={`/dashboard/tickets/${ticket.id}`}
            className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Link>
          {userRole === 'admin' && onDelete && (
            <button
              onClick={() => onDelete(ticket.id)}
              className="p-1.5 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{ticket.created_by_user?.name || 'Desconhecido'}</span>
          </div>
          <div className={cn("font-medium", priority.color)}>
            {priority.label}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{getTimeAgo ? getTimeAgo(ticket.created_at) : ticket.created_at}</span>
          </div>
          {ticket.assigned_to_user && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>→ {ticket.assigned_to_user.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}