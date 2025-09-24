'use client'

import React, { useState, useEffect } from 'react'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Building, Users, ChevronDown, Check, X, Filter, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// =====================================================
// TIPOS E INTERFACES
// =====================================================

interface MultiClientSelectorProps {
  className?: string
  variant?: 'default' | 'compact' | 'minimal'
  showIcon?: boolean
  showType?: boolean
  onSelectionChange?: (selectedIds: string[]) => void
  maxSelections?: number
}

interface ClientOption {
  id: string
  name: string
  type: 'organization' | 'department'
  slug: string
  isSelected: boolean
}

// =====================================================
// COMPONENTE PRINCIPAL - MULTI CLIENT SELECTOR
// =====================================================

export function MultiClientSelector({ 
  className, 
  variant = 'default',
  showIcon = true,
  showType = true,
  onSelectionChange,
  maxSelections = 10
}: MultiClientSelectorProps) {
  const { 
    currentContext, 
    availableContexts, 
    switchContext, 
    isMatrixUser,
    isLoading,
    hasMultipleContexts 
  } = useOrganization()

  const [isOpen, setIsOpen] = useState(false)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([])

  // Inicializar vazio para permitir seleção livre
  useEffect(() => {
    if (availableContexts && availableContexts.length > 0 && selectedClients.length === 0) {
      console.log('🔄 Inicializando seletor vazio para seleção livre')
      setSelectedClients([])
    }
  }, [availableContexts, selectedClients.length])

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
          return // Não permitir mais seleções
        }
        newSelection = [...selectedClients, clientId]
      }
      
      setSelectedClients(newSelection)
      
      // Chamar callback com delay para evitar problemas de estado
      setTimeout(() => {
        try {
          onSelectionChange?.(newSelection)
        } catch (error) {
          console.error('Erro no callback onSelectionChange:', error)
        }
      }, 0)
      
    } catch (error) {
      console.error('Erro ao alternar cliente:', error)
    }
  }

  const handleSelectAll = () => {
    try {
      const allIds = availableContexts.map(context => context.id)
      const newSelection = allIds.slice(0, maxSelections) // Respeitar limite
      setSelectedClients(newSelection)
      
      setTimeout(() => {
        try {
          onSelectionChange?.(newSelection)
        } catch (error) {
          console.error('Erro no callback onSelectionChange (selectAll):', error)
        }
      }, 0)
    } catch (error) {
      console.error('Erro ao selecionar todos:', error)
    }
  }

  const handleClearAll = () => {
    try {
      setSelectedClients([])
      
      setTimeout(() => {
        try {
          onSelectionChange?.([])
        } catch (error) {
          console.error('Erro no callback onSelectionChange (clearAll):', error)
        }
      }, 0)
    } catch (error) {
      console.error('Erro ao limpar seleção:', error)
    }
  }

  const getSelectedClientsInfo = () => {
    if (selectedClients.length === 0) {
      return "Selecionar clientes..."
    }
    
    if (selectedClients.length === availableContexts.length) {
      return "Todos os clientes"
    }
    
    if (selectedClients.length === 1) {
      const selected = availableContexts.find(c => c.id === selectedClients[0])
      return selected?.name || "Cliente selecionado"
    }
    
    return `${selectedClients.length} clientes selecionados`
  }

  const getSelectedClientsNames = () => {
    return selectedClients
      .map(id => availableContexts.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join(', ')
  }

  // Variantes de layout
  if (variant === 'minimal') {
    return (
      <div className={cn("relative", className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>{selectedClients.length}</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.map(option => (
                <label key={option.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={option.isSelected}
                    onChange={() => handleToggleClient(option.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {option.name}
                    </div>
                    {showType && (
                      <div className="text-xs text-gray-500">
                        {option.type === 'organization' ? 'Cliente' : 'Departamento'}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
            
            <div className="p-2 border-t border-gray-100 flex gap-1">
              <button
                onClick={handleSelectAll}
                className="flex-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
              >
                Todos
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
              >
                Limpar
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn("relative", className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          {showIcon && <Building className="w-4 h-4 text-blue-600" />}
          <span className="text-sm font-medium text-gray-900 truncate">
            {getSelectedClientsInfo()}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {filteredOptions.map(option => (
                <label key={option.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={option.isSelected}
                    onChange={() => handleToggleClient(option.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {option.name}
                    </div>
                    {showType && (
                      <div className="text-xs text-gray-500">
                        {option.type === 'organization' ? 'Cliente' : 'Departamento'}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
            
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <button
                onClick={handleSelectAll}
                className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Selecionar Todos
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Limpar Seleção
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Variante padrão (default)
  return (
    <div className={cn("relative", className)}>
      {/* Overlay para fechar modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className="flex flex-col">
        <label className="text-xs font-medium text-gray-600 mb-1">
          Clientes Selecionados
        </label>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-[250px] px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          <span className="truncate">
            {getSelectedClientsInfo()}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 w-[300px] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Selecionar Clientes</span>
            </div>
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {filteredOptions.map(option => (
              <label key={option.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <input
                  type="checkbox"
                  checked={option.isSelected}
                  onChange={() => handleToggleClient(option.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {option.name}
                  </div>
                  {showType && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {option.type === 'organization' ? 'Cliente' : 'Departamento'}
                    </div>
                  )}
                </div>
                {option.isSelected && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </label>
            ))}
          </div>
          
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
            <button
              onClick={handleSelectAll}
              className="flex-1 px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              Selecionar Todos
            </button>
            <button
              onClick={handleClearAll}
              className="flex-1 px-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              Limpar Seleção
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// =====================================================
// COMPONENTE DE TAGS DOS CLIENTES SELECIONADOS
// =====================================================

interface SelectedClientsTagsProps {
  selectedIds: string[]
  availableContexts: Array<{ id: string; name: string; type: string }>
  onRemove: (id: string) => void
  onClearAll: () => void
  className?: string
}

export function SelectedClientsTags({ 
  selectedIds, 
  availableContexts, 
  onRemove, 
  onClearAll,
  className 
}: SelectedClientsTagsProps) {
  if (selectedIds.length === 0) {
    return null
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {selectedIds.map(id => {
        const context = availableContexts.find(c => c.id === id)
        if (!context) return null
        
        return (
          <div
            key={id}
            className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-sm"
          >
            <Building className="w-3 h-3" />
            <span>{context.name}</span>
            <button
              onClick={() => onRemove(id)}
              className="hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )
      })}
      
      {selectedIds.length > 1 && (
        <button
          onClick={onClearAll}
          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Limpar todos
        </button>
      )}
    </div>
  )
}
