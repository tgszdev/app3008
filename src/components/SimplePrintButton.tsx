'use client'

import { FileDown } from 'lucide-react'

interface SimplePrintButtonProps {
  ticket: any
  loading?: boolean
}

export function SimplePrintButton({ ticket, loading }: SimplePrintButtonProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined' && ticket) {
      // Cria um iframe oculto para impressão
      const printFrame = document.createElement('iframe')
      printFrame.style.position = 'absolute'
      printFrame.style.top = '-10000px'
      printFrame.style.left = '-10000px'
      document.body.appendChild(printFrame)

      const printDocument = printFrame.contentDocument || printFrame.contentWindow?.document
      if (!printDocument) {
        document.body.removeChild(printFrame)
        window.print()
        return
      }

      // HTML para impressão
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ticket #${ticket.ticket_number || ticket.id}</title>
            <style>
              @page {
                size: A4;
                margin: 25mm;
              }
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              h1 { font-size: 24px; margin-bottom: 10px; }
              h2 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
              .info-item { margin-bottom: 10px; }
              .info-item strong { display: block; font-weight: bold; }
              .description { white-space: pre-wrap; margin-bottom: 20px; }
              .comment { border-left: 3px solid #ddd; padding-left: 15px; margin-bottom: 15px; }
              .comment-header { font-weight: bold; margin-bottom: 5px; }
              .comment-date { color: #666; font-size: 14px; }
              .internal-badge { background: #fffbeb; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>Ticket #${ticket.ticket_number || ticket.id}</h1>
            <p>Gerado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).replace(',', ' às')}</p>
            
            <h2>Informações do Ticket</h2>
            <div class="info-grid">
              <div class="info-item">
                <strong>Título:</strong>
                ${ticket.title || 'Sem título'}
              </div>
              <div class="info-item">
                <strong>Status:</strong>
                ${getStatusLabel(ticket.status)}
              </div>
              <div class="info-item">
                <strong>Prioridade:</strong>
                ${getPriorityLabel(ticket.priority)}
              </div>
              <div class="info-item">
                <strong>Criado em:</strong>
                ${new Date(ticket.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).replace(',', ' às')}
              </div>
            </div>
            
            <h2>Descrição</h2>
            <div class="description">
              ${ticket.description || 'Sem descrição'}
            </div>
            
            ${ticket.resolution_notes ? `
              <h2>Notas de Resolução</h2>
              <div class="description">
                ${ticket.resolution_notes}
              </div>
            ` : ''}
            
            ${ticket.comments && ticket.comments.length > 0 ? `
              <h2>Comentários</h2>
              ${ticket.comments.map((comment: any) => `
                <div class="comment">
                  <div class="comment-header">
                    ${comment.user?.name || 'Usuário'}
                    ${comment.is_internal ? '<span class="internal-badge">Interno</span>' : ''}
                  </div>
                  <div class="comment-date">
                    ${new Date(comment.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).replace(',', ' às')}
                  </div>
                  <div>${comment.content}</div>
                </div>
              `).join('')}
            ` : ''}
          </body>
        </html>
      `

      printDocument.open()
      printDocument.write(printContent)
      printDocument.close()

      // Aguarda o conteúdo carregar e imprime
      setTimeout(() => {
        printFrame.contentWindow?.focus()
        printFrame.contentWindow?.print()
        setTimeout(() => {
          document.body.removeChild(printFrame)
        }, 1000)
      }, 250)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Aberto',
      in_progress: 'Em Progresso',
      resolved: 'Resolvido',
      closed: 'Fechado',
      cancelled: 'Cancelado'
    }
    return labels[status] || status
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      critical: 'Crítica'
    }
    return labels[priority] || priority
  }

  return (
    <button
      onClick={handlePrint}
      disabled={loading || !ticket}
      className="min-w-[140px] h-10 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-2xl hover:bg-blue-700 hover:border-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium relative overflow-hidden whitespace-nowrap"
      title="Gerar PDF do Ticket"
    >
      <FileDown size={16} className="flex-shrink-0" />
      <span className="text-sm relative z-10">Gerar PDF</span>
      {/* Animação sutil */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
    </button>
  )
}