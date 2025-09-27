'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
// Tipos para multi-tenancy
export type UserType = 'matrix' | 'context'
export type ContextType = 'organization' | 'department'

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface Context {
  id: string
  name: string
  slug: string
  type: ContextType
  settings?: Record<string, any>
  can_manage?: boolean
}

export interface OrganizationContextType {
  // Estado atual
  currentContext: Context | null
  userType: UserType | null
  contextType: ContextType | null
  
  // Contextos disponíveis
  availableContexts: Context[]
  
  // Flags de conveniência
  isMatrixUser: boolean
  isContextUser: boolean
  isOrganizationUser: boolean
  isDepartmentUser: boolean
  
  // Ações
  switchContext: (contextId: string) => void
  refreshContexts: () => Promise<void>
  
  // Estado de carregamento
  isLoading: boolean
  hasMultipleContexts: boolean
}

// =====================================================
// CONTEXT PROVIDER
// =====================================================

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  
  // Estados locais
  const [currentContext, setCurrentContext] = useState<Context | null>(null)
  const [availableContexts, setAvailableContexts] = useState<Context[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // =====================================================
  // DERIVAR DADOS DA SESSÃO
  // =====================================================
  
  const userType = session?.user?.userType as UserType | null
  const contextType = session?.user?.contextType as ContextType | null
  const contextId = session?.user?.context_id
  const contextSlug = session?.user?.context_slug
  const contextName = session?.user?.context_name
  const sessionContexts = session?.user?.availableContexts as Context[] || []
  
  // Flags de conveniência
  const isMatrixUser = userType === 'matrix'
  const isContextUser = userType === 'context'
  const isOrganizationUser = contextType === 'organization'
  const isDepartmentUser = contextType === 'department'
  const hasMultipleContexts = availableContexts.length > 1
  
  // =====================================================
  // INICIALIZAR CONTEXTOS DISPONÍVEIS
  // =====================================================
  
  useEffect(() => {
    console.log('🔄 OrganizationContext useEffect:', { status, hasSession: !!session?.user, userType })
    
    if (status === 'loading') {
      setIsLoading(true)
      return
    }
    
    if (!session?.user) {
      console.log('⚠️ Sem sessão - parando loading')
      setIsLoading(false)
      return
    }
    
    const initializeContexts = async () => {
      try {
        setIsLoading(true)
        
        if (isMatrixUser) {
          // Usuário da matriz: buscar contextos do banco de dados
          console.log('🔄 Carregando contextos para usuário matrix do banco...')
          
          try {
            const response = await fetch('/api/organizations/user-contexts')
            console.log('📡 Response status:', response.status)
            
            if (response.ok) {
              const data = await response.json()
              const contexts = data.organizations || []
              console.log('✅ Contextos carregados do banco:', contexts.length)
              setAvailableContexts(contexts)
              
              // Se tem contextos disponíveis, selecionar o primeiro por padrão
              if (contexts.length > 0) {
                const savedContextId = localStorage.getItem('currentContextId')
                const defaultContext = savedContextId 
                  ? contexts.find(ctx => ctx.id === savedContextId)
                  : contexts[0]
                
                if (defaultContext) {
                  setCurrentContext(defaultContext)
                }
              }
            } else {
              const errorData = await response.json()
              console.error('❌ Erro ao carregar contextos do banco:', errorData)
              // Fallback para contextos da sessão
              setAvailableContexts(sessionContexts)
            }
          } catch (error) {
            console.error('❌ Erro ao buscar contextos:', error)
            // Fallback para contextos da sessão
            setAvailableContexts(sessionContexts)
          }
        } else if (isContextUser) {
          // Usuário de contexto: criar contexto baseado na sessão
          const context: Context = {
            id: contextId!,
            name: contextName!,
            slug: contextSlug!,
            type: contextType!
          }
          
          setAvailableContexts([context])
          setCurrentContext(context)
        }
        
      } catch (error) {
        console.error('Erro ao inicializar contextos:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    initializeContexts()
  }, [session, status, isMatrixUser, isContextUser, contextId, contextName, contextSlug, contextType, sessionContexts])
  
  // =====================================================
  // FUNÇÃO PARA TROCAR CONTEXTO
  // =====================================================
  
  const switchContext = (contextId: string) => {
    const newContext = availableContexts.find(ctx => ctx.id === contextId)
    
    if (newContext) {
      setCurrentContext(newContext)
      localStorage.setItem('currentContextId', contextId)
      
      // Emitir evento customizado para outros componentes
      window.dispatchEvent(new CustomEvent('contextChanged', {
        detail: { context: newContext }
      }))
      
      console.log('Contexto alterado para:', newContext.name)
    }
  }
  
  // =====================================================
  // FUNÇÃO PARA ATUALIZAR CONTEXTOS
  // =====================================================
  
  const refreshContexts = async () => {
    if (!isMatrixUser) return
    
    try {
      // Fazer requisição para obter contextos atualizados
      const response = await fetch('/api/contexts')
      if (response.ok) {
        const data = await response.json()
        setAvailableContexts(data.contexts || [])
        
        // Verificar se o contexto atual ainda está disponível
        if (currentContext && !data.contexts.find(ctx => ctx.id === currentContext.id)) {
          // Se o contexto atual não está mais disponível, selecionar o primeiro
          if (data.contexts.length > 0) {
            switchContext(data.contexts[0].id)
          } else {
            setCurrentContext(null)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar contextos:', error)
    }
  }
  
  // =====================================================
  // VALOR DO CONTEXT
  // =====================================================
  
  const contextValue: OrganizationContextType = {
    // Estado atual
    currentContext,
    userType,
    contextType,
    
    // Contextos disponíveis
    availableContexts,
    
    // Flags de conveniência
    isMatrixUser,
    isContextUser,
    isOrganizationUser,
    isDepartmentUser,
    
    // Ações
    switchContext,
    refreshContexts,
    
    // Estado de carregamento
    isLoading,
    hasMultipleContexts
  }
  
  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  )
}

// =====================================================
// HOOK PARA USAR O CONTEXT
// =====================================================

export function useOrganization() {
  const context = useContext(OrganizationContext)
  
  if (context === undefined) {
    throw new Error('useOrganization deve ser usado dentro de um OrganizationProvider')
  }
  
  return context
}

// =====================================================
// HOOKS ESPECÍFICOS PARA CONVENIÊNCIA
// =====================================================

export function useCurrentContext() {
  const { currentContext } = useOrganization()
  return currentContext
}

export function useIsMatrixUser() {
  const { isMatrixUser } = useOrganization()
  return isMatrixUser
}

export function useIsContextUser() {
  const { isContextUser } = useOrganization()
  return isContextUser
}

export function useAvailableContexts() {
  const { availableContexts } = useOrganization()
  return availableContexts
}

// =====================================================
// HOOK PARA CONTEXT ID (ÚTIL PARA QUERIES)
// =====================================================

export function useCurrentContextId(): string | null {
  const { currentContext, isContextUser, userType } = useOrganization()
  
  // Se é usuário de contexto, sempre retorna o contexto da sessão
  if (isContextUser && userType === 'context') {
    return currentContext?.id || null
  }
  
  // Se é usuário da matriz, retorna o contexto selecionado
  if (userType === 'matrix') {
    return currentContext?.id || null
  }
  
  return null
}

// =====================================================
// HOOK PARA VERIFICAR PERMISSÕES DE CONTEXTO
// =====================================================

export function useContextPermissions() {
  const { currentContext, isMatrixUser, isContextUser } = useOrganization()
  
  return {
    canSwitchContext: isMatrixUser && currentContext !== null,
    canManageContext: currentContext?.can_manage || false,
    isContextActive: currentContext !== null,
    hasContextAccess: isMatrixUser || isContextUser
  }
}
