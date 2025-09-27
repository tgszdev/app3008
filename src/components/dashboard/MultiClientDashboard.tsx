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
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow duration-200"
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
            className="p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0"
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

const ClientCard = ({ client, isExpanded, onToggle }: { 
  client: ClientData
  isExpanded: boolean
  onToggle: () => void
}) => {
  const getStatusIcon = (slug: string) => {
    if (slug.includes('aberto') || slug.includes('open')) return AlertCircle
    if (slug.includes('progresso') || slug.includes('progress') || slug.includes('aguardando') || slug.includes('deploy')) return Clock
    if (slug.includes('resolvido') || slug.includes('resolved') || slug.includes('fechado') || slug.includes('closed')) return CheckCircle
    if (slug.includes('cancelled') || slug.includes('cancelado')) return XCircle
    return TicketIcon
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header do Cliente */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {client.context.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {client.context.type === 'organization' ? 'Cliente' : 'Departamento'} • {client.summary.total_tickets} tickets
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDateShort(client.summary.period.start_date)} - {formatDateShort(client.summary.period.end_date)}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Cards de Status (sempre visíveis) */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            title="Total no Período"
            value={client.summary.total_tickets}
            icon={TicketIcon}
            color="bg-blue-600"
            statusColor="#2563eb"
          />
          {client.status_stats
            .filter(status => status.count > 0)
            .map((status) => {
              const Icon = getStatusIcon(status.slug)
              return (
                <StatCard
                  key={status.slug}
                  title={status.name}
                  value={status.count}
                  icon={Icon}
                  statusColor={status.color}
                />
              )
            })}
        </div>
      </div>

      {/* Conteúdo Expandível */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-6">
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

          {/* Tickets Recentes */}
          {client.tickets.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Tickets Recentes
              </h4>
              <div className="space-y-2">
                {client.tickets.slice(0, 5).map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        #{ticket.ticket_number} - {ticket.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateShort(ticket.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        ticket.status === 'aberto' ? 'bg-blue-100 text-blue-800' :
                        ticket.status === 'em-progresso' ? 'bg-yellow-100 text-yellow-800' :
                        ticket.status === 'resolvido' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =====================================================
// COMPONENTE PRINCIPAL - MULTI CLIENT DASHBOARD
// =====================================================

export default function MultiClientDashboard() {
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
  
  // Filtros de período
  const getCurrentMonthDates = () => {
    // Usar período mais amplo para pegar dados existentes
    const firstDay = new Date(2024, 0, 1) // Janeiro 2024
    const lastDay = new Date(2025, 11, 31) // Dezembro 2025
    
    return {
      start_date: firstDay.toISOString().split('T')[0],
      end_date: lastDay.toISOString().split('T')[0]
    }
  }
  
  const [periodFilter, setPeriodFilter] = useState(getCurrentMonthDates())

  // Carregar seleções do localStorage na inicialização
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedClients')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            setSelectedClients(parsed)
            console.log('🔄 Carregando seleções do localStorage:', parsed)
          }
        } catch (error) {
          console.error('Erro ao carregar seleções do localStorage:', error)
        }
      }
    }
  }, [])

  // Salvar seleções no localStorage sempre que mudarem
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedClients', JSON.stringify(selectedClients))
      console.log('🔄 Salvando seleções no localStorage:', selectedClients)
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
      // Se não tem clientes selecionados, carregar todos os contextos disponíveis
      if (selectedClients.length > 0) {
        fetchMultiClientData()
      } else if (availableContexts.length > 0) {
        // Se não tem seleção, carregar todos os contextos disponíveis
        console.log('🔄 Carregando todos os contextos disponíveis:', availableContexts.map(c => c.id))
        setSelectedClients(availableContexts.map(c => c.id))
      } else {
        // Se não tem contextos, parar loading e mostrar estado vazio
        console.log('⚠️ Nenhum contexto disponível - parando loading')
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
      
      const response = await axios.get(`/api/dashboard/multi-client-analytics?${params}`)
      
      if (response.data) {
        setAnalyticsData(response.data)
        console.log('✅ Dados multi-client carregados:', response.data)
      }
    } catch (error: any) {
      console.error('Erro ao buscar dados multi-client:', error)
      
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard Multi-Cliente
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Análise consolidada por cliente/organização
            </p>
          </div>
          
          {/* Layout em Popup - Seletor Múltiplo de Clientes (apenas para matriz) */}
          {isMatrixUser && (
            <div className="relative">
              {/* Botão principal */}
              <button
                onClick={() => setShowClientPopup(!showClientPopup)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
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
              </button>
              
              {/* Popup de seleção de clientes */}
              {showClientPopup && (
                <div 
                  ref={popupRef}
                  className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 z-50"
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
                    {availableContexts.map((context) => (
                      <label
                        key={context.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors rounded-lg"
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
        </div>
      </div>

      {/* Informações do Período */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
          <span className="font-medium block sm:inline">Período analisado:</span>
          <span className="block sm:inline sm:ml-1">
            {formatDateShort(periodFilter.start_date)} até {formatDateShort(periodFilter.end_date)}
          </span>
          <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
            • <strong>{analyticsData?.consolidated.total_tickets || 0}</strong> tickets no período
          </span>
          <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
            • <strong>{selectedClients.length}</strong> clientes selecionados
          </span>
        </p>
      </div>

      {/* Resumo Consolidado */}
      {analyticsData && analyticsData.consolidated.status_stats.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Resumo Consolidado
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
            <StatCard
              title="Total no Período"
              value={analyticsData.consolidated.total_tickets}
              icon={TicketIcon}
              color="bg-blue-600"
              statusColor="#2563eb"
            />
            {analyticsData.consolidated.status_stats
              .filter(status => status.count > 0)
              .map((status) => {
                const getStatusIcon = (slug: string) => {
                  if (slug.includes('aberto') || slug.includes('open')) return AlertCircle
                  if (slug.includes('progresso') || slug.includes('progress') || slug.includes('aguardando') || slug.includes('deploy')) return Clock
                  if (slug.includes('resolvido') || slug.includes('resolved') || slug.includes('fechado') || slug.includes('closed')) return CheckCircle
                  if (slug.includes('cancelled') || slug.includes('cancelado')) return XCircle
                  return TicketIcon
                }
                
                const Icon = getStatusIcon(status.slug)
                
                return (
                  <StatCard
                    key={status.slug}
                    title={status.name}
                    value={status.count}
                    icon={Icon}
                    statusColor={status.color}
                  />
                )
              })}
          </div>
        </div>
      )}

      {/* Cards por Cliente */}
      {analyticsData && analyticsData.clients.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Building className="h-5 w-5" />
            Dados por Cliente
          </h2>
          <div className="space-y-4">
            {analyticsData.clients.map((client) => (
              <ClientCard
                key={client.context.id}
                client={client}
                isExpanded={expandedClients.has(client.context.id)}
                onToggle={() => toggleClientExpansion(client.context.id)}
              />
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
