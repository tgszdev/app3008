'use client'

import { useState, useRef, useEffect } from 'react'
import { Building, ChevronDown, X, Check } from 'lucide-react'

interface Context {
  id: string
  name: string
  slug: string
  type: 'organization' | 'department'
}

interface ClientSelectorProps {
  selectedClients: string[]
  availableContexts: Context[]
  onSelectionChange: (selectedIds: string[]) => void
  isMatrixUser: boolean
  className?: string
}

export default function ClientSelector({
  selectedClients,
  availableContexts,
  onSelectionChange,
  isMatrixUser,
  className = ''
}: ClientSelectorProps) {
  const [showClientPopup, setShowClientPopup] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

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

  // Não renderizar se não for usuário matriz
  if (!isMatrixUser) {
    return null
  }

  return (
    <div className={`relative w-full sm:w-auto ${className}`}>
      {/* Botão principal com bordas animadas */}
      <button
        onClick={() => setShowClientPopup(!showClientPopup)}
        className="w-full sm:w-auto sm:min-w-[180px] h-12 px-3 sm:px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden whitespace-nowrap"
      >
        <Building className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium">
          {selectedClients.length === 0 
            ? 'Selecionar Clientes' 
            : selectedClients.length === 1 
              ? availableContexts.find(c => c.id === selectedClients[0])?.name || 'Cliente'
              : `${selectedClients.length} clientes`
          }
        </span>
        <ChevronDown className="w-4 h-4 flex-shrink-0" />
        {/* Bordas animadas */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse"></div>
      </button>
      
      {/* Popup de seleção de clientes */}
      {showClientPopup && (
        <div 
          ref={popupRef}
          className="absolute top-full left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 z-50"
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
            {availableContexts
              .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
              .map((context) => (
              <label
                key={context.id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors rounded-xl"
              >
                <input
                  type="checkbox"
                  checked={selectedClients.includes(context.id)}
                  onChange={() => {
                    if (selectedClients.includes(context.id)) {
                      onSelectionChange(selectedClients.filter(id => id !== context.id))
                    } else {
                      onSelectionChange([...selectedClients, context.id])
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
                onClick={() => onSelectionChange(availableContexts.map(c => c.id))}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Todos
              </button>
              <button
                onClick={() => onSelectionChange([])}
                className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 font-medium transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}