'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export interface StatusWithCount {
  id: string
  name: string
  slug: string
  color: string
  description: string
  is_default: boolean
  is_final: boolean
  is_internal: boolean
  order_index: number
  count: number
  created_at?: string
  updated_at?: string
}

export function useStatusesWithCount() {
  const [statuses, setStatuses] = useState<StatusWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatusesWithCount()
  }, [])

  const fetchStatusesWithCount = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/statuses/with-count', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch statuses with count')
      }
      
      const data = await response.json()
      
      // Sort by order_index
      const sortedStatuses = (data || []).sort((a: StatusWithCount, b: StatusWithCount) => 
        (a.order_index || 0) - (b.order_index || 0)
      )
      
      setStatuses(sortedStatuses)
    } catch (error) {
      setError('Erro ao carregar status')
      
      // Fallback to regular statuses API without count
      try {
        const fallbackResponse = await fetch('/api/statuses', {
          credentials: 'include'
        })
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          const statusesWithZeroCount = (fallbackData || []).map((status: any) => ({
            ...status,
            count: 0
          }))
          setStatuses(statusesWithZeroCount)
        }
      } catch (fallbackError) {
        setStatuses([])
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    statuses,
    loading,
    error,
    refetch: fetchStatusesWithCount
  }
}









