'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Building, Users, ChevronDown, Loader2, Filter, X } from 'lucide-react'
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
}

interface ClientTabsSelectorProps {
  className?: string
  onClientChange: (clientId: string | null) => void
  selectedClientId: string | null
  showFilters?: boolean
  onFilterChange?: (filters: ClientFilters) => void
}

interface ClientFilters {
  status: string[]
  priority: string[]
  dateRange: {
    start: string
    end: string
  }
  searchTerm: string
}

// =====================================================
// COMPONENTE PRINCIPAL - CLIENT TABS SELECTOR
// =====================================================

export function ClientTabsSelector({ 
  className, 
  onClientChange, 
  selectedClientId,
  showFilters = false,
  onFilterChange
}: ClientTabsSelectorProps) {
  const { data: session } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filters, setFilters] = useState<ClientFilters>({
    status: [],
    priority: [],
    dateRange: {
      start: '',
      end: ''
    },
    searchTerm: ''
  })

  // Carregar clientes disponíveis
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get('/api/organizations')
        
        if (response.data && Array.isArray(response.data)) {
          // Buscar contagem de tickets para cada cliente
          const clientsWithCounts = await Promise.all(
            response.data.map(async (client: Client) => {
              try {
                const ticketsResponse = await axios.get(`/api/dashboard/client-tickets?client_id=${client.id}`)
                return {
                  ...client,
                  ticketCount: ticketsResponse.data.totalTickets || 0
                }
              } catch {
                return { ...client, ticketCount: 0 }
              }
            })
          )
          setClients(clientsWithCounts)
        }
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user) {
      fetchClients()
    }
  }, [session])

  // Aplicar filtros quando mudarem
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters)
    }
  }, [filters, onFilterChange])

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-gray-600">Carregando clientes...</span>
      </div>
    )
  }

  // Função para lidar com mudança de cliente
  const handleClientChange = (clientId: string) => {
    if (clientId === 'all') {
      onClientChange(null) // null = todos os clientes
    } else {
      onClientChange(clientId)
    }
  }

  // Função para limpar filtros
  const clearFilters = () => {
    setFilters({
      status: [],
      priority: [],
      dateRange: { start: '', end: '' },
      searchTerm: ''
    })
  }

  // Verificar se há filtros ativos
  const hasActiveFilters = filters.status.length > 0 || 
                          filters.priority.length > 0 || 
                          filters.dateRange.start || 
                          filters.dateRange.end || 
                          filters.searchTerm

  return (
    <div className={cn("space-y-4", className)}>
      {/* Seletor de Cliente com Abas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Selecionar Cliente
            </h3>
          </div>
          
          {showFilters && (
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                showAdvancedFilters 
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              )}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filtros</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </button>
          )}
        </div>

        {/* Abas de Clientes */}
        <div className="flex flex-wrap gap-2">
          {/* Aba "Todos" */}
          <button
            onClick={() => handleClientChange('all')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium",
              !selectedClientId
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            )}
          >
            <Users className="w-4 h-4" />
            <span>Todos os Clientes</span>
            <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
              {clients.reduce((sum, client) => sum + (client.ticketCount || 0), 0)}
            </span>
          </button>

          {/* Abas dos Clientes */}
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => handleClientChange(client.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium",
                selectedClientId === client.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              )}
            >
              <Building className="w-4 h-4" />
              <span className="truncate max-w-[150px]" title={client.name}>
                {client.name}
              </span>
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
                {client.ticketCount || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filtros Avançados */}
      {showFilters && showAdvancedFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white">
              Filtros Avançados
            </h4>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-700"
              >
                <X className="w-3 h-3" />
                Limpar Filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro de Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <div className="space-y-2">
                {['open', 'in_progress', 'resolved', 'cancelled'].map((status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({
                            ...prev,
                            status: [...prev.status, status]
                          }))
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            status: prev.status.filter(s => s !== status)
                          }))
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {status.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtro de Prioridade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prioridade
              </label>
              <div className="space-y-2">
                {['low', 'medium', 'high', 'critical'].map((priority) => (
                  <label key={priority} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.priority.includes(priority)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({
                            ...prev,
                            priority: [...prev.priority, priority]
                          }))
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            priority: prev.priority.filter(p => p !== priority)
                          }))
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {priority}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtro de Data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Busca por Texto */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar por Título
            </label>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                searchTerm: e.target.value
              }))}
              placeholder="Digite o título do ticket..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
}

export function ClientBadge({ 
  client, 
  size = 'md', 
  showIcon = true, 
  showCount = false 
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
    <span className={cn(
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
    </span>
  )
}
