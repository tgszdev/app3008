'use client'

import { Clock, User, AlertTriangle, CheckCircle, XCircle, AlertCircle, Star, Calendar, Tag, MessageSquare } from 'lucide-react'

// Protótipo 16: Layout com Cards de Status
export const RecentTicketsPrototype16 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

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
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ticket.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Protótipo 17: Layout com Cards de Status
export const RecentTicketsPrototype17 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

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
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ticket.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Protótipo 18: Layout com Cards de Status
export const RecentTicketsPrototype18 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

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
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ticket.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Protótipo 19: Layout com Cards de Status
export const RecentTicketsPrototype19 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

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
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ticket.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Protótipo 20: Layout com Cards de Status
export const RecentTicketsPrototype20 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

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
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ticket.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
