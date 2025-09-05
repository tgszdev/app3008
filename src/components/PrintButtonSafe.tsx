'use client'

import { PrintButton } from './PrintButton'

// Por enquanto, vamos usar apenas o PrintButton simples
// que funciona com window.print() até resolver o problema
// com o react-to-print em produção

interface PrintButtonSafeProps {
  ticket: any
  loading?: boolean
}

export function PrintButtonSafe(props: PrintButtonSafeProps) {
  // Usa o botão simples que sempre funciona
  return <PrintButton {...props} />
}