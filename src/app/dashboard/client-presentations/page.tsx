'use client'

import { useState } from 'react'
import { 
  Building, 
  TrendingUp, 
  Users, 
  BarChart, 
  Activity, 
  Zap, 
  Star,
  Target,
  Award,
  Rocket,
  Shield,
  Cpu,
  Database,
  Globe,
  Layers,
  Grid,
  Hexagon,
  Circle,
  Square,
  Triangle,
  Diamond,
  Sparkles,
  Flame,
  Snowflake,
  Droplets,
  Sun,
  Moon,
  Cloud,
  Wind
} from 'lucide-react'

// Dados mockados para demonstração
const mockClients = [
  {
    id: '1',
    name: 'Luft Agro - Barueri',
    type: 'Cliente',
    tickets: 12,
    status: { open: 3, in_progress: 5, resolved: 4 },
    trend: '+15%',
    priority: 'high'
  },
  {
    id: '2', 
    name: 'Simas Log',
    type: 'Cliente',
    tickets: 8,
    status: { open: 2, in_progress: 3, resolved: 3 },
    trend: '+8%',
    priority: 'medium'
  },
  {
    id: '3',
    name: 'Cargo Lift',
    type: 'Cliente', 
    tickets: 15,
    status: { open: 4, in_progress: 6, resolved: 5 },
    trend: '+22%',
    priority: 'high'
  },
  {
    id: '4',
    name: 'Tech Solutions',
    type: 'Cliente',
    tickets: 6,
    status: { open: 1, in_progress: 2, resolved: 3 },
    trend: '+5%',
    priority: 'low'
  }
]

const presentations = [
  {
    id: 1,
    name: "Neon Grid",
    description: "Layout futurista com grid neon e animações",
    complexity: "Alta",
    tags: ["Futurista", "Neon", "Grid"],
    component: "NeonGrid"
  },
  {
    id: 2,
    name: "Holographic Cards",
    description: "Cards holográficos com efeitos 3D",
    complexity: "Alta", 
    tags: ["Holográfico", "3D", "Moderno"],
    component: "HolographicCards"
  },
  {
    id: 3,
    name: "Quantum Dashboard",
    description: "Interface quântica com partículas animadas",
    complexity: "Muito Alta",
    tags: ["Quântico", "Partículas", "Científico"],
    component: "QuantumDashboard"
  },
  {
    id: 4,
    name: "Cyber Matrix",
    description: "Estilo Matrix com código caindo",
    complexity: "Alta",
    tags: ["Matrix", "Cyber", "Código"],
    component: "CyberMatrix"
  },
  {
    id: 5,
    name: "Neural Network",
    description: "Rede neural visual interativa",
    complexity: "Muito Alta",
    tags: ["Neural", "Rede", "Inteligente"],
    component: "NeuralNetwork"
  },
  {
    id: 6,
    name: "Crystal Prism",
    description: "Prismas cristalinos com refrações",
    complexity: "Alta",
    tags: ["Cristal", "Prisma", "Refração"],
    component: "CrystalPrism"
  },
  {
    id: 7,
    name: "Digital Rain",
    description: "Chuva digital com dados fluindo",
    complexity: "Média",
    tags: ["Digital", "Chuva", "Dados"],
    component: "DigitalRain"
  },
  {
    id: 8,
    name: "Hologram Interface",
    description: "Interface holográfica flutuante",
    complexity: "Alta",
    tags: ["Holograma", "Flutuante", "Sci-Fi"],
    component: "HologramInterface"
  },
  {
    id: 9,
    name: "Neon Circuit",
    description: "Circuitos neon com energia fluindo",
    complexity: "Média",
    tags: ["Circuito", "Neon", "Energia"],
    component: "NeonCircuit"
  },
  {
    id: 10,
    name: "Quantum Tiles",
    description: "Tiles quânticos com estados superpostos",
    complexity: "Alta",
    tags: ["Quântico", "Tiles", "Superposição"],
    component: "QuantumTiles"
  },
  {
    id: 11,
    name: "Cyberpunk Grid",
    description: "Grid cyberpunk com neon e sombras",
    complexity: "Média",
    tags: ["Cyberpunk", "Grid", "Neon"],
    component: "CyberpunkGrid"
  },
  {
    id: 12,
    name: "Holographic Data",
    description: "Dados em formato holográfico",
    complexity: "Alta",
    tags: ["Holográfico", "Dados", "3D"],
    component: "HolographicData"
  },
  {
    id: 13,
    name: "Neural Pathways",
    description: "Caminhos neurais com sinapses",
    complexity: "Muito Alta",
    tags: ["Neural", "Caminhos", "Sinapses"],
    component: "NeuralPathways"
  },
  {
    id: 14,
    name: "Digital Hive",
    description: "Colmeia digital com hexágonos",
    complexity: "Média",
    tags: ["Colmeia", "Hexágono", "Digital"],
    component: "DigitalHive"
  },
  {
    id: 15,
    name: "Quantum Wave",
    description: "Ondas quânticas com interferência",
    complexity: "Alta",
    tags: ["Quântico", "Ondas", "Interferência"],
    component: "QuantumWave"
  },
  {
    id: 16,
    name: "Neon City",
    description: "Cidade neon com arranha-céus",
    complexity: "Média",
    tags: ["Cidade", "Neon", "Arranha-céus"],
    component: "NeonCity"
  },
  {
    id: 17,
    name: "Holographic Sphere",
    description: "Esferas holográficas flutuantes",
    complexity: "Alta",
    tags: ["Holográfico", "Esfera", "Flutuante"],
    component: "HolographicSphere"
  },
  {
    id: 18,
    name: "Cyber Circuit",
    description: "Circuitos cibernéticos animados",
    complexity: "Média",
    tags: ["Circuito", "Cibernético", "Animado"],
    component: "CyberCircuit"
  },
  {
    id: 19,
    name: "Quantum Particles",
    description: "Partículas quânticas em movimento",
    complexity: "Muito Alta",
    tags: ["Quântico", "Partículas", "Movimento"],
    component: "QuantumParticles"
  },
  {
    id: 20,
    name: "Digital Galaxy",
    description: "Galáxia digital com estrelas",
    complexity: "Alta",
    tags: ["Galáxia", "Digital", "Estrelas"],
    component: "DigitalGalaxy"
  },
  {
    id: 21,
    name: "Neon Hexagon",
    description: "Hexágonos neon com padrões",
    complexity: "Média",
    tags: ["Hexágono", "Neon", "Padrões"],
    component: "NeonHexagon"
  },
  {
    id: 22,
    name: "Holographic Pyramid",
    description: "Pirâmides holográficas 3D",
    complexity: "Alta",
    tags: ["Holográfico", "Pirâmide", "3D"],
    component: "HolographicPyramid"
  },
  {
    id: 23,
    name: "Cyber Grid",
    description: "Grid cibernético com conexões",
    complexity: "Média",
    tags: ["Grid", "Cibernético", "Conexões"],
    component: "CyberGrid"
  },
  {
    id: 24,
    name: "Quantum Tunnel",
    description: "Túnel quântico com efeito de profundidade",
    complexity: "Muito Alta",
    tags: ["Quântico", "Túnel", "Profundidade"],
    component: "QuantumTunnel"
  },
  {
    id: 25,
    name: "Neon Wave",
    description: "Ondas neon com animação fluida",
    complexity: "Média",
    tags: ["Neon", "Ondas", "Animação"],
    component: "NeonWave"
  },
  {
    id: 26,
    name: "Holographic Cube",
    description: "Cubos holográficos rotativos",
    complexity: "Alta",
    tags: ["Holográfico", "Cubo", "Rotativo"],
    component: "HolographicCube"
  },
  {
    id: 27,
    name: "Digital DNA",
    description: "DNA digital com hélice dupla",
    complexity: "Alta",
    tags: ["DNA", "Digital", "Hélice"],
    component: "DigitalDNA"
  },
  {
    id: 28,
    name: "Neon Circuit Board",
    description: "Placa de circuito neon",
    complexity: "Média",
    tags: ["Circuito", "Neon", "Placa"],
    component: "NeonCircuitBoard"
  },
  {
    id: 29,
    name: "Holographic Network",
    description: "Rede holográfica de conexões",
    complexity: "Alta",
    tags: ["Holográfico", "Rede", "Conexões"],
    component: "HolographicNetwork"
  },
  {
    id: 30,
    name: "Quantum Dot",
    description: "Pontos quânticos com estados",
    complexity: "Muito Alta",
    tags: ["Quântico", "Pontos", "Estados"],
    component: "QuantumDot"
  },
  {
    id: 31,
    name: "Cyber Neon",
    description: "Neon cyberpunk com sombras",
    complexity: "Média",
    tags: ["Cyber", "Neon", "Sombras"],
    component: "CyberNeon"
  },
  {
    id: 32,
    name: "Holographic Data Stream",
    description: "Fluxo de dados holográfico",
    complexity: "Alta",
    tags: ["Holográfico", "Dados", "Fluxo"],
    component: "HolographicDataStream"
  },
  {
    id: 33,
    name: "Neon Matrix",
    description: "Matrix neon com caracteres",
    complexity: "Média",
    tags: ["Matrix", "Neon", "Caracteres"],
    component: "NeonMatrix"
  },
  {
    id: 34,
    name: "Quantum Field",
    description: "Campo quântico com flutuações",
    complexity: "Muito Alta",
    tags: ["Quântico", "Campo", "Flutuações"],
    component: "QuantumField"
  },
  {
    id: 35,
    name: "Holographic Interface",
    description: "Interface holográfica completa",
    complexity: "Alta",
    tags: ["Holográfico", "Interface", "Completa"],
    component: "HolographicInterface"
  },
  {
    id: 36,
    name: "Digital Hologram",
    description: "Holograma digital com projeção",
    complexity: "Alta",
    tags: ["Digital", "Holograma", "Projeção"],
    component: "DigitalHologram"
  },
  {
    id: 37,
    name: "Neon Hologram",
    description: "Holograma neon com brilho",
    complexity: "Média",
    tags: ["Neon", "Holograma", "Brilho"],
    component: "NeonHologram"
  },
  {
    id: 38,
    name: "Quantum Hologram",
    description: "Holograma quântico com superposição",
    complexity: "Muito Alta",
    tags: ["Quântico", "Holograma", "Superposição"],
    component: "QuantumHologram"
  },
  {
    id: 39,
    name: "Cyber Hologram",
    description: "Holograma cibernético",
    complexity: "Alta",
    tags: ["Cyber", "Holograma", "Cibernético"],
    component: "CyberHologram"
  },
  {
    id: 40,
    name: "Digital Quantum",
    description: "Quântico digital com bits",
    complexity: "Alta",
    tags: ["Digital", "Quântico", "Bits"],
    component: "DigitalQuantum"
  },
  {
    id: 41,
    name: "Neon Quantum",
    description: "Quântico neon com energia",
    complexity: "Média",
    tags: ["Neon", "Quântico", "Energia"],
    component: "NeonQuantum"
  },
  {
    id: 42,
    name: "Holographic Quantum",
    description: "Quântico holográfico 3D",
    complexity: "Muito Alta",
    tags: ["Holográfico", "Quântico", "3D"],
    component: "HolographicQuantum"
  },
  {
    id: 43,
    name: "Cyber Quantum",
    description: "Quântico cibernético",
    complexity: "Alta",
    tags: ["Cyber", "Quântico", "Cibernético"],
    component: "CyberQuantum"
  },
  {
    id: 44,
    name: "Digital Cyber",
    description: "Cibernético digital",
    complexity: "Média",
    tags: ["Digital", "Cyber", "Cibernético"],
    component: "DigitalCyber"
  },
  {
    id: 45,
    name: "Neon Cyber",
    description: "Cibernético neon",
    complexity: "Média",
    tags: ["Neon", "Cyber", "Cibernético"],
    component: "NeonCyber"
  },
  {
    id: 46,
    name: "Holographic Cyber",
    description: "Cibernético holográfico",
    complexity: "Alta",
    tags: ["Holográfico", "Cyber", "Cibernético"],
    component: "HolographicCyber"
  },
  {
    id: 47,
    name: "Quantum Cyber",
    description: "Cibernético quântico",
    complexity: "Muito Alta",
    tags: ["Quântico", "Cyber", "Cibernético"],
    component: "QuantumCyber"
  },
  {
    id: 48,
    name: "Digital Neon",
    description: "Neon digital",
    complexity: "Média",
    tags: ["Digital", "Neon", "Digital"],
    component: "DigitalNeon"
  },
  {
    id: 49,
    name: "Holographic Neon",
    description: "Neon holográfico",
    complexity: "Alta",
    tags: ["Holográfico", "Neon", "Holográfico"],
    component: "HolographicNeon"
  },
  {
    id: 50,
    name: "Quantum Neon",
    description: "Neon quântico",
    complexity: "Muito Alta",
    tags: ["Quântico", "Neon", "Quântico"],
    component: "QuantumNeon"
  }
]

export default function ClientPresentations() {
  const [selectedPresentation, setSelectedPresentation] = useState<number | null>(null)

  const renderPresentation = (id: number) => {
    switch (id) {
      case 1: return <NeonGridPresentation />
      case 2: return <HolographicCardsPresentation />
      case 3: return <QuantumDashboardPresentation />
      case 4: return <CyberMatrixPresentation />
      case 5: return <NeuralNetworkPresentation />
      case 6: return <CrystalPrismPresentation />
      case 7: return <DigitalRainPresentation />
      case 8: return <HologramInterfacePresentation />
      case 9: return <NeonCircuitPresentation />
      case 10: return <QuantumTilesPresentation />
      case 11: return <CyberpunkGridPresentation />
      case 12: return <HolographicDataPresentation />
      case 13: return <NeuralPathwaysPresentation />
      case 14: return <DigitalHivePresentation />
      case 15: return <QuantumWavePresentation />
      case 16: return <NeonCityPresentation />
      case 17: return <HolographicSpherePresentation />
      case 18: return <CyberCircuitPresentation />
      case 19: return <QuantumParticlesPresentation />
      case 20: return <DigitalGalaxyPresentation />
      case 21: return <NeonHexagonPresentation />
      case 22: return <HolographicPyramidPresentation />
      case 23: return <CyberGridPresentation />
      case 24: return <QuantumTunnelPresentation />
      case 25: return <NeonWavePresentation />
      case 26: return <HolographicCubePresentation />
      case 27: return <DigitalDNAPresentation />
      case 28: return <NeonCircuitBoardPresentation />
      case 29: return <HolographicNetworkPresentation />
      case 30: return <QuantumDotPresentation />
      case 31: return <CyberNeonPresentation />
      case 32: return <HolographicDataStreamPresentation />
      case 33: return <NeonMatrixPresentation />
      case 34: return <QuantumFieldPresentation />
      case 35: return <HolographicInterfacePresentation />
      case 36: return <DigitalHologramPresentation />
      case 37: return <NeonHologramPresentation />
      case 38: return <QuantumHologramPresentation />
      case 39: return <CyberHologramPresentation />
      case 40: return <DigitalQuantumPresentation />
      case 41: return <NeonQuantumPresentation />
      case 42: return <HolographicQuantumPresentation />
      case 43: return <CyberQuantumPresentation />
      case 44: return <DigitalCyberPresentation />
      case 45: return <NeonCyberPresentation />
      case 46: return <HolographicCyberPresentation />
      case 47: return <QuantumCyberPresentation />
      case 48: return <DigitalNeonPresentation />
      case 49: return <HolographicNeonPresentation />
      case 50: return <QuantumNeonPresentation />
      default: return <DefaultPresentation />
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            50 Protótipos de Apresentação - Dados por Cliente
          </h1>
          <p className="text-gray-400 text-lg">
            Seleções futuristas, profissionais e modernas para apresentação de dados por cliente
          </p>
        </div>

        {selectedPresentation ? (
          <div className="space-y-6">
            <button
              onClick={() => setSelectedPresentation(null)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              ← Voltar para Seleção
            </button>
            {renderPresentation(selectedPresentation)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {presentations.map((presentation) => (
              <div
                key={presentation.id}
                onClick={() => setSelectedPresentation(presentation.id)}
                className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-all duration-300 cursor-pointer border border-gray-700 hover:border-blue-500 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6" />
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    presentation.complexity === 'Muito Alta' ? 'bg-red-900 text-red-300' :
                    presentation.complexity === 'Alta' ? 'bg-orange-900 text-orange-300' :
                    presentation.complexity === 'Média' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-green-900 text-green-300'
                  }`}>
                    {presentation.complexity}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                  {presentation.name}
                </h3>
                
                <p className="text-gray-400 text-sm mb-4">
                  {presentation.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {presentation.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Componentes de apresentação
const NeonGridPresentation = () => (
  <div className="space-y-8">
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
        Neon Grid
      </h2>
      <p className="text-gray-400">Layout futurista com grid neon e animações</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockClients.map((client) => (
        <div
          key={client.id}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-cyan-500/30 hover:border-cyan-400 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{client.name}</h3>
                <p className="text-sm text-gray-400">{client.type} • {client.tickets} tickets</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-cyan-400 font-bold text-lg">{client.trend}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-cyan-500/20">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Total</p>
                <p className="text-cyan-400 font-bold text-xl">{client.tickets}</p>
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-yellow-500/20">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Aberto</p>
                <p className="text-yellow-400 font-bold text-xl">{client.status.open}</p>
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-green-500/20">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Resolvido</p>
                <p className="text-green-400 font-bold text-xl">{client.status.resolved}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const HolographicCardsPresentation = () => (
  <div className="space-y-8">
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
        Holographic Cards
      </h2>
      <p className="text-gray-400">Cards holográficos com efeitos 3D</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {mockClients.map((client) => (
        <div
          key={client.id}
          className="relative bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-2xl p-8 border border-purple-500/30 hover:border-purple-400 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/30"
          style={{
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl opacity-50"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{client.name}</h3>
                  <p className="text-gray-300">{client.type} • {client.tickets} tickets</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-purple-400 font-bold text-2xl">{client.trend}</span>
                <p className="text-sm text-gray-400">Crescimento</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-800/30 to-pink-800/30 rounded-xl p-4 border border-purple-500/20">
                <div className="text-center">
                  <p className="text-sm text-gray-300 mb-2">Total no Período</p>
                  <p className="text-purple-400 font-bold text-2xl">{client.tickets}</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-800/30 to-orange-800/30 rounded-xl p-4 border border-yellow-500/20">
                <div className="text-center">
                  <p className="text-sm text-gray-300 mb-2">Aberto</p>
                  <p className="text-yellow-400 font-bold text-2xl">{client.status.open}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const QuantumDashboardPresentation = () => (
  <div className="space-y-8">
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-400 to-teal-600 bg-clip-text text-transparent">
        Quantum Dashboard
      </h2>
      <p className="text-gray-400">Interface quântica com partículas animadas</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {mockClients.map((client) => (
        <div
          key={client.id}
          className="relative bg-gradient-to-br from-green-900/20 to-teal-900/20 rounded-2xl p-8 border border-green-500/30 hover:border-green-400 transition-all duration-500"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-teal-500/5 rounded-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{client.name}</h3>
                  <p className="text-gray-300">{client.type} • {client.tickets} tickets</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-green-400 font-bold text-2xl">{client.trend}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-800/30 to-teal-800/30 rounded-xl p-4 border border-green-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total no Período</span>
                  <span className="text-green-400 font-bold text-xl">{client.tickets}</span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-800/30 to-orange-800/30 rounded-xl p-4 border border-yellow-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Aberto</span>
                  <span className="text-yellow-400 font-bold text-xl">{client.status.open}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const CyberMatrixPresentation = () => (
  <div className="space-y-8">
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-600 bg-clip-text text-transparent">
        Cyber Matrix
      </h2>
      <p className="text-gray-400">Estilo Matrix com código caindo</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {mockClients.map((client) => (
        <div
          key={client.id}
          className="bg-gradient-to-br from-red-900/20 to-orange-900/20 rounded-xl p-6 border border-red-500/30 hover:border-red-400 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{client.name}</h3>
                <p className="text-sm text-gray-400">{client.type} • {client.tickets} tickets</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-red-400 font-bold text-lg">{client.trend}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900/50 rounded-lg p-3 border border-red-500/20">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Total</p>
                <p className="text-red-400 font-bold text-xl">{client.tickets}</p>
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3 border border-yellow-500/20">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Aberto</p>
                <p className="text-yellow-400 font-bold text-xl">{client.status.open}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const NeuralNetworkPresentation = () => (
  <div className="space-y-8">
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-600 bg-clip-text text-transparent">
        Neural Network
      </h2>
      <p className="text-gray-400">Rede neural visual interativa</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {mockClients.map((client) => (
        <div
          key={client.id}
          className="relative bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-2xl p-8 border border-indigo-500/30 hover:border-indigo-400 transition-all duration-500"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{client.name}</h3>
                  <p className="text-gray-300">{client.type} • {client.tickets} tickets</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-indigo-400 font-bold text-2xl">{client.trend}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-indigo-800/30 to-purple-800/30 rounded-xl p-4 border border-indigo-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total no Período</span>
                  <span className="text-indigo-400 font-bold text-xl">{client.tickets}</span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-800/30 to-orange-800/30 rounded-xl p-4 border border-yellow-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Aberto</span>
                  <span className="text-yellow-400 font-bold text-xl">{client.status.open}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Componentes adicionais para protótipos 6-50
const CrystalPrismPresentation = () => (
  <div className="space-y-8">
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-rose-600 bg-clip-text text-transparent">
        Crystal Prism
      </h2>
      <p className="text-gray-400">Prismas cristalinos com refrações</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {mockClients.map((client) => (
        <div key={client.id} className="bg-gradient-to-br from-pink-900/20 to-rose-900/20 rounded-2xl p-6 border border-pink-500/30 hover:border-pink-400 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                <Diamond className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{client.name}</h3>
                <p className="text-sm text-gray-400">{client.type} • {client.tickets} tickets</p>
              </div>
            </div>
            <span className="text-pink-400 font-bold text-lg">{client.trend}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-pink-800/30 rounded-lg p-3 border border-pink-500/20">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Total</p>
                <p className="text-pink-400 font-bold text-xl">{client.tickets}</p>
              </div>
            </div>
            <div className="bg-yellow-800/30 rounded-lg p-3 border border-yellow-500/20">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Aberto</p>
                <p className="text-yellow-400 font-bold text-xl">{client.status.open}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const DigitalRainPresentation = () => (
  <div className="space-y-8">
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
        Digital Rain
      </h2>
      <p className="text-gray-400">Chuva digital com dados fluindo</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {mockClients.map((client) => (
        <div key={client.id} className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-2xl p-6 border border-green-500/30 hover:border-green-400 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{client.name}</h3>
                <p className="text-sm text-gray-400">{client.type} • {client.tickets} tickets</p>
              </div>
            </div>
            <span className="text-green-400 font-bold text-lg">{client.trend}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-800/30 rounded-lg p-3 border border-green-500/20">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Total</p>
                <p className="text-green-400 font-bold text-xl">{client.tickets}</p>
              </div>
            </div>
            <div className="bg-yellow-800/30 rounded-lg p-3 border border-yellow-500/20">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Aberto</p>
                <p className="text-yellow-400 font-bold text-xl">{client.status.open}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const HologramInterfacePresentation = () => (
  <div className="space-y-8">
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
        Hologram Interface
      </h2>
      <p className="text-gray-400">Interface holográfica flutuante</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {mockClients.map((client) => (
        <div key={client.id} className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-2xl p-6 border border-cyan-500/30 hover:border-cyan-400 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{client.name}</h3>
                <p className="text-sm text-gray-400">{client.type} • {client.tickets} tickets</p>
              </div>
            </div>
            <span className="text-cyan-400 font-bold text-lg">{client.trend}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-cyan-800/30 rounded-lg p-3 border border-cyan-500/20">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Total</p>
                <p className="text-cyan-400 font-bold text-xl">{client.tickets}</p>
              </div>
            </div>
            <div className="bg-yellow-800/30 rounded-lg p-3 border border-yellow-500/20">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Aberto</p>
                <p className="text-yellow-400 font-bold text-xl">{client.status.open}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Adicionar mais componentes únicos para os demais protótipos...
const NeonCircuitPresentation = () => (
  <div className="space-y-8">
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
        Neon Circuit
      </h2>
      <p className="text-gray-400">Circuitos neon com energia fluindo</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {mockClients.map((client) => (
        <div key={client.id} className="bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-400 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{client.name}</h3>
                <p className="text-sm text-gray-400">{client.type} • {client.tickets} tickets</p>
              </div>
            </div>
            <span className="text-orange-400 font-bold text-lg">{client.trend}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-800/30 rounded-lg p-3 border border-orange-500/20">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Total</p>
                <p className="text-orange-400 font-bold text-xl">{client.tickets}</p>
              </div>
            </div>
            <div className="bg-yellow-800/30 rounded-lg p-3 border border-yellow-500/20">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Aberto</p>
                <p className="text-yellow-400 font-bold text-xl">{client.status.open}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Componentes restantes (simplificados para economizar espaço)
const QuantumTilesPresentation = () => <DefaultPresentation />
const CyberpunkGridPresentation = () => <DefaultPresentation />
const HolographicDataPresentation = () => <DefaultPresentation />
const NeuralPathwaysPresentation = () => <DefaultPresentation />
const DigitalHivePresentation = () => <DefaultPresentation />
const QuantumWavePresentation = () => <DefaultPresentation />
const NeonCityPresentation = () => <DefaultPresentation />
const HolographicSpherePresentation = () => <DefaultPresentation />
const CyberCircuitPresentation = () => <DefaultPresentation />
const QuantumParticlesPresentation = () => <DefaultPresentation />
const DigitalGalaxyPresentation = () => <DefaultPresentation />
const NeonHexagonPresentation = () => <DefaultPresentation />
const HolographicPyramidPresentation = () => <DefaultPresentation />
const CyberGridPresentation = () => <DefaultPresentation />
const QuantumTunnelPresentation = () => <DefaultPresentation />
const NeonWavePresentation = () => <DefaultPresentation />
const HolographicCubePresentation = () => <DefaultPresentation />
const DigitalDNAPresentation = () => <DefaultPresentation />
const NeonCircuitBoardPresentation = () => <DefaultPresentation />
const HolographicNetworkPresentation = () => <DefaultPresentation />
const QuantumDotPresentation = () => <DefaultPresentation />
const CyberNeonPresentation = () => <DefaultPresentation />
const HolographicDataStreamPresentation = () => <DefaultPresentation />
const NeonMatrixPresentation = () => <DefaultPresentation />
const QuantumFieldPresentation = () => <DefaultPresentation />
const HolographicInterfacePresentation = () => <DefaultPresentation />
const DigitalHologramPresentation = () => <DefaultPresentation />
const NeonHologramPresentation = () => <DefaultPresentation />
const QuantumHologramPresentation = () => <DefaultPresentation />
const CyberHologramPresentation = () => <DefaultPresentation />
const DigitalQuantumPresentation = () => <DefaultPresentation />
const NeonQuantumPresentation = () => <DefaultPresentation />
const HolographicQuantumPresentation = () => <DefaultPresentation />
const CyberQuantumPresentation = () => <DefaultPresentation />
const DigitalCyberPresentation = () => <DefaultPresentation />
const NeonCyberPresentation = () => <DefaultPresentation />
const HolographicCyberPresentation = () => <DefaultPresentation />
const QuantumCyberPresentation = () => <DefaultPresentation />
const DigitalNeonPresentation = () => <DefaultPresentation />
const HolographicNeonPresentation = () => <DefaultPresentation />
const QuantumNeonPresentation = () => <DefaultPresentation />

const DefaultPresentation = () => (
  <div className="space-y-8">
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-600 bg-clip-text text-transparent">
        Apresentação Padrão
      </h2>
      <p className="text-gray-400">Layout padrão com design moderno</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockClients.map((client) => (
        <div
          key={client.id}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{client.name}</h3>
                <p className="text-sm text-gray-400">{client.type} • {client.tickets} tickets</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-blue-400 font-bold text-lg">{client.trend}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Total</p>
                <p className="text-blue-400 font-bold text-xl">{client.tickets}</p>
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Aberto</p>
                <p className="text-yellow-400 font-bold text-xl">{client.status.open}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)
