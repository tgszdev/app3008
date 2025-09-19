'use client'

import { useEffect, useState } from 'react'
import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { calculateSLAStatus, formatMinutes, getSLAStatusColor, getSLAStatusIcon, SLAConfiguration, SLAStatus } from '@/lib/sla-utils'
import { formatBrazilDateTime } from '@/lib/date-utils'

interface SLAIndicatorProps {
  ticket: {
    id: string
    created_at: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    category_id?: string
    status: string
    first_response_at?: string | null
    resolved_at?: string | null
  }
  configuration?: SLAConfiguration
  showDetails?: boolean
  compact?: boolean
}

export function SLAIndicator({ ticket, configuration, showDetails = false, compact = false }: SLAIndicatorProps) {
  const [slaStatus, setSLAStatus] = useState<SLAStatus | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (!configuration) return

    // Calcula status inicial
    const status = calculateSLAStatus(ticket, configuration, currentTime)
    setSLAStatus(status)

    // Atualiza a cada minuto se o ticket ainda está aberto
    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      const interval = setInterval(() => {
        const now = new Date()
        setCurrentTime(now)
        const newStatus = calculateSLAStatus(ticket, configuration, now)
        setSLAStatus(newStatus)
      }, 60000) // Atualiza a cada minuto

      return () => clearInterval(interval)
    }
  }, [ticket, configuration, currentTime])

  if (!configuration || !slaStatus) {
    return null
  }

  const getStatusIcon = (status: 'pending' | 'met' | 'breached' | 'at_risk') => {
    switch (status) {
      case 'met':
        return <CheckCircle className="w-4 h-4" />
      case 'breached':
        return <XCircle className="w-4 h-4" />
      case 'at_risk':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getProgressBarColor = (percentage: number, status: string) => {
    if (status === 'met') return 'bg-green-500'
    if (status === 'breached') return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    if (percentage >= 50) return 'bg-blue-500'
    return 'bg-gray-400'
  }

  if (compact) {
    // Versão compacta para lista de tickets
    return (
      <div className="flex items-center gap-2 text-sm">
        {/* Primeira Resposta */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getSLAStatusColor(slaStatus.first_response.status)}`}>
          {getStatusIcon(slaStatus.first_response.status)}
          <span className="font-medium">
            {ticket.first_response_at 
              ? 'Respondido' 
              : formatMinutes(slaStatus.first_response.remaining_minutes)
            }
          </span>
        </div>
        
        {/* Resolução */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getSLAStatusColor(slaStatus.resolution.status)}`}>
          {getStatusIcon(slaStatus.resolution.status)}
          <span className="font-medium">
            {ticket.resolved_at || ticket.status === 'resolved'
              ? 'Resolvido'
              : formatMinutes(slaStatus.resolution.remaining_minutes)
            }
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          SLA - {configuration.name}
        </h3>
        {showDetails && (
          <span className="text-xs text-gray-500">
            Atualizado há menos de 1 min
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Primeira Resposta */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Primeira Resposta</span>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getSLAStatusColor(slaStatus.first_response.status)}`}>
                {getStatusIcon(slaStatus.first_response.status)}
                <span className="font-medium">
                  {slaStatus.first_response.status === 'met' && 'Atendido'}
                  {slaStatus.first_response.status === 'breached' && 'Violado'}
                  {slaStatus.first_response.status === 'at_risk' && 'Em Risco'}
                  {slaStatus.first_response.status === 'pending' && 'Pendente'}
                </span>
              </span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {slaStatus.first_response.percentage.toFixed(0)}%
            </span>
          </div>
          
          {/* Barra de Progresso */}
          <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`absolute left-0 top-0 h-full transition-all duration-300 ${getProgressBarColor(slaStatus.first_response.percentage, slaStatus.first_response.status)}`}
              style={{ width: `${Math.min(slaStatus.first_response.percentage, 100)}%` }}
            />
          </div>
          
          {showDetails && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Meta: {formatBrazilDateTime(slaStatus.first_response.target)}</span>
                <span>
                  {ticket.first_response_at 
                    ? `Respondido em ${formatMinutes(slaStatus.first_response.elapsed_minutes)}`
                    : `Restante: ${formatMinutes(slaStatus.first_response.remaining_minutes)}`
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Resolução */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Resolução</span>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getSLAStatusColor(slaStatus.resolution.status)}`}>
                {getStatusIcon(slaStatus.resolution.status)}
                <span className="font-medium">
                  {slaStatus.resolution.status === 'met' && 'Atendido'}
                  {slaStatus.resolution.status === 'breached' && 'Violado'}
                  {slaStatus.resolution.status === 'at_risk' && 'Em Risco'}
                  {slaStatus.resolution.status === 'pending' && 'Pendente'}
                </span>
              </span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {slaStatus.resolution.percentage.toFixed(0)}%
            </span>
          </div>
          
          {/* Barra de Progresso */}
          <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`absolute left-0 top-0 h-full transition-all duration-300 ${getProgressBarColor(slaStatus.resolution.percentage, slaStatus.resolution.status)}`}
              style={{ width: `${Math.min(slaStatus.resolution.percentage, 100)}%` }}
            />
          </div>
          
          {showDetails && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Meta: {formatBrazilDateTime(slaStatus.resolution.target)}</span>
                <span>
                  {ticket.resolved_at || ticket.status === 'resolved'
                    ? `Resolvido em ${formatMinutes(slaStatus.resolution.elapsed_minutes)}`
                    : `Restante: ${formatMinutes(slaStatus.resolution.remaining_minutes)}`
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Informações adicionais */}
      {showDetails && configuration.business_hours_only && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">Horário de atendimento:</span>{' '}
            {configuration.business_hours_start.slice(0, 5)} às {configuration.business_hours_end.slice(0, 5)}
            {' • '}
            {configuration.working_days.split(',').length} dias úteis por semana
          </p>
        </div>
      )}
    </div>
  )
}