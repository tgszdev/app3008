'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Clock, Timer, Calendar, User as UserIcon, Activity } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import axios from 'axios'

interface TimelineEntry {
  status: string
  statusColor: string
  user: {
    id: string
    name: string
    email: string
  } | null
  timestamp: string
  duration: string | null
  durationMs: number | null
  isFirst?: boolean
  isFinal?: boolean
}

interface TicketTimelineProps {
  ticketId: string
  className?: string
  initiallyCollapsed?: boolean
}

export default function TicketTimeline({ 
  ticketId, 
  className = '', 
  initiallyCollapsed = true 
}: TicketTimelineProps) {
  const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [totalDuration, setTotalDuration] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTimeline()
  }, [ticketId])

  const fetchTimeline = async () => {
    try {
      setIsLoading(true)
      
      const response = await axios.get(`/api/tickets/${ticketId}/timeline`)
      const { timeline: timelineData, totalDuration: totalDurationData } = response.data
      
      setTimeline(timelineData)
      setTotalDuration(totalDurationData)
    } catch (error) {
      console.error('Erro ao buscar timeline:', error)
      setTimeline([])
      setTotalDuration('')
    } finally {
      setIsLoading(false)
    }
  }

  const maxDuration = Math.max(...timeline.filter(t => t.durationMs).map(t => t.durationMs || 0))

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (timeline.length === 0) {
    return null
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg ${className}`}>
      {/* Header - sempre visível */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isCollapsed ? 'rounded-2xl' : 'rounded-t-2xl'}`}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? 'Expandir linha do tempo' : 'Recolher linha do tempo'}
      >
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Linha do Tempo
          </h3>
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
            {timeline.length} {timeline.length === 1 ? 'etapa' : 'etapas'}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {totalDuration && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Timer className="h-4 w-4" />
              <span className="font-semibold">Tempo total: {totalDuration}</span>
            </div>
          )}
          {isCollapsed ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Conteúdo - colapsável */}
      {!isCollapsed && (
        <div className="px-6 pb-6 pt-2 rounded-b-2xl">
          {/* Tempo total (mobile) */}
          {totalDuration && (
            <div className="sm:hidden mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
              <div className="flex items-center justify-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <Timer className="h-4 w-4" />
                <span className="font-semibold">Tempo total: {totalDuration}</span>
              </div>
            </div>
          )}

          {/* Timeline entries */}
          <div className="space-y-4">
            {timeline.map((item, index) => (
              <div 
                key={index} 
                className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0"
                      style={{ backgroundColor: item.statusColor }}
                      aria-label={`Etapa ${index + 1}`}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{item.status}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {format(new Date(item.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  {item.duration && (
                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-white whitespace-nowrap">
                        {item.duration}
                      </span>
                      <p className="text-xs text-gray-500 hidden sm:block">duração</p>
                    </div>
                  )}
                </div>

                {/* Informação do usuário */}
                {item.user && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3 ml-11">
                    <UserIcon className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{item.user.name}</span>
                  </div>
                )}

                {/* Barra de progresso */}
                {item.durationMs && (
                  <div className="mt-3 ml-11">
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${(item.durationMs / maxDuration) * 100}%`,
                          backgroundColor: item.statusColor
                        }}
                        role="progressbar"
                        aria-valuenow={(item.durationMs / maxDuration) * 100}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Duração relativa: ${((item.durationMs / maxDuration) * 100).toFixed(0)}%`}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total - card de destaque */}
          {totalDuration && (
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl text-center shadow-xl">
              <p className="text-sm opacity-90 mb-1">Tempo Total de Resolução</p>
              <p className="text-2xl sm:text-3xl font-bold">{totalDuration}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

