'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Building, 
  Users, 
  ChevronDown, 
  Loader2, 
  Filter, 
  X, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Calendar,
  Search,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import axios from 'axios'

// =====================================================
// TIPOS E INTERFACES
// =====================================================

interface Client {
  id: string
  name: string
  slug: string
  type: 'organization'
  ticketCount?: number
  stats?: {
    open: number
    inProgress: number
    resolved: number
    cancelled: number
  }
}

interface ClientWidgetSelectorProps {
  className?: string
  onClientChange: (clientId: string | null) => void
  selectedClientId: string | null
  onViewModeChange?: (mode: 'overview' | 'detailed' | 'analytics') => void
  onWidgetToggle?: (widget: string, visible: boolean) => void
}

interface WidgetConfig {
  id: string
  name: string
  icon: React.ComponentType<any>
  visible: boolean
  type: 'chart' | 'table' | 'stats' | 'list'
}

// =====================================================
// COMPONENTE PRINCIPAL - CLIENT WIDGET SELECTOR
// =====================================================

export function ClientWidgetSelector({ 
  className, 
  onClientChange, 
  selectedClientId,
  onViewModeChange,
  onWidgetToggle
}: ClientWidgetSelectorProps) {
  const { data: session } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'analytics'>('overview')
  const [showWidgetConfig, setShowWidgetConfig] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Configuração dos widgets
  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    { id: 'stats', name: 'Estatísticas Gerais', icon: BarChart3, visible: true, type: 'stats' },
    { id: 'recent', name: 'Tickets Recentes', icon: TrendingUp, visible: true, type: 'list' },
    { id: 'categories', name: 'Por Categoria', icon: PieChart, visible: true, type: 'chart' },
    { id: 'timeline', name: 'Timeline', icon: Calendar, visible: false, type: 'chart' },
    { id: 'performance', name: 'Performance', icon: TrendingUp, visible: false, type: 'stats' }
  ])

  // Carregar clientes disponíveis
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get('/api/organizations')
        
        if (response.data && Array.isArray(response.data)) {
          // Buscar estatísticas para cada cliente
          const clientsWithStats = await Promise.all(
            response.data.map(async (client: Client) => {
              try {
                const ticketsResponse = await axios.get(`/api/dashboard/client-tickets?client_id=${client.id}`)
                const clientGroups = ticketsResponse.data.clientGroups || []
                const clientGroup = clientGroups.find((g: any) => g.clientId === client.id)
                
                return {
                  ...client,
                  ticketCount: ticketsResponse.data.totalTickets || 0,
                  stats: clientGroup?.stats || {
                    open: 0,
                    inProgress: 0,
                    resolved: 0,
                    cancelled: 0
                  }
                }
              } catch {
                return { 
                  ...client, 
                  ticketCount: 0,
                  stats: { open: 0, inProgress: 0, resolved: 0, cancelled: 0 }
                }
              }
            })
          )
          setClients(clientsWithStats)
        }
      } catch (error) {
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user) {
      fetchClients()
    }
  }, [session])

  // Filtrar clientes por busca
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Função para lidar com mudança de cliente
  const handleClientChange = (clientId: string) => {
    if (clientId === 'all') {
      onClientChange(null) // null = todos os clientes
    } else {
      onClientChange(clientId)
    }
  }

  // Função para mudar modo de visualização
  const handleViewModeChange = (mode: 'overview' | 'detailed' | 'analytics') => {
    setViewMode(mode)
    if (onViewModeChange) {
      onViewModeChange(mode)
    }
  }

  // Função para toggle de widget
  const toggleWidget = (widgetId: string) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, visible: !widget.visible }
        : widget
    ))
    
    const widget = widgets.find(w => w.id === widgetId)
    if (widget && onWidgetToggle) {
      onWidgetToggle(widgetId, !widget.visible)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-gray-600">Carregando clientes...</span>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header com Controles */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Título e Busca */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Dashboard de Clientes
              </h3>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-2">
            {/* Modo de Visualização */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {[
                { id: 'overview', label: 'Visão Geral', icon: Eye },
                { id: 'detailed', label: 'Detalhado', icon: BarChart3 },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp }
              ].map((mode) => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleViewModeChange(mode.id as any)}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      viewMode === mode.id
                        ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{mode.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Configuração de Widgets */}
            <button
              onClick={() => setShowWidgetConfig(!showWidgetConfig)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">Widgets</span>
            </button>
          </div>
        </div>
      </div>

      {/* Seletor de Clientes com Cards */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          Selecionar Cliente
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Card "Todos" */}
          <button
            onClick={() => handleClientChange('all')}
            className={cn(
              "p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md",
              !selectedClientId
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "p-2 rounded-lg",
                !selectedClientId 
                  ? "bg-blue-100 text-blue-600" 
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
              )}>
                <Users className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h5 className="font-semibold text-gray-900 dark:text-white">
                  Todos os Clientes
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Visão consolidada
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {clients.reduce((sum, client) => sum + (client.ticketCount || 0), 0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                tickets totais
              </div>
            </div>
          </button>

          {/* Cards dos Clientes */}
          {filteredClients.map((client) => (
            <button
              key={client.id}
              onClick={() => handleClientChange(client.id)}
              className={cn(
                "p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md",
                selectedClientId === client.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  selectedClientId === client.id 
                    ? "bg-blue-100 text-blue-600" 
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                )}>
                  <Building className="w-5 h-5" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <h5 className="font-semibold text-gray-900 dark:text-white truncate" title={client.name}>
                    {client.name}
                  </h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Cliente
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {client.ticketCount || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    tickets
                  </div>
                </div>
                
                {client.stats && (
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-blue-600 dark:text-blue-400">
                        {client.stats.open}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">Abertos</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        {client.stats.resolved}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">Resolvidos</div>
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {filteredClients.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum cliente encontrado para "{searchTerm}"
            </p>
          </div>
        )}
      </div>

      {/* Configuração de Widgets */}
      {showWidgetConfig && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white">
              Configurar Widgets
            </h4>
            <button
              onClick={() => setShowWidgetConfig(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {widgets.map((widget) => {
              const Icon = widget.icon
              return (
                <div
                  key={widget.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                    widget.visible
                      ? "border-blue-200 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                  onClick={() => toggleWidget(widget.id)}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    widget.visible
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {widget.name}
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {widget.type === 'chart' ? 'Gráfico' : 
                       widget.type === 'table' ? 'Tabela' :
                       widget.type === 'stats' ? 'Estatísticas' : 'Lista'}
                    </p>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center",
                    widget.visible
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300 dark:border-gray-600"
                  )}>
                    {widget.visible && (
                      <div className="w-2 h-2 bg-white rounded-sm"></div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// =====================================================
// COMPONENTE DE BADGE DE CLIENTE
// =====================================================

interface ClientBadgeProps {
  client: Client
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  showCount?: boolean
  showStats?: boolean
}

export function ClientBadge({ 
  client, 
  size = 'md', 
  showIcon = true, 
  showCount = false,
  showStats = false
}: ClientBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-2 rounded-full font-medium bg-blue-100 text-blue-800",
      sizeClasses[size]
    )}>
      {showIcon && (
        <Building className={iconSizeClasses[size]} />
      )}
      {client.name}
      {showCount && client.ticketCount !== undefined && (
        <span className="px-1.5 py-0.5 bg-blue-200 rounded-full text-xs">
          {client.ticketCount}
        </span>
      )}
      {showStats && client.stats && (
        <div className="flex items-center gap-1 text-xs">
          <span className="text-green-600">{client.stats.resolved}</span>
          <span className="text-gray-400">/</span>
          <span className="text-blue-600">{client.stats.open}</span>
        </div>
      )}
    </div>
  )
}
