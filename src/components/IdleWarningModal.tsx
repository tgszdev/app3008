'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, X, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IdleWarningModalProps {
  isOpen: boolean
  remainingSeconds: number
  onContinue: () => void
  onLogout: () => void
}

export function IdleWarningModal({ 
  isOpen, 
  remainingSeconds, 
  onContinue, 
  onLogout 
}: IdleWarningModalProps) {
  const [progress, setProgress] = useState(100)
  
  // Não renderizar nada se não estiver aberto
  if (!isOpen) return null
  
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  useEffect(() => {
    // Calcular progresso (5 minutos = 300 segundos = 100%)
    const totalWarningTime = 5 * 60 // 5 minutos
    const progressPercentage = (remainingSeconds / totalWarningTime) * 100
    setProgress(progressPercentage)
  }, [remainingSeconds])

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] animate-in fade-in duration-200"
        onClick={onContinue}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] w-full max-w-md animate-in zoom-in-95 fade-in duration-200">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-yellow-400 dark:border-yellow-500 overflow-hidden">
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  Sessão Expirando
                </h3>
                <p className="text-sm text-yellow-100 mt-0.5">
                  Por inatividade
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Timer grande */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-4 border-yellow-400 dark:border-yellow-500 mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-yellow-400 dark:border-yellow-500 animate-pulse"></div>
                <div className="relative">
                  <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mb-1" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                  </p>
                </div>
              </div>
              
              {/* Barra de progresso */}
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-1000 ease-linear",
                    progress > 60 ? "bg-green-500" :
                    progress > 30 ? "bg-yellow-500" :
                    "bg-red-500"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Mensagem */}
            <div className="space-y-3 mb-6">
              <p className="text-center text-gray-700 dark:text-gray-300">
                Sua sessão está prestes a expirar devido à <strong>inatividade</strong>.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-medium mb-1">Por que isso acontece?</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Por segurança, sessões inativas são encerradas após 60 minutos sem atividade.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onContinue}
                className="flex-1 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Shield className="h-5 w-5" />
                Continuar Conectado
              </button>
              <button
                onClick={onLogout}
                className="sm:w-auto px-6 h-12 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <X className="h-4 w-4" />
                Sair Agora
              </button>
            </div>

            {/* Footer info */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              Clique em "Continuar Conectado" para manter sua sessão ativa
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

