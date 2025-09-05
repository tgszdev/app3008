'use client'

import { FileDown } from 'lucide-react'
import { useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { TicketPDF } from './TicketPDF'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

// Importar ReactToPrint dinamicamente para evitar problemas de SSR
const ReactToPrint = dynamic(() => import('react-to-print'), {
  ssr: false,
})

interface PrintButtonProps {
  ticket: any
  loading?: boolean
}

export function PrintButton({ ticket, loading }: PrintButtonProps) {
  const componentRef = useRef<HTMLDivElement>(null)

  const handleBeforePrint = useCallback(() => {
    console.log('Preparando impressão...')
    return Promise.resolve()
  }, [])

  const handleAfterPrint = useCallback(() => {
    console.log('Impressão finalizada')
    return Promise.resolve()
  }, [])

  const handlePrintError = useCallback((errorLocation: string, error: Error) => {
    console.error('Erro na impressão:', errorLocation, error)
    toast.error('Erro ao gerar PDF')
  }, [])

  // Fallback para window.print se ReactToPrint não carregar
  const handlePrintFallback = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }, [])

  const pageStyle = `
    @page {
      size: A4;
      margin: 25mm;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .hidden-print {
        display: none !important;
      }
      
      .ticket-pdf-content {
        display: block !important;
        width: 100%;
        font-family: Arial, sans-serif;
      }
      
      h1, h2, h3 {
        page-break-after: avoid;
      }
      
      .no-break {
        page-break-inside: avoid;
      }
    }
  `

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

  // Se ReactToPrint não carregar, usar botão de fallback
  if (!ReactToPrint) {
    return (
      <>
        <button
          onClick={handlePrintFallback}
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
      </>
    )
  }

  return (
    <>
      <ReactToPrint
        trigger={() => (
          <button
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            title="Gerar PDF do Ticket"
          >
            <FileDown size={20} />
            <span className="hidden sm:inline">Gerar PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        )}
        content={() => componentRef.current}
        documentTitle={`Ticket_${ticket?.ticket_number || ''}_${format(new Date(), 'dd-MM-yyyy')}`}
        onBeforePrint={handleBeforePrint}
        onAfterPrint={handleAfterPrint}
        onPrintError={handlePrintError}
        pageStyle={pageStyle}
      />
      
      {/* Componente oculto para impressão */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <TicketPDF ref={componentRef} ticket={ticket} />
      </div>
    </>
  )
}