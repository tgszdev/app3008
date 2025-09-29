'use client'

import { useState } from 'react'
import { ArrowLeft, Eye, Code } from 'lucide-react'
import Link from 'next/link'

// Importar todos os protótipos
import { 
  RecentTicketsPrototype1, 
  RecentTicketsPrototype2, 
  RecentTicketsPrototype3, 
  RecentTicketsPrototype4, 
  RecentTicketsPrototype5 
} from '@/components/prototypes/RecentTicketsPrototypes1'

import { 
  RecentTicketsPrototype6, 
  RecentTicketsPrototype7, 
  RecentTicketsPrototype8, 
  RecentTicketsPrototype9, 
  RecentTicketsPrototype10 
} from '@/components/prototypes/RecentTicketsPrototypes2'

import { 
  RecentTicketsPrototype11, 
  RecentTicketsPrototype12, 
  RecentTicketsPrototype13, 
  RecentTicketsPrototype14, 
  RecentTicketsPrototype15 
} from '@/components/prototypes/RecentTicketsPrototypes3'

// Criar protótipos adicionais para completar 30
import { 
  RecentTicketsPrototype16, 
  RecentTicketsPrototype17, 
  RecentTicketsPrototype18, 
  RecentTicketsPrototype19, 
  RecentTicketsPrototype20 
} from '@/components/prototypes/RecentTicketsPrototypes4'

import { 
  RecentTicketsPrototype21, 
  RecentTicketsPrototype22, 
  RecentTicketsPrototype23, 
  RecentTicketsPrototype24, 
  RecentTicketsPrototype25 
} from '@/components/prototypes/RecentTicketsPrototypes5'

import { 
  RecentTicketsPrototype26, 
  RecentTicketsPrototype27, 
  RecentTicketsPrototype28, 
  RecentTicketsPrototype29, 
  RecentTicketsPrototype30 
} from '@/components/prototypes/RecentTicketsPrototypes6'

const prototypes = [
  { id: 1, name: 'Layout Clássico com Badges', component: RecentTicketsPrototype1 },
  { id: 2, name: 'Layout com Ícones de Prioridade', component: RecentTicketsPrototype2 },
  { id: 3, name: 'Layout Compacto com Cores', component: RecentTicketsPrototype3 },
  { id: 4, name: 'Layout com Avatar', component: RecentTicketsPrototype4 },
  { id: 5, name: 'Layout com Cards Coloridos', component: RecentTicketsPrototype5 },
  { id: 6, name: 'Layout Minimalista', component: RecentTicketsPrototype6 },
  { id: 7, name: 'Layout com Timeline', component: RecentTicketsPrototype7 },
  { id: 8, name: 'Layout com Cards Empilhados', component: RecentTicketsPrototype8 },
  { id: 9, name: 'Layout com Grid', component: RecentTicketsPrototype9 },
  { id: 10, name: 'Layout com Lista Horizontal', component: RecentTicketsPrototype10 },
  { id: 11, name: 'Layout com Progress Bar', component: RecentTicketsPrototype11 },
  { id: 12, name: 'Layout com Cards Flutuantes', component: RecentTicketsPrototype12 },
  { id: 13, name: 'Layout com Bordas Coloridas', component: RecentTicketsPrototype13 },
  { id: 14, name: 'Layout com Cards Compactos', component: RecentTicketsPrototype14 },
  { id: 15, name: 'Layout com Cards de Status', component: RecentTicketsPrototype15 },
  { id: 16, name: 'Layout com Cards de Status', component: RecentTicketsPrototype16 },
  { id: 17, name: 'Layout com Cards de Status', component: RecentTicketsPrototype17 },
  { id: 18, name: 'Layout com Cards de Status', component: RecentTicketsPrototype18 },
  { id: 19, name: 'Layout com Cards de Status', component: RecentTicketsPrototype19 },
  { id: 20, name: 'Layout com Cards de Status', component: RecentTicketsPrototype20 },
  { id: 21, name: 'Layout com Cards de Status', component: RecentTicketsPrototype21 },
  { id: 22, name: 'Layout com Cards de Status', component: RecentTicketsPrototype22 },
  { id: 23, name: 'Layout com Cards de Status', component: RecentTicketsPrototype23 },
  { id: 24, name: 'Layout com Cards de Status', component: RecentTicketsPrototype24 },
  { id: 25, name: 'Layout com Cards de Status', component: RecentTicketsPrototype25 },
  { id: 26, name: 'Layout com Cards de Status', component: RecentTicketsPrototype26 },
  { id: 27, name: 'Layout com Cards de Status', component: RecentTicketsPrototype27 },
  { id: 28, name: 'Layout com Cards de Status', component: RecentTicketsPrototype28 },
  { id: 29, name: 'Layout com Cards de Status', component: RecentTicketsPrototype29 },
  { id: 30, name: 'Layout com Cards de Status', component: RecentTicketsPrototype30 },
]

export default function RecentTicketsPrototypesPage() {
  const [selectedPrototype, setSelectedPrototype] = useState<number | null>(null)

  const handlePrototypeSelect = (id: number) => {
    setSelectedPrototype(selectedPrototype === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar ao Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Protótipos de Tickets Recentes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            30 sugestões de apresentação para a seção "Tickets Recentes" com criticidade e autor
          </p>
        </div>

        {/* Grid de Protótipos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prototypes.map((prototype) => {
            const Component = prototype.component
            const isSelected = selectedPrototype === prototype.id
            
            return (
              <div key={prototype.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Protótipo {prototype.id}
                    </h3>
                    <button
                      onClick={() => handlePrototypeSelect(prototype.id)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Eye className="h-4 w-4" />
                      {isSelected ? 'Ocultar' : 'Visualizar'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {prototype.name}
                  </p>
                </div>
                
                {isSelected && (
                  <div className="p-4">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <Component />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Selecione um protótipo para visualizar e escolha o que melhor se adequa ao seu projeto
          </p>
        </div>
      </div>
    </div>
  )
}
