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
  { id: 1, name: "Neon Grid", description: "Layout futurista com grid neon e animações", complexity: "Alta", tags: ["Futurista", "Neon", "Grid"], component: "NeonGrid" },
  { id: 2, name: "Holographic Cards", description: "Cards holográficos com efeitos 3D", complexity: "Alta", tags: ["Holográfico", "3D", "Moderno"], component: "HolographicCards" },
  { id: 3, name: "Quantum Dashboard", description: "Interface quântica com partículas animadas", complexity: "Muito Alta", tags: ["Quântico", "Partículas", "Científico"], component: "QuantumDashboard" },
  { id: 4, name: "Cyber Matrix", description: "Estilo Matrix com código caindo", complexity: "Alta", tags: ["Matrix", "Cyber", "Código"], component: "CyberMatrix" },
  { id: 5, name: "Neural Network", description: "Rede neural visual interativa", complexity: "Muito Alta", tags: ["Neural", "Rede", "Inteligente"], component: "NeuralNetwork" },
  { id: 6, name: "Crystal Prism", description: "Prismas cristalinos com refrações", complexity: "Alta", tags: ["Cristal", "Prisma", "Refração"], component: "CrystalPrism" },
  { id: 7, name: "Digital Rain", description: "Chuva digital com dados fluindo", complexity: "Média", tags: ["Digital", "Chuva", "Dados"], component: "DigitalRain" },
  { id: 8, name: "Hologram Interface", description: "Interface holográfica flutuante", complexity: "Alta", tags: ["Holograma", "Flutuante", "Sci-Fi"], component: "HologramInterface" },
  { id: 9, name: "Neon Circuit", description: "Circuitos neon com energia fluindo", complexity: "Média", tags: ["Circuito", "Neon", "Energia"], component: "NeonCircuit" },
  { id: 10, name: "Quantum Tiles", description: "Tiles quânticos com estados superpostos", complexity: "Alta", tags: ["Quântico", "Tiles", "Superposição"], component: "QuantumTiles" },
  { id: 11, name: "Cyberpunk Grid", description: "Grid cyberpunk com neon e sombras", complexity: "Média", tags: ["Cyberpunk", "Grid", "Neon"], component: "CyberpunkGrid" },
  { id: 12, name: "Holographic Data", description: "Dados em formato holográfico", complexity: "Alta", tags: ["Holográfico", "Dados", "3D"], component: "HolographicData" },
  { id: 13, name: "Neural Pathways", description: "Caminhos neurais com sinapses", complexity: "Muito Alta", tags: ["Neural", "Caminhos", "Sinapses"], component: "NeuralPathways" },
  { id: 14, name: "Digital Hive", description: "Colmeia digital com hexágonos", complexity: "Média", tags: ["Colmeia", "Hexágono", "Digital"], component: "DigitalHive" },
  { id: 15, name: "Quantum Wave", description: "Ondas quânticas com interferência", complexity: "Alta", tags: ["Quântico", "Ondas", "Interferência"], component: "QuantumWave" },
  { id: 16, name: "Neon City", description: "Cidade neon com arranha-céus", complexity: "Média", tags: ["Cidade", "Neon", "Arranha-céus"], component: "NeonCity" },
  { id: 17, name: "Holographic Sphere", description: "Esferas holográficas flutuantes", complexity: "Alta", tags: ["Holográfico", "Esfera", "Flutuante"], component: "HolographicSphere" },
  { id: 18, name: "Cyber Circuit", description: "Circuitos cibernéticos animados", complexity: "Média", tags: ["Circuito", "Cibernético", "Animado"], component: "CyberCircuit" },
  { id: 19, name: "Quantum Particles", description: "Partículas quânticas em movimento", complexity: "Muito Alta", tags: ["Quântico", "Partículas", "Movimento"], component: "QuantumParticles" },
  { id: 20, name: "Digital Galaxy", description: "Galáxia digital com estrelas", complexity: "Alta", tags: ["Galáxia", "Digital", "Estrelas"], component: "DigitalGalaxy" },
  { id: 21, name: "Neon Hexagon", description: "Hexágonos neon com padrões", complexity: "Média", tags: ["Hexágono", "Neon", "Padrões"], component: "NeonHexagon" },
  { id: 22, name: "Holographic Pyramid", description: "Pirâmides holográficas 3D", complexity: "Alta", tags: ["Holográfico", "Pirâmide", "3D"], component: "HolographicPyramid" },
  { id: 23, name: "Cyber Grid", description: "Grid cibernético com conexões", complexity: "Média", tags: ["Grid", "Cibernético", "Conexões"], component: "CyberGrid" },
  { id: 24, name: "Quantum Tunnel", description: "Túnel quântico com efeito de profundidade", complexity: "Muito Alta", tags: ["Quântico", "Túnel", "Profundidade"], component: "QuantumTunnel" },
  { id: 25, name: "Neon Wave", description: "Ondas neon com animação fluida", complexity: "Média", tags: ["Neon", "Ondas", "Animação"], component: "NeonWave" },
  { id: 26, name: "Holographic Cube", description: "Cubos holográficos rotativos", complexity: "Alta", tags: ["Holográfico", "Cubo", "Rotativo"], component: "HolographicCube" },
  { id: 27, name: "Digital DNA", description: "DNA digital com hélice dupla", complexity: "Alta", tags: ["DNA", "Digital", "Hélice"], component: "DigitalDNA" },
  { id: 28, name: "Neon Circuit Board", description: "Placa de circuito neon", complexity: "Média", tags: ["Circuito", "Neon", "Placa"], component: "NeonCircuitBoard" },
  { id: 29, name: "Holographic Network", description: "Rede holográfica de conexões", complexity: "Alta", tags: ["Holográfico", "Rede", "Conexões"], component: "HolographicNetwork" },
  { id: 30, name: "Quantum Dot", description: "Pontos quânticos com estados", complexity: "Muito Alta", tags: ["Quântico", "Pontos", "Estados"], component: "QuantumDot" },
  { id: 31, name: "Cyber Neon", description: "Neon cyberpunk com sombras", complexity: "Média", tags: ["Cyber", "Neon", "Sombras"], component: "CyberNeon" },
  { id: 32, name: "Holographic Data Stream", description: "Fluxo de dados holográfico", complexity: "Alta", tags: ["Holográfico", "Dados", "Fluxo"], component: "HolographicDataStream" },
  { id: 33, name: "Neon Matrix", description: "Matrix neon com caracteres", complexity: "Média", tags: ["Matrix", "Neon", "Caracteres"], component: "NeonMatrix" },
  { id: 34, name: "Quantum Field", description: "Campo quântico com flutuações", complexity: "Muito Alta", tags: ["Quântico", "Campo", "Flutuações"], component: "QuantumField" },
  { id: 35, name: "Holographic Interface", description: "Interface holográfica completa", complexity: "Alta", tags: ["Holográfico", "Interface", "Completa"], component: "HolographicInterface" },
  { id: 36, name: "Digital Hologram", description: "Holograma digital com projeção", complexity: "Alta", tags: ["Digital", "Holograma", "Projeção"], component: "DigitalHologram" },
  { id: 37, name: "Neon Hologram", description: "Holograma neon com brilho", complexity: "Média", tags: ["Neon", "Holograma", "Brilho"], component: "NeonHologram" },
  { id: 38, name: "Quantum Hologram", description: "Holograma quântico com superposição", complexity: "Muito Alta", tags: ["Quântico", "Holograma", "Superposição"], component: "QuantumHologram" },
  { id: 39, name: "Cyber Hologram", description: "Holograma cibernético", complexity: "Alta", tags: ["Cyber", "Holograma", "Cibernético"], component: "CyberHologram" },
  { id: 40, name: "Digital Quantum", description: "Quântico digital com bits", complexity: "Alta", tags: ["Digital", "Quântico", "Bits"], component: "DigitalQuantum" },
  { id: 41, name: "Neon Quantum", description: "Quântico neon com energia", complexity: "Média", tags: ["Neon", "Quântico", "Energia"], component: "NeonQuantum" },
  { id: 42, name: "Holographic Quantum", description: "Quântico holográfico 3D", complexity: "Muito Alta", tags: ["Holográfico", "Quântico", "3D"], component: "HolographicQuantum" },
  { id: 43, name: "Cyber Quantum", description: "Quântico cibernético", complexity: "Alta", tags: ["Cyber", "Quântico", "Cibernético"], component: "CyberQuantum" },
  { id: 44, name: "Digital Cyber", description: "Cibernético digital", complexity: "Média", tags: ["Digital", "Cyber", "Cibernético"], component: "DigitalCyber" },
  { id: 45, name: "Neon Cyber", description: "Cibernético neon", complexity: "Média", tags: ["Neon", "Cyber", "Cibernético"], component: "NeonCyber" },
  { id: 46, name: "Holographic Cyber", description: "Cibernético holográfico", complexity: "Alta", tags: ["Holográfico", "Cyber", "Cibernético"], component: "HolographicCyber" },
  { id: 47, name: "Quantum Cyber", description: "Cibernético quântico", complexity: "Muito Alta", tags: ["Quântico", "Cyber", "Cibernético"], component: "QuantumCyber" },
  { id: 48, name: "Digital Neon", description: "Neon digital", complexity: "Média", tags: ["Digital", "Neon", "Digital"], component: "DigitalNeon" },
  { id: 49, name: "Holographic Neon", description: "Neon holográfico", complexity: "Alta", tags: ["Holográfico", "Neon", "Holográfico"], component: "HolographicNeon" },
  { id: 50, name: "Quantum Neon", description: "Neon quântico", complexity: "Muito Alta", tags: ["Quântico", "Neon", "Quântico"], component: "QuantumNeon" }
]

export default function ClientPresentations() {
  const [selectedPresentation, setSelectedPresentation] = useState<number | null>(null)

  const renderPresentation = (id: number) => {
    const colors = [
      { bg: 'from-cyan-900/20 to-blue-900/20', border: 'border-cyan-500/30', hover: 'hover:border-cyan-400', icon: 'from-cyan-500 to-blue-500', text: 'text-cyan-400', card: 'bg-cyan-800/30 border-cyan-500/20' },
      { bg: 'from-purple-900/20 to-pink-900/20', border: 'border-purple-500/30', hover: 'hover:border-purple-400', icon: 'from-purple-500 to-pink-500', text: 'text-purple-400', card: 'bg-purple-800/30 border-purple-500/20' },
      { bg: 'from-green-900/20 to-teal-900/20', border: 'border-green-500/30', hover: 'hover:border-green-400', icon: 'from-green-500 to-teal-500', text: 'text-green-400', card: 'bg-green-800/30 border-green-500/20' },
      { bg: 'from-red-900/20 to-orange-900/20', border: 'border-red-500/30', hover: 'hover:border-red-400', icon: 'from-red-500 to-orange-500', text: 'text-red-400', card: 'bg-red-800/30 border-red-500/20' },
      { bg: 'from-indigo-900/20 to-purple-900/20', border: 'border-indigo-500/30', hover: 'hover:border-indigo-400', icon: 'from-indigo-500 to-purple-500', text: 'text-indigo-400', card: 'bg-indigo-800/30 border-indigo-500/20' },
      { bg: 'from-pink-900/20 to-rose-900/20', border: 'border-pink-500/30', hover: 'hover:border-pink-400', icon: 'from-pink-500 to-rose-500', text: 'text-pink-400', card: 'bg-pink-800/30 border-pink-500/20' },
      { bg: 'from-green-900/20 to-emerald-900/20', border: 'border-green-500/30', hover: 'hover:border-green-400', icon: 'from-green-500 to-emerald-500', text: 'text-green-400', card: 'bg-green-800/30 border-green-500/20' },
      { bg: 'from-cyan-900/20 to-blue-900/20', border: 'border-cyan-500/30', hover: 'hover:border-cyan-400', icon: 'from-cyan-500 to-blue-500', text: 'text-cyan-400', card: 'bg-cyan-800/30 border-cyan-500/20' },
      { bg: 'from-orange-900/20 to-red-900/20', border: 'border-orange-500/30', hover: 'hover:border-orange-400', icon: 'from-orange-500 to-red-500', text: 'text-orange-400', card: 'bg-orange-800/30 border-orange-500/20' },
      { bg: 'from-violet-900/20 to-purple-900/20', border: 'border-violet-500/30', hover: 'hover:border-violet-400', icon: 'from-violet-500 to-purple-500', text: 'text-violet-400', card: 'bg-violet-800/30 border-violet-500/20' }
    ]
    
    const colorIndex = (id - 1) % colors.length
    const color = colors[colorIndex]
    const icons = [Building, Activity, Target, Cpu, Database, Diamond, Droplets, Globe, Zap, Square, Grid, Database, Activity, Hexagon, Wind, Building, Circle, Cpu, Sparkles, Star, Hexagon, Triangle, Grid, Square, Wind, Square, Database, Cpu, Database, Square, Grid, Database, Grid, Database, Database, Database, Database, Database, Database, Database, Database, Database, Database, Database, Database, Database, Database, Database, Database]
    const Icon = icons[id - 1] || Building
    
    const gradients = [
      'from-cyan-400 to-blue-600', 'from-purple-400 to-pink-600', 'from-green-400 to-teal-600', 'from-red-400 to-orange-600', 'from-indigo-400 to-purple-600',
      'from-pink-400 to-rose-600', 'from-green-400 to-emerald-600', 'from-cyan-400 to-blue-600', 'from-orange-400 to-red-600', 'from-violet-400 to-purple-600',
      'from-pink-400 to-red-600', 'from-cyan-400 to-blue-600', 'from-emerald-400 to-teal-600', 'from-amber-400 to-orange-600', 'from-sky-400 to-cyan-600',
      'from-fuchsia-400 to-pink-600', 'from-indigo-400 to-purple-600', 'from-lime-400 to-green-600', 'from-rose-400 to-pink-600', 'from-slate-400 to-gray-600',
      'from-teal-400 to-cyan-600', 'from-yellow-400 to-amber-600', 'from-red-400 to-pink-600', 'from-violet-400 to-purple-600', 'from-cyan-400 to-blue-600',
      'from-indigo-400 to-purple-600', 'from-green-400 to-emerald-600', 'from-orange-400 to-red-600', 'from-blue-400 to-cyan-600', 'from-purple-400 to-pink-600',
      'from-red-400 to-orange-600', 'from-cyan-400 to-blue-600', 'from-green-400 to-teal-600', 'from-indigo-400 to-purple-600', 'from-pink-400 to-rose-600',
      'from-yellow-400 to-amber-600', 'from-blue-400 to-cyan-600', 'from-purple-400 to-pink-600', 'from-red-400 to-orange-600', 'from-green-400 to-teal-600',
      'from-indigo-400 to-purple-600', 'from-cyan-400 to-blue-600', 'from-orange-400 to-red-600', 'from-blue-400 to-cyan-600', 'from-purple-400 to-pink-600',
      'from-red-400 to-orange-600', 'from-green-400 to-teal-600', 'from-indigo-400 to-purple-600', 'from-cyan-400 to-blue-600', 'from-orange-400 to-red-600'
    ]
    
    const gradient = gradients[id - 1] || 'from-blue-400 to-cyan-600'
    const presentation = presentations.find(p => p.id === id)
    
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className={`text-3xl font-bold mb-4 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
            {presentation?.name}
          </h2>
          <p className="text-gray-400">{presentation?.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockClients.map((client) => (
            <div key={client.id} className={`bg-gradient-to-br ${color.bg} rounded-2xl p-6 border ${color.border} ${color.hover} transition-all duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${color.icon} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{client.name}</h3>
                    <p className="text-sm text-gray-400">{client.type} • {client.tickets} tickets</p>
                  </div>
                </div>
                <span className={`${color.text} font-bold text-lg`}>{client.trend}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={`${color.card} rounded-lg p-3 border`}>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">Total</p>
                    <p className={`${color.text} font-bold text-xl`}>{client.tickets}</p>
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