'use client'

import { useState, useEffect } from 'react'
import { Star, MessageSquare, Send, Trash2, Edit2 } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface TicketRatingProps {
  ticketId: string
  ticketNumber: string
  currentUserId: string
  onRatingSubmitted?: () => void
  showInline?: boolean // Se deve mostrar inline ou em modal
}

interface Rating {
  id: string
  rating: number
  comment: string | null
  created_at: string
  user_id: string
  user_name?: string
}

export function TicketRating({ 
  ticketId, 
  ticketNumber, 
  currentUserId, 
  onRatingSubmitted,
  showInline = true 
}: TicketRatingProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [existingRating, setExistingRating] = useState<Rating | null>(null)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    fetchExistingRating()
  }, [ticketId])

  const fetchExistingRating = async () => {
    try {
      const response = await axios.get(`/api/tickets/${ticketId}/rating`)
      if (response.data) {
        setExistingRating(response.data)
        setRating(response.data.rating)
        setComment(response.data.comment || '')
      }
    } catch (error) {
      // Sem avaliação ainda, isso é normal
      console.log('No rating yet')
    }
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Por favor, selecione uma avaliação')
      return
    }

    setLoading(true)
    try {
      if (existingRating && !isEditing) {
        // Delete existing rating
        await axios.delete(`/api/tickets/${ticketId}/rating`, {
          data: { userId: currentUserId } // Enviando userId para delete
        })
        setExistingRating(null)
        setRating(0)
        setComment('')
        toast.success('Avaliação removida')
      } else {
        // Create or update rating
        const response = await axios.post(`/api/tickets/${ticketId}/rating`, {
          rating,
          comment: comment.trim() || null,
          userId: currentUserId // Enviando userId temporariamente
        })
        
        setExistingRating(response.data)
        setIsEditing(false)
        toast.success(existingRating ? 'Avaliação atualizada!' : 'Obrigado pela sua avaliação!')
        
        if (onRatingSubmitted) {
          onRatingSubmitted()
        }
      }
    } catch (error: any) {
      console.error('Error submitting rating:', error)
      toast.error(error.response?.data?.error || 'Erro ao enviar avaliação')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    if (existingRating) {
      setRating(existingRating.rating)
      setComment(existingRating.comment || '')
      setIsEditing(false)
    } else {
      setRating(0)
      setComment('')
    }
  }

  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={loading || (existingRating && !isEditing)}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className={`transition-all ${
              loading || (existingRating && !isEditing) 
                ? 'cursor-not-allowed' 
                : 'cursor-pointer hover:scale-110'
            }`}
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= (hoveredRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600 hover:text-gray-400'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  if (!showInline) {
    return null // Will be handled by modal
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {existingRating && !isEditing ? 'Sua Avaliação' : 'Avaliar Atendimento'}
        </h3>
        {existingRating && !isEditing && (
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Edit2 className="h-5 w-5" />
            </button>
            <button
              onClick={handleSubmit}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Stars */}
        <div className="flex flex-col items-center gap-2">
          {renderStars()}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {rating === 0 ? 'Clique para avaliar' :
             rating === 1 ? 'Muito Insatisfeito' :
             rating === 2 ? 'Insatisfeito' :
             rating === 3 ? 'Neutro' :
             rating === 4 ? 'Satisfeito' :
             'Muito Satisfeito'}
          </p>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MessageSquare className="inline h-4 w-4 mr-1" />
            Comentário (opcional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={loading || (existingRating && !isEditing)}
            rows={3}
            placeholder="Compartilhe sua experiência..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Actions */}
        {(!existingRating || isEditing) && (
          <div className="flex gap-3">
            {isEditing && (
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading || rating === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {loading ? 'Enviando...' : isEditing ? 'Atualizar' : 'Enviar Avaliação'}
            </button>
          </div>
        )}

        {/* Existing Rating Display */}
        {existingRating && !isEditing && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Avaliado em {new Date(existingRating.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
            {existingRating.comment && (
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                "{existingRating.comment}"
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}