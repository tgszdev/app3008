// Protótipos 12-21 baseados no protótipo 11 com steps de progresso
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

export const getPrototypeRender = (prototypeNumber: number) => {
  return (tickets: any[], getStatusConfig: any, getPriorityConfig: any, getCategoryConfig: any, getTimeAgo: any, formatDate: any, truncateTitle: any) => {
    switch (prototypeNumber) {
      case 12:
        return (
          <div className="space-y-6">
            {/* Protótipo 12: Lista com Steps Verticais */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {tickets.map((ticket, index) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                
                const getSteps = (status: string) => {
                  const steps = [
                    { id: 'open', label: 'Aberto', completed: false, active: false },
                    { id: 'in_progress', label: 'Em Progresso', completed: false, active: false },
                    { id: 'resolved', label: 'Resolvido', completed: false, active: false }
                  ]
                  
                  if (status === 'open') {
                    steps[0].active = true
                  } else if (status === 'in_progress') {
                    steps[0].completed = true
                    steps[1].active = true
                  } else if (status === 'resolved') {
                    steps[0].completed = true
                    steps[1].completed = true
                    steps[2].active = true
                  } else if (status === 'cancelled') {
                    steps[0].completed = true
                    steps[1].active = true
                  }
                  
                  return steps
                }
                
                const steps = getSteps(ticket.status)
                
                return (
                  <div key={ticket.id} className={cn(
                    "p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                    index !== tickets.length - 1 && "border-b border-gray-200 dark:border-gray-700"
                  )}>
                    <div className="flex items-start gap-6">
                      <div className="flex flex-col items-center">
                        {steps.map((step, stepIndex) => (
                          <div key={step.id} className="flex flex-col items-center">
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                              step.completed && "bg-blue-600 text-white",
                              step.active && !step.completed && "bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700",
                              !step.completed && !step.active && "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                            )}>
                              {stepIndex + 1}
                            </div>
                            {stepIndex < steps.length - 1 && (
                              <div className={cn(
                                "w-0.5 h-6 my-1 transition-colors duration-300",
                                step.completed ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                              )} />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                            {status.label}
                          </span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                            {priority.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 line-clamp-1">
                          {truncateTitle(ticket.title)}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Criado por: {ticket.created_by_user?.name || 'N/A'}</span>
                          <span>Atribuído: {ticket.assigned_to_user?.name || 'Não atribuído'}</span>
                          <span>Data de abertura: {formatDate(ticket.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{getTimeAgo(ticket.created_at)}</span>
                        <Link href={`/dashboard/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 13:
        return (
          <div className="space-y-6">
            {/* Protótipo 13: Lista com Steps em Card */}
            <div className="grid grid-cols-1 gap-4">
              {tickets.map((ticket) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                
                const getSteps = (status: string) => {
                  const steps = [
                    { id: 'open', label: 'Aberto', completed: false, active: false },
                    { id: 'in_progress', label: 'Em Progresso', completed: false, active: false },
                    { id: 'resolved', label: 'Resolvido', completed: false, active: false }
                  ]
                  
                  if (status === 'open') {
                    steps[0].active = true
                  } else if (status === 'in_progress') {
                    steps[0].completed = true
                    steps[1].active = true
                  } else if (status === 'resolved') {
                    steps[0].completed = true
                    steps[1].completed = true
                    steps[2].active = true
                  } else if (status === 'cancelled') {
                    steps[0].completed = true
                    steps[1].active = true
                  }
                  
                  return steps
                }
                
                const steps = getSteps(ticket.status)
                
                return (
                  <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                            {status.label}
                          </span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                            {priority.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 line-clamp-1">
                          {truncateTitle(ticket.title)}
                        </h3>
                        
                        {/* Steps em Card */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2">
                            {steps.map((step, stepIndex) => (
                              <div key={step.id} className="flex items-center">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                                  step.completed && "bg-blue-600 text-white",
                                  step.active && !step.completed && "bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700",
                                  !step.completed && !step.active && "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                                )}>
                                  {stepIndex + 1}
                                </div>
                                {stepIndex < steps.length - 1 && (
                                  <div className={cn(
                                    "w-8 h-0.5 mx-1 transition-colors duration-300",
                                    step.completed ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                                  )} />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Criado por: {ticket.created_by_user?.name || 'N/A'}</span>
                          <span>Atribuído: {ticket.assigned_to_user?.name || 'Não atribuído'}</span>
                          <span>Data de abertura: {formatDate(ticket.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{getTimeAgo(ticket.created_at)}</span>
                        <Link href={`/dashboard/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 14:
        return (
          <div className="space-y-6">
            {/* Protótipo 14: Lista com Steps Coloridos */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {tickets.map((ticket, index) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                
                const getSteps = (status: string) => {
                  const steps = [
                    { id: 'open', label: 'Aberto', completed: false, active: false, color: 'blue' },
                    { id: 'in_progress', label: 'Em Progresso', completed: false, active: false, color: 'orange' },
                    { id: 'resolved', label: 'Resolvido', completed: false, active: false, color: 'green' }
                  ]
                  
                  if (status === 'open') {
                    steps[0].active = true
                  } else if (status === 'in_progress') {
                    steps[0].completed = true
                    steps[1].active = true
                  } else if (status === 'resolved') {
                    steps[0].completed = true
                    steps[1].completed = true
                    steps[2].active = true
                  } else if (status === 'cancelled') {
                    steps[0].completed = true
                    steps[1].active = true
                  }
                  
                  return steps
                }
                
                const steps = getSteps(ticket.status)
                
                return (
                  <div key={ticket.id} className={cn(
                    "p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                    index !== tickets.length - 1 && "border-b border-gray-200 dark:border-gray-700"
                  )}>
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                            {status.label}
                          </span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                            {priority.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 line-clamp-1">
                          {truncateTitle(ticket.title)}
                        </h3>
                        
                        {/* Steps Coloridos */}
                        <div className="flex items-center gap-2 mb-3">
                          {steps.map((step, stepIndex) => (
                            <div key={step.id} className="flex items-center">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                                step.completed && step.color === 'blue' && "bg-blue-600 text-white",
                                step.completed && step.color === 'orange' && "bg-orange-600 text-white",
                                step.completed && step.color === 'green' && "bg-green-600 text-white",
                                step.active && !step.completed && step.color === 'blue' && "bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700",
                                step.active && !step.completed && step.color === 'orange' && "bg-orange-600 text-white ring-2 ring-orange-300 dark:ring-orange-700",
                                step.active && !step.completed && step.color === 'green' && "bg-green-600 text-white ring-2 ring-green-300 dark:ring-green-700",
                                !step.completed && !step.active && "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                              )}>
                                {stepIndex + 1}
                              </div>
                              {stepIndex < steps.length - 1 && (
                                <div className={cn(
                                  "w-8 h-0.5 mx-1 transition-colors duration-300",
                                  step.completed && step.color === 'blue' && "bg-blue-600",
                                  step.completed && step.color === 'orange' && "bg-orange-600",
                                  step.completed && step.color === 'green' && "bg-green-600",
                                  !step.completed && "bg-gray-300 dark:bg-gray-600"
                                )} />
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Criado por: {ticket.created_by_user?.name || 'N/A'}</span>
                          <span>Atribuído: {ticket.assigned_to_user?.name || 'Não atribuído'}</span>
                          <span>Data de abertura: {formatDate(ticket.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{getTimeAgo(ticket.created_at)}</span>
                        <Link href={`/dashboard/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 15:
        return (
          <div className="space-y-6">
            {/* Protótipo 15: Lista com Steps com Labels */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {tickets.map((ticket, index) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                
                const getSteps = (status: string) => {
                  const steps = [
                    { id: 'open', label: 'Aberto', completed: false, active: false },
                    { id: 'in_progress', label: 'Em Progresso', completed: false, active: false },
                    { id: 'resolved', label: 'Resolvido', completed: false, active: false }
                  ]
                  
                  if (status === 'open') {
                    steps[0].active = true
                  } else if (status === 'in_progress') {
                    steps[0].completed = true
                    steps[1].active = true
                  } else if (status === 'resolved') {
                    steps[0].completed = true
                    steps[1].completed = true
                    steps[2].active = true
                  } else if (status === 'cancelled') {
                    steps[0].completed = true
                    steps[1].active = true
                  }
                  
                  return steps
                }
                
                const steps = getSteps(ticket.status)
                
                return (
                  <div key={ticket.id} className={cn(
                    "p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                    index !== tickets.length - 1 && "border-b border-gray-200 dark:border-gray-700"
                  )}>
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                            {status.label}
                          </span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                            {priority.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 line-clamp-1">
                          {truncateTitle(ticket.title)}
                        </h3>
                        
                        {/* Steps com Labels */}
                        <div className="flex items-center gap-4 mb-3">
                          {steps.map((step, stepIndex) => (
                            <div key={step.id} className="flex flex-col items-center">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                                step.completed && "bg-blue-600 text-white",
                                step.active && !step.completed && "bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700",
                                !step.completed && !step.active && "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                              )}>
                                {stepIndex + 1}
                              </div>
                              <span className={cn(
                                "text-xs mt-1 transition-colors duration-300",
                                step.active ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-500 dark:text-gray-400"
                              )}>
                                {step.label}
                              </span>
                              {stepIndex < steps.length - 1 && (
                                <div className={cn(
                                  "w-8 h-0.5 mx-1 transition-colors duration-300",
                                  step.completed ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                                )} />
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Criado por: {ticket.created_by_user?.name || 'N/A'}</span>
                          <span>Atribuído: {ticket.assigned_to_user?.name || 'Não atribuído'}</span>
                          <span>Data de abertura: {formatDate(ticket.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{getTimeAgo(ticket.created_at)}</span>
                        <Link href={`/dashboard/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 16:
        return (
          <div className="space-y-6">
            {/* Protótipo 16: Lista com Steps igual aos Recent Tickets */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {tickets.map((ticket, index) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                
                // Função para obter steps igual aos recent tickets
                const getTicketSteps = (ticketStatus: string) => {
                  const steps = [
                    { 
                      id: 'open', 
                      label: 'Aberto', 
                      completed: false, 
                      active: false,
                      description: 'Ticket foi criado e está aguardando análise'
                    },
                    { 
                      id: 'in_progress', 
                      label: 'Em Progresso', 
                      completed: false, 
                      active: false,
                      description: 'Ticket está sendo trabalhado pela equipe'
                    },
                    { 
                      id: 'resolved', 
                      label: 'Resolvido', 
                      completed: false, 
                      active: false,
                      description: 'Ticket foi resolvido e está aguardando confirmação'
                    }
                  ]
                  
                  if (ticketStatus === 'open') {
                    steps[0].active = true
                  } else if (ticketStatus === 'in_progress') {
                    steps[0].completed = true
                    steps[1].active = true
                  } else if (ticketStatus === 'resolved') {
                    steps[0].completed = true
                    steps[1].completed = true
                    steps[2].active = true
                  } else if (ticketStatus === 'cancelled') {
                    steps[0].completed = true
                    steps[1].active = true
                  }
                  
                  return steps
                }
                
                const steps = getTicketSteps(ticket.status)
                
                return (
                  <div 
                    key={ticket.id} 
                    className={cn(
                      "p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                      index !== tickets.length - 1 && "border-b border-gray-200 dark:border-gray-700"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl font-mono text-gray-500 font-bold">{ticket.ticket_number}</span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                            {status.label}
                          </span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                            {priority.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 line-clamp-1">
                          {truncateTitle(ticket.title)}
                        </h3>
                        
                        {/* Steps sem números - apenas círculos coloridos */}
                        <div className="flex items-center gap-1 mb-3">
                          {steps.map((step, stepIndex) => (
                            <div key={step.id} className="flex items-center">
                              <div 
                                className={cn(
                                  "w-4 h-4 rounded-full transition-all duration-300 cursor-help",
                                  step.completed && "bg-blue-600",
                                  step.active && !step.completed && "bg-green-500 ring-1 ring-blue-300 dark:ring-blue-700",
                                  !step.completed && !step.active && "bg-gray-400"
                                )}
                                title={`${step.label}: ${step.description}`}
                              />
                              {stepIndex < steps.length - 1 && (
                                <div className={cn(
                                  "w-4 h-0.5 mx-0.5 transition-colors duration-300",
                                  step.completed ? "bg-blue-600" : "bg-gray-400"
                                )} />
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Criado por: {ticket.created_by_user?.name || 'N/A'}</span>
                          <span>Atribuído: {ticket.assigned_to_user?.name || 'Não atribuído'}</span>
                          <span>Data de abertura: {formatDate(ticket.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{getTimeAgo(ticket.created_at)}</span>
                        <Link href={`/dashboard/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 17:
        return (
          <div className="space-y-6">
            {/* Protótipo 17: Lista com Steps em Linha */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {tickets.map((ticket, index) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                
                const getSteps = (status: string) => {
                  const steps = [
                    { id: 'open', label: 'Aberto', completed: false, active: false },
                    { id: 'in_progress', label: 'Em Progresso', completed: false, active: false },
                    { id: 'resolved', label: 'Resolvido', completed: false, active: false }
                  ]
                  
                  if (status === 'open') {
                    steps[0].active = true
                  } else if (status === 'in_progress') {
                    steps[0].completed = true
                    steps[1].active = true
                  } else if (status === 'resolved') {
                    steps[0].completed = true
                    steps[1].completed = true
                    steps[2].active = true
                  } else if (status === 'cancelled') {
                    steps[0].completed = true
                    steps[1].active = true
                  }
                  
                  return steps
                }
                
                const steps = getSteps(ticket.status)
                
                return (
                  <div key={ticket.id} className={cn(
                    "p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                    index !== tickets.length - 1 && "border-b border-gray-200 dark:border-gray-700"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                            {status.label}
                          </span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                            {priority.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 line-clamp-1">
                          {truncateTitle(ticket.title)}
                        </h3>
                        
                        {/* Steps em Linha */}
                        <div className="flex items-center gap-2 mb-3">
                          {steps.map((step, stepIndex) => (
                            <div key={step.id} className="flex items-center">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                                step.completed && "bg-blue-600 text-white",
                                step.active && !step.completed && "bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700",
                                !step.completed && !step.active && "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                              )}>
                                {stepIndex + 1}
                              </div>
                              {stepIndex < steps.length - 1 && (
                                <div className={cn(
                                  "w-6 h-0.5 mx-1 transition-colors duration-300",
                                  step.completed ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                                )} />
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Criado por: {ticket.created_by_user?.name || 'N/A'}</span>
                          <span>Atribuído: {ticket.assigned_to_user?.name || 'Não atribuído'}</span>
                          <span>Data de abertura: {formatDate(ticket.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{getTimeAgo(ticket.created_at)}</span>
                        <Link href={`/dashboard/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 18:
        return (
          <div className="space-y-6">
            {/* Protótipo 18: Lista com Steps com Ícones */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {tickets.map((ticket, index) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                
                const getSteps = (status: string) => {
                  const steps = [
                    { id: 'open', label: 'Aberto', completed: false, active: false, icon: '📝' },
                    { id: 'in_progress', label: 'Em Progresso', completed: false, active: false, icon: '⚙️' },
                    { id: 'resolved', label: 'Resolvido', completed: false, active: false, icon: '✅' }
                  ]
                  
                  if (status === 'open') {
                    steps[0].active = true
                  } else if (status === 'in_progress') {
                    steps[0].completed = true
                    steps[1].active = true
                  } else if (status === 'resolved') {
                    steps[0].completed = true
                    steps[1].completed = true
                    steps[2].active = true
                  } else if (status === 'cancelled') {
                    steps[0].completed = true
                    steps[1].active = true
                  }
                  
                  return steps
                }
                
                const steps = getSteps(ticket.status)
                
                return (
                  <div key={ticket.id} className={cn(
                    "p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                    index !== tickets.length - 1 && "border-b border-gray-200 dark:border-gray-700"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                            {status.label}
                          </span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                            {priority.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 line-clamp-1">
                          {truncateTitle(ticket.title)}
                        </h3>
                        
                        {/* Steps com Ícones */}
                        <div className="flex items-center gap-2 mb-3">
                          {steps.map((step, stepIndex) => (
                            <div key={step.id} className="flex items-center">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                                step.completed && "bg-blue-600 text-white",
                                step.active && !step.completed && "bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700",
                                !step.completed && !step.active && "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                              )}>
                                {step.completed ? step.icon : stepIndex + 1}
                              </div>
                              {stepIndex < steps.length - 1 && (
                                <div className={cn(
                                  "w-6 h-0.5 mx-1 transition-colors duration-300",
                                  step.completed ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                                )} />
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Criado por: {ticket.created_by_user?.name || 'N/A'}</span>
                          <span>Atribuído: {ticket.assigned_to_user?.name || 'Não atribuído'}</span>
                          <span>Data de abertura: {formatDate(ticket.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{getTimeAgo(ticket.created_at)}</span>
                        <Link href={`/dashboard/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 19:
        return (
          <div className="space-y-6">
            {/* Protótipo 19: Lista com Steps com Progresso */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {tickets.map((ticket, index) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                
                const getSteps = (status: string) => {
                  const steps = [
                    { id: 'open', label: 'Aberto', completed: false, active: false },
                    { id: 'in_progress', label: 'Em Progresso', completed: false, active: false },
                    { id: 'resolved', label: 'Resolvido', completed: false, active: false }
                  ]
                  
                  if (status === 'open') {
                    steps[0].active = true
                  } else if (status === 'in_progress') {
                    steps[0].completed = true
                    steps[1].active = true
                  } else if (status === 'resolved') {
                    steps[0].completed = true
                    steps[1].completed = true
                    steps[2].active = true
                  } else if (status === 'cancelled') {
                    steps[0].completed = true
                    steps[1].active = true
                  }
                  
                  return steps
                }
                
                const steps = getSteps(ticket.status)
                const completedSteps = steps.filter(step => step.completed).length
                const progressPercentage = (completedSteps / steps.length) * 100
                
                return (
                  <div key={ticket.id} className={cn(
                    "p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                    index !== tickets.length - 1 && "border-b border-gray-200 dark:border-gray-700"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                            {status.label}
                          </span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                            {priority.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 line-clamp-1">
                          {truncateTitle(ticket.title)}
                        </h3>
                        
                        {/* Steps com Progresso */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            {steps.map((step, stepIndex) => (
                              <div key={step.id} className="flex items-center">
                                <div className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                                  step.completed && "bg-blue-600 text-white",
                                  step.active && !step.completed && "bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700",
                                  !step.completed && !step.active && "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                                )}>
                                  {stepIndex + 1}
                                </div>
                                {stepIndex < steps.length - 1 && (
                                  <div className={cn(
                                    "w-6 h-0.5 mx-1 transition-colors duration-300",
                                    step.completed ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                                  )} />
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Criado por: {ticket.created_by_user?.name || 'N/A'}</span>
                          <span>Atribuído: {ticket.assigned_to_user?.name || 'Não atribuído'}</span>
                          <span>Data de abertura: {formatDate(ticket.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{getTimeAgo(ticket.created_at)}</span>
                        <Link href={`/dashboard/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 20:
        return (
          <div className="space-y-6">
            {/* Protótipo 20: Lista com Steps com Tooltips */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {tickets.map((ticket, index) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                
                const getSteps = (status: string) => {
                  const steps = [
                    { id: 'open', label: 'Aberto', completed: false, active: false, description: 'Ticket foi criado e está aguardando análise' },
                    { id: 'in_progress', label: 'Em Progresso', completed: false, active: false, description: 'Ticket está sendo trabalhado pela equipe' },
                    { id: 'resolved', label: 'Resolvido', completed: false, active: false, description: 'Ticket foi resolvido e está aguardando confirmação' }
                  ]
                  
                  if (status === 'open') {
                    steps[0].active = true
                  } else if (status === 'in_progress') {
                    steps[0].completed = true
                    steps[1].active = true
                  } else if (status === 'resolved') {
                    steps[0].completed = true
                    steps[1].completed = true
                    steps[2].active = true
                  } else if (status === 'cancelled') {
                    steps[0].completed = true
                    steps[1].active = true
                  }
                  
                  return steps
                }
                
                const steps = getSteps(ticket.status)
                
                return (
                  <div key={ticket.id} className={cn(
                    "p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                    index !== tickets.length - 1 && "border-b border-gray-200 dark:border-gray-700"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                            {status.label}
                          </span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                            {priority.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 line-clamp-1">
                          {truncateTitle(ticket.title)}
                        </h3>
                        
                        {/* Steps com Tooltips */}
                        <div className="flex items-center gap-2 mb-3">
                          {steps.map((step, stepIndex) => (
                            <div key={step.id} className="flex items-center">
                              <div 
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 cursor-help",
                                  step.completed && "bg-blue-600 text-white",
                                  step.active && !step.completed && "bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700",
                                  !step.completed && !step.active && "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                                )}
                                title={step.description}
                              >
                                {stepIndex + 1}
                              </div>
                              {stepIndex < steps.length - 1 && (
                                <div className={cn(
                                  "w-6 h-0.5 mx-1 transition-colors duration-300",
                                  step.completed ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                                )} />
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Criado por: {ticket.created_by_user?.name || 'N/A'}</span>
                          <span>Atribuído: {ticket.assigned_to_user?.name || 'Não atribuído'}</span>
                          <span>Data de abertura: {formatDate(ticket.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{getTimeAgo(ticket.created_at)}</span>
                        <Link href={`/dashboard/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 21:
        return (
          <div className="space-y-6">
            {/* Protótipo 21: Lista com Steps com Animações */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {tickets.map((ticket, index) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                
                const getSteps = (status: string) => {
                  const steps = [
                    { id: 'open', label: 'Aberto', completed: false, active: false },
                    { id: 'in_progress', label: 'Em Progresso', completed: false, active: false },
                    { id: 'resolved', label: 'Resolvido', completed: false, active: false }
                  ]
                  
                  if (status === 'open') {
                    steps[0].active = true
                  } else if (status === 'in_progress') {
                    steps[0].completed = true
                    steps[1].active = true
                  } else if (status === 'resolved') {
                    steps[0].completed = true
                    steps[1].completed = true
                    steps[2].active = true
                  } else if (status === 'cancelled') {
                    steps[0].completed = true
                    steps[1].active = true
                  }
                  
                  return steps
                }
                
                const steps = getSteps(ticket.status)
                
                return (
                  <div key={ticket.id} className={cn(
                    "p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                    index !== tickets.length - 1 && "border-b border-gray-200 dark:border-gray-700"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                            {status.label}
                          </span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                            {priority.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 line-clamp-1">
                          {truncateTitle(ticket.title)}
                        </h3>
                        
                        {/* Steps com Animações */}
                        <div className="flex items-center gap-2 mb-3">
                          {steps.map((step, stepIndex) => (
                            <div key={step.id} className="flex items-center">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-500 transform",
                                step.completed && "bg-blue-600 text-white scale-110",
                                step.active && !step.completed && "bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700 animate-pulse",
                                !step.completed && !step.active && "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:scale-105"
                              )}>
                                {stepIndex + 1}
                              </div>
                              {stepIndex < steps.length - 1 && (
                                <div className={cn(
                                  "w-6 h-0.5 mx-1 transition-all duration-500",
                                  step.completed ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                                )} />
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Criado por: {ticket.created_by_user?.name || 'N/A'}</span>
                          <span>Atribuído: {ticket.assigned_to_user?.name || 'Não atribuído'}</span>
                          <span>Data de abertura: {formatDate(ticket.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{getTimeAgo(ticket.created_at)}</span>
                        <Link href={`/dashboard/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Protótipo {prototypeNumber}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Layout em desenvolvimento...
            </p>
          </div>
        )
    }
  }
}
