'use client'

import { Clock, User, AlertTriangle, CheckCircle, XCircle, AlertCircle, Star, Calendar, Tag, MessageSquare } from 'lucide-react'

// Protótipo 33 com Steps: Layout com Progress Bar Vertical + Steps
export const RecentTicketsPrototype33WithSteps = () => {
  const mockTickets = [
    { id: 1, number: 64, title: 'Migração completa do banco de dados para PostgreSQL com otimização de performance', date: '28/09/2025', status: 'Resolvido', priority: 'low', author: 'João Silva' },
    { id: 2, number: 63, title: 'Implementação de dashboard em tempo real com WebSockets para monitoramento de sistema', date: '28/09/2025', status: 'Em Atendimento', priority: 'high', author: 'Maria Santos' },
    { id: 3, number: 61, title: 'Correção de vulnerabilidade de segurança crítica no sistema de login', date: '26/09/2025', status: 'Aberto', priority: 'critical', author: 'Pedro Costa' }
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
            {/* Progress Bar Vertical */}
            <div className="flex-shrink-0">
              <div className="w-2 h-20 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div 
                  className={`w-2 rounded-full ${getProgressColor(ticket.status)}`}
                  style={{ height: `${getProgressValue(ticket.status)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex-1 space-y-3">
              {/* Header com número, título e prioridade */}
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
              
              {/* Título do ticket */}
              <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">{ticket.title}</h3>
              
              {/* Informações do ticket */}
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
              
              {/* Steps horizontais */}
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
