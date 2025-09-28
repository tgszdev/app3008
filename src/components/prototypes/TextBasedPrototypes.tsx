'use client'

import React from 'react'
import { Grid } from 'lucide-react'

const mockData = {
  total: 13,
  status: [
    { name: 'Aberto', count: 4, color: '#3B82F6' },
    { name: 'Ag. Deploy em Homologação', count: 3, color: '#3B82F6' },
    { name: 'Em Atendimento', count: 2, color: '#F59E0B' },
    { name: 'Em Homologação', count: 1, color: '#8B5CF6' },
    { name: 'Ag. Deploy em Produção', count: 1, color: '#3B82F6' },
    { name: 'Cancelado', count: 1, color: '#EF4444' },
    { name: 'Resolvido', count: 1, color: '#10B981' }
  ]
}

// Protótipo 31: Baseado no 17 - Texto com Layout em Duas Colunas
export const Prototype31 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
        <div className="relative">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 text-right">{mockData.total}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Período</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Atual</div>
            </div>
          </div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${status.color}, transparent)` }}></div>
          <div className="relative">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Count</div>
                <div className="text-2xl font-bold text-right" style={{ color: status.color }}>{status.count}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 break-words">{status.name}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 32: Baseado no 23 - Texto com Progresso
export const Prototype32 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
        <div className="relative">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 break-words">Total no Período</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2 text-right">{mockData.total}</div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <div className="bg-blue-600 h-1 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => {
        const percentage = (status.count / mockData.total) * 100
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${status.color}, transparent)` }}></div>
            <div className="relative">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 break-words">{status.name}</div>
              <div className="text-3xl font-bold mb-2 text-right" style={{ color: status.color }}>{status.count}</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div className="h-1 rounded-full" style={{ width: `${percentage}%`, backgroundColor: status.color }}></div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)

// Protótipo 33: Texto com Layout de Lista Vertical
export const Prototype33 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
        <div className="relative">
          <div className="space-y-1">
            <div className="text-sm text-gray-600 dark:text-gray-400 break-words">Total no Período</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 text-right">{mockData.total}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">tickets</div>
          </div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${status.color}, transparent)` }}></div>
          <div className="relative">
            <div className="space-y-1">
              <div className="text-sm text-gray-600 dark:text-gray-400 break-words">{status.name}</div>
              <div className="text-3xl font-bold text-right" style={{ color: status.color }}>{status.count}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">tickets</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 34: Texto com Layout Centralizado
export const Prototype34 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
        <div className="relative">
          <div className="text-center">
            <div className="text-lg text-gray-600 dark:text-gray-400 mb-3 break-words">Total no Período</div>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{mockData.total}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">tickets processados</div>
          </div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${status.color}, transparent)` }}></div>
          <div className="relative">
            <div className="text-center">
              <div className="text-lg text-gray-600 dark:text-gray-400 mb-3 break-words">{status.name}</div>
              <div className="text-4xl font-bold mb-2" style={{ color: status.color }}>{status.count}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">tickets</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 35: Texto com Layout de Tabela
export const Prototype35 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
        <div className="relative">
          <div className="border-b border-gray-200 dark:border-gray-600 pb-2 mb-2">
            <div className="text-sm text-gray-600 dark:text-gray-400 break-words">Total no Período</div>
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 text-right">{mockData.total}</div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${status.color}, transparent)` }}></div>
          <div className="relative">
            <div className="border-b border-gray-200 dark:border-gray-600 pb-2 mb-2">
              <div className="text-sm text-gray-600 dark:text-gray-400 break-words">{status.name}</div>
            </div>
            <div className="text-3xl font-bold text-right" style={{ color: status.color }}>{status.count}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 36: Texto com Layout de Dashboard
export const Prototype36 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
        <div className="relative">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total no Período</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">100%</div>
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => {
        const percentage = (status.count / mockData.total) * 100
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${status.color}, transparent)` }}></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">{status.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{percentage.toFixed(1)}%</div>
              </div>
              <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)

// Protótipo 37: Texto com Layout Minimalista
export const Prototype37 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
        <div className="relative">
          <div className="text-4xl font-light text-blue-600 dark:text-blue-400 mb-1">{mockData.total}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total no Período</div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${status.color}, transparent)` }}></div>
          <div className="relative">
            <div className="text-4xl font-light mb-1" style={{ color: status.color }}>{status.count}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{status.name}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 38: Texto com Layout de Card com Destaque
export const Prototype38 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
        <div className="relative">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{mockData.total}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full inline-block">
            Principal
          </div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${status.color}, transparent)` }}></div>
          <div className="relative">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
            <div className="text-3xl font-bold mb-2" style={{ color: status.color }}>{status.count}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full inline-block" style={{ backgroundColor: `${status.color}20` }}>
              Status
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 39: Texto com Layout de Card com Informações Extras
export const Prototype39 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
        <div className="relative">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{mockData.total}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <div>Período: Set/2025</div>
            <div>Última atualização: Hoje</div>
          </div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${status.color}, transparent)` }}></div>
          <div className="relative">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
            <div className="text-3xl font-bold mb-2" style={{ color: status.color }}>{status.count}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <div>Status: {status.name}</div>
              <div>Cor: {status.color}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 40: Texto com Layout de Card com Estatísticas
export const Prototype40 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
        <div className="relative">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{mockData.total}</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div>Média: 2.2/dia</div>
            <div>Pico: 5</div>
          </div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => {
        const percentage = (status.count / mockData.total) * 100
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${status.color}, transparent)` }}></div>
            <div className="relative">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
              <div className="text-3xl font-bold mb-2" style={{ color: status.color }}>{status.count}</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                <div>{percentage.toFixed(1)}%</div>
                <div>Rank: {index + 1}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)
