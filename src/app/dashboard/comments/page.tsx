'use client'

import { MessageSquare } from 'lucide-react'

export default function CommentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Comentários
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Histórico de comentários em chamados
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
        <div className="text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Página em Desenvolvimento
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            O histórico de comentários estará disponível em breve.
          </p>
        </div>
      </div>
    </div>
  )
}