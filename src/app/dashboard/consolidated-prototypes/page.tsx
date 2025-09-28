'use client'

import React, { useState } from 'react'
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
import { 
  Prototype6, 
  Prototype7, 
  Prototype8, 
  Prototype9, 
  Prototype10 
} from '@/components/prototypes/ConsolidatedPrototypes'
import { 
  Prototype11, 
  Prototype12, 
  Prototype13, 
  Prototype14, 
  Prototype15 
} from '@/components/prototypes/AdditionalPrototypes'
import { 
  Prototype16, 
  Prototype17, 
  Prototype18, 
  Prototype19, 
  Prototype20 
} from '@/components/prototypes/MorePrototypes'
import { 
  Prototype21, 
  Prototype22, 
  Prototype23, 
  Prototype24, 
  Prototype25,
  Prototype26,
  Prototype27,
  Prototype28,
  Prototype29,
  Prototype30
} from '@/components/prototypes/FinalPrototypes'

// Dados mockados para os protótipos
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

// Função para obter ícones dinamicamente
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

// Protótipo 1: Cards Minimalistas
const Prototype1 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {/* Total */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {/* Status */}
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
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

// Protótipo 2: Cards com Gradientes
const Prototype2 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {/* Total */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
        <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{mockData.total}</div>
      </div>
      
      {/* Status */}
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        const bgColor = `${status.color}20`
        const borderColor = `${status.color}40`
        return (
          <div key={index} className={`bg-gradient-to-br rounded-xl p-4 border shadow-sm`} style={{ 
            background: `linear-gradient(135deg, ${bgColor}, ${status.color}10)`,
            borderColor: borderColor
          }}>
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

// Protótipo 3: Cards com Bordas Coloridas
const Prototype3 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {/* Total */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 border-blue-500 shadow-sm">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {/* Status */}
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 shadow-sm" style={{ borderLeftColor: status.color }}>
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

// Protótipo 4: Cards com Ícones Grandes
const Prototype4 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <PieChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {/* Total */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm text-center">
        <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockData.total}</div>
      </div>
      
      {/* Status */}
      {mockData.status.map((status, index) => {
        const Icon = getIcon(status.icon)
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm text-center">
            <Icon className="h-8 w-8 mx-auto mb-3" style={{ color: status.color }} />
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">{status.name}</div>
            <div className="text-2xl font-bold" style={{ color: status.color }}>{status.count}</div>
          </div>
        )
      })}
    </div>
  </div>
)

// Protótipo 5: Cards com Progress Bars
const Prototype5 = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo Consolidado</h2>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {/* Total */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total no Período</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">{mockData.total}</div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
        </div>
      </div>
      
      {/* Status */}
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
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="h-2 rounded-full" style={{ width: `${percentage}%`, backgroundColor: status.color }}></div>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)

export default function ConsolidatedPrototypes() {
  const [selectedPrototype, setSelectedPrototype] = useState(1)
  
  const prototypes = [
    { id: 1, name: 'Cards Minimalistas', component: Prototype1 },
    { id: 2, name: 'Cards com Gradientes', component: Prototype2 },
    { id: 3, name: 'Cards com Bordas Coloridas', component: Prototype3 },
    { id: 4, name: 'Cards com Ícones Grandes', component: Prototype4 },
    { id: 5, name: 'Cards com Progress Bars', component: Prototype5 },
    { id: 6, name: 'Cards Hexagonais', component: Prototype6 },
    { id: 7, name: 'Cards com Sombras Coloridas', component: Prototype7 },
    { id: 8, name: 'Cards com Backgrounds Coloridos', component: Prototype8 },
    { id: 9, name: 'Cards com Animações', component: Prototype9 },
    { id: 10, name: 'Cards com Bordas Duplas', component: Prototype10 },
    { id: 11, name: 'Cards com Glassmorphism', component: Prototype11 },
    { id: 12, name: 'Cards com Neumorphism', component: Prototype12 },
    { id: 13, name: 'Cards com Hover Effects', component: Prototype13 },
    { id: 14, name: 'Cards com Badges', component: Prototype14 },
    { id: 15, name: 'Cards com Linhas de Progresso', component: Prototype15 },
    { id: 16, name: 'Cards com Formas Geométricas', component: Prototype16 },
    { id: 17, name: 'Cards com Padrões', component: Prototype17 },
    { id: 18, name: 'Cards com Efeitos de Luz', component: Prototype18 },
    { id: 19, name: 'Cards com Bordas Animadas', component: Prototype19 },
    { id: 20, name: 'Cards com Efeitos 3D', component: Prototype20 },
    { id: 21, name: 'Cards com Efeitos de Partículas', component: Prototype21 },
    { id: 22, name: 'Cards com Efeitos de Brilho', component: Prototype22 },
    { id: 23, name: 'Cards com Efeitos de Ondas', component: Prototype23 },
    { id: 24, name: 'Cards com Efeitos de Escala', component: Prototype24 },
    { id: 25, name: 'Cards com Efeitos de Rotação', component: Prototype25 },
    { id: 26, name: 'Cards com Efeitos de Desfoque', component: Prototype26 },
    { id: 27, name: 'Cards com Sombra Dinâmica', component: Prototype27 },
    { id: 28, name: 'Cards com Gradiente Animado', component: Prototype28 },
    { id: 29, name: 'Cards com Borda Animada', component: Prototype29 },
    { id: 30, name: 'Cards com Partículas Flutuantes', component: Prototype30 }
  ]
  
  const SelectedComponent = prototypes.find(p => p.id === selectedPrototype)?.component || Prototype1
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Protótipos - Resumo Consolidado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            30 sugestões completas com Dark Mode, Light Mode, Color Theory, Color Psychology, Acessibilidade WCAG e UX
          </p>
        </div>
        
        {/* Seletor de Protótipos */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {prototypes.map((prototype) => (
              <button
                key={prototype.id}
                onClick={() => setSelectedPrototype(prototype.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 text-center ${
                  selectedPrototype === prototype.id
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-105'
                }`}
              >
                {prototype.id}. {prototype.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Preview do Protótipo Selecionado */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <SelectedComponent />
        </div>
      </div>
    </div>
  )
}
