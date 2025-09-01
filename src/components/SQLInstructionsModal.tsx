'use client'

import { useState } from 'react'
import { X, Copy, CheckCircle, Database } from 'lucide-react'
import toast from 'react-hot-toast'

interface SQLInstructionsModalProps {
  isOpen: boolean
  onClose: () => void
  sql: string
  title?: string
  instructions?: string[]
}

export default function SQLInstructionsModal({ 
  isOpen, 
  onClose, 
  sql, 
  title = 'Configuração Necessária do Banco de Dados',
  instructions = []
}: SQLInstructionsModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      toast.success('SQL copiado para a área de transferência!')
      setTimeout(() => setCopied(false), 3000)
    } catch (error) {
      toast.error('Erro ao copiar SQL')
    }
  }

  const defaultInstructions = [
    'Acesse o Supabase Dashboard',
    'Navegue até SQL Editor',
    'Cole e execute o script SQL abaixo',
    'Após executar, feche este modal e tente novamente'
  ]

  const finalInstructions = instructions.length > 0 ? instructions : defaultInstructions

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative z-50 w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Instructions */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Instruções:
            </h3>
            <ol className="list-decimal list-inside space-y-2">
              {finalInstructions.map((instruction, index) => (
                <li key={index} className="text-gray-700 dark:text-gray-300">
                  {instruction}
                </li>
              ))}
            </ol>
          </div>
          
          {/* SQL Code */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Script SQL:
              </h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar SQL
                  </>
                )}
              </button>
            </div>
            
            <div className="relative">
              <pre className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                  {sql}
                </code>
              </pre>
            </div>
            
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Importante:</strong> Execute este script apenas uma vez. 
                O script já contém verificação IF NOT EXISTS para evitar duplicação.
              </p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
            <a
              href="https://supabase.com/dashboard/project/eyfvvximmeqmwdfqzqov/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Abrir SQL Editor
            </a>
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}