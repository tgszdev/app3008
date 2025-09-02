'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Loader2 } from 'lucide-react'

export default function CategoriesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar automaticamente para a página de configurações
    const timer = setTimeout(() => {
      router.push('/dashboard/settings')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full">
          <Settings className="h-8 w-8 text-orange-600 dark:text-orange-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gerenciamento de Categorias
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          O gerenciamento de categorias foi movido para a página de Configurações Administrativas.
        </p>
        
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Redirecionando...</span>
        </div>
        
        <button
          onClick={() => router.push('/dashboard/settings')}
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          Ir para Configurações
        </button>
      </div>
    </div>
  )
}