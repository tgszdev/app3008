'use client'

import { Clock, User, AlertTriangle, CheckCircle, XCircle, AlertCircle, Star, Calendar, Tag, MessageSquare } from 'lucide-react'

// Protótipo 11: Layout com Progress Bar
export const RecentTicketsPrototype11 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
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
                <span className="text-gray-900 dark:text-white font-medium">{ticket.title}</span>
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
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {ticket.date}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {ticket.author}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getProgressColor(ticket.status)}`}
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

// Protótipo 12: Layout com Cards Flutuantes
export const RecentTicketsPrototype12 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  return (
    <div className="space-y-3">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">#{ticket.number}</span>
                <span className="text-gray-900 dark:text-white font-medium">{ticket.title}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  ticket.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  ticket.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {ticket.priority === 'critical' ? 'Crítico' : ticket.priority === 'high' ? 'Alto' : ticket.priority === 'medium' ? 'Médio' : 'Baixo'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {ticket.date}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
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

// Protótipo 13: Layout com Bordas Coloridas
export const RecentTicketsPrototype13 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500'
      case 'high': return 'border-l-orange-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-gray-500'
    }
  }

  return (
    <div className="space-y-3">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 ${getPriorityBorderColor(ticket.priority)} border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">#{ticket.number}</span>
                <span className="text-gray-900 dark:text-white font-medium">{ticket.title}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  ticket.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  ticket.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {ticket.priority === 'critical' ? 'Crítico' : ticket.priority === 'high' ? 'Alto' : ticket.priority === 'medium' ? 'Médio' : 'Baixo'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {ticket.date}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
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

// Protótipo 14: Layout com Cards Compactos
export const RecentTicketsPrototype14 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  return (
    <div className="space-y-2">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900 dark:text-white">#{ticket.number}</span>
                <span className="text-gray-900 dark:text-white font-medium">{ticket.title}</span>
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

// Protótipo 15: Layout com Cards de Status
export const RecentTicketsPrototype15 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolvido': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'Em Atendimento': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'Aberto': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-3">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">#{ticket.number}</span>
                <span className="text-gray-900 dark:text-white font-medium">{ticket.title}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  ticket.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  ticket.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {ticket.priority === 'critical' ? 'Crítico' : ticket.priority === 'high' ? 'Alto' : ticket.priority === 'medium' ? 'Médio' : 'Baixo'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {ticket.date}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {ticket.author}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                {ticket.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
