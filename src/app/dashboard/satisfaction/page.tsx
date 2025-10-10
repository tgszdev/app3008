'use client'

import { useEffect, useState } from 'react'
import { Star, TrendingUp, TrendingDown, Calendar, Download, RefreshCw, Filter, Building } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatBrazilDateTime } from '@/lib/date-utils'
import { useOrganization } from '@/contexts/OrganizationContext'
import ClientSelector from '@/components/ClientSelector'

interface SatisfactionData {
  averageRating: number
  totalRatings: number
  trend: number
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
    ticketTitle: string
    createdAt: string
  }>
}

export default function SatisfactionPage() {
  const { availableContexts, isMatrixUser } = useOrganization()
  const [data, setData] = useState<SatisfactionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedClients, setSelectedClients] = useState<string[]>([])

  // Carregar seleções do localStorage na inicialização
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('satisfactionSelectedClients')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedClients(parsed)
          }
        } catch (error) {
          setSelectedClients([])
        }
      }
    }
  }, [])

  // Salvar seleções no localStorage sempre que mudarem
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedClients.length > 0) {
        localStorage.setItem('satisfactionSelectedClients', JSON.stringify(selectedClients))
      } else {
        localStorage.removeItem('satisfactionSelectedClients')
      }
    }
  }, [selectedClients])

  useEffect(() => {
    fetchSatisfactionData()
  }, [period, selectedClients])

  const fetchSatisfactionData = async () => {
    try {
      setLoading(true)
      
      // Se não há clientes selecionados, não buscar dados
      if (selectedClients.length === 0) {
        setData({
          averageRating: 0,
          totalRatings: 0,
          trend: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          recentComments: []
        })
        return
      }
      
      const params = new URLSearchParams({
        period: period,
        context_ids: selectedClients.join(',')
      })
      
      const response = await axios.get(`/api/dashboard/satisfaction?${params}`)
      setData(response.data)
    } catch (error) {
      toast.error('Erro ao carregar dados de satisfação')
      setData({
        averageRating: 0,
        totalRatings: 0,
        trend: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentComments: []
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchSatisfactionData()
    setRefreshing(false)
    toast.success('Dados atualizados')
  }

  const renderStars = (rating: number, size: string = 'h-5 w-5') => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
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

  const formatDate = (dateString: string) => {
    return formatBrazilDateTime(dateString)
  }

  const getPeriodLabel = () => {
    switch(period) {
      case 'week': return 'Última Semana'
      case 'month': return 'Último Mês'
      case 'year': return 'Último Ano'
      default: return 'Período'
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-pulse text-center">
          <Star className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Carregando dados de satisfação...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const satisfactionPercentage = (data.averageRating / 5) * 100
  const maxRatings = Math.max(...Object.values(data.distribution))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Satisfação do Cliente
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Análise completa das avaliações e feedbacks dos clientes
              {selectedClients.length > 0 && (
                <span className="block mt-1 text-sm">
                  {selectedClients.length === 1 
                    ? `Filtrado para: ${availableContexts.find(c => c.id === selectedClients[0])?.name || 'Cliente selecionado'}`
                    : `Filtrado para: ${selectedClients.length} clientes selecionados`
                  }
                </span>
              )}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Client Selector */}
            <ClientSelector
              selectedClients={selectedClients}
              availableContexts={availableContexts}
              onSelectionChange={setSelectedClients}
              isMatrixUser={isMatrixUser}
              className="w-full sm:w-auto"
            />
            
            {/* Period Selector */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Última Semana</option>
              <option value="month">Último Mês</option>
              <option value="year">Último Ano</option>
            </select>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full sm:w-auto p-2 rounded-2xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Average Rating Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Média Geral
            </h3>
            <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {data.averageRating.toFixed(1)}
          </div>
          {renderStars(data.averageRating, 'h-6 w-6')}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {satisfactionPercentage.toFixed(0)}% de satisfação
          </div>
        </div>

        {/* Total Ratings Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Total de Avaliações
            </h3>
            <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {data.totalRatings}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {getPeriodLabel()}
          </div>
          {data.totalRatings === 0 && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Nenhuma avaliação neste período
            </p>
          )}
        </div>

        {/* Trend Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tendência
            </h3>
            {data.trend > 0 ? (
              <TrendingUp className="h-6 w-6 text-green-600" />
            ) : data.trend < 0 ? (
              <TrendingDown className="h-6 w-6 text-red-600" />
            ) : (
              <div className="h-6 w-6 text-gray-400">→</div>
            )}
          </div>
          <div className={`text-4xl font-bold ${
            data.trend > 0 ? 'text-green-600' : data.trend < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'
          }`}>
            {data.trend > 0 ? '+' : ''}{data.trend.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            vs período anterior
          </div>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Distribuição das Avaliações
        </h3>
        
        <div className="space-y-4">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = data.distribution[rating as keyof typeof data.distribution]
            const percentage = data.totalRatings > 0 ? (count / data.totalRatings) * 100 : 0
            
            return (
              <div key={rating} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-20">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {rating}
                  </span>
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
                
                <div className="flex-1">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 relative overflow-hidden">
                    <div
                      className={`h-8 rounded-full transition-all duration-700 flex items-center justify-end pr-3 ${
                        rating === 5 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        rating === 4 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                        rating === 3 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                        rating === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                        'bg-gradient-to-r from-red-400 to-red-500'
                      }`}
                      style={{ width: `${Math.max(percentage, percentage > 0 ? 10 : 0)}%` }}
                    >
                      {percentage > 5 && (
                        <span className="text-sm text-white font-medium">
                          {percentage.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12 text-right">
                  {count}
                </div>
              </div>
            )
          })}
        </div>

        {/* Statistics Summary */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.distribution[5] + data.distribution[4]}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Avaliações Positivas (4-5⭐)
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {data.distribution[3]}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Avaliações Neutras (3⭐)
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {data.distribution[2] + data.distribution[1]}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Avaliações Negativas (1-2⭐)
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {((data.distribution[5] + data.distribution[4]) / data.totalRatings * 100 || 0).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Taxa de Aprovação
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Comments */}
      {data.recentComments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Comentários Recentes
          </h3>
          
          <div className="space-y-4">
            {data.recentComments.map((comment, index) => (
              <div 
                key={index} 
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {renderStars(comment.rating)}
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {comment.ticketNumber}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {comment.ticketTitle}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  "{comment.comment}"
                </p>
              </div>
            ))}
          </div>
          
          {data.totalRatings > data.recentComments.length && (
            <div className="mt-6 text-center">
              <button
                onClick={() => window.location.href = '/dashboard/reports'}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Ver todos os {data.totalRatings} comentários
                <Download className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State - Nenhum cliente selecionado */}
      {selectedClients.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
          <div className="text-center">
            <Building className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum cliente selecionado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Selecione um ou mais clientes para visualizar os dados de satisfação.
            </p>
            {!isMatrixUser && (
              <p className="text-sm text-gray-400 mt-2">
                Apenas usuários matriz podem selecionar múltiplos clientes
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty State - Nenhuma avaliação */}
      {selectedClients.length > 0 && data.totalRatings === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
          <div className="text-center">
            <Star className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma avaliação ainda
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              As avaliações aparecerão aqui quando os tickets forem resolvidos e avaliados pelos clientes.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}