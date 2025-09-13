import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
    const dateText = `Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`
    pdf.text(dateText, pdf.internal.pageSize.width / 2, subtitle ? 30 : 23, { align: 'center' })
    
    // Adicionar tabela
    pdf.autoTable({
      head: [headers],
      body: data,
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
    format(new Date(ts.work_date), 'dd/MM/yyyy'),
    ts.user?.name || '-',
    `#${ts.ticket?.ticket_number || '-'}`,
    `${ts.hours_worked}h`,
    ts.status === 'approved' ? 'Aprovado' : 
    ts.status === 'rejected' ? 'Rejeitado' : 'Pendente',
    ts.description?.substring(0, 50) + (ts.description?.length > 50 ? '...' : '') || '-'
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
    user.name || '-',
    user.email || '-',
    user.role_name || user.role || '-',
    user.department || '-',
    user.permissions ? Object.keys(user.permissions).filter(k => user.permissions[k]).join(', ') : 'Nenhuma'
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