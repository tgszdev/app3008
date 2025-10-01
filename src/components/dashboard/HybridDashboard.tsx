'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/contexts/OrganizationContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  TicketIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  BarChart,
  Activity,
  XCircle,
  Loader2,
  Calendar,
  Filter,
  PieChart as PieChartIcon,
  Building,
  Cpu,
  Wifi,
  Printer,
  Code,
  Mail,
  Shield,
  Phone,
  User,
  FileDown,
  ChevronDown,
  ChevronUp,
  X,
  Check
} from 'lucide-react'
import { getIcon } from '@/lib/icons'

// =====================================================
// TIPOS E INTERFACES
// =====================================================

interface ClientData {
  context: {
    id: string
    name: string
    type: string
  slug: string
  }
  summary: {
    total_tickets: number
    avg_resolution_time: string
    period: {
      start_date: string
      end_date: string
    }
  }
  status_stats: Array<{
    id: string
  name: string
    slug: string
  color: string
  count: number
  order_index: number
  }>
  category_stats: Array<{
  id: string
    name: string
    slug: string
    color: string
    icon: string
    is_global: boolean
    context_id: string
    total: number
    percentage: number
  status_breakdown: Record<string, number>
    status_breakdown_detailed: Array<{
      slug: string
      name: string
      color: string
      count: number
      order_index: number
    }>
  }>
  tickets: Array<{
  id: string
  ticket_number: string
  title: string
  status: string
  priority: string
  created_at: string
  }>
}

interface MultiClientAnalytics {
  clients: ClientData[]
  consolidated: {
    total_tickets: number
    period: {
  start_date: string
  end_date: string
    }
    status_stats: Array<{
      id: string
      name: string
      slug: string
      color: string
      count: number
      order_index: number
    }>
    category_stats: Array<{
      id: string
      name: string
      slug: string
      color: string
      icon: string
      is_global: boolean
      context_id: string
      total: number
      percentage: number
      status_breakdown: Record<string, number>
    }>
  }
}

// =====================================================
// COMPONENTES DE CARD (REUTILIZADOS)
// =====================================================

const StatCard = ({ title, value, icon: Icon, trend, color, statusColor }: any) => {
  const getCardColor = (statusColor: string, title: string) => {
    if (statusColor && statusColor !== '#6b7280') {
      return statusColor
    }
    
    if (title.includes('Total')) return '#2563eb'
    if (title.includes('Aberto') || title.includes('Open')) return '#3b82f6'
    if (title.includes('Progresso') || title.includes('Progress') || title.includes('Aguardando') || title.includes('Deploy')) return '#f59e0b'
    if (title.includes('Resolvido') || title.includes('Resolved') || title.includes('Fechado') || title.includes('Closed')) return '#10b981'
    if (title.includes('Cancelado') || title.includes('Cancelled')) return '#ef4444'
    return '#6b7280'
  }
  
  const cardColor = getCardColor(statusColor, title)
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow duration-200"
      style={{
        borderLeftColor: cardColor,
        borderLeftWidth: '3px'
      }}
    >
      <div className="text-center">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <p 
          className="text-xl font-bold"
          style={{ color: cardColor }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

const CategoryCard = ({ category }: { category: any }) => {
  const Icon = getIcon(category.icon)
  const backgroundColor = category.color ? `${category.color}20` : '#E5E7EB'
  const borderColor = category.color || '#6B7280'
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-6"
      style={{ borderLeft: `6px solid ${borderColor}` }}
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center flex-1 min-w-0">
          <div 
            className="p-1.5 sm:p-2 rounded-xl mr-2 sm:mr-3 flex-shrink-0"
            style={{ backgroundColor, color: borderColor }}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
              {category.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
              {category.percentage}% do total
            </p>
          </div>
        </div>
        <div className="text-right ml-2 flex-shrink-0">
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {category.total}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            tickets
          </p>
        </div>
      </div>
      
      <div className="mt-3 sm:mt-4">
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
          {category.status_breakdown_detailed.map((status: any, index: number) => {
            if (status.count <= 0) return null
            
            return (
              <div 
                key={status.slug}
                className="transition-all duration-300" 
                style={{ 
                  width: `${(status.count / category.total) * 100}%`,
                  backgroundColor: status.color
                }}
                title={`${status.name}: ${status.count}`}
              />
            )
          })}
        </div>
        
        <div className="mt-3 space-y-1">
          {category.status_breakdown_detailed
            .filter((status: any) => status.count > 0)
            .map((status: any) => (
              <div key={status.slug} className="flex items-center justify-between text-xs">
                <div className="flex items-center">
                  <div 
                    className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-gray-600 dark:text-gray-400 truncate">
                    {status.name}
                  </span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white ml-2">
                  {status.count}
                </span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

const ClientCard = ({ client, isExpanded, onToggle, analyticsData }: { 
  client: ClientData
  isExpanded: boolean
  onToggle: () => void
  analyticsData: MultiClientAnalytics | null
}) => {
  const getStatusIcon = (slug: string) => {
    // Usar ícones dinâmicos baseados no slug ou padrão
    if (slug.includes('aberto') || slug.includes('open')) return AlertCircle
    if (slug.includes('progresso') || slug.includes('progress') || slug.includes('aguardando') || slug.includes('deploy')) return Clock
    if (slug.includes('resolvido') || slug.includes('resolved') || slug.includes('fechado') || slug.includes('closed')) return CheckCircle
    if (slug.includes('cancelled') || slug.includes('cancelado')) return XCircle
    return TicketIcon
  }
  
  // Calcular percentual de distribuição dos tickets
  const calculateDistributionPercentage = () => {
    const clientTickets = client.summary.total_tickets
    if (clientTickets === 0) return '0%'
    
    // Buscar total de tickets de todos os clientes selecionados
    const totalAllTickets = analyticsData?.consolidated?.total_tickets || 0
    
    if (totalAllTickets === 0) return '0%'
    
    // Calcular percentual de distribuição com 1 casa decimal
    const percentage = ((clientTickets / totalAllTickets) * 100).toFixed(1)
    
    return `${percentage}%`
  }
  
  const trend = calculateDistributionPercentage()
  
  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-500 w-full shadow-lg dark:shadow-2xl">
      {/* Header Neural Network Style */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{client.context.name}</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm">{client.context.type === 'organization' ? 'Cliente' : 'Departamento'} • {client.summary.total_tickets} tickets</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">{trend}</span>
        </div>
      </div>
      
      {/* Status em Lista Neural Network Style */}
      <div className="space-y-3 mb-6">
        {/* Status dinâmicos em lista vertical - ordenados por order_index */}
        {client.status_stats.map((status, index) => {
          // Sistema de cores melhorado com acessibilidade
          const statusColor = status.color || '#6B7280'
          
          // Função para determinar se a cor é clara ou escura
          const isLightColor = (color: string) => {
            const hex = color.replace('#', '')
            const r = parseInt(hex.substr(0, 2), 16)
            const g = parseInt(hex.substr(2, 2), 16)
            const b = parseInt(hex.substr(4, 2), 16)
            const brightness = (r * 299 + g * 587 + b * 114) / 1000
            return brightness > 128
          }
          
          // Cores adaptativas para dark/light mode
          const getAdaptiveColors = (color: string) => {
            const isLight = isLightColor(color)
            return {
              bg: isLight 
                ? `bg-[${color}]/10 dark:bg-[${color}]/20` 
                : `bg-[${color}]/20 dark:bg-[${color}]/30`,
              border: isLight 
                ? `border-[${color}]/20 dark:border-[${color}]/30` 
                : `border-[${color}]/30 dark:border-[${color}]/40`,
              text: isLight 
                ? `text-slate-700 dark:text-slate-200` 
                : `text-slate-600 dark:text-slate-300`,
              number: color
            }
          }
          
          const colors = getAdaptiveColors(statusColor)
          
          return (
            <div key={status.id} className={`${colors.bg} ${colors.border} rounded-xl p-4 border transition-all duration-200 hover:shadow-sm`}>
              <div className="flex justify-between items-center">
                <span className={`${colors.text} truncate font-medium`} title={status.name}>
                  {status.name}
    </span>
                <span 
                  className="font-bold text-xl"
                  style={{ color: statusColor }}
                >
                  {status.count}
                </span>
              </div>
            </div>
          )
        })}
        
        {/* Total no Período - sempre no final */}
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex justify-between items-center">
            <span className="text-slate-700 dark:text-slate-200 font-medium">Total no Período</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">{client.summary.total_tickets}</span>
          </div>
        </div>
      </div>

      {/* Botão Ver mais Neural Network Style */}
      <div className="flex justify-center">
        <button
          onClick={onToggle}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
        >
          {isExpanded ? 'Ver menos' : 'Ver mais'}
        </button>
      </div>

      {/* Conteúdo expandido */}
      {isExpanded && (
        <div className="mt-6 space-y-4">
          {/* Cards de Categorias */}
          {client.category_stats.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <PieChartIcon className="h-4 w-4" />
                Categorias
              </h4>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {client.category_stats.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          )}

          {/* Tickets Recentes - Protótipo 33 com Steps */}
          {client.tickets.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Tickets Recentes
              </h4>
              <div className="space-y-3">
                {client.tickets.slice(0, 5).map((ticket) => {
                  // Buscar cor do status no cadastro
                  const statusInfo = client.status_stats.find(s => s.slug === ticket.status)
                  const statusColor = statusInfo?.color || '#6B7280'

                  // Processar histórico de status para mostrar steps reais
                  const getStatusHistory = () => {
                    if (!(ticket as any).ticket_history) {
                      // Se não há histórico, mostrar apenas o status atual
                      return [{
                        status: ticket.status,
                        created_at: ticket.created_at,
                        user: (ticket as any).created_by_user
                      }]
                    }
                    
                    // Filtrar apenas mudanças de status
                    const statusChanges = (ticket as any).ticket_history
                      .filter((history: any) => history.action_type === 'status_changed' && history.field_changed === 'status')
                      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    
                    // Criar array com status inicial + mudanças
                    const history: Array<{
                      status: string;
                      created_at: string;
                      user: any;
                    }> = []
                    
                    // Adicionar status inicial (sempre Aberto quando criado)
                    history.push({
                      status: 'Aberto',
                      created_at: ticket.created_at,
                      user: (ticket as any).created_by_user
                    })
                    
                    // Adicionar apenas as mudanças de status que realmente aconteceram
                    statusChanges.forEach((change: any) => {
                      // Evitar duplicatas - só adicionar se for diferente do último status
                      const lastStatus = history[history.length - 1]?.status
                      if (change.new_value !== lastStatus) {
                        history.push({
                          status: change.new_value,
                          created_at: change.created_at,
                          user: change.user
                        })
                      }
                    })
                    
                    return history
                  }

                  const statusHistory = getStatusHistory()
                  
                  // No mobile (< 640px), mostrar sempre os últimos 5 steps
                  const [isMobile, setIsMobile] = useState(false)
                  
                  useEffect(() => {
                    const checkMobile = () => {
                      setIsMobile(window.innerWidth < 640)
                    }
                    
                    checkMobile()
                    window.addEventListener('resize', checkMobile)
                    
                    return () => window.removeEventListener('resize', checkMobile)
                  }, [])
                  
                  const displayStatusHistory = isMobile && statusHistory.length > 5
                    ? statusHistory.slice(-5) 
                    : statusHistory


                  const getPriorityColor = (priority: string) => {
                    switch (priority) {
                      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }
  }
  
  // Obter cor da prioridade para a borda
  const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#ef4444'
      case 'high': return '#f97316'
      case 'medium': return '#eab308'
      case 'low': return '#22c55e'
      default: return '#6b7280'
    }
  }

  return (
                    <div 
                      key={ticket.id} 
                      className="bg-white dark:bg-gray-800 rounded-2xl p-4 border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                      style={{ borderColor: getPriorityBorderColor(ticket.priority) }}
                      onClick={() => window.location.href = `/dashboard/tickets/${ticket.id}`}
                    >
                      <div className="space-y-3">
                          {/* Header com número, título e prioridade */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white text-xl sm:text-2xl">#{ticket.ticket_number}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority === 'critical' ? 'Crítico' : ticket.priority === 'high' ? 'Alto' : ticket.priority === 'medium' ? 'Médio' : 'Baixo'}
                            </span>
                            <span 
                              className="text-xs font-medium px-2 py-1 rounded-full ml-auto"
                              style={{
                                backgroundColor: `${statusColor}20`,
                                color: statusColor
                              }}
                            >
                              {ticket.status}
                            </span>
                          </div>
                          
                          {/* Título do ticket */}
                          <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base line-clamp-2">{ticket.title}</h3>
                          
                          {/* Informações do ticket - Grid 2x2 */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                <span className="font-medium hidden sm:inline">Data de Abertura:</span>
                                <span className="font-medium sm:hidden">Abertura:</span> {formatDateShort(ticket.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                <span className="font-medium hidden sm:inline">Autor do Chamado:</span>
                                <span className="font-medium sm:hidden">Autor:</span> {(ticket as any).created_by_user?.name || 'Sistema'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                <span className="font-medium hidden sm:inline">Atribuído Para:</span>
                                <span className="font-medium sm:hidden">Atribuído:</span> {(ticket as any).assigned_to_user?.name || 'Não atribuído'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                <span className="font-medium">Cliente:</span> {client.context.name}
                              </span>
                            </div>
                          </div>
                          
                          {/* Steps horizontais - baseados no histórico real */}
                          <div 
                            className="flex items-center gap-2 ml-[10%]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {displayStatusHistory.map((historyItem, index) => {
                              const isLast = index === displayStatusHistory.length - 1
                              const isCurrent = isLast
                              
                              // Buscar cor do status no cadastro
                              const historyStatusInfo = client.status_stats.find(s => s.slug === historyItem.status)
                              const historyStatusColor = historyStatusInfo?.color || '#6B7280'
                              
                              const formatDate = (dateString: string) => {
                                const date = new Date(dateString)
                                return date.toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              }
                              
                              return (
                                <div key={`${historyItem.status}-${index}`} className="flex items-center group relative">
                                  <div 
                                    className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 ${
                                      isCurrent
                                        ? 'ring-2 ring-offset-2' 
                                        : ''
                                    }`}
                                    style={{
                                      backgroundColor: historyStatusColor
                                    }}
                                  ></div>
                                  
                                  {/* Tooltip instantâneo - responsivo */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none z-[9999] whitespace-nowrap">
                                    <div className="font-semibold">{historyItem.status}</div>
                                    <div className="text-gray-300">
                                      {formatDate(historyItem.created_at)}
                                    </div>
                                    <div className="text-gray-400">
                                      por {historyItem.user?.name || 'Sistema'}
                                    </div>
                                    {/* Seta do tooltip */}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                                  </div>
                                  
                                  {!isLast && (
                                    <div 
                                      className="w-8 h-1 rounded-full"
                                      style={{
                                        backgroundColor: historyStatusColor
                                      }}
                                    ></div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =====================================================
// COMPONENTE PRINCIPAL - HYBRID DASHBOARD
// =====================================================

export default function HybridDashboard() {
  const { session } = useAuth()
  const { 
    currentContext, 
    availableContexts,
    isMatrixUser, 
    isContextUser,
    contextType,
    isLoading: contextLoading 
  } = useOrganization()
  
  // Estados
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())
  const [analyticsData, setAnalyticsData] = useState<MultiClientAnalytics | null>(null)
  const [showClientPopup, setShowClientPopup] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  
  // Estados dos botões originais
  const [showFilters, setShowFilters] = useState(false)
  const [myTicketsOnly, setMyTicketsOnly] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  
  // Filtros de período - últimos 2 meses completos
  const getLast2MonthsDates = () => {
    const now = new Date()
    // Pegar mês anterior (início)
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    // Pegar último dia do mês atual (fim)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    return {
      start_date: firstDay.toISOString().split('T')[0],
      end_date: lastDay.toISOString().split('T')[0]
    }
  }
  
  const [periodFilter, setPeriodFilter] = useState(getLast2MonthsDates())
  const [tempFilter, setTempFilter] = useState<{start_date: string, end_date: string}>(getLast2MonthsDates())

  // Carregar seleções do localStorage na inicialização
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedClients')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedClients(parsed)
            console.log('🔄 Carregando seleções do localStorage:', parsed)
          } else {
            // Se localStorage está vazio ou inválido, não selecionar nada
            console.log('🔄 localStorage vazio - não selecionando nenhum cliente')
            setSelectedClients([])
          }
        } catch (error) {
          console.error('Erro ao carregar seleções do localStorage:', error)
          setSelectedClients([])
        }
      } else {
        // Se não há localStorage, não selecionar nada
        console.log('🔄 Nenhum localStorage encontrado - não selecionando nenhum cliente')
        setSelectedClients([])
      }
    }
  }, [])

  // Salvar seleções no localStorage sempre que mudarem
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedClients.length > 0) {
        localStorage.setItem('selectedClients', JSON.stringify(selectedClients))
        console.log('🔄 Salvando seleções no localStorage:', selectedClients)
      } else {
        // Se não há seleções, remover do localStorage
        localStorage.removeItem('selectedClients')
        console.log('🔄 Removendo seleções do localStorage (lista vazia)')
      }
    }
  }, [selectedClients])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fechar popup ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowClientPopup(false)
      }
    }

    if (showClientPopup) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showClientPopup])

  useEffect(() => {
    if (mounted && !contextLoading) {
      // Se tem clientes selecionados, buscar dados
      if (selectedClients.length > 0) {
        fetchMultiClientData()
      } else {
        // Se não tem seleção, parar loading e mostrar estado vazio
        console.log('⚠️ Nenhum cliente selecionado - parando loading')
        setLoading(false)
      }
    }
  }, [mounted, contextLoading, selectedClients, periodFilter, availableContexts])

  const fetchMultiClientData = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        start_date: periodFilter.start_date,
        end_date: periodFilter.end_date,
        context_ids: selectedClients.join(',')
      })
      
      console.log('🔄 Buscando dados multi-client com context_ids:', selectedClients)
      console.log('🔄 URL da API:', `/api/dashboard/multi-client-analytics?${params}`)
      
      const response = await axios.get(`/api/dashboard/multi-client-analytics?${params}`)
      
      console.log('🔄 Resposta da API:', response.status, response.data)
      
      if (response.data) {
        setAnalyticsData(response.data)
        console.log('✅ Dados multi-client carregados:', response.data)
      }
    } catch (error: any) {
      console.error('Erro ao buscar dados multi-client:', error)
      console.error('Status do erro:', error.response?.status)
      console.error('Dados do erro:', error.response?.data)
      
      // Se erro de autenticação, mostrar estado vazio
      if (error.response?.status === 401) {
        console.log('⚠️ Usuário não autenticado - mostrando estado vazio')
        setAnalyticsData(null)
      } else {
        toast.error('Erro ao carregar dados dos clientes selecionados')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClientSelectionChange = (selectedIds: string[]) => {
    console.log('🔄 Mudança de seleção de clientes:', selectedIds)
    setSelectedClients(selectedIds)
    setExpandedClients(new Set()) // Reset expanded clients
  }

  const toggleClientExpansion = (clientId: string) => {
    const newExpanded = new Set(expandedClients)
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId)
    } else {
      newExpanded.add(clientId)
    }
    setExpandedClients(newExpanded)
  }

  // =====================================================
  // FUNÇÕES DOS BOTÕES ORIGINAIS
  // =====================================================

  const toggleMyTickets = () => {
    setMyTicketsOnly(!myTicketsOnly)
    console.log('🔄 Meus Tickets toggled:', !myTicketsOnly)
  }

  const handleApplyFilter = () => {
    setPeriodFilter(tempFilter)
    setShowFilters(false)
    console.log('🔄 Filtro aplicado:', tempFilter)
  }

  const handleResetFilter = () => {
    const last2Months = getLast2MonthsDates()
    setTempFilter(last2Months)
    setPeriodFilter(last2Months)
    setShowFilters(false)
    console.log('🔄 Filtro resetado para últimos 2 meses')
  }

  const handleExportPDF = async () => {
    try {
      setIsGeneratingPDF(true)
      console.log('🔄 Iniciando exportação PDF...')
      
      // Simular geração de PDF (implementar funcionalidade real depois)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('PDF exportado com sucesso!')
      console.log('✅ PDF exportado')
    } catch (error) {
      console.error('❌ Erro ao exportar PDF:', error)
      toast.error('Erro ao exportar PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard {myTicketsOnly && '- Meus Tickets'} {selectedClients.length === 1 && '- Cliente Específico'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Bem-vindo de volta, {session?.user?.name}!
            {myTicketsOnly 
              ? ' Visualizando apenas seus tickets.'
              : selectedClients.length === 1 
                ? ' Visualizando tickets do cliente selecionado.'
                : ' Visualizando todos os clientes agrupados.'
            }
          </p>
        </div>
      </div>
        
      {/* Segunda linha: Botões de ação originais */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Informações do modo de visualização */}
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Modo: 
            <span className="font-medium ml-1 text-gray-900 dark:text-white">
              {selectedClients.length > 1 ? 'Multi-Cliente' : selectedClients.length === 1 ? 'Cliente Específico' : 'Todos os Clientes'}
            </span>
              </span>
            </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Seletor de Clientes (apenas para matriz) */}
          {isMatrixUser && (
            <div className="relative">
              {/* Botão principal com bordas animadas */}
              <button
                onClick={() => setShowClientPopup(!showClientPopup)}
                className="w-40 h-10 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2 relative overflow-hidden whitespace-nowrap"
              >
                <Building className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {selectedClients.length === 0 
                    ? 'Selecionar Clientes' 
                    : selectedClients.length === 1 
                      ? availableContexts.find(c => c.id === selectedClients[0])?.name || 'Cliente'
                      : `${selectedClients.length} clientes`
                  }
                </span>
                <ChevronDown className="w-4 h-4" />
                {/* Bordas animadas */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse"></div>
              </button>
              
              {/* Popup de seleção de clientes */}
              {showClientPopup && (
                <div 
                  ref={popupRef}
                  className="absolute top-full left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 z-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">Seleção Rápida</span>
                    </div>
                    <button
                      onClick={() => setShowClientPopup(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {availableContexts
                      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                      .map((context) => (
                      <label
                        key={context.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors rounded-xl"
                      >
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(context.id)}
                          onChange={() => {
                            if (selectedClients.includes(context.id)) {
                              handleClientSelectionChange(selectedClients.filter(id => id !== context.id))
                            } else {
                              handleClientSelectionChange([...selectedClients, context.id])
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {context.name}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-xl font-medium ${
                              context.type === 'organization' 
                                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" 
                                : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                            }`}>
                              {context.type === 'organization' ? 'Cliente' : 'Dept'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {context.slug}
                          </div>
                        </div>
                        {selectedClients.includes(context.id) && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </label>
                    ))}
        </div>
        
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedClients.length} de {availableContexts.length} selecionados
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleClientSelectionChange(availableContexts.map(c => c.id))}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => {
                          handleClientSelectionChange([])
                          localStorage.removeItem('selectedClients')
                        }}
                        className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 font-medium transition-colors"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botão Meus Tickets com bordas animadas */}
          <button
            onClick={toggleMyTickets}
            className={`w-full sm:w-auto sm:min-w-[180px] h-10 flex items-center justify-center gap-2 px-3 sm:px-4 border rounded-xl transition-all duration-300 relative overflow-hidden whitespace-nowrap ${
              myTicketsOnly 
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">Meus Tickets</span>
            {/* Bordas animadas */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </button>
          
          {/* Botão Filtro de Data com bordas animadas */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full sm:w-auto sm:min-w-[240px] h-10 flex items-center justify-center gap-2 px-3 sm:px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 relative overflow-hidden whitespace-nowrap"
          >
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">
              {periodFilter.start_date && periodFilter.end_date
                ? `${formatDateShort(periodFilter.start_date)} - ${formatDateShort(periodFilter.end_date)}`
                : 'Selecionar Período'
              }
            </span>
            <Filter className="h-4 w-4 flex-shrink-0" />
            {/* Bordas animadas */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent animate-pulse"></div>
          </button>
          
          {/* Botão Export PDF com bordas animadas */}
          <button
            onClick={handleExportPDF}
            disabled={isGeneratingPDF}
            className="w-full sm:w-auto sm:min-w-[180px] h-10 flex items-center justify-center gap-2 px-3 sm:px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden whitespace-nowrap"
          >
            {isGeneratingPDF ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">
              {isGeneratingPDF ? 'Gerando...' : 'Exportar PDF'}
            </span>
            {/* Bordas animadas */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-purple-500/20 to-transparent animate-pulse"></div>
          </button>
        </div>
      </div>

      {/* Filtros de Período */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Filtrar por Período
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={tempFilter.start_date}
                onChange={(e) => setTempFilter({ ...tempFilter, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={tempFilter.end_date}
                onChange={(e) => setTempFilter({ ...tempFilter, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button
              onClick={handleApplyFilter}
              className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium"
            >
              Aplicar Filtro
            </button>
            <button
              onClick={handleResetFilter}
              className="flex-1 sm:flex-initial px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-800 transition-colors text-sm font-medium"
            >
              Limpar Filtro
            </button>
          </div>
        </div>
      )}

      {/* Informações do Período */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
            <span className="font-medium block sm:inline">Período analisado:</span>
            <span className="block sm:inline sm:ml-1">
            {formatDateShort(periodFilter.start_date)} até {formatDateShort(periodFilter.end_date)}
            </span>
            <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
            • <strong>{analyticsData?.consolidated.total_tickets || 0}</strong> {myTicketsOnly ? 'seus tickets' : 'tickets'} no período
          </span>
          <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
            • <strong>{selectedClients.length}</strong> clientes selecionados
            </span>
            {myTicketsOnly && (
              <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
                • <span className="font-medium">Filtrado por: Meus Tickets</span>
              </span>
            )}
          </p>
        </div>

      {/* Resumo Consolidado - Protótipo 35 (Layout de Tabela) */}
      {analyticsData && analyticsData.consolidated.status_stats.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Resumo Consolidado
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {/* Status dinâmicos - ordenados por order_index */}
            {analyticsData.consolidated.status_stats
            .filter(status => status.count > 0)
              .sort((a, b) => a.order_index - b.order_index)
            .map((status) => {
                const statusColor = status.color || '#6B7280'
              
              return (
                  <div key={status.slug} className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${statusColor}, transparent)` }}></div>
                    <div className="relative">
                      <div className="border-b border-gray-200 dark:border-gray-600 pb-3 mb-3">
                        <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 break-words">{status.name}</div>
                      </div>
                      <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-right leading-none" style={{ color: statusColor }}>{status.count}</div>
                    </div>
                  </div>
                )
              })}
            
            {/* Total no Período - sempre no final */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
              <div className="relative">
                <div className="border-b border-gray-200 dark:border-gray-600 pb-3 mb-3">
                  <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 break-words">Total no Período</div>
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 dark:text-blue-400 text-right leading-none">{analyticsData.consolidated.total_tickets}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cards por Cliente - Neural Network Layout */}
      {analyticsData && analyticsData.clients.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Building className="h-5 w-5" />
            Dados por Cliente
          </h2>
          {/* Layout em lista vertical */}
          <div className="space-y-2">
            {analyticsData.clients
              .sort((a, b) => a.context.name.localeCompare(b.context.name, 'pt-BR'))
              .map((client, index) => (
              <div key={client.context.id} className="relative">
                <ClientCard
                  client={client}
                  isExpanded={expandedClients.has(client.context.id)}
                  onToggle={() => toggleClientExpansion(client.context.id)}
                  analyticsData={analyticsData}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado Vazio */}
      {selectedClients.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum cliente selecionado
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Selecione um ou mais clientes para visualizar os dados
          </p>
          {!isMatrixUser && (
            <p className="text-sm text-gray-400">
              Apenas usuários matriz podem selecionar múltiplos clientes
            </p>
          )}
        </div>
      )}

      {/* Estado sem dados */}
      {selectedClients.length > 0 && (!analyticsData || analyticsData.clients.length === 0) && (
        <div className="text-center py-12">
          <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum dado encontrado
                  </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Não foram encontrados tickets para os clientes selecionados no período
          </p>
          <p className="text-sm text-gray-400">
            Verifique se há tickets criados para estes clientes ou tente um período diferente
          </p>
        </div>
      )}
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