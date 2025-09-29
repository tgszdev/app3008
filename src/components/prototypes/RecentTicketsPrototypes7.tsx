'use client'

import { Clock, User, AlertTriangle, CheckCircle, XCircle, AlertCircle, Star, Calendar, Tag, MessageSquare } from 'lucide-react'

// Protótipo 31: Layout com Progress Bar - Versão Compacta
export const RecentTicketsPrototype31 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'Sistema de gerenciamento de estoque com integração de múltiplos fornecedores e controle de validade de produtos', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'Implementação de autenticação de dois fatores para todos os usuários do sistema', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'Correção crítica no módulo de pagamentos que está causando falhas nas transações', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
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
    <div className="space-y-3">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
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
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ticket.status}</span>
            </div>
            <div className="space-y-1">
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
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${getProgressColor(ticket.status)}`}
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

// Protótipo 32: Layout com Cards Flutuantes - Versão Horizontal
export const RecentTicketsPrototype32 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'Desenvolvimento de API RESTful para integração com sistemas externos de terceiros', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'Implementação de sistema de backup automático com criptografia de dados sensíveis', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'Correção urgente no sistema de autenticação que está bloqueando usuários', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className="flex-shrink-0 w-80 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900 dark:text-white">#{ticket.number}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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

// Protótipo 33: Layout com Progress Bar - Versão Vertical
export const RecentTicketsPrototype33 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'Migração completa do banco de dados para PostgreSQL com otimização de performance', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'Implementação de dashboard em tempo real com WebSockets para monitoramento de sistema', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'Correção de vulnerabilidade de segurança crítica no sistema de login', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
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
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-2 h-20 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div 
                  className={`w-2 rounded-full ${getProgressColor(ticket.status)}`}
                  style={{ height: `${getProgressValue(ticket.status)}%` }}
                ></div>
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

// Protótipo 34: Layout com Cards Flutuantes - Versão Compacta
export const RecentTicketsPrototype34 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'Desenvolvimento de sistema de relatórios avançados com exportação em múltiplos formatos', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'Implementação de sistema de notificações push para dispositivos móveis', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'Correção de bug crítico que está causando perda de dados em transações', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
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

// Protótipo 35: Layout com Progress Bar - Versão Circular
export const RecentTicketsPrototype35 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'Implementação de sistema de cache distribuído para melhorar performance da aplicação', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'Desenvolvimento de interface de administração com dashboard de métricas em tempo real', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'Correção de falha de segurança que permite acesso não autorizado ao sistema', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
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
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <span className={`text-lg font-bold ${getProgressColor(ticket.status)}`}>
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
