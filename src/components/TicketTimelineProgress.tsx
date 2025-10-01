'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Clock, Timer, Calendar, User as UserIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabaseAdmin } from '@/lib/supabase'

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

interface TicketTimelineProgressProps {
  ticketId: string
  className?: string
  initiallyCollapsed?: boolean
}

export default function TicketTimelineProgress({ 
  ticketId, 
  className = '', 
  initiallyCollapsed = true 
}: TicketTimelineProgressProps) {
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
      
      // Buscar histórico do ticket com informações do status
      const { data: historyData, error: historyError } = await supabaseAdmin
        .from('ticket_history')
        .select(`
          *,
          user:users(id, name, email),
          status_info:ticket_statuses!ticket_history_new_status_fkey(id, name, color, slug)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (historyError) {
        console.error('Erro ao buscar histórico:', historyError)
        return
      }

      if (!historyData || historyData.length === 0) {
        setTimeline([])
        return
      }

      // Processar dados do histórico
      const processedTimeline: TimelineEntry[] = []
      let totalMs = 0

      for (let i = 0; i < historyData.length; i++) {
        const current = historyData[i]
        const next = historyData[i + 1]

        // Calcular duração até o próximo status
        let durationMs: number | null = null
        let durationStr: string | null = null

        if (next) {
          const currentTime = new Date(current.created_at).getTime()
          const nextTime = new Date(next.created_at).getTime()
          durationMs = nextTime - currentTime
          totalMs += durationMs

          // Converter para formato legível
          const hours = Math.floor(durationMs / (1000 * 60 * 60))
          const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
          
          if (hours > 0) {
            durationStr = `${hours}h ${minutes}min`
          } else {
            durationStr = `${minutes}min`
          }
        }

        // Pegar cor do status
        const statusColor = (current as any).status_info?.color || '#6b7280'
        const statusName = (current as any).status_info?.name || current.new_status || 'Desconhecido'

        processedTimeline.push({
          status: statusName,
          statusColor: statusColor,
          user: current.user || null,
          timestamp: current.created_at,
          duration: durationStr,
          durationMs: durationMs,
          isFirst: i === 0,
          isFinal: i === historyData.length - 1
        })
      }

      // Calcular tempo total
      if (totalMs > 0) {
        const totalHours = Math.floor(totalMs / (1000 * 60 * 60))
        const totalMinutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
        
        if (totalHours > 0) {
          setTotalDuration(`${totalHours}h ${totalMinutes}min`)
        } else {
          setTotalDuration(`${totalMinutes}min`)
        }
      }

      setTimeline(processedTimeline)
    } catch (error) {
      console.error('Erro ao processar timeline:', error)
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
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden ${className}`}>
      {/* Header - sempre visível */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Linha do Tempo do Ticket
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
        <div className="px-6 pb-6 pt-2">
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
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                      style={{ backgroundColor: item.statusColor }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{item.status}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(item.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  {item.duration && (
                    <div className="text-right">
                      <span className="font-bold text-lg text-gray-900 dark:text-white">{item.duration}</span>
                      <p className="text-xs text-gray-500">duração</p>
                    </div>
                  )}
                </div>

                {/* Informação do usuário */}
                {item.user && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3 ml-11">
                    <UserIcon className="h-3 w-3" />
                    <span>{item.user.name}</span>
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
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total - card de destaque */}
          {totalDuration && (
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl text-center">
              <p className="text-sm opacity-90 mb-1">Tempo Total de Resolução</p>
              <p className="text-3xl font-bold">{totalDuration}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

