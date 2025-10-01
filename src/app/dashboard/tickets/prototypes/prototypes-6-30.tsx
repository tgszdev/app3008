// Protótipos 6-30 para a página de tickets
import Link from 'next/link'
import { Eye, Clock, AlertCircle, CheckCircle, XCircle, Star, Zap, Shield, Target, TrendingUp, BarChart3, PieChart, Activity, Users, Settings, Bell, Heart, Award, Crown, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export const getPrototypeRender = (prototypeNumber: number) => {
  return (tickets: any[], getStatusConfig: any, getPriorityConfig: any, getCategoryConfig: any, getTimeAgo: any) => {
    switch (prototypeNumber) {
      case 6:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map((ticket) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                const progress = Math.random() * 100
                
                return (
                  <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                        {priority.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 line-clamp-2">
                      {ticket.title}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                          {status.label}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>Progresso</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{getTimeAgo(ticket.created_at)}</span>
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

      case 7:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map((ticket) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                
                return (
                  <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {ticket.created_by_user?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                            {status.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                          {ticket.title}
                        </h3>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                          {priority.label}
                        </span>
                        {ticket.assigned_to_user && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Atribuído a {ticket.assigned_to_user.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{getTimeAgo(ticket.created_at)}</span>
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

      case 8:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map((ticket) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                
                return (
                  <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 relative overflow-hidden">
                    <div className={cn(
                      "absolute top-0 right-0 w-20 h-20 rounded-bl-full",
                      ticket.status === 'open' && "bg-blue-100 dark:bg-blue-900",
                      ticket.status === 'in_progress' && "bg-orange-100 dark:bg-orange-900",
                      ticket.status === 'resolved' && "bg-green-100 dark:bg-green-900",
                      ticket.status === 'cancelled' && "bg-red-100 dark:bg-red-900",
                      !['open', 'in_progress', 'resolved', 'cancelled'].includes(ticket.status) && "bg-purple-100 dark:bg-purple-900"
                    )} />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                          {priority.label}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 line-clamp-2">
                        {ticket.title}
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <span>{getTimeAgo(ticket.created_at)}</span>
                          <Link href={`/dashboard/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 9:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map((ticket) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                
                return (
                  <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        ticket.status === 'open' && "bg-blue-500",
                        ticket.status === 'in_progress' && "bg-orange-500",
                        ticket.status === 'resolved' && "bg-green-500",
                        ticket.status === 'cancelled' && "bg-red-500",
                        !['open', 'in_progress', 'resolved', 'cancelled'].includes(ticket.status) && "bg-purple-500"
                      )} />
                      <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                        {priority.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 line-clamp-2">
                      {ticket.title}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{getTimeAgo(ticket.created_at)}</span>
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

      case 10:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map((ticket) => {
                const status = getStatusConfig(ticket.status)
                const priority = getPriorityConfig(ticket.priority)
                
                return (
                  <div key={ticket.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200">
                    <div className={cn(
                      "px-6 py-4",
                      ticket.status === 'open' && "bg-blue-50 dark:bg-blue-900/20",
                      ticket.status === 'in_progress' && "bg-orange-50 dark:bg-orange-900/20",
                      ticket.status === 'resolved' && "bg-green-50 dark:bg-green-900/20",
                      ticket.status === 'cancelled' && "bg-red-50 dark:bg-red-900/20",
                      !['open', 'in_progress', 'resolved', 'cancelled'].includes(ticket.status) && "bg-purple-50 dark:bg-purple-900/20"
                    )}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", priority.color)}>
                          {priority.label}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 line-clamp-2">
                        {ticket.title}
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <span>{getTimeAgo(ticket.created_at)}</span>
                          <Link href={`/dashboard/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-800">
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      // Continuar com os protótipos 11-30...
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
