'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export interface Status {
  id: string
  name: string
  slug: string
  color: string
  description: string
  is_default: boolean
  is_final: boolean
  is_internal: boolean
  order_index: number
  created_at?: string
  updated_at?: string
}

export function useStatuses() {
  const [statuses, setStatuses] = useState<Status[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatuses()
  }, [])

  const fetchStatuses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/statuses', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch statuses')
      }
      
      const data = await response.json()
      
      // Sort by order_index
      const sortedStatuses = (data || []).sort((a: Status, b: Status) => 
        (a.order_index || 0) - (b.order_index || 0)
      )
      
      setStatuses(sortedStatuses)
    } catch (error) {
      setError('Erro ao carregar status')
      
      // Fallback to default statuses if API fails
      setStatuses([
        {
          id: 'open',
          name: 'Aberto',
          slug: 'open',
          color: '#2563eb',
          description: 'Chamado aberto/novo',
          is_default: true,
          is_final: false,
          is_internal: false,
          order_index: 1
        },
        {
          id: 'in_progress',
          name: 'Em Progresso',
          slug: 'in_progress',
          color: '#eab308',
          description: 'Atendimento em andamento',
          is_default: false,
          is_final: false,
          is_internal: false,
          order_index: 2
        },
        {
          id: 'resolved',
          name: 'Resolvido',
          slug: 'resolved',
          color: '#16a34a',
          description: 'Solução aplicada',
          is_default: false,
          is_final: false,
          is_internal: false,
          order_index: 3
        },
        {
          id: 'closed',
          name: 'Fechado',
          slug: 'closed',
          color: '#6b7280',
          description: 'Chamado concluído',
          is_default: false,
          is_final: true,
          is_internal: false,
          order_index: 4
        },
        {
          id: 'cancelled',
          name: 'Cancelado',
          slug: 'cancelled',
          color: '#dc2626',
          description: 'Chamado cancelado',
          is_default: false,
          is_final: true,
          is_internal: false,
          order_index: 5
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return {
    statuses,
    loading,
    error,
    refetch: fetchStatuses
  }
}