'use client'

import { Clock, User, AlertTriangle, CheckCircle, XCircle, AlertCircle, Star, Calendar, Tag, MessageSquare } from 'lucide-react'

// Protótipo 36: Layout com Cards Flutuantes - Versão Grid
export const RecentTicketsPrototype36 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'Implementação de sistema de monitoramento de performance com alertas automáticos', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'Desenvolvimento de API GraphQL para consultas complexas e otimizadas', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'Correção de bug que está causando travamento do sistema durante picos de uso', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900 dark:text-white">#{ticket.number}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                ticket.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                ticket.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              }`}>
                {ticket.priority === 'critical' ? 'Crítico' : ticket.priority === 'high' ? 'Alto' : ticket.priority === 'medium' ? 'Médio' : 'Baixo'}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-sm line-clamp-3">{ticket.title}</h3>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {ticket.date}
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  {ticket.author}
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-3 w-3" />
                  {ticket.status}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Protótipo 37: Layout com Progress Bar - Versão Dupla
export const RecentTicketsPrototype37 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'Implementação de sistema de backup incremental com compressão de dados', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'Desenvolvimento de interface responsiva para dispositivos móveis com PWA', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'Correção de vulnerabilidade de SQL injection em consultas do banco de dados', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'Resolvido': return 100
      case 'Em Atendimento': return 60
      case 'Aberto': return 20
      default: return 0
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'Resolvido': return 'bg-green-500'
      case 'Em Atendimento': return 'bg-blue-500'
      case 'Aberto': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-4">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">#{ticket.number}</span>
                <span className="text-gray-900 dark:text-white font-medium text-sm line-clamp-1">{ticket.title}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  ticket.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  ticket.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {ticket.priority === 'critical' ? 'Crítico' : ticket.priority === 'high' ? 'Alto' : ticket.priority === 'medium' ? 'Médio' : 'Baixo'}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ticket.status}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {ticket.date}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {ticket.author}
                </span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getProgressColor(ticket.status)}`}
                      style={{ width: `${getProgressValue(ticket.status)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getProgressColor(ticket.status)}`}
                      style={{ width: `${getProgressValue(ticket.status)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Protótipo 38: Layout com Cards Flutuantes - Versão Lista
export const RecentTicketsPrototype38 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'Implementação de sistema de logs centralizados com análise de padrões', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'Desenvolvimento de sistema de autenticação OAuth2 com múltiplos provedores', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'Correção de bug que está causando perda de sessão de usuários logados', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  return (
    <div className="space-y-2">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900 dark:text-white">#{ticket.number}</span>
                <span className="text-gray-900 dark:text-white font-medium text-sm line-clamp-1">{ticket.title}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  ticket.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  ticket.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {ticket.priority === 'critical' ? 'Crítico' : ticket.priority === 'high' ? 'Alto' : ticket.priority === 'medium' ? 'Médio' : 'Baixo'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                <span>{ticket.date}</span>
                <span>•</span>
                <span>{ticket.author}</span>
                <span>•</span>
                <span className="font-medium">{ticket.status}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Protótipo 39: Layout com Progress Bar - Versão Estrelas
export const RecentTicketsPrototype39 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'Implementação de sistema de cache Redis para otimizar consultas frequentes', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'Desenvolvimento de sistema de notificações em tempo real com WebSockets', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'Correção de falha crítica que está impedindo o acesso ao sistema', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'Resolvido': return 5
      case 'Em Atendimento': return 3
      case 'Aberto': return 1
      default: return 0
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'Resolvido': return 'text-green-500'
      case 'Em Atendimento': return 'text-blue-500'
      case 'Aberto': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="space-y-4">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">#{ticket.number}</span>
                <span className="text-gray-900 dark:text-white font-medium text-sm line-clamp-1">{ticket.title}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  ticket.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  ticket.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {ticket.priority === 'critical' ? 'Crítico' : ticket.priority === 'high' ? 'Alto' : ticket.priority === 'medium' ? 'Médio' : 'Baixo'}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ticket.status}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {ticket.date}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {ticket.author}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${
                      i < getProgressValue(ticket.status) 
                        ? getProgressColor(ticket.status) 
                        : 'text-gray-300 dark:text-gray-600'
                    }`} 
                    fill={i < getProgressValue(ticket.status) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Protótipo 40: Layout com Cards Flutuantes - Versão Minimalista
export const RecentTicketsPrototype40 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'Implementação de sistema de versionamento de código com Git hooks automáticos', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'Desenvolvimento de sistema de testes automatizados com cobertura de código', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'Correção de bug que está causando vazamento de memória no sistema', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  return (
    <div className="space-y-1">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900 dark:text-white">#{ticket.number}</span>
                <span className="text-gray-900 dark:text-white font-medium text-sm line-clamp-1">{ticket.title}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  ticket.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  ticket.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {ticket.priority === 'critical' ? 'Crítico' : ticket.priority === 'high' ? 'Alto' : ticket.priority === 'medium' ? 'Médio' : 'Baixo'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                <span>{ticket.date}</span>
                <span>•</span>
                <span>{ticket.author}</span>
                <span>•</span>
                <span className="font-medium">{ticket.status}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
