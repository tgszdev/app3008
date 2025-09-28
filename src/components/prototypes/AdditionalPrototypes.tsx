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

// Protótipo 11: Cards com Glassmorphism
export const Prototype11 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Snowflake className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg rounded-xl p-4 border border-white/30 dark:border-gray-700/30 shadow-lg">
        <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg rounded-xl p-4 border border-white/30 dark:border-gray-700/30 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4" style={{ color: status.color }} />
              <div className="text-sm text-gray-700 dark:text-gray-300 truncate">{status.name}</div>
            </div>
            <div className="text-xl font-bold" style={{ color: status.color }}>{status.count}</div>
          </div>
        )
      })}
    </div>
  </div>
)

// Protótipo 12: Cards com Neumorphism
export const Prototype12 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Circle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.1),inset_2px_2px_4px_rgba(0,0,0,0.1)] dark:shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(0,0,0,0.3)]">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.1),inset_2px_2px_4px_rgba(0,0,0,0.1)] dark:shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(0,0,0,0.3)]">
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

// Protótipo 13: Cards com Hover Effects
export const Prototype13 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
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

// Protótipo 14: Cards com Badges
export const Prototype14 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative">
        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Total</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative">
            <div className="absolute -top-2 -right-2 text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: status.color }}>{status.count}</div>
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

// Protótipo 15: Cards com Linhas de Progresso
export const Prototype15 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">{mockData.total}</div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div className="bg-blue-600 h-1 rounded-full" style={{ width: '100%' }}></div>
        </div>
      </div>
      
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        const percentage = (status.count / mockData.total) * 100
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4" style={{ color: status.color }} />
              <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{status.name}</div>
            </div>
            <div className="text-xl font-bold mb-2" style={{ color: status.color }}>{status.count}</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div className="h-1 rounded-full" style={{ width: `${percentage}%`, backgroundColor: status.color }}></div>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)
