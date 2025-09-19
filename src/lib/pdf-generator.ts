import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatHoursToHHMM } from './format-hours'
import { formatBrazilDateTime, formatBrazilDate } from './date-utils'

// Adicionar tipo para o autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface ExportOptions {
  title: string
  subtitle?: string
  filename: string
  headers: string[]
  data: any[][]
  orientation?: 'portrait' | 'landscape'
  pageSize?: 'a4' | 'letter'
}

export const generatePDF = ({
  title,
  subtitle,
  filename,
  headers,
  data,
  orientation = 'landscape',
  pageSize = 'a4'
}: ExportOptions) => {
  try {
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize
    })

    // Configurar fonte
    pdf.setFont('helvetica')
    
    // Adicionar título
    pdf.setFontSize(20)
    pdf.text(title, pdf.internal.pageSize.width / 2, 15, { align: 'center' })
    
    // Adicionar subtítulo se houver
    if (subtitle) {
      pdf.setFontSize(12)
      pdf.setTextColor(100)
      pdf.text(subtitle, pdf.internal.pageSize.width / 2, 23, { align: 'center' })
    }
    
    // Adicionar data de geração
    pdf.setFontSize(10)
    pdf.setTextColor(128)
    const dateText = `Gerado em: ${formatBrazilDateTime(new Date())}`
    pdf.text(dateText, pdf.internal.pageSize.width / 2, subtitle ? 30 : 23, { align: 'center' })
    
    // Garantir que todos os dados sejam strings
    const sanitizedData = data.map(row => 
      row.map(cell => String(cell ?? '-'))
    )
    
    // Adicionar tabela
    pdf.autoTable({
      head: [headers],
      body: sanitizedData,
      startY: subtitle ? 35 : 28,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'left'
      },
      headStyles: {
        fillColor: [59, 130, 246], // Azul
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 'auto' }
      },
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      didDrawPage: (data: any) => {
        // Adicionar rodapé com número da página
        const pageCount = pdf.internal.pages.length - 1
        pdf.setFontSize(8)
        pdf.setTextColor(128)
        const pageText = `Página ${data.pageNumber} de ${pageCount}`
        pdf.text(
          pageText,
          pdf.internal.pageSize.width / 2,
          pdf.internal.pageSize.height - 10,
          { align: 'center' }
        )
      }
    })
    
    // Salvar o PDF
    pdf.save(filename)
    return true
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    return false
  }
}

// Função específica para exportar apontamentos
export const exportTimesheetsPDF = (timesheets: any[], title: string = 'Relatório de Apontamentos') => {
  const headers = [
    'Data',
    'Colaborador',
    'Ticket',
    'Horas',
    'Status',
    'Descrição'
  ]
  
  const data = timesheets.map(ts => [
    formatBrazilDate(ts.work_date),
    String(ts.user?.name || '-'),
    `#${ts.ticket?.ticket_number || '-'}`,
    String(ts.hours_worked ? formatHoursToHHMM(ts.hours_worked) : '-'),
    String(ts.status === 'approved' ? 'Aprovado' : 
    ts.status === 'rejected' ? 'Rejeitado' : 'Pendente'),
    String(ts.description?.substring(0, 50) + (ts.description?.length > 50 ? '...' : '') || '-')
  ])
  
  return generatePDF({
    title,
    subtitle: `Total de registros: ${timesheets.length}`,
    filename: `apontamentos_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`,
    headers,
    data,
    orientation: 'landscape'
  })
}

// Função para exportar permissões
export const exportPermissionsPDF = (users: any[], title: string = 'Relatório de Permissões') => {
  const headers = [
    'Usuário',
    'Email',
    'Cargo',
    'Departamento',
    'Permissões'
  ]
  
  const data = users.map(user => [
    String(user.name || '-'),
    String(user.email || '-'),
    String(user.role_name || user.role || '-'),
    String(user.department || '-'),
    String(user.permissions ? Object.keys(user.permissions).filter(k => user.permissions[k]).join(', ') : 'Nenhuma')
  ])
  
  return generatePDF({
    title,
    subtitle: `Total de usuários: ${users.length}`,
    filename: `permissoes_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`,
    headers,
    data,
    orientation: 'portrait'
  })
}

// Função para exportar analytics
export const exportAnalyticsPDF = (analytics: any[], title: string = 'Relatório de Analytics') => {
  const headers = [
    'Colaborador',
    'Total de Horas',
    'Horas Aprovadas',
    'Horas Pendentes',
    'Horas Rejeitadas',
    'Taxa de Aprovação'
  ]
  
  const data = analytics.map(item => [
    String(item.user_name || '-'),
    String(item.total_hours ? formatHoursToHHMM(item.total_hours) : '-'),
    String(item.approved_hours ? formatHoursToHHMM(item.approved_hours) : '-'),
    String(item.pending_hours ? formatHoursToHHMM(item.pending_hours) : '-'),
    String(item.rejected_hours ? formatHoursToHHMM(item.rejected_hours) : '-'),
    String(item.approval_rate ? `${item.approval_rate.toFixed(1)}%` : '-')
  ])
  
  return generatePDF({
    title,
    subtitle: `Total de colaboradores: ${analytics.length}`,
    filename: `analytics_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`,
    headers,
    data,
    orientation: 'landscape'
  })
}