'use client'

import React from 'react'
import { Building, Users, TicketIcon, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// =====================================================
// TIPOS E INTERFACES
// =====================================================

interface Ticket {
  id: string
  ticket_number: string
  title: string
  status: string
  priority: string
  requester: string
  created_at: string
  context_id: string
  context_name: string
}

interface ClientGroup {
  clientId: string
  clientName: string
  tickets: Ticket[]
  stats: {
    total: number
    open: number
    inProgress: number
    resolved: number
    cancelled: number
  }
}

interface ClientGroupedTicketsProps {
  clientGroups: ClientGroup[]
  onTicketClick: (ticketId: string) => void
  className?: string
}

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  }
  
  const labels: Record<string, string> = {
    open: 'Aberto',
    in_progress: 'Em Progresso',
    resolved: 'Resolvido',
    closed: 'Fechado',
    cancelled: 'Cancelado',
  }
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || colors.open}`}>
      {labels[status] || status}
    </span>
  )
}

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  }
  
  const labels: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    critical: 'Crítica',
  }
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority] || colors.medium}`}>
      {labels[priority] || priority}
    </span>
  )
}

const ClientHeader = ({ clientName, stats }: { clientName: string; stats: ClientGroup['stats'] }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {clientName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cliente
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.total}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
          </div>
          
          <div className="flex gap-2">
            {stats.open > 0 && (
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {stats.open}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Abertos</div>
              </div>
            )}
            
            {stats.inProgress > 0 && (
              <div className="text-center">
                <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                  {stats.inProgress}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Progresso</div>
              </div>
            )}
            
            {stats.resolved > 0 && (
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {stats.resolved}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Resolvidos</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// COMPONENTE PRINCIPAL - CLIENT GROUPED TICKETS
// =====================================================

export function ClientGroupedTickets({ 
  clientGroups, 
  onTicketClick, 
  className 
}: ClientGroupedTicketsProps) {
  if (clientGroups.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Nenhum ticket encontrado
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {clientGroups.map((group) => (
        <div key={group.clientId} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Header do Cliente */}
          <ClientHeader clientName={group.clientName} stats={group.stats} />
          
          {/* Tickets do Cliente */}
          {group.tickets.length > 0 ? (
            <>
              {/* Tabela Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Título
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Prioridade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Solicitante
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {group.tickets.map((ticket) => (
                      <tr 
                        key={ticket.id} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                        onClick={() => onTicketClick(ticket.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          #{ticket.ticket_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <div className="truncate max-w-xs" title={ticket.title}>
                            {ticket.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {ticket.requester}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDateShort(ticket.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards Mobile */}
              <div className="sm:hidden divide-y divide-gray-200 dark:divide-gray-700">
                {group.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                    onClick={() => onTicketClick(ticket.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        #{ticket.ticket_number}
                      </span>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {ticket.title.toUpperCase()}
                    </h3>
                    <div className="flex justify-between items-center">
                      <PriorityBadge priority={ticket.priority} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateShort(ticket.created_at)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Solicitante: {ticket.requester}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum ticket encontrado para este cliente
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// =====================================================
// FUNÇÃO AUXILIAR PARA FORMATAR DATAS
// =====================================================

function formatDateShort(date: string | null | undefined) {
  if (!date) {
    return 'N/A'
  }
  
  if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
  }
  
  const dateObj = new Date(date)
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toLocaleDateString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
  
  const parts = date.split('-')
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number)
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
    }
  }
  
  return 'N/A'
}
