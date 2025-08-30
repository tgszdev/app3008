'use client'

import { BarChart3, TrendingUp, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Estatísticas
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Análise detalhada do desempenho do sistema
        </p>
      </div>

      {/* Em desenvolvimento */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Página em Desenvolvimento
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Os gráficos e relatórios detalhados estarão disponíveis em breve.
          </p>
        </div>
      </div>
    </div>
  )
}