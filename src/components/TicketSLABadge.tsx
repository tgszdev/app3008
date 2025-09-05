'use client'

import { useEffect, useState } from 'react'
import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { calculateSLAStatus, formatMinutes, SLAConfiguration, SLAStatus } from '@/lib/sla-utils'
import axios from 'axios'

interface TicketSLABadgeProps {
  ticket: {
    id: string
    created_at: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    category_id?: string
    status: string
    first_response_at?: string | null
    resolved_at?: string | null
  }
}

export function TicketSLABadge({ ticket }: TicketSLABadgeProps) {
  const [slaData, setSlaData] = useState<{
    configuration: SLAConfiguration | null
    status: SLAStatus | null
  }>({ configuration: null, status: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSLA()
    
    // Atualiza a cada minuto se o ticket está aberto
    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      const interval = setInterval(fetchSLA, 60000)
      return () => clearInterval(interval)
    }
  }, [ticket.id, ticket.status])

  const fetchSLA = async () => {
    try {
      const response = await axios.get(`/api/sla/ticket/${ticket.id}`)
      if (response.data.configuration) {
        const status = calculateSLAStatus(ticket, response.data.configuration)
        setSlaData({
          configuration: response.data.configuration,
          status
        })
      }
    } catch (error) {
      console.error('Erro ao buscar SLA:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !slaData.configuration || !slaData.status) {
    return null
  }

  const { status } = slaData
  
  // Determina o status mais crítico para exibir
  const criticalStatus = 
    status.resolution.status === 'breached' || status.first_response.status === 'breached' ? 'breached' :
    status.resolution.status === 'at_risk' || status.first_response.status === 'at_risk' ? 'at_risk' :
    status.resolution.status === 'met' && status.first_response.status === 'met' ? 'met' :
    'pending'

  const getStatusConfig = () => {
    switch (criticalStatus) {
      case 'breached':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
          label: 'SLA Violado'
        }
      case 'at_risk':
        return {
          icon: AlertTriangle,
          color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
          label: 'SLA em Risco'
        }
      case 'met':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
          label: 'SLA Atendido'
        }
      default:
        return {
          icon: Clock,
          color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
          label: 'SLA Ativo'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  // Determina qual tempo mostrar (o mais crítico)
  const timeToShow = status.first_response.status === 'breached' || status.first_response.status === 'at_risk'
    ? { 
        label: 'Resposta',
        time: status.first_response.remaining_minutes,
        percentage: status.first_response.percentage
      }
    : {
        label: 'Resolução',
        time: status.resolution.remaining_minutes,
        percentage: status.resolution.percentage
      }

  return (
    <div className="flex items-center gap-2">
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={14} />
        <span>{config.label}</span>
      </div>
      
      {(ticket.status !== 'resolved' && ticket.status !== 'closed') && timeToShow.time > 0 && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {timeToShow.label}: {formatMinutes(timeToShow.time)}
        </div>
      )}
    </div>
  )
}