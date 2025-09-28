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

// Protótipo 16: Cards com Formas Geométricas
export const Prototype16 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Triangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm transform rotate-1 hover:rotate-0 transition-transform">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        const rotation = (index % 2 === 0) ? 'rotate-1' : '-rotate-1'
        return (
          <div key={index} className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm transform ${rotation} hover:rotate-0 transition-transform`}>
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

// Protótipo 17: Cards com Padrões
export const Prototype17 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Grid className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
        <div className="relative">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${status.color}, transparent)` }}></div>
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

// Protótipo 18: Cards com Efeitos de Luz
export const Prototype18 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Sun className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative group">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative group">
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(135deg, ${status.color}20, transparent)` }}></div>
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

// Protótipo 19: Cards com Bordas Animadas
export const Prototype19 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Heart className="h-5 w-5 text-red-600 dark:text-red-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-blue-500 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse"></div>
        <div className="relative">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 shadow-sm relative overflow-hidden" style={{ borderColor: status.color }}>
            <div className="absolute inset-0 rounded-xl animate-pulse" style={{ background: `linear-gradient(90deg, transparent, ${status.color}20, transparent)` }}></div>
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

// Protótipo 20: Cards com Efeitos 3D
export const Prototype20 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Diamond className="h-5 w-5 text-pink-600 dark:text-pink-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
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
