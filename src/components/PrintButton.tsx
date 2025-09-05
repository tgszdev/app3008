'use client'

import { FileDown } from 'lucide-react'
import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { TicketPDF } from './TicketPDF'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface PrintButtonProps {
  ticket: any
  loading?: boolean
}

export function PrintButton({ ticket, loading }: PrintButtonProps) {
  const componentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Ticket_${ticket?.ticket_number || ''}_${format(new Date(), 'dd-MM-yyyy')}`,
    onBeforePrint: () => {
      console.log('Iniciando impressão...')
    },
    onAfterPrint: () => {
      console.log('Impressão concluída')
    },
    onPrintError: (errorLocation: string, error: any) => {
      console.error('Erro na impressão:', errorLocation, error)
      toast.error('Erro ao gerar PDF')
    },
    pageStyle: `
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
  })

  const handleClick = () => {
    if (!ticket) {
      toast.error('Aguarde o carregamento do ticket')
      return
    }
    
    console.log('Gerando PDF do ticket:', ticket.ticket_number)
    handlePrint()
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={!ticket || loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        title="Gerar PDF do Ticket"
      >
        <FileDown size={20} />
        <span className="hidden sm:inline">Gerar PDF</span>
        <span className="sm:hidden">PDF</span>
      </button>
      
      {/* Componente oculto para impressão */}
      {ticket && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <TicketPDF ref={componentRef} ticket={ticket} />
        </div>
      )}
    </>
  )
}