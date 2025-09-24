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

  // Inicializar com contexto atual se disponível
  useEffect(() => {
    if (currentContext && !selectedClients.includes(currentContext.id)) {
      setSelectedClients([currentContext.id])
    }
  }, [currentContext])

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
    let newSelection: string[]
    
    if (selectedClients.includes(clientId)) {
      // Remover da seleção
      newSelection = selectedClients.filter(id => id !== clientId)
    } else {
      // Adicionar à seleção (respeitando limite máximo)
      if (selectedClients.length >= maxSelections) {
        return // Não permitir mais seleções
      }
      newSelection = [...selectedClients, clientId]
    }
    
    setSelectedClients(newSelection)
    onSelectionChange?.(newSelection)
  }

  const handleSelectAll = () => {
    const allIds = availableContexts.map(context => context.id)
    const newSelection = allIds.slice(0, maxSelections) // Respeitar limite
    setSelectedClients(newSelection)
    onSelectionChange?.(newSelection)
  }

  const handleClearAll = () => {
    setSelectedClients([])
    onSelectionChange?.([])
  }

  const getSelectedClientsInfo = () => {
    if (selectedClients.length === 0) {
      return "Nenhum cliente selecionado"
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
          <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
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
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors w-full"
      >
        {showIcon && <Building className="w-5 h-5 text-blue-600" />}
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-gray-900">
            {getSelectedClientsInfo()}
          </div>
          {selectedClients.length > 0 && selectedClients.length < availableContexts.length && (
            <div className="text-xs text-gray-500 truncate">
              {getSelectedClientsNames()}
            </div>
          )}
        </div>
        <ChevronDown className="w-5 h-5 text-gray-400" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Selecionar Clientes</span>
            </div>
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {filteredOptions.map(option => (
              <label key={option.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
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
                {option.isSelected && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </label>
            ))}
          </div>
          
          <div className="p-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={handleSelectAll}
              className="flex-1 px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Selecionar Todos
            </button>
            <button
              onClick={handleClearAll}
              className="flex-1 px-4 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
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
            className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
          >
            <Building className="w-3 h-3" />
            <span>{context.name}</span>
            <button
              onClick={() => onRemove(id)}
              className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )
      })}
      
      {selectedIds.length > 1 && (
        <button
          onClick={onClearAll}
          className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors"
        >
          Limpar todos
        </button>
      )}
    </div>
  )
}
