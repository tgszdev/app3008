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

// Protótipo 41: Texto com Layout de Card com Badge
export const Prototype41 = () => (
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
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
              {mockData.total}
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${status.color}, transparent)` }}></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">{status.name}</div>
              <div className="text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: status.color }}>
                {status.count}
              </div>
            </div>
            <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 42: Texto com Layout de Card com Linha Divisória
export const Prototype42 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
        <div className="relative">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Total no Período</div>
          <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
          </div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${status.color}, transparent)` }}></div>
          <div className="relative">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">{status.name}</div>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 43: Texto com Layout de Card com Fundo Colorido
export const Prototype43 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="rounded-xl p-4 text-white shadow-sm relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
        <div className="text-sm opacity-90 mb-2">Total no Período</div>
        <div className="text-3xl font-bold">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="rounded-xl p-4 text-white shadow-sm relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${status.color}, ${status.color}CC)` }}>
          <div className="text-sm opacity-90 mb-2">{status.name}</div>
          <div className="text-3xl font-bold">{status.count}</div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 44: Texto com Layout de Card com Sombra Colorida
export const Prototype44 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg shadow-blue-500/25">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg" style={{ boxShadow: `0 10px 25px -5px ${status.color}25` }}>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
          <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 45: Texto com Layout de Card com Borda Colorida
export const Prototype45 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-blue-500 shadow-sm">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 shadow-sm" style={{ borderColor: status.color }}>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
          <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 46: Texto com Layout de Card com Gradiente de Texto
export const Prototype46 = () => (
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
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{mockData.total}</div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${status.color}, transparent)` }}></div>
          <div className="relative">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
            <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 47: Texto com Layout de Card com Hover Effect
export const Prototype47 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
          <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 48: Texto com Layout de Card com Animação
export const Prototype48 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm animate-pulse">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm animate-pulse">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
          <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 49: Texto com Layout de Card com Glassmorphism
export const Prototype49 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg rounded-xl p-4 border border-white/30 dark:border-gray-700/30 shadow-lg">
        <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">Total no Período</div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg rounded-xl p-4 border border-white/30 dark:border-gray-700/30 shadow-lg">
          <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">{status.name}</div>
          <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 50: Texto com Layout de Card com Neumorphism
export const Prototype50 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.1),inset_2px_2px_4px_rgba(0,0,0,0.1)] dark:shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(0,0,0,0.3)]">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.1),inset_2px_2px_4px_rgba(0,0,0,0.1)] dark:shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(0,0,0,0.3)]">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
          <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 51: Texto com Layout de Card com Borda Animada
export const Prototype51 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-blue-500 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 rounded-xl border-2 border-blue-500 animate-spin" style={{ animation: 'spin 3s linear infinite' }}></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-lg p-2">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 shadow-sm relative overflow-hidden" style={{ borderColor: status.color }}>
          <div className="absolute inset-0 rounded-xl border-2 animate-spin" style={{ borderColor: status.color, animation: 'spin 3s linear infinite' }}></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg p-2">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
            <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 52: Texto com Layout de Card com Partículas
export const Prototype52 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, ${status.color}, ${status.color}80)` }}></div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
          <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 53: Texto com Layout de Card com Efeito de Brilho
export const Prototype53 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative group">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative group">
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${status.color}20, transparent)` }}></div>
          <div className="relative">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
            <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 54: Texto com Layout de Card com Efeito de Ondas
export const Prototype54 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-pulse"></div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-1 animate-pulse" style={{ background: `linear-gradient(90deg, ${status.color}, ${status.color}80, ${status.color})` }}></div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
          <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 55: Texto com Layout de Card com Efeito de Escala
export const Prototype55 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:scale-110 transition-transform duration-300">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:scale-110 transition-transform duration-300">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
          <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 56: Texto com Layout de Card com Efeito de Rotação
export const Prototype56 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:rotate-3 transition-transform duration-300">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:rotate-3 transition-transform duration-300">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
          <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 57: Texto com Layout de Card com Efeito de Desfoque
export const Prototype57 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:backdrop-blur-sm transition-all duration-300">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:backdrop-blur-sm transition-all duration-300">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
          <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 58: Texto com Layout de Card com Sombra Dinâmica
export const Prototype58 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-2xl transition-all duration-300" style={{ '--tw-shadow-colored': `${status.color}25` } as any}>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
          <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 59: Texto com Layout de Card com Gradiente Animado
export const Prototype59 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm animate-pulse">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm animate-pulse">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
          <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
        </div>
      ))}
    </div>
  </div>
)

// Protótipo 60: Texto com Layout de Card com Partículas Flutuantes
export const Prototype60 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="relative">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${status.color}20, transparent)` }}></div>
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: status.color }}></div>
          <div className="relative">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status.name}</div>
            <div className="text-3xl font-bold" style={{ color: status.color }}>{status.count}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
)
