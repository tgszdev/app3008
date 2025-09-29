'use client'

import { Clock, User, AlertTriangle, CheckCircle, XCircle, AlertCircle, Star, Calendar, Tag, MessageSquare } from 'lucide-react'

// Protótipo 6: Layout Minimalista
export const RecentTicketsPrototype6 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  return (
    <div className="space-y-2">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900 dark:text-white">#{ticket.number}</span>
                <span className="text-gray-900 dark:text-white">{ticket.title}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{ticket.date}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{ticket.author}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                {ticket.priority === 'critical' ? 'Crítico' : ticket.priority === 'high' ? 'Alto' : ticket.priority === 'medium' ? 'Médio' : 'Baixo'}
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ticket.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Protótipo 7: Layout com Timeline
export const RecentTicketsPrototype7 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolvido': return 'bg-green-500'
      case 'Em Atendimento': return 'bg-blue-500'
      case 'Aberto': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
      <div className="space-y-4">
        {mockTickets.map((ticket, index) => (
          <div key={ticket.id} className="relative flex items-start gap-4">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(ticket.status)} relative z-10 mt-1`}></div>
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
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
          </div>
        ))}
      </div>
    </div>
  )
}

// Protótipo 8: Layout com Cards Empilhados
export const RecentTicketsPrototype8 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  return (
    <div className="space-y-2">
      {mockTickets.map((ticket, index) => (
        <div key={ticket.id} className="relative">
          <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow transform hover:-translate-y-1 ${
            index === 0 ? 'z-30' : index === 1 ? 'z-20 -mt-2' : 'z-10 -mt-4'
          }`}>
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
        </div>
      ))}
    </div>
  )
}

// Protótipo 9: Layout com Grid
export const RecentTicketsPrototype9 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
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
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">{ticket.title}</h3>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {ticket.date}
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {ticket.author}
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
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

// Protótipo 10: Layout com Lista Horizontal
export const RecentTicketsPrototype10 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className="flex-shrink-0 w-80 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
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
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">{ticket.title}</h3>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {ticket.date}
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {ticket.author}
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
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
