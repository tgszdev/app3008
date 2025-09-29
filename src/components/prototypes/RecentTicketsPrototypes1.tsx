'use client'

import { Clock, User, AlertTriangle, CheckCircle, XCircle, AlertCircle, Star, Calendar, Tag, MessageSquare } from 'lucide-react'

// Protótipo 1: Layout Clássico com Badges
export const RecentTicketsPrototype1 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

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
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900 dark:text-white">#{ticket.number}</span>
                <span className="text-gray-900 dark:text-white font-medium">{ticket.title}</span>
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
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority === 'critical' ? 'Crítico' : ticket.priority === 'high' ? 'Alto' : ticket.priority === 'medium' ? 'Médio' : 'Baixo'}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                {ticket.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Protótipo 2: Layout com Ícones de Prioridade
export const RecentTicketsPrototype2 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'high': return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Resolvido': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'Em Atendimento': return <Clock className="h-4 w-4 text-blue-500" />
      case 'Aberto': return <XCircle className="h-4 w-4 text-gray-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
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
                {getPriorityIcon(ticket.priority)}
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
            <div className="flex items-center gap-2">
              {getStatusIcon(ticket.status)}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ticket.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Protótipo 3: Layout Compacto com Cores
export const RecentTicketsPrototype3 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50 dark:bg-red-900/10'
      case 'high': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
      case 'low': return 'border-l-green-500 bg-green-50 dark:bg-green-900/10'
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10'
    }
  }

  return (
    <div className="space-y-2">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className={`bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 ${getPriorityColor(ticket.priority)} border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900 dark:text-white">#{ticket.number}</span>
                <span className="text-gray-900 dark:text-white font-medium">{ticket.title}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
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

// Protótipo 4: Layout com Avatar
export const RecentTicketsPrototype4 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-3">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{getInitials(ticket.author)}</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900 dark:text-white">#{ticket.number}</span>
                <span className="text-gray-900 dark:text-white font-medium">{ticket.title}</span>
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(ticket.priority)}`}></div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
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

// Protótipo 5: Layout com Cards Coloridos
export const RecentTicketsPrototype5 = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'agro 3', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'agro 2', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'agro 1', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
  ]

  const getPriorityGradient = (priority: string) => {
    switch (priority) {
      case 'critical': return 'from-red-500 to-red-600'
      case 'high': return 'from-orange-500 to-orange-600'
      case 'medium': return 'from-yellow-500 to-yellow-600'
      case 'low': return 'from-green-500 to-green-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className="space-y-3">
      {mockTickets.map((ticket) => (
        <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className={`h-1 bg-gradient-to-r ${getPriorityGradient(ticket.priority)}`}></div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white">#{ticket.number}</span>
                  <span className="text-gray-900 dark:text-white font-medium">{ticket.title}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getPriorityGradient(ticket.priority)} text-white`}>
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
