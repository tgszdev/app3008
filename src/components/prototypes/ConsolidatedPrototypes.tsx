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

// Dados mockados
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

// Protótipo 6: Cards Hexagonais
export const Prototype6 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Hexagon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm transform hover:scale-105 transition-transform">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm transform hover:scale-105 transition-transform">
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

// Protótipo 7: Cards com Sombras Coloridas
export const Prototype7 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg shadow-blue-500/20">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg" style={{ boxShadow: `0 10px 25px -5px ${status.color}20` }}>
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

// Protótipo 8: Cards com Backgrounds Coloridos
export const Prototype8 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Flame className="h-5 w-5 text-red-600 dark:text-red-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="rounded-xl p-4 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
        <div className="text-sm opacity-90 mb-1">Total no Período</div>
        <div className="text-2xl font-bold">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="rounded-xl p-4 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${status.color}, ${status.color}CC)` }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4" />
              <div className="text-sm opacity-90 truncate">{status.name}</div>
            </div>
            <div className="text-xl font-bold">{status.count}</div>
          </div>
        )
      })}
    </div>
  </div>
)

// Protótipo 9: Cards com Animações
export const Prototype9 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
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

// Protótipo 10: Cards com Bordas Duplas
export const Prototype10 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-700 shadow-sm">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 shadow-sm" style={{ borderColor: `${status.color}40` }}>
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
