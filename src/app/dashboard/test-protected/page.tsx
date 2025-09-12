'use client'

import { useProtectedSession } from '@/hooks/useProtectedSession'
import { Shield, WifiOff, Wifi, RefreshCw, Clock, AlertTriangle } from 'lucide-react'

export default function TestProtectedPage() {
  const {
    isValid,
    isLoading,
    isConnected,
    lastCheck,
    invalidationReason,
    session,
    checkNow,
    disconnect
  } = useProtectedSession({
    showNotifications: true,
    enableSSE: true,
    enablePolling: true,
    pollingInterval: 5000, // Verificar a cada 5s se SSE falhar
    onSessionInvalidated: (reason) => {
      console.log('🔒 Sessão invalidada! Motivo:', reason)
      // Aqui você pode limpar dados locais, cache, etc
    }
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verificando sessão...</p>
        </div>
      </div>
    )
  }

  if (!isValid) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center bg-red-50 dark:bg-red-900/20 p-8 rounded-lg">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">Sessão Inválida</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Motivo: {invalidationReason || 'Desconhecido'}
          </p>
          <p className="text-sm text-gray-500 mt-2">Redirecionando para login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Página Protegida - Teste do Hook
          </h1>
          
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="flex items-center gap-1 text-green-600">
                <Wifi className="h-4 w-4" />
                SSE Conectado
              </span>
            ) : (
              <span className="flex items-center gap-1 text-orange-600">
                <WifiOff className="h-4 w-4" />
                Polling Ativo
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status da Sessão */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              Status da Sessão
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`font-semibold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {isValid ? '✅ Válida' : '❌ Inválida'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Proteção:</span>
                <span className={`font-semibold ${isConnected ? 'text-green-600' : 'text-orange-600'}`}>
                  {isConnected ? '🟢 SSE Ativo' : '🟠 Polling'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Última Verificação:</span>
                <span className="text-gray-900 dark:text-white">
                  {lastCheck ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {lastCheck.toLocaleTimeString('pt-BR')}
                    </span>
                  ) : 'Nunca'}
                </span>
              </div>
            </div>
          </div>

          {/* Informações do Usuário */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              Informações do Usuário
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Nome:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {session?.user?.name || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="text-gray-900 dark:text-white text-sm">
                  {session?.user?.email || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">ID:</span>
                <span className="text-gray-900 dark:text-white font-mono text-xs">
                  {session?.user?.id?.substring(0, 8) || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={checkNow}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Verificar Agora
          </button>
          
          <button
            onClick={disconnect}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            disabled={!isConnected}
          >
            <WifiOff className="h-4 w-4" />
            Desconectar SSE
          </button>
        </div>

        {/* Instruções */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📋 Como Testar
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>Esta página está protegida pelo hook useProtectedSession</li>
            <li>Faça login em outro navegador/aba privada com o mesmo usuário</li>
            <li>Observe que esta sessão será invalidada automaticamente em ~2 segundos</li>
            <li>O SSE detecta a invalidação em tempo real</li>
            <li>Se o SSE falhar, o polling assume como fallback</li>
          </ol>
        </div>

        {/* Debug Info */}
        {invalidationReason && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
              ⚠️ Sessão Invalidada
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200">
              Motivo: {invalidationReason}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}