'use client'

import ModernDashboardLayout from '../modern-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Users, DollarSign, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react'

export default function TestModernPage() {
  const stats = [
    {
      title: 'Total de Chamados',
      value: '2,543',
      change: '+12.5%',
      trend: 'up',
      icon: Activity,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Usuários Ativos',
      value: '1,429',
      change: '+5.2%',
      trend: 'up',
      icon: Users,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Taxa de Resolução',
      value: '94.8%',
      change: '+2.1%',
      trend: 'up',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Tempo Médio',
      value: '2.4h',
      change: '-15%',
      trend: 'down',
      icon: DollarSign,
      color: 'from-orange-500 to-amber-500'
    }
  ]
  
  return (
    <ModernDashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold text-white">Dashboard Moderno</h2>
          <p className="text-gray-400 mt-2">
            Teste da nova sidebar com design moderno e animações
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="relative bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 hover:bg-gray-800/70 transition-all duration-200 group"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-200`} />
                
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {stat.trend === 'up' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                      <span>{stat.change}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                    <p className="text-gray-400 text-sm mt-1">{stat.title}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Features Section */}
        <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            ✨ Features da Nova Sidebar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <p className="text-white font-medium">Design Moderno</p>
                  <p className="text-gray-400 text-sm">
                    Interface escura com gradientes e efeitos glassmorphism
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <div>
                  <p className="text-white font-medium">Animações Suaves</p>
                  <p className="text-gray-400 text-sm">
                    Transições com Framer Motion para melhor UX
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                <div>
                  <p className="text-white font-medium">Tooltips Inteligentes</p>
                  <p className="text-gray-400 text-sm">
                    Tooltips aparecem quando sidebar está colapsada
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                <div>
                  <p className="text-white font-medium">Submenus Expansíveis</p>
                  <p className="text-gray-400 text-sm">
                    Organização hierárquica com animações
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-pink-500 mt-2" />
                <div>
                  <p className="text-white font-medium">Badges e Notificações</p>
                  <p className="text-gray-400 text-sm">
                    Indicadores visuais para itens importantes
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2" />
                <div>
                  <p className="text-white font-medium">Estado Persistente</p>
                  <p className="text-gray-400 text-sm">
                    Sidebar mantém estado colapsado/expandido
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            🚀 Como Testar
          </h3>
          <ol className="space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">1.</span>
              <span>Clique no botão de colapsar/expandir no canto inferior da sidebar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">2.</span>
              <span>Passe o mouse sobre os ícones quando colapsada para ver os tooltips</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">3.</span>
              <span>Clique em "Apontamentos" para ver o submenu expansível</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">4.</span>
              <span>Navegue entre as páginas para ver o indicador de rota ativa</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">5.</span>
              <span>Teste em mobile para ver a versão responsiva</span>
            </li>
          </ol>
        </div>
      </div>
    </ModernDashboardLayout>
  )
}