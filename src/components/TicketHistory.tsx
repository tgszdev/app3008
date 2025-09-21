'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  User, 
  Clock, 
  RefreshCw, 
  AlertTriangle, 
  UserPlus, 
  UserMinus, 
  UserCheck, 
  MessageCircle, 
  ArrowUp, 
  RotateCcw, 
  CheckCircle, 
  PlusCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import axios from 'axios'
import toast from 'react-hot-toast'

interface HistoryEntry {
  id: string
  action_type: string
  field_changed: string
  old_value: string
  new_value: string
  description: string
  metadata: any
  created_at: string
  user: {
    id: string
    name: string
    email: string
    avatar_url?: string
  }
  actionIcon: string
  actionColor: string
  formattedOldValue: string
  formattedNewValue: string
}

interface TicketHistoryProps {
  ticketId: string
  className?: string
}

const iconMap: Record<string, React.ElementType> = {
  'plus-circle': PlusCircle,
  'refresh-cw': RefreshCw,
  'alert-triangle': AlertTriangle,
  'user-plus': UserPlus,
  'user-minus': UserMinus,
  'user-check': UserCheck,
  'message-circle': MessageCircle,
  'arrow-up': ArrowUp,
  'rotate-ccw': RotateCcw,
  'check-circle': CheckCircle,
  'activity': Activity
}

const colorMap: Record<string, string> = {
  'green': 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
  'blue': 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
  'orange': 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
  'red': 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
  'yellow': 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
  'gray': 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700'
}

export default function TicketHistory({ ticketId, className = '' }: TicketHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [ticketId])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axios.get(`/api/tickets/${ticketId}/history`)
      
      if (response.data.success) {
        setHistory(response.data.history || [])
      } else {
        setError('Erro ao carregar histórico')
      }
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error)
      if (error.response?.status === 403) {
        setError('Você não tem permissão para visualizar o histórico')
      } else {
        setError('Erro ao carregar histórico')
      }
    } finally {
      setLoading(false)
    }
  }

  const renderHistoryEntry = (entry: HistoryEntry) => {
    const IconComponent = iconMap[entry.actionIcon] || Activity
    const colorClass = colorMap[entry.actionColor] || colorMap.gray

    return (
      <div key={entry.id} className="flex items-start space-x-3 p-3 border-l-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        {/* Ícone da ação */}
        <div className={`p-2 rounded-full ${colorClass} flex-shrink-0`}>
          <IconComponent className="h-4 w-4" />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Descrição e usuário */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {entry.description}
              </p>
              <div className="flex items-center mt-1 space-x-2">
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {entry.user.name}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(entry.created_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detalhes da mudança (se aplicável) */}
          {entry.formattedOldValue && entry.formattedNewValue && entry.formattedOldValue !== entry.formattedNewValue && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              <span className="text-red-600 dark:text-red-400 line-through">
                {entry.formattedOldValue}
              </span>
              {' → '}
              <span className="text-green-600 dark:text-green-400 font-medium">
                {entry.formattedNewValue}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center">
          <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  const visibleHistory = expanded ? history : history.slice(0, 5)

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Cabeçalho */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Histórico do Ticket
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {history.length} {history.length === 1 ? 'entrada' : 'entradas'}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6">
        {history.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhum histórico encontrado para este ticket
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-0">
              {visibleHistory.map(renderHistoryEntry)}
            </div>

            {/* Botão para expandir/recolher */}
            {history.length > 5 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="inline-flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Mostrar mais {history.length - 5} entradas
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
