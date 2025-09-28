'use client'

import { useState } from 'react'
import { 
  Building, 
  Users, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar,
  Filter,
  Download,
  Settings,
  Eye,
  Grid3X3,
  Layout,
  Zap,
  Star,
  Target,
  Layers,
  Cpu,
  Database,
  Globe,
  Shield,
  Sparkles,
  Rocket,
  Brain,
  Palette,
  Lightbulb,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

interface LayoutOption {
  id: number
  name: string
  description: string
  category: string
  features: string[]
  icon: any
  complexity: 'Low' | 'Medium' | 'High'
  futuristic: boolean
  professional: boolean
}

const layoutOptions: LayoutOption[] = [
  // CATEGORIA: LAYOUTS MODERNOS
  {
    id: 1,
    name: "Glassmorphism Dashboard",
    description: "Design com efeito de vidro translúcido e blur",
    category: "Modern",
    features: ["Transparência", "Blur effects", "Gradientes", "Cards flutuantes"],
    icon: Sparkles,
    complexity: "Medium",
    futuristic: true,
    professional: true
  },
  {
    id: 2,
    name: "Neumorphism Cards",
    description: "Cards com efeito de relevo e sombras suaves",
    category: "Modern",
    features: ["Sombras internas", "Relevo sutil", "Cores suaves", "Bordas arredondadas"],
    icon: Layers,
    complexity: "Low",
    futuristic: false,
    professional: true
  },
  {
    id: 3,
    name: "Grid Responsivo Avançado",
    description: "Sistema de grid inteligente que se adapta ao conteúdo",
    category: "Layout",
    features: ["Auto-sizing", "Breakpoints inteligentes", "Overflow handling", "Dynamic columns"],
    icon: Grid3X3,
    complexity: "High",
    futuristic: true,
    professional: true
  },
  {
    id: 4,
    name: "Sidebar Flutuante",
    description: "Navegação lateral que aparece/desaparece dinamicamente",
    category: "Navigation",
    features: ["Auto-hide", "Hover reveal", "Smooth transitions", "Context awareness"],
    icon: Layout,
    complexity: "Medium",
    futuristic: true,
    professional: true
  },

  // CATEGORIA: INTERAÇÕES AVANÇADAS
  {
    id: 5,
    name: "Micro-interações Inteligentes",
    description: "Animações sutis que guiam o usuário",
    category: "Interaction",
    features: ["Loading states", "Success feedback", "Error handling", "Progress indicators"],
    icon: Zap,
    complexity: "Medium",
    futuristic: true,
    professional: true
  },
  {
    id: 6,
    name: "Gestos Touch Avançados",
    description: "Controles por gestos para dispositivos móveis",
    category: "Mobile",
    features: ["Swipe navigation", "Pinch to zoom", "Pull to refresh", "Long press actions"],
    icon: Target,
    complexity: "High",
    futuristic: true,
    professional: true
  },
  {
    id: 7,
    name: "Voice Commands",
    description: "Controle por voz para acessibilidade",
    category: "Accessibility",
    features: ["Speech recognition", "Voice feedback", "Hands-free navigation", "Multi-language"],
    icon: Brain,
    complexity: "High",
    futuristic: true,
    professional: true
  },

  // CATEGORIA: VISUALIZAÇÃO DE DADOS
  {
    id: 8,
    name: "Data Visualization 3D",
    description: "Gráficos tridimensionais interativos",
    category: "Data",
    features: ["3D charts", "Interactive rotation", "Depth perception", "Real-time updates"],
    icon: BarChart3,
    complexity: "High",
    futuristic: true,
    professional: true
  },
  {
    id: 9,
    name: "Real-time Streaming",
    description: "Atualizações em tempo real com WebSockets",
    category: "Data",
    features: ["Live updates", "Push notifications", "Sync indicators", "Conflict resolution"],
    icon: RefreshCw,
    complexity: "High",
    futuristic: true,
    professional: true
  },
  {
    id: 10,
    name: "AI-Powered Insights",
    description: "Insights gerados por inteligência artificial",
    category: "AI",
    features: ["Predictive analytics", "Anomaly detection", "Smart recommendations", "Auto-categorization"],
    icon: Brain,
    complexity: "High",
    futuristic: true,
    professional: true
  },

  // CATEGORIA: PERSONALIZAÇÃO
  {
    id: 11,
    name: "Theme Engine Avançado",
    description: "Sistema de temas com múltiplas opções",
    category: "Customization",
    features: ["Dark/Light modes", "Custom colors", "Font scaling", "Layout presets"],
    icon: Palette,
    complexity: "Medium",
    futuristic: false,
    professional: true
  },
  {
    id: 12,
    name: "Workspace Personalizado",
    description: "Cada usuário pode customizar seu workspace",
    category: "Customization",
    features: ["Drag & drop widgets", "Custom layouts", "Saved views", "Personal shortcuts"],
    icon: Settings,
    complexity: "High",
    futuristic: true,
    professional: true
  },
  {
    id: 13,
    name: "Adaptive UI",
    description: "Interface que se adapta ao comportamento do usuário",
    category: "AI",
    features: ["Learning patterns", "Auto-optimization", "Predictive UI", "Smart defaults"],
    icon: Cpu,
    complexity: "High",
    futuristic: true,
    professional: true
  },

  // CATEGORIA: PERFORMANCE
  {
    id: 14,
    name: "Lazy Loading Inteligente",
    description: "Carregamento otimizado baseado no viewport",
    category: "Performance",
    features: ["Viewport detection", "Priority loading", "Preloading", "Memory optimization"],
    icon: Database,
    complexity: "Medium",
    futuristic: false,
    professional: true
  },
  {
    id: 15,
    name: "Progressive Web App",
    description: "Funcionalidade offline e instalação nativa",
    category: "Performance",
    features: ["Offline support", "Push notifications", "Native feel", "App-like experience"],
    icon: Rocket,
    complexity: "High",
    futuristic: true,
    professional: true
  },

  // CATEGORIA: SEGURANÇA
  {
    id: 16,
    name: "Zero Trust Security",
    description: "Segurança baseada em verificação contínua",
    category: "Security",
    features: ["Multi-factor auth", "Behavioral analysis", "Risk scoring", "Auto-logout"],
    icon: Shield,
    complexity: "High",
    futuristic: true,
    professional: true
  },
  {
    id: 17,
    name: "Biometric Authentication",
    description: "Autenticação por biometria",
    category: "Security",
    features: ["Fingerprint", "Face recognition", "Voice ID", "Behavioral biometrics"],
    icon: Eye,
    complexity: "High",
    futuristic: true,
    professional: true
  },

  // CATEGORIA: COLABORAÇÃO
  {
    id: 18,
    name: "Real-time Collaboration",
    description: "Colaboração em tempo real entre usuários",
    category: "Collaboration",
    features: ["Live cursors", "Shared editing", "Conflict resolution", "Presence indicators"],
    icon: Users,
    complexity: "High",
    futuristic: true,
    professional: true
  },
  {
    id: 19,
    name: "Smart Notifications",
    description: "Sistema de notificações inteligente",
    category: "Communication",
    features: ["Priority-based", "Context-aware", "Smart grouping", "Do not disturb"],
    icon: Bell,
    complexity: "Medium",
    futuristic: true,
    professional: true
  },

  // CATEGORIA: ACESSIBILIDADE
  {
    id: 20,
    name: "Universal Design",
    description: "Design acessível para todos os usuários",
    category: "Accessibility",
    features: ["Screen reader support", "Keyboard navigation", "High contrast", "Text scaling"],
    icon: Eye,
    complexity: "Medium",
    futuristic: false,
    professional: true
  },
  {
    id: 21,
    name: "Haptic Feedback",
    description: "Feedback tátil para melhor experiência",
    category: "Accessibility",
    features: ["Vibration patterns", "Touch feedback", "Gesture recognition", "Spatial awareness"],
    icon: Target,
    complexity: "Medium",
    futuristic: true,
    professional: true
  },

  // CATEGORIA: ANÁLISE E INSIGHTS
  {
    id: 22,
    name: "Behavioral Analytics",
    description: "Análise do comportamento do usuário",
    category: "Analytics",
    features: ["Heat maps", "Click tracking", "User journeys", "Conversion funnels"],
    icon: BarChart3,
    complexity: "Medium",
    futuristic: false,
    professional: true
  },
  {
    id: 23,
    name: "Predictive Dashboard",
    description: "Dashboard que prevê necessidades futuras",
    category: "AI",
    features: ["Trend prediction", "Resource forecasting", "Risk assessment", "Opportunity detection"],
    icon: TrendingUp,
    complexity: "High",
    futuristic: true,
    professional: true
  },

  // CATEGORIA: MOBILE-FIRST
  {
    id: 24,
    name: "Mobile-First Design",
    description: "Design otimizado para mobile",
    category: "Mobile",
    features: ["Touch-friendly", "Swipe gestures", "Responsive images", "Fast loading"],
    icon: Globe,
    complexity: "Low",
    futuristic: false,
    professional: true
  },
  {
    id: 25,
    name: "Cross-Platform Sync",
    description: "Sincronização entre dispositivos",
    category: "Mobile",
    features: ["Cloud sync", "Offline support", "Conflict resolution", "Real-time updates"],
    icon: RefreshCw,
    complexity: "High",
    futuristic: true,
    professional: true
  },

  // CATEGORIA: AUTOMAÇÃO
  {
    id: 26,
    name: "Workflow Automation",
    description: "Automação de fluxos de trabalho",
    category: "Automation",
    features: ["Rule-based actions", "Trigger automation", "Smart routing", "Auto-escalation"],
    icon: Zap,
    complexity: "High",
    futuristic: true,
    professional: true
  },
  {
    id: 27,
    name: "Smart Defaults",
    description: "Valores padrão inteligentes baseados em contexto",
    category: "AI",
    features: ["Context awareness", "Learning patterns", "Predictive inputs", "Smart suggestions"],
    icon: Lightbulb,
    complexity: "Medium",
    futuristic: true,
    professional: true
  },

  // CATEGORIA: VISUALIZAÇÃO AVANÇADA
  {
    id: 28,
    name: "Immersive Data View",
    description: "Visualização imersiva de dados",
    category: "Visualization",
    features: ["Full-screen mode", "Focus mode", "Detail drill-down", "Context switching"],
    icon: Eye,
    complexity: "Medium",
    futuristic: true,
    professional: true
  },
  {
    id: 29,
    name: "Interactive Storytelling",
    description: "Narrativa interativa dos dados",
    category: "Visualization",
    features: ["Guided tours", "Progressive disclosure", "Story flow", "Interactive tutorials"],
    icon: Star,
    complexity: "High",
    futuristic: true,
    professional: true
  },

  // CATEGORIA: INTEGRAÇÃO
  {
    id: 30,
    name: "API-First Architecture",
    description: "Arquitetura baseada em APIs",
    category: "Integration",
    features: ["RESTful APIs", "GraphQL support", "Webhook integration", "Third-party connectors"],
    icon: Database,
    complexity: "High",
    futuristic: false,
    professional: true
  },
  {
    id: 31,
    name: "Microservices Dashboard",
    description: "Dashboard distribuído em microserviços",
    category: "Architecture",
    features: ["Service discovery", "Load balancing", "Fault tolerance", "Scalability"],
    icon: Cpu,
    complexity: "High",
    futuristic: true,
    professional: true
  },

  // CATEGORIA: GAMIFICAÇÃO
  {
    id: 32,
    name: "Gamified Experience",
    description: "Elementos de gamificação para engajamento",
    category: "Engagement",
    features: ["Achievement badges", "Progress bars", "Leaderboards", "Reward systems"],
    icon: Star,
    complexity: "Medium",
    futuristic: false,
    professional: true
  },
  {
    id: 33,
    name: "Progress Visualization",
    description: "Visualização clara do progresso",
    category: "Engagement",
    features: ["Milestone tracking", "Goal setting", "Progress indicators", "Celebration moments"],
    icon: Target,
    complexity: "Low",
    futuristic: false,
    professional: true
  },

  // CATEGORIA: PERFORMANCE AVANÇADA
  {
    id: 34,
    name: "Edge Computing",
    description: "Processamento na borda para melhor performance",
    category: "Performance",
    features: ["CDN optimization", "Edge caching", "Local processing", "Reduced latency"],
    icon: Globe,
    complexity: "High",
    futuristic: true,
    professional: true
  },
  {
    id: 35,
    name: "Quantum-Ready",
    description: "Preparado para computação quântica",
    category: "Future",
    features: ["Quantum algorithms", "Parallel processing", "Advanced encryption", "Future-proof"],
    icon: Rocket,
    complexity: "High",
    futuristic: true,
    professional: true
  },

  // CATEGORIA: SUSTENTABILIDADE
  {
    id: 36,
    name: "Green Computing",
    description: "Computação sustentável e eficiente",
    category: "Sustainability",
    features: ["Energy optimization", "Carbon footprint", "Efficient algorithms", "Green hosting"],
    icon: Globe,
    complexity: "Medium",
    futuristic: false,
    professional: true
  },
  {
    id: 37,
    name: "Resource Optimization",
    description: "Otimização inteligente de recursos",
    category: "Performance",
    features: ["Memory management", "CPU optimization", "Network efficiency", "Storage optimization"],
    icon: Cpu,
    complexity: "High",
    futuristic: true,
    professional: true
  },

  // CATEGORIA: INOVAÇÃO
  {
    id: 38,
    name: "AR/VR Integration",
    description: "Integração com realidade aumentada/virtual",
    category: "Innovation",
    features: ["3D visualization", "Immersive experience", "Spatial computing", "Mixed reality"],
    icon: Eye,
    complexity: "High",
    futuristic: true,
    professional: true
  },
  {
    id: 39,
    name: "Blockchain Integration",
    description: "Integração com blockchain para transparência",
    category: "Innovation",
    features: ["Immutable records", "Smart contracts", "Decentralized data", "Cryptographic security"],
    icon: Shield,
    complexity: "High",
    futuristic: true,
    professional: true
  },

  // CATEGORIA: EXPERIÊNCIA DO USUÁRIO
  {
    id: 40,
    name: "Emotional Design",
    description: "Design que considera as emoções do usuário",
    category: "UX",
    features: ["Emotional feedback", "Mood detection", "Adaptive responses", "Empathy mapping"],
    icon: Heart,
    complexity: "Medium",
    futuristic: true,
    professional: true
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
    professional: true
  },

  // CATEGORIA: DADOS E INSIGHTS
  {
    id: 42,
    name: "Data Storytelling",
    description: "Contar histórias com dados",
    category: "Data",
    features: ["Narrative flow", "Visual metaphors", "Context building", "Insight delivery"],
    icon: Star,
    complexity: "Medium",
    futuristic: false,
    professional: true
  },
  {
    id: 43,
    name: "Real-time Decision Support",
    description: "Suporte à decisão em tempo real",
    category: "AI",
    features: ["Live recommendations", "Risk assessment", "Opportunity alerts", "Decision trees"],
    icon: Target,
    complexity: "High",
    futuristic: true,
    professional: true
  },

  // CATEGORIA: COLABORAÇÃO AVANÇADA
  {
    id: 44,
    name: "Virtual Workspace",
    description: "Espaço de trabalho virtual colaborativo",
    category: "Collaboration",
    features: ["Virtual rooms", "Shared whiteboards", "Real-time editing", "Spatial audio"],
    icon: Users,
    complexity: "High",
    futuristic: true,
    professional: true
  },
  {
    id: 45,
    name: "AI-Powered Collaboration",
    description: "Colaboração assistida por IA",
    category: "AI",
    features: ["Smart suggestions", "Conflict resolution", "Auto-translation", "Context awareness"],
    icon: Brain,
    complexity: "High",
    futuristic: true,
    professional: true
  },

  // CATEGORIA: SEGURANÇA AVANÇADA
  {
    id: 46,
    name: "Zero-Knowledge Architecture",
    description: "Arquitetura de conhecimento zero",
    category: "Security",
    features: ["End-to-end encryption", "Zero-trust model", "Privacy by design", "Data minimization"],
    icon: Shield,
    complexity: "High",
    futuristic: true,
    professional: true
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
    professional: true
  },

  // CATEGORIA: FUTURO
  {
    id: 48,
    name: "Neural Interface Ready",
    description: "Preparado para interfaces neurais",
    category: "Future",
    features: ["Brain-computer interface", "Thought control", "Neural feedback", "Cognitive enhancement"],
    icon: Brain,
    complexity: "High",
    futuristic: true,
    professional: true
  },
  {
    id: 49,
    name: "Quantum-Safe Security",
    description: "Segurança resistente a computação quântica",
    category: "Future",
    features: ["Post-quantum cryptography", "Quantum key distribution", "Future-proof encryption", "Advanced algorithms"],
    icon: Shield,
    complexity: "High",
    futuristic: true,
    professional: true
  },
  {
    id: 50,
    name: "Metaverse Integration",
    description: "Integração com o metaverso",
    category: "Future",
    features: ["Virtual presence", "3D avatars", "Spatial computing", "Immersive collaboration"],
    icon: Rocket,
    complexity: "High",
    futuristic: true,
    professional: true
  }
]

export default function LayoutOptionsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedComplexity, setSelectedComplexity] = useState<string>('All')
  const [selectedOption, setSelectedOption] = useState<LayoutOption | null>(null)

  const categories = ['All', ...Array.from(new Set(layoutOptions.map(opt => opt.category)))]
  
  const filteredOptions = layoutOptions.filter(option => {
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
            🚀 Dashboard Layout Options
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            50 sugestões profissionais e futuristas para organizar seu dashboard
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
                    <selectedOption.icon className="h-8 w-8 text-white" />
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
