'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/contexts/OrganizationContext'
import {
  Building,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Loader2,
  Calendar,
  Filter,
  FileDown,
  User
} from 'lucide-react'

// =====================================================
// COMPONENTE PRINCIPAL - MULTI CLIENT DASHBOARD (APENAS BOTÕES)
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
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [showClientPopup, setShowClientPopup] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  
  // Filtros de período
  const getCurrentMonthDates = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
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

  const handleClientSelectionChange = (selectedIds: string[]) => {
    console.log('🔄 Mudança de seleção de clientes:', selectedIds)
    setSelectedClients(selectedIds)
  }

  const handleMyTickets = () => {
    console.log('🔄 Meus Tickets clicado')
    // Implementar funcionalidade de "Meus Tickets"
  }

  const handleCurrentMonth = () => {
    console.log('🔄 Mês Atual clicado')
    // Implementar funcionalidade de filtro de data
  }

  const handleExportPDF = () => {
    console.log('🔄 Exportar PDF clicado')
    // Implementar funcionalidade de exportar PDF
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
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-wrap gap-3">
        {/* Seletor de Clientes */}
        {isMatrixUser && (
          <div className="relative">
            <button
              onClick={() => setShowClientPopup(!showClientPopup)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Building className="w-4 h-4" />
              <span className="text-sm font-medium">
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

        {/* Meus Tickets */}
        <button
          onClick={handleMyTickets}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">Meus Tickets</span>
        </button>

        {/* Mês Atual (Filtro de Data) */}
        <button
          onClick={handleCurrentMonth}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">Mês Atual</span>
        </button>

        {/* Exportar PDF */}
        <button
          onClick={handleExportPDF}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <FileDown className="w-4 h-4" />
          <span className="text-sm font-medium">Exportar PDF</span>
        </button>
      </div>

      {/* Informações do Período */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
          <span className="font-medium block sm:inline">Período analisado:</span>
          <span className="block sm:inline sm:ml-1">
            {formatDateShort(periodFilter.start_date)} até {formatDateShort(periodFilter.end_date)}
          </span>
          <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
            • <strong>{selectedClients.length}</strong> clientes selecionados
          </span>
        </p>
      </div>

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