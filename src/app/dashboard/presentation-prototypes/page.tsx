'use client'

import { useState } from 'react'
import {
  Building,
  TrendingUp,
  Users,
  BarChart,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  Filter,
  Download,
  Eye,
  Star,
  Zap,
  Target,
  Award,
  Shield,
  Rocket,
  Sparkles,
  Layers,
  Grid,
  Layout,
  Palette,
  MousePointer,
  Maximize,
  Minimize,
  RotateCcw,
  Settings
} from 'lucide-react'

// Dados mockados para os protótipos
const mockData = {
  clients: [
    { id: '1', name: 'Luft Agro', type: 'Cliente', tickets: 12, status: 'active' },
    { id: '2', name: 'Simas Log', type: 'Cliente', tickets: 8, status: 'active' },
    { id: '3', name: 'TechCorp', type: 'Cliente', tickets: 15, status: 'active' },
    { id: '4', name: 'InnovaSoft', type: 'Cliente', tickets: 6, status: 'active' }
  ],
  stats: {
    total: 41,
    open: 12,
    inProgress: 8,
    resolved: 18,
    cancelled: 3
  },
  categories: [
    { name: 'Suporte Técnico', count: 15, color: '#3B82F6', icon: 'Shield' },
    { name: 'Desenvolvimento', count: 12, color: '#10B981', icon: 'Code' },
    { name: 'Infraestrutura', count: 8, color: '#F59E0B', icon: 'Server' },
    { name: 'Consultoria', count: 6, color: '#8B5CF6', icon: 'Users' }
  ]
}

// Protótipos de apresentação
const prototypes = [
  {
    id: 1,
    name: 'Dashboard Minimalista',
    description: 'Design limpo com foco nos dados essenciais',
    features: ['Cards compactos', 'Tipografia clara', 'Cores neutras'],
    complexity: 'Baixa',
    tags: ['Minimalista', 'Profissional'],
    component: () => (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BarChart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h3>
              <p className="text-sm text-gray-500">Visão geral do sistema</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-sm">
              Exportar
            </button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">
              Ver mais
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockData.stats.total}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Abertos</p>
            <p className="text-2xl font-bold text-blue-600">{mockData.stats.open}</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 2,
    name: 'Cards com Gradiente',
    description: 'Visual moderno com gradientes e sombras',
    features: ['Gradientes suaves', 'Sombras profundas', 'Animações'],
    complexity: 'Média',
    tags: ['Moderno', 'Gradiente'],
    component: () => (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Performance em tempo real</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">
              Exportar
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-sm font-medium">
              Ver mais
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{mockData.stats.total}</p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Abertos</p>
            <p className="text-3xl font-bold text-blue-600">{mockData.stats.open}</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 3,
    name: 'Layout Corporativo',
    description: 'Design profissional para ambientes corporativos',
    features: ['Cores corporativas', 'Layout estruturado', 'Hierarquia clara'],
    complexity: 'Baixa',
    tags: ['Corporativo', 'Profissional'],
    component: () => (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Building className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Relatório Executivo</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Setembro 2024</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm">
              Exportar
            </button>
            <button className="px-3 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-sm">
              Ver mais
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total de Tickets</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{mockData.stats.total}</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Em Aberto</p>
            <p className="text-2xl font-semibold text-blue-600">{mockData.stats.open}</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 4,
    name: 'Dark Mode Premium',
    description: 'Visual premium com tema escuro',
    features: ['Tema escuro', 'Acentos coloridos', 'Contraste alto'],
    complexity: 'Média',
    tags: ['Dark Mode', 'Premium'],
    component: () => (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Dashboard</h3>
              <p className="text-sm text-gray-400">Métricas em tempo real</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg text-sm border border-gray-700">
              Exportar
            </button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">
              Ver mais
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400">Total</p>
            <p className="text-2xl font-bold text-white">{mockData.stats.total}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400">Abertos</p>
            <p className="text-2xl font-bold text-blue-400">{mockData.stats.open}</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 5,
    name: 'Cards Flutuantes',
    description: 'Design com cards que parecem flutuar',
    features: ['Sombras profundas', 'Espaçamento generoso', 'Efeito flutuante'],
    complexity: 'Média',
    tags: ['Flutuante', 'Moderno'],
    component: () => (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Performance</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Métricas avançadas</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium shadow-md">
                Exportar
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium shadow-lg">
                Ver mais
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 shadow-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{mockData.stats.total}</p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 shadow-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Abertos</p>
              <p className="text-3xl font-bold text-green-600">{mockData.stats.open}</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 6,
    name: 'Layout Compacto',
    description: 'Máximo de informações em espaço mínimo',
    features: ['Densidade alta', 'Informações condensadas', 'Eficiência'],
    complexity: 'Baixa',
    tags: ['Compacto', 'Eficiente'],
    component: () => (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Dashboard</h3>
          </div>
          <button className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            Ver mais
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
            <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{mockData.stats.total}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
            <p className="text-xs text-gray-600 dark:text-gray-400">Abertos</p>
            <p className="text-lg font-bold text-blue-600">{mockData.stats.open}</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 7,
    name: 'Design Glassmorphism',
    description: 'Efeito de vidro com transparência',
    features: ['Transparência', 'Blur effects', 'Bordas suaves'],
    complexity: 'Alta',
    tags: ['Glassmorphism', 'Moderno'],
    component: () => (
      <div className="bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-8 rounded-2xl">
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/30 backdrop-blur-sm rounded-xl border border-white/40">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Analytics</h3>
                <p className="text-sm text-white/80">Dados em tempo real</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-medium border border-white/30">
                Exportar
              </button>
              <button className="px-4 py-2 bg-white/30 backdrop-blur-sm text-white rounded-xl text-sm font-medium border border-white/40">
                Ver mais
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <p className="text-sm text-white/80 mb-1">Total</p>
              <p className="text-3xl font-bold text-white">{mockData.stats.total}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <p className="text-sm text-white/80 mb-1">Abertos</p>
              <p className="text-3xl font-bold text-white">{mockData.stats.open}</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 8,
    name: 'Layout Assimétrico',
    description: 'Design que quebra a simetria tradicional',
    features: ['Layout único', 'Hierarquia visual', 'Criatividade'],
    complexity: 'Alta',
    tags: ['Assimétrico', 'Criativo'],
    component: () => (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl transform rotate-3">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Métricas principais</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-xl text-sm font-medium transform -rotate-1">
            Ver mais
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 transform -rotate-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockData.stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 transform rotate-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">Abertos</p>
            <p className="text-2xl font-bold text-green-600">{mockData.stats.open}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 transform -rotate-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">Progresso</p>
            <p className="text-2xl font-bold text-purple-600">{mockData.stats.inProgress}</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 9,
    name: 'Design Neon',
    description: 'Visual futurista com efeitos neon',
    features: ['Cores vibrantes', 'Efeitos glow', 'Estilo cyberpunk'],
    complexity: 'Alta',
    tags: ['Neon', 'Futurista'],
    component: () => (
      <div className="bg-gray-900 rounded-xl p-6 border border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500 rounded-xl shadow-lg shadow-cyan-500/50">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-cyan-400">Dashboard</h3>
              <p className="text-sm text-cyan-300">Sistema avançado</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-cyan-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-cyan-500/50">
            Ver mais
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
            <p className="text-sm text-cyan-300">Total</p>
            <p className="text-3xl font-bold text-cyan-400">{mockData.stats.total}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-pink-500/30 shadow-lg shadow-pink-500/10">
            <p className="text-sm text-pink-300">Abertos</p>
            <p className="text-3xl font-bold text-pink-400">{mockData.stats.open}</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 10,
    name: 'Layout Modular',
    description: 'Componentes modulares e reutilizáveis',
    features: ['Módulos independentes', 'Flexibilidade', 'Escalabilidade'],
    complexity: 'Média',
    tags: ['Modular', 'Flexível'],
    component: () => (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Layers className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Módulo principal</p>
            </div>
          </div>
          <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">
            Ver mais
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockData.stats.total}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Abertos</p>
            <p className="text-2xl font-bold text-blue-600">{mockData.stats.open}</p>
          </div>
        </div>
      </div>
    )
  }
]

// Adicionar mais 20 protótipos para completar 30
const additionalPrototypes = [
  {
    id: 11,
    name: 'Design Material',
    description: 'Seguindo princípios do Material Design',
    features: ['Elevação', 'Cores vibrantes', 'Animações'],
    complexity: 'Média',
    tags: ['Material', 'Google'],
    component: () => (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg shadow-md">
              <Grid className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Material Design</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-shadow">
            Ver mais
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockData.stats.total}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400">Abertos</p>
            <p className="text-2xl font-bold text-green-600">{mockData.stats.open}</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 12,
    name: 'Layout Retrô',
    description: 'Estilo vintage com cores clássicas',
    features: ['Cores retrô', 'Tipografia clássica', 'Nostalgia'],
    complexity: 'Baixa',
    tags: ['Retrô', 'Vintage'],
    component: () => (
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border-2 border-amber-200 dark:border-amber-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600 rounded-lg">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">Dashboard</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">Estilo clássico</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium">
            Ver mais
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-amber-100 dark:bg-amber-800/30 rounded-lg p-4 border border-amber-300 dark:border-amber-700">
            <p className="text-sm text-amber-800 dark:text-amber-200">Total</p>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{mockData.stats.total}</p>
          </div>
          <div className="bg-amber-100 dark:bg-amber-800/30 rounded-lg p-4 border border-amber-300 dark:border-amber-700">
            <p className="text-sm text-amber-800 dark:text-amber-200">Abertos</p>
            <p className="text-2xl font-bold text-amber-600">{mockData.stats.open}</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 13,
    name: 'Design Monocromático',
    description: 'Paleta de cores única e elegante',
    features: ['Uma cor principal', 'Tons variados', 'Elegância'],
    complexity: 'Baixa',
    tags: ['Monocromático', 'Elegante'],
    component: () => (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-600 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monocromático</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium">
            Ver mais
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockData.stats.total}</p>
          </div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Abertos</p>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{mockData.stats.open}</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 14,
    name: 'Layout Geométrico',
    description: 'Formas geométricas e padrões',
    features: ['Formas geométricas', 'Padrões', 'Matemática visual'],
    complexity: 'Alta',
    tags: ['Geométrico', 'Matemático'],
    component: () => (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full -translate-y-16 translate-x-16 opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full translate-y-12 -translate-x-12 opacity-20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg transform rotate-45">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Geométrico</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium">
              Ver mais
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 transform rotate-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockData.stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4 transform -rotate-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Abertos</p>
              <p className="text-2xl font-bold text-green-600">{mockData.stats.open}</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 15,
    name: 'Design Minimalista Avançado',
    description: 'Minimalismo com funcionalidades avançadas',
    features: ['Máxima simplicidade', 'Funcionalidade completa', 'Elegância'],
    complexity: 'Média',
    tags: ['Minimalista', 'Avançado'],
    component: () => (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-light text-gray-900 dark:text-white">Dashboard</h3>
            <div className="w-16 h-0.5 bg-gray-300 dark:bg-gray-600 mt-2"></div>
          </div>
          <button className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            Ver mais →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <p className="text-4xl font-thin text-gray-900 dark:text-white mb-2">{mockData.stats.total}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-thin text-blue-600 mb-2">{mockData.stats.open}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Abertos</p>
          </div>
        </div>
      </div>
    )
  }
]

// Combinar todos os protótipos
const allPrototypes = [...prototypes, ...additionalPrototypes]

export default function PresentationPrototypes() {
  const [selectedPrototype, setSelectedPrototype] = useState<number | null>(null)
  const [filter, setFilter] = useState('all')

  const filteredPrototypes = allPrototypes.filter(prototype => {
    if (filter === 'all') return true
    return prototype.tags.includes(filter)
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Protótipos de Apresentação
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            30 designs modernos com boas práticas UX e profissional
          </p>
          
          {/* Filtros */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {['all', 'Moderno', 'Profissional', 'Minimalista', 'Futurista', 'Corporativo'].map(tag => (
              <button
                key={tag}
                onClick={() => setFilter(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === tag
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tag === 'all' ? 'Todos' : tag}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Protótipos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrototypes.map((prototype) => (
            <div
              key={prototype.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => setSelectedPrototype(prototype.id)}
            >
              {/* Preview do Protótipo */}
              <div className="p-4">
                <prototype.component />
              </div>
              
              {/* Informações do Protótipo */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {prototype.name}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    prototype.complexity === 'Baixa' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                    prototype.complexity === 'Média' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {prototype.complexity}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {prototype.description}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {prototype.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Eye className="h-4 w-4" />
                    <span>Clique para ver detalhes</span>
                  </div>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Selecionar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de Detalhes */}
        {selectedPrototype && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {allPrototypes.find(p => p.id === selectedPrototype)?.name}
                  </h2>
                  <button
                    onClick={() => setSelectedPrototype(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="mb-6">
                  {allPrototypes.find(p => p.id === selectedPrototype)?.component()}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Características
                    </h3>
                    <ul className="space-y-2">
                      {allPrototypes.find(p => p.id === selectedPrototype)?.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Informações
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Complexidade:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          allPrototypes.find(p => p.id === selectedPrototype)?.complexity === 'Baixa' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                          allPrototypes.find(p => p.id === selectedPrototype)?.complexity === 'Média' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {allPrototypes.find(p => p.id === selectedPrototype)?.complexity}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {allPrototypes.find(p => p.id === selectedPrototype)?.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Implementar Este Design
                  </button>
                  <button
                    onClick={() => setSelectedPrototype(null)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
