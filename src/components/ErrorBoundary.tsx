'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertTriangle size={24} />
                <h2 className="text-xl font-semibold">Erro ao carregar a página</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Ocorreu um erro ao carregar esta página. Por favor, tente novamente.
              </p>
              <div className="bg-gray-100 p-3 rounded mb-4">
                <p className="text-sm font-mono text-gray-700">
                  {this.state.error?.message || 'Erro desconhecido'}
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Recarregar página
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}