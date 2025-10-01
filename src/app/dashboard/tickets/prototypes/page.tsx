'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, Filter, Calendar, User, Building, Plus, RefreshCw, 
  FileDown, Eye, Edit, Trash2, Clock, AlertCircle, CheckCircle, 
  XCircle, ChevronDown, ChevronRight, Star, Zap, Shield, 
  Target, TrendingUp, BarChart3, PieChart, Activity, 
  Users, Settings, Bell, Heart, Award, Crown, Sparkles,
  Loader2, X, Check, ArrowRight, ArrowLeft, MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useStatuses } from '@/hooks/useStatuses'
import { useStatusesWithCount } from '@/hooks/useStatusesWithCount'
import { usePrioritiesWithCount } from '@/hooks/usePrioritiesWithCount'
import { usePermissions } from '@/hooks/usePermissions'
import toast from 'react-hot-toast'
import axios from 'axios'
import { getPrototypeRender } from './prototypes-6-25'
import { getPrototypeRender as getPrototypeRender12_21 } from './prototypes-12-21'

interface Ticket {
  id: string
  ticket_number: string
  title: string
  description: string
  status: string
  priority: string
  category_id: string
  context_id: string
  created_by: string
  assigned_to: string | null
  created_at: string
  updated_at: string
  resolved_at?: string
  closed_at?: string
  due_date?: string
  created_by_user: User | null
  assigned_to_user: User | null
  comment_count?: number
  is_internal?: boolean
}

interface User {
  id: string
  name: string
  email: string
}

const PrototypeSelector = ({ currentPrototype, onPrototypeChange }: { 
  currentPrototype: number, 
  onPrototypeChange: (prototype: number) => void 
}) => {
  const prototypes = Array.from({ length: 30 }, (_, i) => i + 1)
  
  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-xs">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        🎨 Protótipos de Layout
      </h3>
      <div className="grid grid-cols-5 gap-2">
        {prototypes.map((num) => (
          <button
            key={num}
            onClick={() => onPrototypeChange(num)}
            className={cn(
              "w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200",
              currentPrototype === num
                ? "bg-blue-600 text-white shadow-lg scale-110"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            )}
          >
            {num}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Protótipo {currentPrototype} de 30
      </p>
    </div>
  )
}

export default function TicketsPrototypesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { hasPermission } = usePermissions()
  const { statuses: availableStatuses } = useStatuses()
  const { statuses: statusesWithCount } = useStatusesWithCount()
  const { priorities: prioritiesWithCount } = usePrioritiesWithCount()
  const { availableContexts, hasMultipleContexts } = useOrganization()
  
  const [currentPrototype, setCurrentPrototype] = useState(1)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [myTicketsOnly, setMyTicketsOnly] = useState(false)
  const [periodFilter, setPeriodFilter] = useState({
    start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })

  // Mock data para demonstração
  useEffect(() => {
    const mockTickets: Ticket[] = Array.from({ length: 13 }, (_, i) => ({
      id: `ticket-${i + 1}`,
      ticket_number: `#${72 - i}`,
      title: i < 4 ? `SIMAS ${String(i + 1).padStart(3, '0')}` : 
             i < 7 ? `agro ${i - 3}` : 
             i < 9 ? `SIMAS ${String(i - 6).padStart(3, '0')}` : 
             `Simas ${String(i - 8).padStart(3, '0')}`,
      description: `Descrição do ticket ${i + 1}`,
      status: ['open', 'in_progress', 'waiting_deploy_homolog', 'in_homolog', 'waiting_deploy_prod', 'resolved', 'cancelled'][i % 7],
      priority: ['medium', 'critical', 'low'][i % 3],
      category_id: `cat-${i % 4}`,
      context_id: `context-${i % 2}`,
      created_by: 'user-1',
      assigned_to: i % 3 === 0 ? 'user-2' : null,
      created_at: new Date(Date.now() - (i * 2 + 1) * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      created_by_user: { id: 'user-1', name: 'S', email: 's@example.com' },
      assigned_to_user: i % 3 === 0 ? { id: 'user-2', name: 'AU', email: 'au@example.com' } : null,
      comment_count: Math.floor(Math.random() * 5),
      is_internal: false
    }))
    setTickets(mockTickets)
    setLoading(false)
  }, [])

  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, any> = {
      open: { label: 'Aberto', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: AlertCircle },
      in_progress: { label: 'Em Atendimento', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: Clock },
      waiting_deploy_homolog: { label: 'Ag. Deploy em Homologação', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', icon: Clock },
      in_homolog: { label: 'Em Homologação', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300', icon: Clock },
      waiting_deploy_prod: { label: 'Ag. Deploy em Produção', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300', icon: Clock },
      resolved: { label: 'Resolvido', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle }
    }
    return statusMap[status] || statusMap.open
  }

  const getPriorityConfig = (priority: string) => {
    const priorityMap: Record<string, any> = {
      low: { label: 'Baixa', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
      medium: { label: 'Média', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      critical: { label: 'Crítica', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
    }
    return priorityMap[priority] || priorityMap.medium
  }

  const getCategoryConfig = (categoryId: string) => {
    const categoryMap: Record<string, any> = {
      'cat-0': { label: 'Impressão', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300', icon: '🖨️' },
      'cat-1': { label: '▲ Emergência', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: '⚠️' },
      'cat-2': { label: 'simas categoria especifica', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: '📁' },
      'cat-3': { label: 'Teste Agro Específica', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: '🌱' }
    }
    return categoryMap[categoryId] || categoryMap['cat-0']
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const ticketDate = new Date(date)
    const diffInHours = Math.floor((now.getTime() - ticketDate.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) return `há ${diffInHours} horas`
    const diffInDays = Math.floor(diffInHours / 24)
    return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateTitle = (title: string, maxLength: number = 150) => {
    if (title.length <= maxLength) return title
    return title.substring(0, maxLength) + '...'
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const renderPrototype = () => {
    switch (currentPrototype) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Protótipo 1: Cards Minimalistas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.map((ticket) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                const category = getCategoryConfig(ticket.category_id)
                
                return (
                  <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                          {status.label}
                        </span>
                      </div>
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                        {priority.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {truncateTitle(ticket.title)}
                    </h3>
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>Criado por: {ticket.created_by_user?.name || 'N/A'}</span>
                        <span>Atribuído: {ticket.assigned_to_user?.name || 'Não atribuído'}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(ticket.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>{getTimeAgo(ticket.created_at)}</span>
                      <Link href={`/dashboard/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            {/* Protótipo 2: Lista Compacta */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              {filteredTickets.map((ticket, index) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                
                return (
                  <div key={ticket.id} className={cn(
                    "flex items-center justify-between p-4",
                    index !== filteredTickets.length - 1 && "border-b border-gray-200 dark:border-gray-700"
                  )}>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-gray-500 w-16">{ticket.ticket_number}</span>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{truncateTitle(ticket.title)}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                            {status.label}
                          </span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                            {priority.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>Criado por: {ticket.created_by_user?.name || 'N/A'}</span>
                          <span>Atribuído: {ticket.assigned_to_user?.name || 'Não atribuído'}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(ticket.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{getTimeAgo(ticket.created_at)}</span>
                      <Link href={`/dashboard/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            {/* Protótipo 3: Grid Colorido */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTickets.map((ticket) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                
                return (
                  <div key={ticket.id} className={cn(
                    "rounded-xl p-4 text-white relative overflow-hidden",
                    ticket.status === 'open' && "bg-gradient-to-br from-blue-500 to-blue-600",
                    ticket.status === 'in_progress' && "bg-gradient-to-br from-orange-500 to-orange-600",
                    ticket.status === 'resolved' && "bg-gradient-to-br from-green-500 to-green-600",
                    ticket.status === 'cancelled' && "bg-gradient-to-br from-red-500 to-red-600",
                    !['open', 'in_progress', 'resolved', 'cancelled'].includes(ticket.status) && "bg-gradient-to-br from-purple-500 to-purple-600"
                  )}>
                    <div className="absolute top-2 right-2">
                      <span className="text-xs font-medium opacity-80">{ticket.ticket_number}</span>
                    </div>
                    <div className="relative z-10">
                      <h3 className="font-semibold mb-2 line-clamp-2">{truncateTitle(ticket.title)}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/20">
                          {status.label}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/20">
                          {priority.label}
                        </span>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-4 text-xs opacity-80">
                          <span>Criado por: {ticket.created_by_user?.name || 'N/A'}</span>
                          <span>Atribuído: {ticket.assigned_to_user?.name || 'Não atribuído'}</span>
                        </div>
                        <div className="text-xs opacity-80">
                          {formatDate(ticket.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs opacity-80">{getTimeAgo(ticket.created_at)}</span>
                        <Link href={`/dashboard/tickets/${ticket.id}`} className="text-white hover:text-gray-200">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            {/* Protótipo 4: Timeline Vertical */}
            <div className="space-y-4">
              {filteredTickets.map((ticket, index) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                
                return (
                  <div key={ticket.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        ticket.status === 'open' && "bg-blue-500",
                        ticket.status === 'in_progress' && "bg-orange-500",
                        ticket.status === 'resolved' && "bg-green-500",
                        ticket.status === 'cancelled' && "bg-red-500",
                        !['open', 'in_progress', 'resolved', 'cancelled'].includes(ticket.status) && "bg-purple-500"
                      )} />
                      {index !== filteredTickets.length - 1 && (
                        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                            {status.label}
                          </span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                            {priority.label}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{getTimeAgo(ticket.created_at)}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{truncateTitle(ticket.title)}</h3>
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Criado por: {ticket.created_by_user?.name || 'N/A'}</span>
                          <span>Atribuído: {ticket.assigned_to_user?.name || 'Não atribuído'}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(ticket.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {ticket.assigned_to_user?.name || '-'}
                        </span>
                        <Link href={`/dashboard/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            {/* Protótipo 5: Cards com Ícones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTickets.map((ticket) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                const category = getCategoryConfig(ticket.category_id)
                
                return (
                  <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        ticket.status === 'open' && "bg-blue-100 dark:bg-blue-900",
                        ticket.status === 'in_progress' && "bg-orange-100 dark:bg-orange-900",
                        ticket.status === 'resolved' && "bg-green-100 dark:bg-green-900",
                        ticket.status === 'cancelled' && "bg-red-100 dark:bg-red-900",
                        !['open', 'in_progress', 'resolved', 'cancelled'].includes(ticket.status) && "bg-purple-100 dark:bg-purple-900"
                      )}>
                        <status.icon className={cn(
                          "w-5 h-5",
                          ticket.status === 'open' && "text-blue-600 dark:text-blue-400",
                          ticket.status === 'in_progress' && "text-orange-600 dark:text-orange-400",
                          ticket.status === 'resolved' && "text-green-600 dark:text-green-400",
                          ticket.status === 'cancelled' && "text-red-600 dark:text-red-400",
                          !['open', 'in_progress', 'resolved', 'cancelled'].includes(ticket.status) && "text-purple-600 dark:text-purple-400"
                        )} />
                      </div>
                      <div>
                        <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{truncateTitle(ticket.title)}</h3>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                          {status.label}
                        </span>
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                          {priority.label}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Criado por: {ticket.created_by_user?.name || 'N/A'}</span>
                          <span>Atribuído: {ticket.assigned_to_user?.name || 'Não atribuído'}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(ticket.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{getTimeAgo(ticket.created_at)}</span>
                        <Link href={`/dashboard/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      // Protótipos 6-25
      default:
        if (currentPrototype >= 6 && currentPrototype <= 11) {
          const PrototypeComponent = getPrototypeRender(currentPrototype)
          return PrototypeComponent(filteredTickets, getStatusConfig, getPriorityConfig, getCategoryConfig, getTimeAgo, formatDate, truncateTitle)
        }
        
        if (currentPrototype >= 12 && currentPrototype <= 21) {
          const PrototypeComponent = getPrototypeRender12_21(currentPrototype)
          return PrototypeComponent(filteredTickets, getStatusConfig, getPriorityConfig, getCategoryConfig, getTimeAgo, formatDate, truncateTitle)
        }
        
        if (currentPrototype >= 22 && currentPrototype <= 25) {
          const PrototypeComponent = getPrototypeRender(currentPrototype)
          return PrototypeComponent(filteredTickets, getStatusConfig, getPriorityConfig, getCategoryConfig, getTimeAgo, formatDate, truncateTitle)
        }
        
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Protótipo {currentPrototype}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Layout em desenvolvimento...
            </p>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Carregando protótipos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PrototypeSelector 
        currentPrototype={currentPrototype} 
        onPrototypeChange={setCurrentPrototype} 
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎨 Protótipos de Layout - Tickets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore 30 designs diferentes para a página de tickets
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                {statusesWithCount
                  .filter(status => status.count > 0)
                  .map((status) => (
                    <option key={status.id} value={status.slug}>
                      {status.name}
                    </option>
                  ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas as Prioridades</option>
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

        {/* Conteúdo do Protótipo */}
        {renderPrototype()}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {filteredTickets.length} tickets • Protótipo {currentPrototype} de 30
          </p>
        </div>
      </div>
    </div>
  )
}
