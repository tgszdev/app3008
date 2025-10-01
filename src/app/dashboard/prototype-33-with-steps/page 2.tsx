'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { RecentTicketsPrototype33WithSteps } from '@/components/prototypes/RecentTicketsPrototype33WithSteps'

export default function Prototype33WithStepsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/dashboard/recent-tickets-prototypes" 
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar aos Protótipos
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Protótipo 33 com Steps
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Combinação do Layout com Progress Bar Vertical (33) + Steps (43)
          </p>
        </div>

        {/* Demonstração */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Como ficaria o Protótipo 33 com Steps:
          </h2>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <RecentTicketsPrototype33WithSteps />
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">
              Características desta versão:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• <strong>Progress Bar Vertical</strong> - Mostra o progresso visualmente na lateral</li>
              <li>• <strong>Steps Horizontais</strong> - Indica as etapas do processo (Aberto → Em Análise → Em Atendimento → Resolvido)</li>
              <li>• <strong>Layout Responsivo</strong> - Funciona bem em diferentes tamanhos de tela</li>
              <li>• <strong>Títulos Longos</strong> - Suporte para títulos de até 150 caracteres com truncamento</li>
              <li>• <strong>Criticidade</strong> - Badges coloridos para prioridade</li>
              <li>• <strong>Autor</strong> - Informação do responsável pelo ticket</li>
              <li>• <strong>Dark Mode</strong> - Suporte completo para modo escuro</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
