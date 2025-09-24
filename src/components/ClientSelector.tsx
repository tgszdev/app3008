'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Building, Users, ChevronDown, Loader2 } from 'lucide-react'
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
}

interface ClientSelectorProps {
  className?: string
  onClientChange: (clientId: string | null) => void
  selectedClientId: string | null
}

// =====================================================
// COMPONENTE PRINCIPAL - CLIENT SELECTOR
// =====================================================

export function ClientSelector({ 
  className, 
  onClientChange, 
  selectedClientId 
}: ClientSelectorProps) {
  const { data: session } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Carregar clientes disponíveis
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get('/api/organizations')
        
        if (response.data && Array.isArray(response.data)) {
          setClients(response.data)
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

  // Obter nome do cliente selecionado
  const getSelectedClientName = () => {
    if (!selectedClientId) return 'Todos os Clientes'
    const client = clients.find(c => c.id === selectedClientId)
    return client ? client.name : 'Selecionar Cliente'
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Building className="w-4 h-4 text-blue-600" />
      
      <div className="flex flex-col">
        <label className="text-xs font-medium text-gray-600 mb-1">
          Cliente:
        </label>
        <select 
          value={selectedClientId || 'all'} 
          onChange={(e) => handleClientChange(e.target.value)}
          className="w-[250px] px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todos os Clientes</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex flex-col">
        <span className="text-xs font-medium text-gray-600 mb-1">Visualização</span>
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {selectedClientId ? 'Filtrado' : 'Agrupado'}
        </span>
      </div>
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
}

export function ClientBadge({ client, size = 'md', showIcon = true }: ClientBadgeProps) {
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
    </span>
  )
}
