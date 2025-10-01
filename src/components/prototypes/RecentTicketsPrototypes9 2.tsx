'use client'

import { Clock, User, AlertTriangle, CheckCircle, XCircle, AlertCircle, Star, Calendar, Tag, MessageSquare } from 'lucide-react'

// Protótipo 41: Layout com Progress Bar - Versão Animated
export const RecentTicketsPrototype41 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'Implementação de sistema de monitoramento de infraestrutura com alertas em tempo real', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'Desenvolvimento de sistema de autenticação biométrica para acesso seguro', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'Correção de bug crítico que está causando falha no sistema de pagamentos', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
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
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full ${getProgressColor(ticket.status)} transition-all duration-1000 ease-out`}
                  style={{ width: `${getProgressValue(ticket.status)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Protótipo 42: Layout com Cards Flutuantes - Versão Glass
export const RecentTicketsPrototype42 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'Implementação de sistema de backup em nuvem com criptografia de ponta a ponta', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'Desenvolvimento de sistema de análise de dados com machine learning', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'Correção de vulnerabilidade de segurança que permite acesso não autorizado', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  return (
    <div className="space-y-3">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">#{ticket.number}</span>
                <span className="text-gray-900 dark:text-white font-medium text-sm line-clamp-2">{ticket.title}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  ticket.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  ticket.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {ticket.priority === 'critical' ? 'Crítico' : ticket.priority === 'high' ? 'Alto' : ticket.priority === 'medium' ? 'Médio' : 'Baixo'}
                </span>
              </div>
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
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ticket.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Protótipo 43: Layout com Progress Bar - Versão Steps
export const RecentTicketsPrototype43 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'Implementação de sistema de CI/CD com deploy automático em múltiplos ambientes', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'Desenvolvimento de sistema de monitoramento de performance com métricas em tempo real', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'Correção de bug que está causando instabilidade no sistema durante picos de tráfego', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  const getStepValue = (status: string) => {
    switch (status) {
      case 'Resolvido': return 4
      case 'Em Atendimento': return 2
      case 'Aberto': return 1
      default: return 0
    }
  }

  const getStepColor = (status: string) => {
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
              <div className="flex items-center gap-2">
                {['Aberto', 'Em Análise', 'Em Atendimento', 'Resolvido'].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      index < getStepValue(ticket.status) 
                        ? getStepColor(ticket.status) 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}></div>
                    {index < 3 && (
                      <div className={`w-8 h-0.5 ${
                        index < getStepValue(ticket.status) - 1 
                          ? getStepColor(ticket.status) 
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Protótipo 44: Layout com Cards Flutuantes - Versão Neon
export const RecentTicketsPrototype44 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'Implementação de sistema de autenticação de dois fatores com tokens temporários', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'Desenvolvimento de sistema de chat em tempo real com WebRTC', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'Correção de bug crítico que está causando perda de dados em transações', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  return (
    <div className="space-y-3">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">#{ticket.number}</span>
                <span className="text-gray-900 dark:text-white font-medium text-sm line-clamp-2">{ticket.title}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  ticket.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  ticket.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {ticket.priority === 'critical' ? 'Crítico' : ticket.priority === 'high' ? 'Alto' : ticket.priority === 'medium' ? 'Médio' : 'Baixo'}
                </span>
              </div>
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
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ticket.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Protótipo 45: Layout com Progress Bar - Versão Radial
export const RecentTicketsPrototype45 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'Implementação de sistema de cache distribuído com invalidação automática', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'Desenvolvimento de sistema de relatórios com visualizações interativas', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'Correção de bug que está causando travamento do sistema durante operações', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
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
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-300 dark:text-gray-600"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={getProgressColor(ticket.status)}
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${getProgressValue(ticket.status)}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className={`absolute text-xs font-bold ${getProgressColor(ticket.status)}`}>
                  {getProgressValue(ticket.status)}%
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">#{ticket.number}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  ticket.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  ticket.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {ticket.priority === 'critical' ? 'Crítico' : ticket.priority === 'high' ? 'Alto' : ticket.priority === 'medium' ? 'Médio' : 'Baixo'}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-auto">{ticket.status}</span>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">{ticket.title}</h3>
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
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
