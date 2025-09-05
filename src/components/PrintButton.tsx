'use client'

import { FileDown } from 'lucide-react'
import { useRef } from 'react'
import { TicketPDF } from './TicketPDF'

interface PrintButtonProps {
  ticket: any
  loading?: boolean
}

export function PrintButton({ ticket, loading }: PrintButtonProps) {
  const componentRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  if (!ticket) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-50 text-sm sm:text-base"
        title="Aguarde o carregamento do ticket"
      >
        <FileDown size={20} />
        <span className="hidden sm:inline">Gerar PDF</span>
        <span className="sm:hidden">PDF</span>
      </button>
    )
  }

  return (
    <>
      <button
        onClick={handlePrint}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        title="Gerar PDF do Ticket"
      >
        <FileDown size={20} />
        <span className="hidden sm:inline">Gerar PDF</span>
        <span className="sm:hidden">PDF</span>
      </button>

      {/* Componente para impressão com @media print */}
      <div className="hidden print:block">
        <TicketPDF ref={componentRef} ticket={ticket} />
      </div>

      {/* Styles para impressão */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          @page {
            size: A4;
            margin: 25mm;
          }
        }
      `}</style>
    </>
  )
}