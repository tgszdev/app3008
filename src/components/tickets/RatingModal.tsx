'use client'

import { useState, useEffect } from 'react'
import { X, Star, Send } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  ticketNumber: string
  ticketTitle: string
  userId?: string // Adicionar userId como prop opcional
}

export function RatingModal({ 
  isOpen, 
  onClose, 
  ticketId, 
  ticketNumber,
  ticketTitle,
  userId 
}: RatingModalProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(0)
      setHoveredRating(0)
      setComment('')
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Por favor, selecione uma avaliação')
      return
    }

    setLoading(true)
    try {
      await axios.post(`/api/tickets/${ticketId}/rating`, {
        rating,
        comment: comment.trim() || null,
        userId: userId // Enviando userId temporariamente
      })
      
      toast.success('Obrigado pela sua avaliação!')
      onClose()
    } catch (error: any) {
      console.error('Error submitting rating:', error)
      toast.error(error.response?.data?.error || 'Erro ao enviar avaliação')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <Star className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Ticket Resolvido!
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              #{ticketNumber} - {ticketTitle}
            </p>
          </div>

          {/* Rating Section */}
          <div className="space-y-6">
            <div>
              <p className="text-center text-gray-700 dark:text-gray-300 mb-4">
                Como foi sua experiência com este atendimento?
              </p>
              
              {/* Stars */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    disabled={loading}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className={`transition-all ${
                      loading ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'
                    }`}
                  >
                    <Star
                      className={`h-10 w-10 transition-colors ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600 hover:text-gray-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
              
              {/* Rating Label */}
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                {rating === 0 ? 'Clique nas estrelas para avaliar' :
                 rating === 1 ? '😞 Muito Insatisfeito' :
                 rating === 2 ? '😕 Insatisfeito' :
                 rating === 3 ? '😐 Neutro' :
                 rating === 4 ? '😊 Satisfeito' :
                 '😄 Muito Satisfeito'}
              </p>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deixe um comentário (opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={loading}
                rows={3}
                placeholder="Conte-nos mais sobre sua experiência..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Pular
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || rating === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                {loading ? 'Enviando...' : 'Enviar Avaliação'}
              </button>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
            Sua avaliação nos ajuda a melhorar nosso atendimento
          </p>
        </div>
      </div>
    </div>
  )
}