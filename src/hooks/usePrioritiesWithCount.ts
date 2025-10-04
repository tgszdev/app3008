'use client'

import { useState, useEffect } from 'react'

export interface PriorityWithCount {
  slug: string
  name: string
  color: string
  count: number
}

export function usePrioritiesWithCount() {
  const [priorities, setPriorities] = useState<PriorityWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPrioritiesWithCount()
  }, [])

  const fetchPrioritiesWithCount = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/priorities/with-count', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch priorities with count')
      }
      
      const data = await response.json()
      setPriorities(data || [])
    } catch (error) {
      setError('Erro ao carregar prioridades')
      
      // Fallback to default priorities with zero count
      setPriorities([
        { slug: 'low', name: 'Baixa', color: '#6b7280', count: 0 },
        { slug: 'medium', name: 'Média', color: '#2563eb', count: 0 },
        { slug: 'high', name: 'Alta', color: '#d97706', count: 0 },
        { slug: 'critical', name: 'Crítica', color: '#dc2626', count: 0 }
      ])
    } finally {
      setLoading(false)
    }
  }

  return {
    priorities,
    loading,
    error,
    refetch: fetchPrioritiesWithCount
  }
}










