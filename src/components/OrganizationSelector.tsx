'use client'

import React from 'react'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Building2, Users, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// =====================================================
// TIPOS E INTERFACES
// =====================================================

interface OrganizationSelectorProps {
  className?: string
  variant?: 'default' | 'compact' | 'minimal'
  showIcon?: boolean
  showType?: boolean
}

interface OrganizationSelectionScreenProps {
  onContinue?: () => void
}

// =====================================================
// COMPONENTE PRINCIPAL - ORGANIZATION SELECTOR
// =====================================================

export function OrganizationSelector({ 
  className, 
  variant = 'default',
  showIcon = true,
  showType = true
}: OrganizationSelectorProps) {
  const { 
    currentContext, 
    availableContexts, 
    switchContext, 
    isMatrixUser,
    isLoading,
    hasMultipleContexts 
  } = useOrganization()

  // Não mostrar se não é usuário da matriz ou não tem múltiplos contextos
  if (!isMatrixUser || !hasMultipleContexts) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-gray-600">Carregando...</span>
      </div>
    )
  }

  // Função para lidar com mudança de contexto
  const handleOrganizationChange = (contextId: string) => {
    if (contextId && contextId !== currentContext?.id) {
      switchContext(contextId)
    }
  }

  // Função para obter ícone baseado no tipo
  const getContextIcon = (type: string) => {
    return type === 'organization' ? Building2 : Users
  }

  // Função para obter cor baseada no tipo
  const getContextColor = (type: string) => {
    return type === 'organization' ? 'text-blue-600' : 'text-green-600'
  }

  // Variante compacta
  if (variant === 'compact') {
    return (
      <select 
        value={currentContext?.id || ''} 
        onChange={(e) => handleOrganizationChange(e.target.value)}
        className={cn(
          "w-[200px] px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          className
        )}
      >
        {availableContexts.map((context) => {
          const Icon = getContextIcon(context.type)
          return (
            <option key={context.id} value={context.id}>
              {context.name}
            </option>
          )
        })}
      </select>
    )
  }

  // Variante mínima
  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showIcon && currentContext && (
          React.createElement(getContextIcon(currentContext.type), {
            className: cn("w-4 h-4", getContextColor(currentContext.type))
          })
        )}
        <select 
          value={currentContext?.id || ''} 
          onChange={(e) => handleOrganizationChange(e.target.value)}
          className="bg-transparent border-none outline-none text-sm font-medium text-gray-900 cursor-pointer"
        >
          {availableContexts.map((context) => (
            <option key={context.id} value={context.id}>
              {context.name}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>
    )
  }

  // Variante padrão
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showIcon && currentContext && (
        React.createElement(getContextIcon(currentContext.type), {
          className: cn("w-4 h-4", getContextColor(currentContext.type))
        })
      )}
      
      <div className="flex flex-col">
        <label className="text-xs font-medium text-gray-600 mb-1">
          {currentContext?.type === 'organization' ? 'Organização' : 'Departamento'}
        </label>
        <select 
          value={currentContext?.id || ''} 
          onChange={(e) => handleOrganizationChange(e.target.value)}
          className="w-[250px] px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {availableContexts.map((context) => (
            <option key={context.id} value={context.id}>
              {context.name}
            </option>
          ))}
        </select>
      </div>
      
      {showType && currentContext && (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-600 mb-1">Tipo</span>
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            currentContext.type === 'organization' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-green-100 text-green-800'
          )}>
            {currentContext.type === 'organization' ? 'Cliente' : 'Departamento'}
          </span>
        </div>
      )}
    </div>
  )
}

// =====================================================
// TELA DE SELEÇÃO DE ORGANIZAÇÃO (PARA LOGIN)
// =====================================================

export function OrganizationSelectionScreen({ onContinue }: OrganizationSelectionScreenProps) {
  const { 
    availableContexts, 
    switchContext, 
    currentContext,
    isLoading 
  } = useOrganization()

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando organizações...</p>
        </div>
      </div>
    )
  }

  // Função para lidar com seleção
  const handleSelectContext = (contextId: string) => {
    switchContext(contextId)
    if (onContinue) {
      onContinue()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Selecione uma Organização
            </h1>
            <p className="text-gray-600">
              Escolha qual organização você gostaria de acessar
            </p>
          </div>

          <div className="grid gap-4">
            {availableContexts.map((context) => {
              const Icon = getContextIcon(context.type)
              const isSelected = currentContext?.id === context.id
              
              return (
                <button
                  key={context.id}
                  onClick={() => handleSelectContext(context.id)}
                  className={cn(
                    "w-full p-4 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-md",
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-lg",
                      context.type === 'organization' 
                        ? "bg-blue-100 text-blue-600" 
                        : "bg-green-100 text-green-600"
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {context.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {context.type === 'organization' ? 'Organização Cliente' : 'Departamento Interno'}
                      </p>
                    </div>
                    
                    {isSelected && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {availableContexts.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Nenhuma organização disponível
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// =====================================================
// COMPONENTE DE BADGE DE CONTEXTO
// =====================================================

interface ContextBadgeProps {
  context: any
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export function ContextBadge({ context, size = 'md', showIcon = true }: ContextBadgeProps) {
  if (!context) return null

  const Icon = getContextIcon(context.type)
  
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
      "inline-flex items-center gap-2 rounded-full font-medium",
      sizeClasses[size],
      context.type === 'organization' 
        ? 'bg-blue-100 text-blue-800' 
        : 'bg-green-100 text-green-800'
    )}>
      {showIcon && (
        <Icon className={iconSizeClasses[size]} />
      )}
      {context.name}
    </span>
  )
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function getContextIcon(type: string) {
  return type === 'organization' ? Building2 : Users
}
