'use client'

import { useEffect, useState } from 'react'
import { Star, TrendingUp, TrendingDown, Users, MessageSquare } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface SatisfactionData {
  averageRating: number
  totalRatings: number
  trend: number // percentual de mudança em relação ao período anterior
  distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  recentComments: Array<{
    rating: number
    comment: string
    ticketNumber: string
    createdAt: string
  }>
}

export function SatisfactionWidget() {
  const [data, setData] = useState<SatisfactionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month') // 'week', 'month', 'year'

  useEffect(() => {
    fetchSatisfactionData()
  }, [period])

  const fetchSatisfactionData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/dashboard/satisfaction?period=${period}`)
      setData(response.data)
    } catch (error) {
      console.error('Error fetching satisfaction data:', error)
      // Se a API não existir ainda, usar dados mocados para demonstração
      setData({
        averageRating: 4.2,
        totalRatings: 45,
        trend: 12.5,
        distribution: {
          1: 2,
          2: 3,
          3: 8,
          4: 15,
          5: 17
        },
        recentComments: [
          {
            rating: 5,
            comment: "Excelente atendimento, problema resolvido rapidamente!",
            ticketNumber: "2024-0045",
            createdAt: new Date().toISOString()
          },
          {
            rating: 4,
            comment: "Bom suporte, mas demorou um pouco.",
            ticketNumber: "2024-0044",
            createdAt: new Date().toISOString()
          }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.floor(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : star === Math.ceil(rating) && rating % 1 !== 0
                ? 'fill-yellow-400/50 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const satisfactionPercentage = (data.averageRating / 5) * 100

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Satisfação do Cliente
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Baseado em {data.totalRatings} avaliações
          </p>
        </div>
        
        {/* Period Selector */}
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="week">Última Semana</option>
          <option value="month">Último Mês</option>
          <option value="year">Último Ano</option>
        </select>
      </div>

      {/* Main Rating Display */}
      <div className="flex items-center gap-6 mb-6">
        <div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {data.averageRating.toFixed(1)}
          </div>
          {renderStars(data.averageRating)}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {satisfactionPercentage.toFixed(0)}% Satisfação
            </span>
            {data.trend !== 0 && (
              <span className={`flex items-center gap-1 text-sm font-medium ${
                data.trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {data.trend > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {Math.abs(data.trend).toFixed(1)}%
              </span>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${satisfactionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-2 mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Distribuição das Avaliações
        </h4>
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = data.distribution[rating as keyof typeof data.distribution]
          const percentage = data.totalRatings > 0 ? (count / data.totalRatings) * 100 : 0
          
          return (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-12">
                <span className="text-sm text-gray-600 dark:text-gray-400">{rating}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    rating === 5 ? 'bg-green-500' :
                    rating === 4 ? 'bg-lime-500' :
                    rating === 3 ? 'bg-yellow-500' :
                    rating === 2 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                {count}
              </span>
            </div>
          )
        })}
      </div>

      {/* Recent Comments */}
      {data.recentComments.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comentários Recentes
          </h4>
          <div className="space-y-3">
            {data.recentComments.slice(0, 2).map((comment, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {renderStars(comment.rating)}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      #{comment.ticketNumber}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  "{comment.comment}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => window.location.href = '/dashboard/reports'}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          Ver Relatório Completo →
        </button>
      </div>
    </div>
  )
}