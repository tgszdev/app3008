'use client'

import dynamic from 'next/dynamic'
import { PrintButton } from './PrintButton'

// Tenta carregar o componente com react-to-print
const PrintButtonWithLibrary = dynamic(
  () => import('./PrintButtonWrapper'),
  {
    ssr: false,
    loading: () => null,
    // Se falhar ao carregar, usa o componente fallback
    // @ts-ignore
    fallback: PrintButton
  }
)

interface PrintButtonSafeProps {
  ticket: any
  loading?: boolean
}

export function PrintButtonSafe(props: PrintButtonSafeProps) {
  // Tenta usar o componente com react-to-print
  // Se falhar, o ErrorBoundary vai capturar e usar o fallback
  try {
    if (PrintButtonWithLibrary) {
      return <PrintButtonWithLibrary {...props} />
    }
  } catch (error) {
    console.error('Erro ao carregar PrintButton com react-to-print:', error)
  }

  // Fallback para o botão simples com window.print()
  return <PrintButton {...props} />
}