'use client'

import React from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Activity,
  PieChart,
  Target,
  Zap,
  Shield,
  Star,
  Award,
  Rocket,
  Globe,
  Database,
  Layers,
  Grid,
  Hexagon,
  Circle,
  Square,
  Triangle,
  Diamond,
  Heart,
  Sparkles,
  Flame,
  Snowflake,
  Leaf,
  Sun
} from 'lucide-react'

const mockData = {
  total: 13,
  status: [
    { name: 'Aberto', count: 4, color: '#3B82F6', icon: 'AlertCircle' },
    { name: 'Ag. Deploy em Homologação', count: 3, color: '#3B82F6', icon: 'Rocket' },
    { name: 'Em Atendimento', count: 2, color: '#F59E0B', icon: 'Users' },
    { name: 'Em Homologação', count: 1, color: '#8B5CF6', icon: 'Clock' },
    { name: 'Ag. Deploy em Produção', count: 1, color: '#3B82F6', icon: 'Rocket' },
    { name: 'Cancelado', count: 1, color: '#EF4444', icon: 'XCircle' },
    { name: 'Resolvido', count: 1, color: '#10B981', icon: 'CheckCircle' }
  ]
}

const getIcon = (iconName: string) => {
  const icons: { [key: string]: any } = {
    AlertCircle, Rocket, Users, Clock, XCircle, CheckCircle,
    BarChart3, TrendingUp, Activity, PieChart, Target, Zap,
    Shield, Star, Award, Globe, Database, Layers, Grid,
    Hexagon, Circle, Square, Triangle, Diamond, Heart,
    Sparkles, Flame, Snowflake, Leaf, Sun
  }
  return icons[iconName] || BarChart3
}

// Protótipo 21: Cards com Efeitos de Partículas
export const Prototype21 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, ${status.color}, ${status.color}80)` }}></div>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4" style={{ color: status.color }} />
              <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{status.name}</div>
            </div>
            <div className="text-xl font-bold" style={{ color: status.color }}>{status.count}</div>
          </div>
        )
      })}
    </div>
  </div>
)

// Protótipo 22: Cards com Efeitos de Brilho
export const Prototype22 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Globe className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative group">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative group">
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${status.color}20, transparent)` }}></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" style={{ color: status.color }} />
                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{status.name}</div>
              </div>
              <div className="text-xl font-bold" style={{ color: status.color }}>{status.count}</div>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)

// Protótipo 23: Cards com Efeitos de Ondas
export const Prototype23 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-pulse"></div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-full h-1 animate-pulse" style={{ background: `linear-gradient(90deg, ${status.color}, ${status.color}80, ${status.color})` }}></div>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4" style={{ color: status.color }} />
              <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{status.name}</div>
            </div>
            <div className="text-xl font-bold" style={{ color: status.color }}>{status.count}</div>
          </div>
        )
      })}
    </div>
  </div>
)

// Protótipo 24: Cards com Efeitos de Escala
export const Prototype24 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Square className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:scale-110 transition-transform duration-300">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:scale-110 transition-transform duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4" style={{ color: status.color }} />
              <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{status.name}</div>
            </div>
            <div className="text-xl font-bold" style={{ color: status.color }}>{status.count}</div>
          </div>
        )
      })}
    </div>
  </div>
)

// Protótipo 25: Cards com Efeitos de Rotação
export const Prototype25 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Circle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:rotate-3 transition-transform duration-300">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:rotate-3 transition-transform duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4" style={{ color: status.color }} />
              <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{status.name}</div>
            </div>
            <div className="text-xl font-bold" style={{ color: status.color }}>{status.count}</div>
          </div>
        )
      })}
    </div>
  </div>
)

// Protótipo 26: Cards com Efeitos de Desfoque
export const Prototype26 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:backdrop-blur-sm transition-all duration-300">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:backdrop-blur-sm transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4" style={{ color: status.color }} />
              <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{status.name}</div>
            </div>
            <div className="text-xl font-bold" style={{ color: status.color }}>{status.count}</div>
          </div>
        )
      })}
    </div>
  </div>
)

// Protótipo 27: Cards com Efeitos de Sombra Dinâmica
export const Prototype27 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-2xl transition-all duration-300" style={{ '--tw-shadow-colored': `${status.color}25` } as any}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4" style={{ color: status.color }} />
              <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{status.name}</div>
            </div>
            <div className="text-xl font-bold" style={{ color: status.color }}>{status.count}</div>
          </div>
        )
      })}
    </div>
  </div>
)

// Protótipo 28: Cards com Efeitos de Gradiente Animado
export const Prototype28 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm animate-pulse">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4" style={{ color: status.color }} />
              <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{status.name}</div>
            </div>
            <div className="text-xl font-bold" style={{ color: status.color }}>{status.count}</div>
          </div>
        )
      })}
    </div>
  </div>
)

// Protótipo 29: Cards com Efeitos de Borda Animada
export const Prototype29 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-blue-500 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 rounded-xl border-2 border-blue-500 animate-spin" style={{ animation: 'spin 3s linear infinite' }}></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-lg p-2">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 shadow-sm relative overflow-hidden" style={{ borderColor: status.color }}>
            <div className="absolute inset-0 rounded-xl border-2 animate-spin" style={{ borderColor: status.color, animation: 'spin 3s linear infinite' }}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg p-2">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" style={{ color: status.color }} />
                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{status.name}</div>
              </div>
              <div className="text-xl font-bold" style={{ color: status.color }}>{status.count}</div>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)

// Protótipo 30: Cards com Efeitos de Partículas Flutuantes
export const Prototype30 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Rocket className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="relative">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${status.color}20, transparent)` }}></div>
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: status.color }}></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" style={{ color: status.color }} />
                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{status.name}</div>
              </div>
              <div className="text-xl font-bold" style={{ color: status.color }}>{status.count}</div>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)
