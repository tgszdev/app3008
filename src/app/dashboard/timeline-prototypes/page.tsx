'use client'

import { useState } from 'react'
import { Clock, CheckCircle, Circle, ArrowRight, Activity, Zap, TrendingUp, Timer, Calendar } from 'lucide-react'

// Dados de exemplo para os protótipos
const mockTimelineData = [
  {
    status: 'Aberto',
    user: 'Thiago Rodrigues Souza',
    timestamp: '2025-09-30T19:00:00-03:00',
    duration: null, // Primeiro status não tem duração
    color: '#3b82f6' // blue
  },
  {
    status: 'Em Atendimento',
    user: 'João Silva',
    timestamp: '2025-09-30T20:30:00-03:00',
    duration: '1h 30min',
    durationMs: 5400000,
    color: '#f59e0b' // amber
  },
  {
    status: 'Em Homologação',
    user: 'Maria Santos',
    timestamp: '2025-10-01T10:15:00-03:00',
    duration: '13h 45min',
    durationMs: 49500000,
    color: '#8b5cf6' // purple
  },
  {
    status: 'Ag. Deploy em Produção',
    user: 'Pedro Costa',
    timestamp: '2025-10-01T14:00:00-03:00',
    duration: '3h 45min',
    durationMs: 13500000,
    color: '#ec4899' // pink
  },
  {
    status: 'Resolvido',
    user: 'Ana Paula',
    timestamp: '2025-10-01T16:30:00-03:00',
    duration: '2h 30min',
    durationMs: 9000000,
    color: '#10b981' // green
  },
  {
    status: 'Fechado',
    user: 'Carlos Mendes',
    timestamp: '2025-10-01T17:00:00-03:00',
    duration: '30min',
    durationMs: 1800000,
    color: '#6b7280', // gray
    isFinal: true
  }
]

const totalDuration = '22h 00min'

export default function TimelinePrototypesPage() {
  const [selectedPrototype, setSelectedPrototype] = useState(1)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Protótipos de Linha do Tempo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            10 protótipos diferentes seguindo melhores práticas de UI/UX e Acessibilidade
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Tempo total:</strong> {totalDuration} desde abertura até fechamento
            </p>
          </div>
        </div>

        {/* Seletor de Protótipos */}
        <div className="mb-8 flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <button
              key={num}
              onClick={() => setSelectedPrototype(num)}
              className={`px-4 py-2 rounded-2xl font-medium transition-all duration-300 ${
                selectedPrototype === num
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Protótipo {num}
            </button>
          ))}
        </div>

        {/* Protótipos */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          {selectedPrototype === 1 && <Prototype1 />}
          {selectedPrototype === 2 && <Prototype2 />}
          {selectedPrototype === 3 && <Prototype3 />}
          {selectedPrototype === 4 && <Prototype4 />}
          {selectedPrototype === 5 && <Prototype5 />}
          {selectedPrototype === 6 && <Prototype6 />}
          {selectedPrototype === 7 && <Prototype7 />}
          {selectedPrototype === 8 && <Prototype8 />}
          {selectedPrototype === 9 && <Prototype9 />}
          {selectedPrototype === 10 && <Prototype10 />}
        </div>
      </div>
    </div>
  )
}

// ==================== PROTÓTIPO 1 ====================
// Timeline Vertical Clássica com Linha Contínua
function Prototype1() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Protótipo 1: Timeline Vertical Clássica
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Design clássico com linha vertical contínua e badges coloridos
      </p>
      
      <div className="relative">
        {/* Linha vertical */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
        
        {mockTimelineData.map((item, index) => (
          <div key={index} className="relative pl-16 pb-8 last:pb-0">
            {/* Ponto na linha */}
            <div
              className="absolute left-3 top-0 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800 shadow-lg z-10"
              style={{ backgroundColor: item.color }}
            />
            
            {/* Conteúdo */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{item.status}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">por {item.user}</p>
                </div>
                {item.duration && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                      <Clock size={16} />
                      {item.duration}
                    </div>
                    <p className="text-xs text-gray-500">nesta etapa</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(item.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        ))}
        
        {/* Tempo total */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-center gap-2">
            <Timer size={20} className="text-blue-600" />
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              Tempo Total: {totalDuration}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== PROTÓTIPO 2 ====================
// Timeline Horizontal com Cards
function Prototype2() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Protótipo 2: Timeline Horizontal com Cards
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Layout horizontal moderno com cards flutuantes
      </p>
      
      <div className="overflow-x-auto pb-4">
        <div className="flex items-start gap-4 min-w-max">
          {mockTimelineData.map((item, index) => (
            <div key={index} className="flex items-center">
              {/* Card */}
              <div className="w-64 bg-white dark:bg-gray-700 rounded-2xl p-4 shadow-lg border-l-4" style={{ borderColor: item.color }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{item.status}</h3>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {new Date(item.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">por {item.user}</p>
                {item.duration && (
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                    <Clock size={14} />
                    {item.duration}
                  </div>
                )}
              </div>
              
              {/* Seta */}
              {index < mockTimelineData.length - 1 && (
                <ArrowRight className="mx-2 text-gray-400" size={24} />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Total */}
      <div className="mt-6 text-center p-4 bg-blue-600 text-white rounded-2xl">
        <div className="flex items-center justify-center gap-2">
          <Timer size={24} />
          <span className="font-bold text-xl">Duração Total: {totalDuration}</span>
        </div>
      </div>
    </div>
  )
}

// ==================== PROTÓTIPO 3 ====================
// Timeline com Barras de Progresso
function Prototype3() {
  const maxDuration = Math.max(...mockTimelineData.filter(d => d.durationMs).map(d => d.durationMs || 0))
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Protótipo 3: Timeline com Barras de Progresso
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Visualização de duração com barras proporcionais
      </p>
      
      <div className="space-y-4">
        {mockTimelineData.map((item, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: item.color }}>
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{item.status}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(item.timestamp).toLocaleString('pt-BR')} • {item.user}
                  </p>
                </div>
              </div>
              {item.duration && (
                <div className="text-right">
                  <span className="font-bold text-lg text-gray-900 dark:text-white">{item.duration}</span>
                  <p className="text-xs text-gray-500">duração</p>
                </div>
              )}
            </div>
            
            {/* Barra de progresso */}
            {item.durationMs && (
              <div className="mt-3">
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${(item.durationMs / maxDuration) * 100}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Total */}
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl text-center">
          <p className="text-sm opacity-90 mb-1">Tempo Total de Resolução</p>
          <p className="text-3xl font-bold">{totalDuration}</p>
        </div>
      </div>
    </div>
  )
}

// ==================== PROTÓTIPO 4 ====================
// Timeline Compacta com Ícones
function Prototype4() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Protótipo 4: Timeline Compacta com Ícones
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Design minimalista e compacto com ícones visuais
      </p>
      
      <div className="space-y-3">
        {mockTimelineData.map((item, index) => {
          const Icon = item.isFinal ? CheckCircle : index === 0 ? Activity : Clock
          
          return (
            <div key={index} className="flex items-center gap-4 p-3 bg-white dark:bg-gray-700 rounded-2xl hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600">
              {/* Ícone */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.color + '20' }}>
                <Icon size={20} style={{ color: item.color }} />
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{item.status}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.user}</p>
              </div>
              
              {/* Duração */}
              {item.duration && (
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm" style={{ color: item.color }}>{item.duration}</p>
                </div>
              )}
              
              {/* Data */}
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(item.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Total */}
      <div className="mt-6 flex items-center justify-center gap-3 p-4 bg-gray-900 dark:bg-gray-950 text-white rounded-2xl">
        <Zap size={24} className="text-yellow-400" />
        <span className="text-xl font-bold">Resolvido em {totalDuration}</span>
      </div>
    </div>
  )
}

// ==================== PROTÓTIPO 5 ====================
// Timeline com Cards Empilhados (Stepper Style)
function Prototype5() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Protótipo 5: Stepper Style (Material Design)
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Estilo Material Design com números e conectores
      </p>
      
      <div className="relative">
        {mockTimelineData.map((item, index) => (
          <div key={index} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Connector line */}
            {index < mockTimelineData.length - 1 && (
              <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />
            )}
            
            {/* Step number */}
            <div className="relative flex-shrink-0">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-10"
                style={{ backgroundColor: item.color }}
              >
                {index + 1}
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 bg-white dark:bg-gray-700 rounded-2xl p-4 shadow-md border-l-4" style={{ borderColor: item.color }}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{item.status}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Responsável: {item.user}</p>
                </div>
                {item.duration && (
                  <div className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: item.color + '20', color: item.color }}>
                    <Clock size={14} className="inline mr-1" />
                    {item.duration}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <Calendar size={12} className="inline mr-1" />
                {new Date(item.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Total Banner */}
      <div className="mt-6 p-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Tempo Total de Resolução</p>
            <p className="text-3xl font-bold">{totalDuration}</p>
          </div>
          <CheckCircle size={48} className="opacity-80" />
        </div>
      </div>
    </div>
  )
}

// ==================== PROTÓTIPO 6 ====================
// Timeline Minimalista com Foco em Métricas
function Prototype6() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Protótipo 6: Foco em Métricas
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Design minimalista destacando durações
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTimelineData.map((item, index) => (
          <div
            key={index}
            className="relative bg-white dark:bg-gray-800 rounded-2xl p-5 border-2 hover:shadow-xl transition-all duration-300 group cursor-pointer"
            style={{ borderColor: item.color }}
          >
            {/* Badge número */}
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg" style={{ backgroundColor: item.color }}>
              {index + 1}
            </div>
            
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 mt-2">{item.status}</h3>
            
            {item.duration && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Timer size={16} style={{ color: item.color }} />
                  <span className="text-2xl font-bold" style={{ color: item.color }}>{item.duration}</span>
                </div>
                <p className="text-xs text-gray-500">tempo nesta etapa</p>
              </div>
            )}
            
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>👤 {item.user}</p>
              <p>📅 {new Date(item.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Total */}
      <div className="mt-8 text-center">
        <div className="inline-block px-8 py-4 bg-gray-900 dark:bg-gray-950 text-white rounded-full shadow-2xl">
          <p className="text-sm opacity-75 mb-1">TEMPO TOTAL</p>
          <p className="text-4xl font-bold">{totalDuration}</p>
        </div>
      </div>
    </div>
  )
}

// ==================== PROTÓTIPO 7 ====================
// Timeline Vertical com Expansão
function Prototype7() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Protótipo 7: Timeline Expansível
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Cards expansíveis para mostrar mais detalhes
      </p>
      
      <div className="space-y-2">
        {mockTimelineData.map((item, index) => {
          const isExpanded = expandedIndex === index
          
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-700 rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer hover:shadow-lg"
              style={{ borderColor: isExpanded ? item.color : 'transparent' }}
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
            >
              {/* Header sempre visível */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: item.color }}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{item.status}</h3>
                    {item.duration && !isExpanded && (
                      <p className="text-sm" style={{ color: item.color }}>{item.duration}</p>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(item.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              {/* Detalhes expansíveis */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Responsável</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{item.user}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Data/Hora</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Date(item.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    {item.duration && (
                      <div className="col-span-2">
                        <p className="text-gray-500 text-xs mb-1">Tempo nesta etapa</p>
                        <p className="text-2xl font-bold" style={{ color: item.color }}>{item.duration}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      <div className="mt-6 p-4 bg-blue-600 text-white rounded-2xl text-center">
        <p className="text-sm opacity-90">Tempo Total</p>
        <p className="text-2xl font-bold">{totalDuration}</p>
      </div>
    </div>
  )
}

// ==================== PROTÓTIPO 8 ====================
// Timeline com Gráfico de Gantt Simplificado
function Prototype8() {
  const totalMs = mockTimelineData.reduce((sum, item) => sum + (item.durationMs || 0), 0)
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Protótipo 8: Gantt Simplificado
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Visualização estilo Gantt com proporções
      </p>
      
      {/* Barra de progresso geral */}
      <div className="mb-6">
        <div className="flex h-12 rounded-2xl overflow-hidden shadow-lg">
          {mockTimelineData.filter(d => d.durationMs).map((item, index) => (
            <div
              key={index}
              className="relative group flex items-center justify-center text-white text-xs font-bold transition-all duration-300 hover:opacity-90 cursor-pointer"
              style={{
                width: `${((item.durationMs || 0) / totalMs) * 100}%`,
                backgroundColor: item.color
              }}
              title={`${item.status}: ${item.duration}`}
            >
              <span className="hidden md:block">{item.duration}</span>
              
              {/* Tooltip no hover */}
              <div className="absolute bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                <div className="font-semibold">{item.status}</div>
                <div>{item.duration}</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Labels */}
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>{new Date(mockTimelineData[0].timestamp).toLocaleDateString('pt-BR')}</span>
          <span>{new Date(mockTimelineData[mockTimelineData.length - 1].timestamp).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
      
      {/* Detalhes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {mockTimelineData.map((item, index) => (
          <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{item.status}</h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">👤 {item.user}</p>
            {item.duration && (
              <p className="text-xs font-bold mt-1" style={{ color: item.color }}>⏱️ {item.duration}</p>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-green-600 text-white rounded-2xl text-center font-bold text-xl">
        ✓ Concluído em {totalDuration}
      </div>
    </div>
  )
}

// ==================== PROTÓTIPO 9 ====================
// Timeline com Animação e Gradientes
function Prototype9() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Protótipo 9: Design Moderno com Gradientes
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Visual premium com gradientes e glassmorphism
      </p>
      
      <div className="relative space-y-6">
        {mockTimelineData.map((item, index) => (
          <div key={index} className="relative">
            {/* Connector */}
            {index < mockTimelineData.length - 1 && (
              <div className="absolute left-8 top-16 w-1 h-12 bg-gradient-to-b from-current to-transparent opacity-20" style={{ color: item.color }} />
            )}
            
            <div className="flex gap-4">
              {/* Avatar/Icon */}
              <div className="relative">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-2xl backdrop-blur-sm"
                  style={{ background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}dd 100%)` }}
                >
                  {item.isFinal ? <CheckCircle size={32} /> : <Activity size={32} />}
                </div>
                {item.duration && (
                  <div className="absolute -bottom-2 -right-2 px-2 py-1 bg-white dark:bg-gray-800 rounded-full shadow-lg text-xs font-bold border-2" style={{ borderColor: item.color, color: item.color }}>
                    {item.duration.split(' ')[0]}
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <div className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{item.status}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>👤 {item.user}</span>
                    <span>📅 {new Date(item.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {item.duration && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: item.color }} />
                        </div>
                        <span className="font-bold" style={{ color: item.color }}>{item.duration}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-6 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 text-white rounded-3xl shadow-2xl text-center">
        <p className="text-lg opacity-90 mb-2">⏱️ Resolvido em Tempo Recorde</p>
        <p className="text-5xl font-bold">{totalDuration}</p>
      </div>
    </div>
  )
}

// ==================== PROTÓTIPO 10 ====================
// Timeline Ultra Compacta (Tabela)
function Prototype10() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Protótipo 10: Formato Tabela Compacta
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Máxima densidade de informação
      </p>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-300 dark:border-gray-600">
              <th className="text-left p-3 text-sm font-bold text-gray-700 dark:text-gray-300">#</th>
              <th className="text-left p-3 text-sm font-bold text-gray-700 dark:text-gray-300">Status</th>
              <th className="text-left p-3 text-sm font-bold text-gray-700 dark:text-gray-300">Responsável</th>
              <th className="text-left p-3 text-sm font-bold text-gray-700 dark:text-gray-300">Data/Hora</th>
              <th className="text-right p-3 text-sm font-bold text-gray-700 dark:text-gray-300">Duração</th>
            </tr>
          </thead>
          <tbody>
            {mockTimelineData.map((item, index) => (
              <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="p-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: item.color }}>
                    {index + 1}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-gray-900 dark:text-white">{item.status}</span>
                  </div>
                </td>
                <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{item.user}</td>
                <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                  {new Date(item.timestamp).toLocaleString('pt-BR')}
                </td>
                <td className="p-3 text-right">
                  {item.duration ? (
                    <span className="font-bold" style={{ color: item.color }}>{item.duration}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
            {/* Total row */}
            <tr className="bg-blue-600 text-white font-bold">
              <td colSpan={4} className="p-4 text-right">TEMPO TOTAL</td>
              <td className="p-4 text-right text-xl">{totalDuration}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Protótipos 4, 5 reutilizando estilos diferentes
const Prototype4 = Prototype4
const Prototype5 = Prototype5
const Prototype6 = Prototype6
const Prototype7 = Prototype7
const Prototype8 = Prototype8
const Prototype9 = Prototype9
const Prototype10 = Prototype10

