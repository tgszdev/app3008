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

interface ButtonSuggestion {
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
}

const buttonSuggestions: ButtonSuggestion[] = [
  // CATEGORIA: LAYOUT E POSICIONAMENTO
  {
    id: 1,
    name: "Botões Flutuantes",
    description: "Botões com efeito de flutuação e sombras dinâmicas",
    category: "Layout",
    features: ["Sombras suaves", "Hover effects", "Transições fluidas", "Z-index inteligente"],
    icon: Layers,
    complexity: "Low",
    futuristic: true,
    professional: true,
    preview: "Botões com elevação sutil e animações de hover"
  },
  {
    id: 2,
    name: "Grid Responsivo Inteligente",
    description: "Layout que se adapta automaticamente ao conteúdo",
    category: "Layout",
    features: ["Auto-sizing", "Breakpoints dinâmicos", "Overflow handling", "Smart wrapping"],
    icon: Grid3X3,
    complexity: "Medium",
    futuristic: true,
    professional: true,
    preview: "Botões se reorganizam automaticamente em diferentes telas"
  },
  {
    id: 3,
    name: "Botões Contextuais",
    description: "Botões que aparecem/desaparecem baseado no contexto",
    category: "Layout",
    features: ["Context awareness", "Smart visibility", "Progressive disclosure", "User behavior"],
    icon: Eye,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Botões aparecem apenas quando relevantes"
  },

  // CATEGORIA: INTERAÇÕES AVANÇADAS
  {
    id: 4,
    name: "Micro-interações Inteligentes",
    description: "Animações sutis que guiam o usuário",
    category: "Interaction",
    features: ["Loading states", "Success feedback", "Error handling", "Progress indicators"],
    icon: Zap,
    complexity: "Medium",
    futuristic: true,
    professional: true,
    preview: "Animações suaves em hover, click e loading"
  },
  {
    id: 5,
    name: "Gestos Touch Avançados",
    description: "Controles por gestos para dispositivos móveis",
    category: "Mobile",
    features: ["Swipe actions", "Long press", "Pinch to zoom", "Pull to refresh"],
    icon: Target,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Gestos naturais para interação mobile"
  },
  {
    id: 6,
    name: "Feedback Haptic",
    description: "Feedback tátil para melhor experiência",
    category: "Mobile",
    features: ["Vibration patterns", "Touch feedback", "Gesture recognition", "Spatial awareness"],
    icon: Heart,
    complexity: "Medium",
    futuristic: true,
    professional: true,
    preview: "Vibração sutil ao tocar os botões"
  },

  // CATEGORIA: VISUAL E DESIGN
  {
    id: 7,
    name: "Glassmorphism Buttons",
    description: "Botões com efeito de vidro translúcido",
    category: "Visual",
    features: ["Transparência", "Blur effects", "Gradientes", "Bordas suaves"],
    icon: Sparkles,
    complexity: "Medium",
    futuristic: true,
    professional: true,
    preview: "Botões com efeito de vidro e blur"
  },
  {
    id: 8,
    name: "Neumorphism Design",
    description: "Botões com efeito de relevo e sombras suaves",
    category: "Visual",
    features: ["Sombras internas", "Relevo sutil", "Cores suaves", "Bordas arredondadas"],
    icon: Layers,
    complexity: "Low",
    futuristic: false,
    professional: true,
    preview: "Botões com efeito de relevo e profundidade"
  },
  {
    id: 9,
    name: "Gradientes Dinâmicos",
    description: "Gradientes que mudam baseado no estado",
    category: "Visual",
    features: ["Color transitions", "State-based colors", "Smooth animations", "Accessibility"],
    icon: Palette,
    complexity: "Medium",
    futuristic: true,
    professional: true,
    preview: "Cores que fluem suavemente entre estados"
  },

  // CATEGORIA: FUNCIONALIDADE
  {
    id: 10,
    name: "Botões Inteligentes",
    description: "Botões que aprendem com o comportamento do usuário",
    category: "AI",
    features: ["Learning patterns", "Smart suggestions", "Predictive actions", "Auto-optimization"],
    icon: Brain,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Botões que se adaptam ao seu uso"
  },
  {
    id: 11,
    name: "Ações Rápidas",
    description: "Atalhos inteligentes para ações frequentes",
    category: "Functionality",
    features: ["Keyboard shortcuts", "Quick actions", "Smart defaults", "Context menus"],
    icon: Zap,
    complexity: "Medium",
    futuristic: false,
    professional: true,
    preview: "Atalhos de teclado e ações rápidas"
  },
  {
    id: 12,
    name: "Botões Condicionais",
    description: "Botões que aparecem baseado em permissões e contexto",
    category: "Functionality",
    features: ["Permission-based", "Context awareness", "Role-based", "Smart visibility"],
    icon: Shield,
    complexity: "Medium",
    futuristic: false,
    professional: true,
    preview: "Botões aparecem apenas quando você tem permissão"
  },

  // CATEGORIA: ACESSIBILIDADE
  {
    id: 13,
    name: "Acessibilidade Universal",
    description: "Design acessível para todos os usuários",
    category: "Accessibility",
    features: ["Screen reader support", "Keyboard navigation", "High contrast", "Text scaling"],
    icon: Eye,
    complexity: "Medium",
    futuristic: false,
    professional: true,
    preview: "Botões acessíveis para todos os usuários"
  },
  {
    id: 14,
    name: "Voice Commands",
    description: "Controle por voz para acessibilidade",
    category: "Accessibility",
    features: ["Speech recognition", "Voice feedback", "Hands-free navigation", "Multi-language"],
    icon: Volume2,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Controle os botões por voz"
  },
  {
    id: 15,
    name: "Focus Management",
    description: "Gerenciamento inteligente de foco",
    category: "Accessibility",
    features: ["Tab navigation", "Focus indicators", "Skip links", "Focus trapping"],
    icon: Target,
    complexity: "Medium",
    futuristic: false,
    professional: true,
    preview: "Navegação por teclado otimizada"
  },

  // CATEGORIA: PERFORMANCE
  {
    id: 16,
    name: "Lazy Loading Inteligente",
    description: "Carregamento otimizado dos botões",
    category: "Performance",
    features: ["Viewport detection", "Priority loading", "Preloading", "Memory optimization"],
    icon: Database,
    complexity: "Medium",
    futuristic: false,
    professional: true,
    preview: "Botões carregam apenas quando necessário"
  },
  {
    id: 17,
    name: "Preload Actions",
    description: "Pré-carregamento de ações para melhor performance",
    category: "Performance",
    features: ["Action preloading", "Smart caching", "Background processing", "Optimistic updates"],
    icon: RefreshCw,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Ações são pré-carregadas para resposta instantânea"
  },

  // CATEGORIA: PERSONALIZAÇÃO
  {
    id: 18,
    name: "Botões Personalizáveis",
    description: "Usuários podem customizar botões",
    category: "Customization",
    features: ["Drag & drop", "Custom layouts", "Saved presets", "Personal shortcuts"],
    icon: Settings,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Arraste e solte para reorganizar botões"
  },
  {
    id: 19,
    name: "Temas Dinâmicos",
    description: "Temas que mudam baseado no horário/contexto",
    category: "Customization",
    features: ["Time-based themes", "Context awareness", "Auto-switching", "User preferences"],
    icon: Sun,
    complexity: "Medium",
    futuristic: true,
    professional: true,
    preview: "Temas que mudam automaticamente"
  },
  {
    id: 20,
    name: "Workspace Personalizado",
    description: "Cada usuário tem seu layout personalizado",
    category: "Customization",
    features: ["User-specific layouts", "Saved configurations", "Quick switching", "Team presets"],
    icon: User,
    complexity: "High",
    futuristic: false,
    professional: true,
    preview: "Layout personalizado para cada usuário"
  },

  // CATEGORIA: COLABORAÇÃO
  {
    id: 21,
    name: "Presença em Tempo Real",
    description: "Mostra o que outros usuários estão fazendo",
    category: "Collaboration",
    features: ["Live cursors", "Activity indicators", "User presence", "Real-time updates"],
    icon: Users,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Veja o que outros usuários estão fazendo"
  },
  {
    id: 22,
    name: "Compartilhamento Inteligente",
    description: "Compartilhe configurações e layouts",
    category: "Collaboration",
    features: ["Share configurations", "Team templates", "Export/import", "Version control"],
    icon: Share,
    complexity: "Medium",
    futuristic: false,
    professional: true,
    preview: "Compartilhe seus layouts com a equipe"
  },

  // CATEGORIA: NOTIFICAÇÕES
  {
    id: 23,
    name: "Notificações Inteligentes",
    description: "Sistema de notificações contextual",
    category: "Notifications",
    features: ["Priority-based", "Context-aware", "Smart grouping", "Do not disturb"],
    icon: Bell,
    complexity: "Medium",
    futuristic: true,
    professional: true,
    preview: "Notificações que aparecem no momento certo"
  },
  {
    id: 24,
    name: "Status Indicators",
    description: "Indicadores visuais de status",
    category: "Notifications",
    features: ["Status badges", "Progress indicators", "Error states", "Success feedback"],
    icon: Activity,
    complexity: "Low",
    futuristic: false,
    professional: true,
    preview: "Indicadores visuais de status dos botões"
  },

  // CATEGORIA: SEGURANÇA
  {
    id: 25,
    name: "Botões Seguros",
    description: "Segurança baseada em contexto e permissões",
    category: "Security",
    features: ["Permission-based", "Risk assessment", "Audit logging", "Secure actions"],
    icon: Lock,
    complexity: "High",
    futuristic: false,
    professional: true,
    preview: "Botões com segurança baseada em contexto"
  },
  {
    id: 26,
    name: "Confirmação Inteligente",
    description: "Confirmações baseadas no risco da ação",
    category: "Security",
    features: ["Risk-based confirmation", "Smart defaults", "Context awareness", "User education"],
    icon: AlertTriangle,
    complexity: "Medium",
    futuristic: true,
    professional: true,
    preview: "Confirmações aparecem apenas para ações arriscadas"
  },

  // CATEGORIA: ANÁLISE
  {
    id: 27,
    name: "Analytics de Uso",
    description: "Análise de como os botões são usados",
    category: "Analytics",
    features: ["Usage tracking", "Heat maps", "Click analytics", "User behavior"],
    icon: BarChart3,
    complexity: "Medium",
    futuristic: false,
    professional: true,
    preview: "Veja quais botões são mais usados"
  },
  {
    id: 28,
    name: "Otimização Automática",
    description: "Layout se otimiza baseado no uso",
    category: "Analytics",
    features: ["Auto-optimization", "Usage patterns", "Smart positioning", "Performance tuning"],
    icon: Cpu,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Layout se otimiza automaticamente"
  },

  // CATEGORIA: MOBILE
  {
    id: 29,
    name: "Mobile-First Design",
    description: "Design otimizado para dispositivos móveis",
    category: "Mobile",
    features: ["Touch-friendly", "Swipe gestures", "Responsive design", "Fast loading"],
    icon: Smartphone,
    complexity: "Low",
    futuristic: false,
    professional: true,
    preview: "Botões otimizados para touch"
  },
  {
    id: 30,
    name: "Adaptive Sizing",
    description: "Tamanhos que se adaptam ao dispositivo",
    category: "Mobile",
    features: ["Device detection", "Screen size adaptation", "Touch target sizing", "Responsive scaling"],
    icon: Monitor,
    complexity: "Medium",
    futuristic: false,
    professional: true,
    preview: "Botões se adaptam ao tamanho da tela"
  },

  // CATEGORIA: FUTURO
  {
    id: 31,
    name: "AR/VR Integration",
    description: "Integração com realidade aumentada/virtual",
    category: "Future",
    features: ["3D interactions", "Spatial computing", "Immersive experience", "Gesture control"],
    icon: Eye,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Botões em realidade aumentada"
  },
  {
    id: 32,
    name: "Neural Interface",
    description: "Controle por pensamento",
    category: "Future",
    features: ["Brain-computer interface", "Thought control", "Neural feedback", "Cognitive enhancement"],
    icon: Brain,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Controle os botões com o pensamento"
  },
  {
    id: 33,
    name: "Quantum-Ready",
    description: "Preparado para computação quântica",
    category: "Future",
    features: ["Quantum algorithms", "Parallel processing", "Advanced encryption", "Future-proof"],
    icon: Rocket,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Botões preparados para o futuro quântico"
  },

  // CATEGORIA: AUTOMAÇÃO
  {
    id: 34,
    name: "Auto-Actions",
    description: "Ações automáticas baseadas em contexto",
    category: "Automation",
    features: ["Smart automation", "Context triggers", "Rule-based actions", "Workflow automation"],
    icon: Zap,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Botões executam ações automaticamente"
  },
  {
    id: 35,
    name: "Smart Shortcuts",
    description: "Atalhos inteligentes que aprendem",
    category: "Automation",
    features: ["Learning shortcuts", "Predictive actions", "Smart suggestions", "Auto-completion"],
    icon: Lightbulb,
    complexity: "Medium",
    futuristic: true,
    professional: true,
    preview: "Atalhos que aprendem com seu uso"
  },

  // CATEGORIA: INTEGRAÇÃO
  {
    id: 36,
    name: "API Integration",
    description: "Integração com APIs externas",
    category: "Integration",
    features: ["Third-party APIs", "Webhook integration", "Real-time sync", "Data exchange"],
    icon: Globe,
    complexity: "High",
    futuristic: false,
    professional: true,
    preview: "Botões conectados a serviços externos"
  },
  {
    id: 37,
    name: "Cross-Platform Sync",
    description: "Sincronização entre dispositivos",
    category: "Integration",
    features: ["Cloud sync", "Device synchronization", "Conflict resolution", "Real-time updates"],
    icon: RefreshCw,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Botões sincronizados entre dispositivos"
  },

  // CATEGORIA: SUSTENTABILIDADE
  {
    id: 38,
    name: "Green Computing",
    description: "Computação sustentável e eficiente",
    category: "Sustainability",
    features: ["Energy optimization", "Efficient algorithms", "Green hosting", "Carbon footprint"],
    icon: Globe,
    complexity: "Medium",
    futuristic: false,
    professional: true,
    preview: "Botões otimizados para sustentabilidade"
  },
  {
    id: 39,
    name: "Resource Optimization",
    description: "Otimização inteligente de recursos",
    category: "Sustainability",
    features: ["Memory management", "CPU optimization", "Network efficiency", "Storage optimization"],
    icon: Cpu,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Botões que consomem menos recursos"
  },

  // CATEGORIA: EXPERIÊNCIA
  {
    id: 40,
    name: "Emotional Design",
    description: "Design que considera as emoções do usuário",
    category: "UX",
    features: ["Emotional feedback", "Mood detection", "Adaptive responses", "Empathy mapping"],
    icon: Heart,
    complexity: "Medium",
    futuristic: true,
    professional: true,
    preview: "Botões que respondem às suas emoções"
  },
  {
    id: 41,
    name: "Cognitive Load Reduction",
    description: "Redução da carga cognitiva do usuário",
    category: "UX",
    features: ["Information hierarchy", "Progressive disclosure", "Visual clarity", "Mental models"],
    icon: Brain,
    complexity: "Medium",
    futuristic: false,
    professional: true,
    preview: "Botões que reduzem a confusão mental"
  },

  // CATEGORIA: DADOS
  {
    id: 42,
    name: "Data-Driven Design",
    description: "Design baseado em dados de uso",
    category: "Data",
    features: ["Usage analytics", "A/B testing", "User feedback", "Performance metrics"],
    icon: BarChart3,
    complexity: "Medium",
    futuristic: false,
    professional: true,
    preview: "Botões otimizados com base em dados"
  },
  {
    id: 43,
    name: "Predictive UI",
    description: "Interface que prevê necessidades",
    category: "Data",
    features: ["Predictive actions", "Smart suggestions", "Context awareness", "Proactive help"],
    icon: Target,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Botões que aparecem antes de você precisar"
  },

  // CATEGORIA: COLABORAÇÃO AVANÇADA
  {
    id: 44,
    name: "Real-time Collaboration",
    description: "Colaboração em tempo real",
    category: "Collaboration",
    features: ["Live cursors", "Shared editing", "Conflict resolution", "Presence indicators"],
    icon: Users,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Botões compartilhados em tempo real"
  },
  {
    id: 45,
    name: "AI-Powered Collaboration",
    description: "Colaboração assistida por IA",
    category: "Collaboration",
    features: ["Smart suggestions", "Conflict resolution", "Auto-translation", "Context awareness"],
    icon: Brain,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "IA ajuda na colaboração"
  },

  // CATEGORIA: SEGURANÇA AVANÇADA
  {
    id: 46,
    name: "Zero-Knowledge Security",
    description: "Segurança de conhecimento zero",
    category: "Security",
    features: ["End-to-end encryption", "Zero-trust model", "Privacy by design", "Data minimization"],
    icon: Shield,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Segurança máxima para botões"
  },
  {
    id: 47,
    name: "Behavioral Security",
    description: "Segurança baseada no comportamento",
    category: "Security",
    features: ["Anomaly detection", "Risk scoring", "Adaptive security", "Continuous monitoring"],
    icon: Eye,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Segurança que aprende com seu comportamento"
  },

  // CATEGORIA: INOVAÇÃO
  {
    id: 48,
    name: "Blockchain Integration",
    description: "Integração com blockchain",
    category: "Innovation",
    features: ["Immutable records", "Smart contracts", "Decentralized data", "Cryptographic security"],
    icon: Shield,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Botões com segurança blockchain"
  },
  {
    id: 49,
    name: "Metaverse Ready",
    description: "Preparado para o metaverso",
    category: "Innovation",
    features: ["Virtual presence", "3D avatars", "Spatial computing", "Immersive collaboration"],
    icon: Rocket,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Botões no metaverso"
  },
  {
    id: 50,
    name: "Quantum-Safe Security",
    description: "Segurança resistente a computação quântica",
    category: "Innovation",
    features: ["Post-quantum cryptography", "Quantum key distribution", "Future-proof encryption", "Advanced algorithms"],
    icon: Shield,
    complexity: "High",
    futuristic: true,
    professional: true,
    preview: "Botões preparados para o futuro quântico"
  }
]

export default function ButtonSuggestionsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedComplexity, setSelectedComplexity] = useState<string>('All')
  const [selectedOption, setSelectedOption] = useState<ButtonSuggestion | null>(null)

  const categories = ['All', ...Array.from(new Set(buttonSuggestions.map(opt => opt.category)))]
  
  const filteredOptions = buttonSuggestions.filter(option => {
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
            🎯 Sugestões para Botões do Dashboard
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            50 sugestões específicas para melhorar a área dos botões e seletor de clientes
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

        {/* Grid de Opções */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredOptions.map((option) => {
            const Icon = option.icon
            return (
              <div
                key={option.id}
                onClick={() => setSelectedOption(option)}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 cursor-pointer hover:bg-white/20 transition-all duration-300 hover:scale-105 group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{option.name}</h3>
                    <p className="text-sm text-gray-300">{option.category}</p>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-4 text-sm">{option.description}</p>
                
                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-400 mb-1">Preview:</p>
                  <p className="text-sm text-white">{option.preview}</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {option.features.slice(0, 2).map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white/20 rounded-lg text-xs text-white"
                    >
                      {feature}
                    </span>
                  ))}
                  {option.features.length > 2 && (
                    <span className="px-2 py-1 bg-white/20 rounded-lg text-xs text-white">
                      +{option.features.length - 2} mais
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs ${
                      option.complexity === 'Low' ? 'bg-green-500/20 text-green-300' :
                      option.complexity === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {option.complexity}
                    </span>
                    {option.futuristic && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs">
                        Futurista
                      </span>
                    )}
                    {option.professional && (
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
        {selectedOption && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    {(() => {
                      const Icon = selectedOption.icon
                      return <Icon className="h-8 w-8 text-white" />
                    })()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedOption.name}</h2>
                    <p className="text-gray-300">{selectedOption.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOption(null)}
                  className="text-white hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <p className="text-gray-300 mb-6">{selectedOption.description}</p>
              
              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Preview:</h3>
                <p className="text-gray-300">{selectedOption.preview}</p>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Características:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedOption.features.map((feature, index) => (
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
                    selectedOption.complexity === 'Low' ? 'bg-green-500/20 text-green-300' :
                    selectedOption.complexity === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {selectedOption.complexity}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white mb-2">Tags:</h4>
                  <div className="flex gap-2">
                    {selectedOption.futuristic && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs">
                        Futurista
                      </span>
                    )}
                    {selectedOption.professional && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs">
                        Profissional
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                  Escolher Esta Opção
                </button>
                <button
                  onClick={() => setSelectedOption(null)}
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
