'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock data
const tickets = [
  {
    id: '1',
    ticket_number: '202412001',
    title: 'Problema com impressora do 3º andar',
    description: 'A impressora não está imprimindo documentos coloridos',
    status: 'open',
    priority: 'high',
    module: 'Hardware',
    requester: 'João Silva',
    assigned_to: 'Carlos Souza',
    created_at: '2024-12-01T10:00:00',
    updated_at: '2024-12-01T10:00:00',
  },
  {
    id: '2',
    ticket_number: '202412002',
    title: 'Acesso ao sistema ERP bloqueado',
    description: 'Usuário não consegue fazer login no sistema',
    status: 'in_progress',
    priority: 'critical',
    module: 'Software',
    requester: 'Maria Santos',
    assigned_to: 'Ana Costa',
    created_at: '2024-12-01T11:30:00',
    updated_at: '2024-12-01T14:00:00',
  },
  {
    id: '3',
    ticket_number: '202412003',
    title: 'Instalação de software de design',
    description: 'Necessário instalar Adobe Creative Suite',
    status: 'waiting',
    priority: 'medium',
    module: 'Software',
    requester: 'Pedro Costa',
    assigned_to: null,
    created_at: '2024-12-01T09:00:00',
    updated_at: '2024-12-01T09:00:00',
  },
  {
    id: '4',
    ticket_number: '202412004',
    title: 'Configuração de VPN',
    description: 'Configurar acesso VPN para trabalho remoto',
    status: 'resolved',
    priority: 'medium',
    module: 'Rede',
    requester: 'Lucas Oliveira',
    assigned_to: 'Carlos Souza',
    created_at: '2024-11-30T15:00:00',
    updated_at: '2024-12-01T08:00:00',
  },
]

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
    <span className={cn("px-2 py-1 text-xs font-medium rounded-full", color)}>
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
    <span className={cn("px-2 py-1 text-xs font-medium rounded-full", color)}>
      {label}
    </span>
  )
}

export default function TicketsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticket_number.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chamados
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gerencie todos os chamados técnicos
          </p>
        </div>
        <Link
          href="/dashboard/tickets/new"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Chamado
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="open">Aberto</option>
              <option value="in_progress">Em Progresso</option>
              <option value="waiting">Aguardando</option>
              <option value="resolved">Resolvido</option>
              <option value="closed">Fechado</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
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
                  Módulo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Atualizado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    #{ticket.ticket_number}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {ticket.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {ticket.requester}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {ticket.module}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {ticket.assigned_to || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(ticket.updated_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/tickets/${ticket.id}`}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span className="font-medium">{filteredTickets.length}</span> de{' '}
              <span className="font-medium">{tickets.length}</span> resultados
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                Anterior
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                2
              </button>
              <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                Próximo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}