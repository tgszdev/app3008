'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useOrganization } from '@/contexts/OrganizationContext'
import { 
  Building, 
  ChevronDown, 
  Search, 
  Check, 
  X,
  Users,
  Filter,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// =====================================================
// TIPOS E INTERFACES
// =====================================================

interface ClientOption {
  id: string
  name: string
  type: 'organization' | 'department'
  slug: string
  isSelected: boolean
}

interface ModernClientSelectorProps {
  className?: string
  selectedClients: string[]
  onSelectionChange: (clients: string[]) => void
  maxSelections?: number
  showType?: boolean
  showIcon?: boolean
}

// =====================================================
// COMPONENTE PRINCIPAL - MODERN CLIENT SELECTOR
// =====================================================

export function ModernClientSelector({ 
  className, 
  selectedClients = [],
  onSelectionChange,
  maxSelections = 10,
  showType = true,
  showIcon = true
}: ModernClientSelectorProps) {
  const { data: session } = useSession()
  const { 
    availableContexts, 
    isMatrixUser, 
    isLoading 
  } = useOrganization()

  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([])

  // Converter contextos disponíveis em opções
  useEffect(() => {
    if (availableContexts && availableContexts.length > 0) {
      const options: ClientOption[] = availableContexts.map(context => ({
        id: context.id,
        name: context.name,
        type: context.type,
        slug: context.slug,
        isSelected: selectedClients.includes(context.id)
      }))
      setClientOptions(options)
    }
  }, [availableContexts, selectedClients])

  // Filtrar opções baseado na busca
  const filteredOptions = clientOptions.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Não mostrar se não é usuário da matriz
  if (!isMatrixUser) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showIcon && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
        <span className="text-sm text-gray-600">Carregando clientes...</span>
      </div>
    )
  }

  // Se não tem contextos disponíveis
  if (!availableContexts || availableContexts.length === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-gray-500", className)}>
        {showIcon && <Building className="w-4 h-4" />}
        <span className="text-sm">Nenhum cliente disponível</span>
      </div>
    )
  }

  // =====================================================
  // FUNÇÕES DE MANIPULAÇÃO
  // =====================================================

  const handleToggleClient = (clientId: string) => {
    try {
      let newSelection: string[]
      
      if (selectedClients.includes(clientId)) {
        // Remover da seleção
        newSelection = selectedClients.filter(id => id !== clientId)
      } else {
        // Adicionar à seleção (respeitando limite máximo)
        if (selectedClients.length >= maxSelections) {
          console.warn(`Limite máximo de ${maxSelections} seleções atingido`)
          return
        }
        newSelection = [...selectedClients, clientId]
      }
      
      onSelectionChange?.(newSelection)
    } catch (error) {
      console.error('Erro ao alternar cliente:', error)
    }
  }

  const handleSelectAll = () => {
    try {
      const allIds = availableContexts.map(context => context.id)
      const newSelection = allIds.slice(0, maxSelections)
      onSelectionChange?.(newSelection)
    } catch (error) {
      console.error('Erro ao selecionar todos:', error)
    }
  }

  const handleClearAll = () => {
    try {
      onSelectionChange?.([])
    } catch (error) {
      console.error('Erro ao limpar seleção:', error)
    }
  }

  const getSelectedClientsInfo = () => {
    if (selectedClients.length === 0) {
      return "Selecionar Clientes"
    }
    
    if (selectedClients.length === availableContexts.length) {
      return "Todos os Clientes"
    }
    
    if (selectedClients.length === 1) {
      const selected = availableContexts.find(c => c.id === selectedClients[0])
      return selected?.name || "Cliente selecionado"
    }
    
    return `${selectedClients.length} clientes selecionados`
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className={cn("relative", className)}>
      {/* Overlay para fechar modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" 
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Botão principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group relative w-full px-3 py-2 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl",
          "hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "transition-all duration-200 shadow-sm",
          isOpen && "ring-2 ring-blue-500 border-blue-500 shadow-md"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {showIcon && (
              <div className="flex-shrink-0">
                <Building className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                {getSelectedClientsInfo()}
              </div>
              {selectedClients.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedClients.length} de {availableContexts.length} selecionados
                </div>
              )}
            </div>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0",
            isOpen && "rotate-180"
          )} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-96 overflow-hidden w-full max-w-sm">
          {/* Header com busca */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Selecionar Clientes</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Lista de opções */}
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <Building className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente disponível'}
                </p>
              </div>
            ) : (
              <div className="py-2">
                {filteredOptions.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
                  >
                    <input
                      type="checkbox"
                      checked={option.isSelected}
                      onChange={() => handleToggleClient(option.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-gray-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-blue-300 truncate">
                          {option.name}
                        </span>
                        {showType && (
                          <span className={cn(
                            "px-1.5 py-0.5 text-xs rounded-xl font-medium flex-shrink-0",
                            option.type === 'organization' 
                              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" 
                              : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                          )}>
                            {option.type === 'organization' ? 'Cliente' : 'Dept'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {option.slug}
                      </div>
                    </div>
                    {option.isSelected && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé com ações */}
          {filteredOptions.length > 0 && (
            <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {selectedClients.length} de {filteredOptions.length} selecionados
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                  >
                    Todos
                  </button>
                  <button
                    onClick={handleClearAll}
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
  )
}
