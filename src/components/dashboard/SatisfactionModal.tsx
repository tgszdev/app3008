'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition, Tab } from '@headlessui/react'
import { X, TrendingUp, TrendingDown, Star, MessageSquare, BarChart3, Calendar, FileText } from 'lucide-react'
import { formatBrazilDateTime } from '@/lib/date-utils'

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
    createdAt: string
  }>
}

interface SatisfactionModalProps {
  isOpen: boolean
  onClose: () => void
  data: SatisfactionData
  period: string
}

export function SatisfactionModal({ isOpen, onClose, data, period }: SatisfactionModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const satisfactionPercentage = (data.averageRating / 5) * 100
  const maxRatings = Math.max(...Object.values(data.distribution))
  
  const renderStars = (rating: number, size: string = 'h-4 w-4') => {
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
    try {
      return formatBrazilDateTime(dateString)
    } catch {
      return dateString
    }
  }
  
  const getPeriodLabel = () => {
    switch(period) {
      case 'week': return 'Última Semana'
      case 'month': return 'Último Mês'
      case 'year': return 'Último Ano'
      default: return 'Período'
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 dark:text-white">
                    Análise de Satisfação - {getPeriodLabel()}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Tabs */}
                <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
                  <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-700 p-1 mb-6">
                    <Tab
                      className={({ selected }) =>
                        `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                        ${selected 
                          ? 'bg-white dark:bg-gray-600 text-blue-700 dark:text-blue-400 shadow'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] hover:text-gray-700'
                        }`
                      }
                    >
                      <div className="flex items-center justify-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Resumo
                      </div>
                    </Tab>
                    <Tab
                      className={({ selected }) =>
                        `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                        ${selected 
                          ? 'bg-white dark:bg-gray-600 text-blue-700 dark:text-blue-400 shadow'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] hover:text-gray-700'
                        }`
                      }
                    >
                      <div className="flex items-center justify-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Comentários ({data.recentComments.length})
                      </div>
                    </Tab>
                    <Tab
                      className={({ selected }) =>
                        `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                        ${selected 
                          ? 'bg-white dark:bg-gray-600 text-blue-700 dark:text-blue-400 shadow'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] hover:text-gray-700'
                        }`
                      }
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Star className="h-4 w-4" />
                        Gráficos
                      </div>
                    </Tab>
                  </Tab.List>

                  <Tab.Panels>
                    {/* Tab 1: Resumo */}
                    <Tab.Panel className="rounded-xl p-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Card Média */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Média Geral</span>
                            <Star className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {data.averageRating.toFixed(1)}
                          </div>
                          {renderStars(data.averageRating)}
                        </div>

                        {/* Card Total */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total de Avaliações</span>
                            <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {data.totalRatings}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {getPeriodLabel()}
                          </div>
                        </div>

                        {/* Card Tendência */}
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Tendência</span>
                            {data.trend > 0 ? (
                              <TrendingUp className="h-5 w-5 text-green-600" />
                            ) : data.trend < 0 ? (
                              <TrendingDown className="h-5 w-5 text-red-600" />
                            ) : (
                              <div className="h-5 w-5 text-gray-400">→</div>
                            )}
                          </div>
                          <div className={`text-3xl font-bold ${
                            data.trend > 0 ? 'text-green-600' : data.trend < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'
                          }`}>
                            {data.trend > 0 ? '+' : ''}{data.trend.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            vs período anterior
                          </div>
                        </div>
                      </div>

                      {/* Distribuição */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                          Distribuição das Avaliações
                        </h4>
                        <div className="space-y-3">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const count = data.distribution[rating as keyof typeof data.distribution]
                            const percentage = data.totalRatings > 0 ? (count / data.totalRatings) * 100 : 0
                            
                            return (
                              <div key={rating} className="flex items-center gap-3">
                                <div className="flex items-center gap-1 w-16">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">{rating}</span>
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                </div>
                                <div className="flex-1">
                                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-6 relative overflow-hidden">
                                    <div
                                      className={`h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
                                        rating === 5 ? 'bg-green-500' :
                                        rating === 4 ? 'bg-green-400' :
                                        rating === 3 ? 'bg-yellow-400' :
                                        rating === 2 ? 'bg-orange-400' :
                                        'bg-red-400'
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                    >
                                      {percentage > 10 && (
                                        <span className="text-xs text-white font-medium">
                                          {percentage.toFixed(0)}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                                  {count}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </Tab.Panel>

                    {/* Tab 2: Comentários */}
                    <Tab.Panel className="rounded-xl p-3">
                      {data.recentComments.length > 0 ? (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {data.recentComments.map((comment, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  {renderStars(comment.rating)}
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {comment.ticketNumber}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 mt-2">
                                "{comment.comment}"
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">
                            Nenhum comentário disponível neste período
                          </p>
                        </div>
                      )}
                    </Tab.Panel>

                    {/* Tab 3: Gráficos */}
                    <Tab.Panel className="rounded-xl p-3">
                      <div className="space-y-6">
                        {/* Gráfico de Satisfação */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                            Nível de Satisfação
                          </h4>
                          <div className="relative">
                            <div className="flex items-center gap-4">
                              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                                {satisfactionPercentage.toFixed(0)}%
                              </div>
                              <div className="flex-1">
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-8">
                                  <div
                                    className={`h-8 rounded-full transition-all duration-1000 flex items-center justify-center ${
                                      satisfactionPercentage >= 80 ? 'bg-green-500' :
                                      satisfactionPercentage >= 60 ? 'bg-yellow-400' :
                                      satisfactionPercentage >= 40 ? 'bg-orange-400' :
                                      'bg-red-400'
                                    }`}
                                    style={{ width: `${satisfactionPercentage}%` }}
                                  >
                                    <span className="text-sm text-white font-medium">
                                      {data.averageRating.toFixed(1)} ⭐
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Estatísticas Visuais */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4 text-center">
                            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {Math.max(...Object.entries(data.distribution).map(([k, v]) => Number(k) * v)) / data.totalRatings || 0} ⭐
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Avaliação mais comum
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg p-4 text-center">
                            <Calendar className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {data.totalRatings}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {getPeriodLabel()}
                            </div>
                          </div>
                        </div>

                        {/* Legenda de Cores */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Escala de Satisfação
                          </h4>
                          <div className="grid grid-cols-5 gap-2 text-center">
                            <div>
                              <div className="h-8 bg-red-400 rounded mb-1"></div>
                              <span className="text-xs text-gray-600 dark:text-gray-400">Muito Ruim</span>
                            </div>
                            <div>
                              <div className="h-8 bg-orange-400 rounded mb-1"></div>
                              <span className="text-xs text-gray-600 dark:text-gray-400">Ruim</span>
                            </div>
                            <div>
                              <div className="h-8 bg-yellow-400 rounded mb-1"></div>
                              <span className="text-xs text-gray-600 dark:text-gray-400">Regular</span>
                            </div>
                            <div>
                              <div className="h-8 bg-green-400 rounded mb-1"></div>
                              <span className="text-xs text-gray-600 dark:text-gray-400">Bom</span>
                            </div>
                            <div>
                              <div className="h-8 bg-green-500 rounded mb-1"></div>
                              <span className="text-xs text-gray-600 dark:text-gray-400">Excelente</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>

                {/* Footer Actions */}
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => {
                      // TODO: Implementar exportação
                      alert('Exportação em desenvolvimento')
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <FileText className="h-4 w-4" />
                    Exportar Relatório
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                  >
                    Fechar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}