'use client'

import { useState } from 'react'
import { 
  Building, 
  Users, 
  Calendar,
  Filter,
  Download,
  Settings,
  Eye,
  Zap,
  Star,
  Target,
  Layers,
  Cpu,
  Shield,
  Sparkles,
  Rocket,
  Brain,
  Palette,
  Lightbulb,
  CheckCircle,
  XCircle,
  RefreshCw,
  Bell,
  Heart,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Search,
  Grid3X3,
  Layout,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Clock,
  FileText,
  User,
  Mail,
  Phone,
  Globe,
  Database,
  Lock,
  Unlock,
  AlertTriangle,
  Info,
  HelpCircle,
  Menu,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Share,
  ExternalLink,
  Maximize,
  Minimize,
  RotateCcw,
  Save,
  Upload,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Desktop
} from 'lucide-react'

interface ButtonPrototype {
  id: number
  name: string
  description: string
  category: string
  features: string[]
  icon: any
  complexity: 'Low' | 'Medium' | 'High'
  futuristic: boolean
  professional: boolean
  preview: string
  component: React.ReactNode
}

const ButtonPrototypes: ButtonPrototype[] = [
  // PROTÓTIPO 1: Botões Flutuantes
  {
    id: 1,
    name: "Botões Flutuantes",
    description: "Botões com elevação sutil e sombras dinâmicas",
    category: "Layout",
    features: ["Sombras suaves", "Hover effects", "Transições fluidas", "Z-index inteligente"],
    icon: Layers,
    complexity: "Low",
    futuristic: true,
    professional: true,
    preview: "Botões com elevação sutil e animações de hover",
    component: (
      <div className="bg-gray-900 p-6 rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Dashboard</h2>
              <p className="text-sm text-gray-400">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span>4 clientes</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 text-white">
              <User className="w-4 h-4" />
              <span>Meus Tickets</span>
            </button>
            <button className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 text-white">
              <Calendar className="w-4 h-4" />
              <span>Mês Atual</span>
              <Filter className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 text-white">
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 2: Glassmorphism
  {
    id: 2,
    name: "Glassmorphism",
    description: "Efeito de vidro translúcido com blur",
    category: "Visual",
    features: ["Transparência", "Blur effects", "Gradientes", "Bordas suaves"],
    icon: Sparkles,
    complexity: "Medium",
    futuristic: true,
    professional: true,
    preview: "Botões com efeito de vidro e blur",
    component: (
      <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6 rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Dashboard</h2>
              <p className="text-sm text-gray-300">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl shadow-2xl hover:bg-white/30 transition-all duration-300 flex items-center gap-2 text-white">
              <Building className="w-4 h-4" />
              <span>4 clientes</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white/15 backdrop-blur-md border border-white/25 rounded-xl shadow-2xl hover:bg-white/25 transition-all duration-300 flex items-center gap-2 text-white">
              <User className="w-4 h-4" />
              <span>Meus Tickets</span>
            </button>
            <button className="px-4 py-2 bg-white/15 backdrop-blur-md border border-white/25 rounded-xl shadow-2xl hover:bg-white/25 transition-all duration-300 flex items-center gap-2 text-white">
              <Calendar className="w-4 h-4" />
              <span>Mês Atual</span>
              <Filter className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-white/15 backdrop-blur-md border border-white/25 rounded-xl shadow-2xl hover:bg-white/25 transition-all duration-300 flex items-center gap-2 text-white">
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 3: Neumorphism
  {
    id: 3,
    name: "Neumorphism",
    description: "Efeito de relevo com sombras suaves",
    category: "Visual",
    features: ["Sombras internas", "Relevo sutil", "Cores suaves", "Bordas arredondadas"],
    icon: Layers,
    complexity: "Low",
    futuristic: false,
    professional: true,
    preview: "Botões com efeito de relevo e profundidade",
    component: (
      <div className="bg-gray-200 p-6 rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
              <p className="text-sm text-gray-600">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-2 bg-gray-200 shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.7),inset_2px_2px_4px_rgba(0,0,0,0.1)] rounded-xl hover:shadow-[inset_-1px_-1px_2px_rgba(255,255,255,0.7),inset_1px_1px_2px_rgba(0,0,0,0.1)] transition-all duration-300 flex items-center gap-2 text-gray-700">
              <Building className="w-4 h-4" />
              <span>4 clientes</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-gray-200 shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.7),inset_2px_2px_4px_rgba(0,0,0,0.1)] rounded-xl hover:shadow-[inset_-1px_-1px_2px_rgba(255,255,255,0.7),inset_1px_1px_2px_rgba(0,0,0,0.1)] transition-all duration-300 flex items-center gap-2 text-gray-700">
              <User className="w-4 h-4" />
              <span>Meus Tickets</span>
            </button>
            <button className="px-4 py-2 bg-gray-200 shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.7),inset_2px_2px_4px_rgba(0,0,0,0.1)] rounded-xl hover:shadow-[inset_-1px_-1px_2px_rgba(255,255,255,0.7),inset_1px_1px_2px_rgba(0,0,0,0.1)] transition-all duration-300 flex items-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4" />
              <span>Mês Atual</span>
              <Filter className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-gray-200 shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.7),inset_2px_2px_4px_rgba(0,0,0,0.1)] rounded-xl hover:shadow-[inset_-1px_-1px_2px_rgba(255,255,255,0.7),inset_1px_1px_2px_rgba(0,0,0,0.1)] transition-all duration-300 flex items-center gap-2 text-gray-700">
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 4: Gradientes Dinâmicos
  {
    id: 4,
    name: "Gradientes Dinâmicos",
    description: "Gradientes que mudam baseado no estado",
    category: "Visual",
    features: ["Color transitions", "State-based colors", "Smooth animations", "Accessibility"],
    icon: Palette,
    complexity: "Medium",
    futuristic: true,
    professional: true,
    preview: "Cores que fluem suavemente entre estados",
    component: (
      <div className="bg-gray-900 p-6 rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Dashboard</h2>
              <p className="text-sm text-gray-400">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 shadow-lg">
              <Building className="w-4 h-4" />
              <span>4 clientes</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl hover:from-green-600 hover:to-teal-700 transition-all duration-300 flex items-center gap-2 shadow-lg">
              <User className="w-4 h-4" />
              <span>Meus Tickets</span>
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 flex items-center gap-2 shadow-lg">
              <Calendar className="w-4 h-4" />
              <span>Mês Atual</span>
              <Filter className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 flex items-center gap-2 shadow-lg">
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 5: Minimalista
  {
    id: 5,
    name: "Minimalista",
    description: "Design limpo e focado no essencial",
    category: "Layout",
    features: ["Clean design", "Minimal colors", "Focus on content", "Simple interactions"],
    icon: Target,
    complexity: "Low",
    futuristic: false,
    professional: true,
    preview: "Design limpo e focado no essencial",
    component: (
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-sm text-gray-600">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 border border-gray-300">
              <Building className="w-4 h-4" />
              <span>4 clientes</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 border border-gray-300">
              <User className="w-4 h-4" />
              <span>Meus Tickets</span>
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 border border-gray-300">
              <Calendar className="w-4 h-4" />
              <span>Mês Atual</span>
              <Filter className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 border border-gray-300">
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 6: Futurista
  {
    id: 6,
    name: "Futurista",
    description: "Design com elementos futuristas e neon",
    category: "Visual",
    features: ["Neon effects", "Glowing borders", "Cyber aesthetics", "High contrast"],
    icon: Rocket,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Design com elementos futuristas e neon",
    component: (
      <div className="bg-black p-6 rounded-xl border border-cyan-500/30">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-cyan-400">Dashboard</h2>
              <p className="text-sm text-cyan-300">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-2 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition-all duration-300 flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              <Building className="w-4 h-4" />
              <span>4 clientes</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-green-500/20 border border-green-500 text-green-400 rounded-xl hover:bg-green-500/30 transition-all duration-300 flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              <User className="w-4 h-4" />
              <span>Meus Tickets</span>
            </button>
            <button className="px-4 py-2 bg-purple-500/20 border border-purple-500 text-purple-400 rounded-xl hover:bg-purple-500/30 transition-all duration-300 flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <Calendar className="w-4 h-4" />
              <span>Mês Atual</span>
              <Filter className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-pink-500/20 border border-pink-500 text-pink-400 rounded-xl hover:bg-pink-500/30 transition-all duration-300 flex items-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 7: Material Design
  {
    id: 7,
    name: "Material Design",
    description: "Seguindo as diretrizes do Material Design",
    category: "Layout",
    features: ["Material shadows", "Ripple effects", "Typography scale", "Color system"],
    icon: Layers,
    complexity: "Medium",
    futuristic: false,
    professional: true,
    preview: "Seguindo as diretrizes do Material Design",
    component: (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-sm text-gray-600">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 hover:bg-blue-700">
              <Building className="w-4 h-4" />
              <span>4 clientes</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 hover:bg-green-700">
              <User className="w-4 h-4" />
              <span>Meus Tickets</span>
            </button>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 hover:bg-orange-700">
              <Calendar className="w-4 h-4" />
              <span>Mês Atual</span>
              <Filter className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 hover:bg-purple-700">
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 8: Dark Mode Avançado
  {
    id: 8,
    name: "Dark Mode Avançado",
    description: "Modo escuro com contrastes otimizados",
    category: "Visual",
    features: ["High contrast", "Eye comfort", "Battery saving", "Modern aesthetics"],
    icon: Moon,
    complexity: "Low",
    futuristic: false,
    professional: true,
    preview: "Modo escuro com contrastes otimizados",
    component: (
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Dashboard</h2>
              <p className="text-sm text-gray-300">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors flex items-center gap-2 border border-gray-600">
              <Building className="w-4 h-4" />
              <span>4 clientes</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors flex items-center gap-2 border border-gray-600">
              <User className="w-4 h-4" />
              <span>Meus Tickets</span>
            </button>
            <button className="px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors flex items-center gap-2 border border-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Mês Atual</span>
              <Filter className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors flex items-center gap-2 border border-gray-600">
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 9: Botões com Ícones Grandes
  {
    id: 9,
    name: "Ícones Grandes",
    description: "Botões com ícones grandes e texto menor",
    category: "Layout",
    features: ["Large icons", "Compact text", "Visual hierarchy", "Touch friendly"],
    icon: Target,
    complexity: "Low",
    futuristic: false,
    professional: true,
    preview: "Botões com ícones grandes e texto menor",
    component: (
      <div className="bg-gray-900 p-6 rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Dashboard</h2>
              <p className="text-sm text-gray-400">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-3">
              <Building className="w-6 h-6" />
              <div className="text-left">
                <div className="text-sm font-medium">4 clientes</div>
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex flex-col items-center gap-2 min-w-[100px]">
              <User className="w-6 h-6" />
              <span className="text-xs">Meus Tickets</span>
            </button>
            <button className="px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex flex-col items-center gap-2 min-w-[100px]">
              <Calendar className="w-6 h-6" />
              <span className="text-xs">Mês Atual</span>
            </button>
            <button className="px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex flex-col items-center gap-2 min-w-[100px]">
              <Download className="w-6 h-6" />
              <span className="text-xs">Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 10: Botões Compactos
  {
    id: 10,
    name: "Botões Compactos",
    description: "Layout compacto para economizar espaço",
    category: "Layout",
    features: ["Compact design", "Space efficient", "Quick access", "Minimal footprint"],
    icon: Grid3X3,
    complexity: "Low",
    futuristic: false,
    professional: true,
    preview: "Layout compacto para economizar espaço",
    component: (
      <div className="bg-gray-900 p-4 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Dashboard</h2>
            <p className="text-xs text-gray-400">Bem-vindo, Thiago!</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-sm">
              <Building className="w-4 h-4" />
              <span>4</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <button className="px-3 py-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-1.5 text-sm">
              <User className="w-4 h-4" />
            </button>
            <button className="px-3 py-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-1.5 text-sm">
              <Calendar className="w-4 h-4" />
            </button>
            <button className="px-3 py-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-1.5 text-sm">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 11: Botões com Badges
  {
    id: 11,
    name: "Botões com Badges",
    description: "Botões com indicadores de notificação",
    category: "Visual",
    features: ["Notification badges", "Status indicators", "Count displays", "Visual hierarchy"],
    icon: Bell,
    complexity: "Low",
    futuristic: false,
    professional: true,
    preview: "Botões com indicadores de notificação",
    component: (
      <div className="bg-gray-900 p-6 rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Dashboard</h2>
              <p className="text-sm text-gray-400">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 relative">
              <Building className="w-4 h-4" />
              <span>4 clientes</span>
              <ChevronDown className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">4</span>
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2 relative">
              <User className="w-4 h-4" />
              <span>Meus Tickets</span>
              <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 ml-1">12</span>
            </button>
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2 relative">
              <Calendar className="w-4 h-4" />
              <span>Mês Atual</span>
              <Filter className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2 relative">
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 12: Botões com Loading
  {
    id: 12,
    name: "Botões com Loading",
    description: "Estados de carregamento visuais",
    category: "Interaction",
    features: ["Loading states", "Progress indicators", "Visual feedback", "User guidance"],
    icon: RefreshCw,
    complexity: "Medium",
    futuristic: false,
    professional: true,
    preview: "Estados de carregamento visuais",
    component: (
      <div className="bg-gray-900 p-6 rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Dashboard</h2>
              <p className="text-sm text-gray-400">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span>4 clientes</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Meus Tickets</span>
            </button>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Carregando...</span>
            </button>
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 13: Botões com Tooltips
  {
    id: 13,
    name: "Botões com Tooltips",
    description: "Informações adicionais em hover",
    category: "UX",
    features: ["Hover tooltips", "Contextual help", "User guidance", "Information display"],
    icon: Info,
    complexity: "Low",
    futuristic: false,
    professional: true,
    preview: "Informações adicionais em hover",
    component: (
      <div className="bg-gray-900 p-6 rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Dashboard</h2>
              <p className="text-sm text-gray-400">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 group relative">
              <Building className="w-4 h-4" />
              <span>4 clientes</span>
              <ChevronDown className="w-4 h-4" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Selecionar clientes para visualizar
              </div>
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2 group relative">
              <User className="w-4 h-4" />
              <span>Meus Tickets</span>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Ver apenas seus tickets
              </div>
            </button>
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2 group relative">
              <Calendar className="w-4 h-4" />
              <span>Mês Atual</span>
              <Filter className="w-4 h-4" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Filtrar por período
              </div>
            </button>
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2 group relative">
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Baixar relatório em PDF
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 14: Botões com Estados
  {
    id: 14,
    name: "Botões com Estados",
    description: "Diferentes estados visuais (ativo, inativo, hover)",
    category: "Visual",
    features: ["Active states", "Disabled states", "Hover effects", "Visual feedback"],
    icon: Target,
    complexity: "Medium",
    futuristic: false,
    professional: true,
    preview: "Diferentes estados visuais",
    component: (
      <div className="bg-gray-900 p-6 rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Dashboard</h2>
              <p className="text-sm text-gray-400">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span>4 clientes</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Meus Tickets</span>
            </button>
            <button className="px-4 py-2 bg-gray-600 text-gray-400 rounded-xl cursor-not-allowed flex items-center gap-2" disabled>
              <Calendar className="w-4 h-4" />
              <span>Mês Atual</span>
              <Filter className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 15: Botões com Animações
  {
    id: 15,
    name: "Botões com Animações",
    description: "Animações suaves e micro-interações",
    category: "Interaction",
    features: ["Smooth animations", "Micro-interactions", "Visual feedback", "Engaging UX"],
    icon: Zap,
    complexity: "Medium",
    futuristic: true,
    professional: true,
    preview: "Animações suaves e micro-interações",
    component: (
      <div className="bg-gray-900 p-6 rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Dashboard</h2>
              <p className="text-sm text-gray-400">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 hover:scale-105 hover:shadow-lg">
              <Building className="w-4 h-4" />
              <span>4 clientes</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center gap-2 hover:scale-105 hover:shadow-lg">
              <User className="w-4 h-4" />
              <span>Meus Tickets</span>
            </button>
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center gap-2 hover:scale-105 hover:shadow-lg">
              <Calendar className="w-4 h-4" />
              <span>Mês Atual</span>
              <Filter className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center gap-2 hover:scale-105 hover:shadow-lg">
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 16: Botões com Bordas
  {
    id: 16,
    name: "Botões com Bordas",
    description: "Bordas coloridas e estilizadas",
    category: "Visual",
    features: ["Colored borders", "Custom styling", "Visual hierarchy", "Brand colors"],
    icon: Target,
    complexity: "Low",
    futuristic: false,
    professional: true,
    preview: "Bordas coloridas e estilizadas",
    component: (
      <div className="bg-gray-900 p-6 rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Dashboard</h2>
              <p className="text-sm text-gray-400">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-2 bg-transparent border-2 border-blue-500 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-colors flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span>4 clientes</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-transparent border-2 border-green-500 text-green-400 rounded-xl hover:bg-green-500 hover:text-white transition-colors flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Meus Tickets</span>
            </button>
            <button className="px-4 py-2 bg-transparent border-2 border-orange-500 text-orange-400 rounded-xl hover:bg-orange-500 hover:text-white transition-colors flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Mês Atual</span>
              <Filter className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-transparent border-2 border-purple-500 text-purple-400 rounded-xl hover:bg-purple-500 hover:text-white transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 17: Botões com Ícones Diferentes
  {
    id: 17,
    name: "Ícones Diferentes",
    description: "Ícones alternativos para cada função",
    category: "Visual",
    features: ["Alternative icons", "Visual variety", "Function clarity", "Icon diversity"],
    icon: Palette,
    complexity: "Low",
    futuristic: false,
    professional: true,
    preview: "Ícones alternativos para cada função",
    component: (
      <div className="bg-gray-900 p-6 rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Dashboard</h2>
              <p className="text-sm text-gray-400">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>4 clientes</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Meus Tickets</span>
            </button>
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Mês Atual</span>
              <Filter className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
              <Share className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 18: Botões com Texto Pequeno
  {
    id: 18,
    name: "Texto Pequeno",
    description: "Botões com texto reduzido e ícones grandes",
    category: "Layout",
    features: ["Compact text", "Large icons", "Space efficient", "Clean look"],
    icon: Grid3X3,
    complexity: "Low",
    futuristic: false,
    professional: true,
    preview: "Botões com texto reduzido e ícones grandes",
    component: (
      <div className="bg-gray-900 p-6 rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Dashboard</h2>
              <p className="text-sm text-gray-400">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Building className="w-5 h-5" />
              <span className="text-sm">4 clientes</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-3 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="text-xs">Meus</span>
            </button>
            <button className="px-3 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="text-xs">Mês</span>
            </button>
            <button className="px-3 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
              <Download className="w-5 h-5" />
              <span className="text-xs">PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 19: Botões com Cores de Status
  {
    id: 19,
    name: "Cores de Status",
    description: "Cores baseadas no status/função",
    category: "Visual",
    features: ["Status colors", "Function-based colors", "Visual hierarchy", "Color coding"],
    icon: Target,
    complexity: "Low",
    futuristic: false,
    professional: true,
    preview: "Cores baseadas no status/função",
    component: (
      <div className="bg-gray-900 p-6 rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Dashboard</h2>
              <p className="text-sm text-gray-400">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span>4 clientes</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Meus Tickets</span>
            </button>
            <button className="px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Mês Atual</span>
              <Filter className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  },

  // PROTÓTIPO 20: Botões com Sombra
  {
    id: 20,
    name: "Botões com Sombra",
    description: "Sombras profundas para destaque",
    category: "Visual",
    features: ["Deep shadows", "Visual depth", "Elevation", "Modern look"],
    icon: Layers,
    complexity: "Low",
    futuristic: false,
    professional: true,
    preview: "Sombras profundas para destaque",
    component: (
      <div className="bg-gray-900 p-6 rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Dashboard</h2>
              <p className="text-sm text-gray-400">Bem-vindo de volta, Thiago!</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-2xl">
              <Building className="w-4 h-4" />
              <span>4 clientes</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2 shadow-lg">
              <User className="w-4 h-4" />
              <span>Meus Tickets</span>
            </button>
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2 shadow-lg">
              <Calendar className="w-4 h-4" />
              <span>Mês Atual</span>
              <Filter className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2 shadow-lg">
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  }
]

export default function ButtonPrototypesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedComplexity, setSelectedComplexity] = useState<string>('All')
  const [selectedPrototype, setSelectedPrototype] = useState<ButtonPrototype | null>(null)

  const categories = ['All', ...Array.from(new Set(ButtonPrototypes.map(opt => opt.category)))]
  
  const filteredOptions = ButtonPrototypes.filter(option => {
    const categoryMatch = selectedCategory === 'All' || option.category === selectedCategory
    const complexityMatch = selectedComplexity === 'All' || option.complexity === selectedComplexity
    return categoryMatch && complexityMatch
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎨 Protótipos Visuais dos Botões
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            50 protótipos visuais mostrando como ficaria a área dos botões
          </p>
          
          {/* Filtros */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white"
            >
              {categories.map(category => (
                <option key={category} value={category} className="bg-gray-800">
                  {category}
                </option>
              ))}
            </select>
            
            <select
              value={selectedComplexity}
              onChange={(e) => setSelectedComplexity(e.target.value)}
              className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white"
            >
              <option value="All" className="bg-gray-800">Todas as Complexidades</option>
              <option value="Low" className="bg-gray-800">Baixa</option>
              <option value="Medium" className="bg-gray-800">Média</option>
              <option value="High" className="bg-gray-800">Alta</option>
            </select>
          </div>
        </div>

        {/* Grid de Protótipos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {filteredOptions.map((prototype) => {
            const Icon = prototype.icon
            return (
              <div
                key={prototype.id}
                onClick={() => setSelectedPrototype(prototype)}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 cursor-pointer hover:bg-white/20 transition-all duration-300 hover:scale-105 group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{prototype.name}</h3>
                    <p className="text-sm text-gray-300">{prototype.category}</p>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-4 text-sm">{prototype.description}</p>
                
                {/* Preview Visual */}
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-2">Preview:</p>
                  <div className="bg-gray-800 rounded-lg p-4 overflow-hidden">
                    {prototype.component}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {prototype.features.slice(0, 2).map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white/20 rounded-lg text-xs text-white"
                    >
                      {feature}
                    </span>
                  ))}
                  {prototype.features.length > 2 && (
                    <span className="px-2 py-1 bg-white/20 rounded-lg text-xs text-white">
                      +{prototype.features.length - 2} mais
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs ${
                      prototype.complexity === 'Low' ? 'bg-green-500/20 text-green-300' :
                      prototype.complexity === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {prototype.complexity}
                    </span>
                    {prototype.futuristic && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs">
                        Futurista
                      </span>
                    )}
                    {prototype.professional && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs">
                        Profissional
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal de Detalhes */}
        {selectedPrototype && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    {(() => {
                      const Icon = selectedPrototype.icon
                      return <Icon className="h-8 w-8 text-white" />
                    })()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedPrototype.name}</h2>
                    <p className="text-gray-300">{selectedPrototype.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPrototype(null)}
                  className="text-white hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <p className="text-gray-300 mb-6">{selectedPrototype.description}</p>
              
              {/* Preview Visual Grande */}
              <div className="bg-gray-800 rounded-lg p-6 mb-6 overflow-hidden">
                <p className="text-sm text-gray-400 mb-4">Preview Completo:</p>
                {selectedPrototype.component}
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Características:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPrototype.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white mb-2">Complexidade:</h4>
                  <span className={`px-3 py-1 rounded-lg text-sm ${
                    selectedPrototype.complexity === 'Low' ? 'bg-green-500/20 text-green-300' :
                    selectedPrototype.complexity === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {selectedPrototype.complexity}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white mb-2">Tags:</h4>
                  <div className="flex gap-2">
                    {selectedPrototype.futuristic && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs">
                        Futurista
                      </span>
                    )}
                    {selectedPrototype.professional && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs">
                        Profissional
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                  Implementar Este Design
                </button>
                <button
                  onClick={() => setSelectedPrototype(null)}
                  className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
