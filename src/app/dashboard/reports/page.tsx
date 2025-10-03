'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import axios from 'axios'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Eye,
  FileSpreadsheet,
  Loader2,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  Printer,
  Send,
  Archive,
  RefreshCw,
  ChevronRight,
  FileDown,
  X,
  TicketIcon
} from 'lucide-react'

interface ReportConfig {
  type: 'tickets' | 'performance' | 'categories' | 'users' | 'summary'
  period: {
    start_date: string
    end_date: string
  }
  filters: {
    status?: string[]
    priority?: string[]
    category?: string[]
    user?: string[]
  }
  format: 'pdf' | 'excel' | 'preview'
  includeCharts: boolean
  includeDetails: boolean
}

interface ReportData {
  summary: {
    totalTickets: number
    openTickets: number
    resolvedTickets: number
    avgResolutionTime: string
    satisfactionRate: number
  }
  tickets: Array<{
    id: string
    ticket_number: string
    title: string
    status: string
    priority: string
    category: string
    created_at: string
    resolved_at?: string
    requester: string
    assignee?: string
  }>
  performance: {
    resolutionRate: number
    firstResponseTime: string
    reopenRate: number
    escalationRate: number
  }
  categoryStats: Array<{
    name: string
    count: number
    percentage: number
  }>
  userStats: Array<{
    name: string
    created: number
    resolved: number
    avgTime: string
  }>
}

const ReportTemplate = ({ 
  title, 
  description, 
  icon: Icon, 
  color,
  onClick 
}: {
  title: string
  description: string
  icon: any
  color: string
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all hover:border-blue-400 dark:hover:border-blue-600 text-left"
  >
    <div className="flex items-start space-x-4">
      <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
    </div>
  </button>
)

export default function ReportsPage() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  
  // Get current month dates as default
  const getCurrentMonthDates = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    return {
      start_date: firstDay.toISOString().split('T')[0],
      end_date: lastDay.toISOString().split('T')[0]
    }
  }

  const [config, setConfig] = useState<ReportConfig>({
    type: 'summary',
    period: getCurrentMonthDates(),
    filters: {},
    format: 'preview',
    includeCharts: true,
    includeDetails: true
  })

  const [savedReports, setSavedReports] = useState<Array<{
    id: string
    name: string
    type: string
    created_at: string
    size: string
  }>>([])

  useEffect(() => {
    fetchSavedReports()
  }, [])

  const fetchSavedReports = async () => {
    try {
      // Mock saved reports for demonstration
      setSavedReports([
        {
          id: '1',
          name: 'Relatório Mensal - Dezembro 2024',
          type: 'summary',
          created_at: '2024-12-31T23:59:59',
          size: '2.4 MB'
        },
        {
          id: '2',
          name: 'Análise de Performance - Q4 2024',
          type: 'performance',
          created_at: '2024-12-30T15:30:00',
          size: '1.8 MB'
        }
      ])
    } catch (error) {
    }
  }

  const generateReport = async () => {
    try {
      setGenerating(true)
      
      const response = await axios.post('/api/dashboard/reports/generate', config)
      setReportData(response.data)
      
      if (config.format === 'preview') {
        setShowPreview(true)
      } else if (config.format === 'pdf') {
        await exportToPDF(response.data)
      } else if (config.format === 'excel') {
        await exportToExcel(response.data)
      }
      
      toast.success('Relatório gerado com sucesso!')
    } catch (error) {
      toast.error('Erro ao gerar relatório')
    } finally {
      setGenerating(false)
    }
  }

  const exportToPDF = async (data: ReportData) => {
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    // Add header
    pdf.setFontSize(20)
    pdf.setTextColor(40, 40, 40)
    pdf.text('Relatório do Sistema de Tickets', 20, 20)
    
    pdf.setFontSize(12)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Período: ${formatDate(config.period.start_date)} - ${formatDate(config.period.end_date)}`, 20, 30)
    
    // Add summary section
    pdf.setFontSize(16)
    pdf.setTextColor(40, 40, 40)
    pdf.text('Resumo Executivo', 20, 45)
    
    pdf.setFontSize(11)
    pdf.setTextColor(60, 60, 60)
    let yPosition = 55
    
    pdf.text(`Total de Tickets: ${String(data.summary.totalTickets || 0)}`, 20, yPosition)
    yPosition += 8
    pdf.text(`Tickets Abertos: ${String(data.summary.openTickets || 0)}`, 20, yPosition)
    yPosition += 8
    pdf.text(`Tickets Resolvidos: ${String(data.summary.resolvedTickets || 0)}`, 20, yPosition)
    yPosition += 8
    pdf.text(`Tempo Médio de Resolução: ${String(data.summary.avgResolutionTime || '-')}`, 20, yPosition)
    yPosition += 8
    pdf.text(`Taxa de Satisfação: ${String(data.summary.satisfactionRate || 0)}%`, 20, yPosition)
    
    // Add performance metrics
    if (config.type === 'performance' || config.type === 'summary') {
      yPosition += 15
      pdf.setFontSize(16)
      pdf.setTextColor(40, 40, 40)
      pdf.text('Métricas de Performance', 20, yPosition)
      
      yPosition += 10
      pdf.setFontSize(11)
      pdf.setTextColor(60, 60, 60)
      pdf.text(`Taxa de Resolução: ${String(data.performance.resolutionRate || 0)}%`, 20, yPosition)
      yPosition += 8
      pdf.text(`Tempo de Primeira Resposta: ${String(data.performance.firstResponseTime || '-')}`, 20, yPosition)
      yPosition += 8
      pdf.text(`Taxa de Reabertura: ${String(data.performance.reopenRate || 0)}%`, 20, yPosition)
      yPosition += 8
      pdf.text(`Taxa de Escalonamento: ${String(data.performance.escalationRate || 0)}%`, 20, yPosition)
    }
    
    // Add category stats
    if (config.type === 'categories' || config.type === 'summary') {
      yPosition += 15
      pdf.setFontSize(16)
      pdf.setTextColor(40, 40, 40)
      pdf.text('Distribuição por Categoria', 20, yPosition)
      
      yPosition += 10
      pdf.setFontSize(11)
      pdf.setTextColor(60, 60, 60)
      data.categoryStats.slice(0, 5).forEach(cat => {
        pdf.text(`${String(cat.name || '-')}: ${String(cat.count || 0)} tickets (${String(cat.percentage || 0)}%)`, 20, yPosition)
        yPosition += 8
      })
    }
    
    // Add tickets details if requested
    if (config.includeDetails && data.tickets.length > 0) {
      pdf.addPage()
      pdf.setFontSize(16)
      pdf.setTextColor(40, 40, 40)
      pdf.text('Detalhes dos Tickets', 20, 20)
      
      yPosition = 35
      pdf.setFontSize(10)
      
      // Table headers
      pdf.setTextColor(255, 255, 255)
      pdf.setFillColor(59, 130, 246)
      pdf.rect(20, yPosition - 5, 170, 8, 'F')
      pdf.text('Número', 22, yPosition)
      pdf.text('Título', 45, yPosition)
      pdf.text('Status', 110, yPosition)
      pdf.text('Prioridade', 135, yPosition)
      pdf.text('Data', 160, yPosition)
      
      yPosition += 10
      pdf.setTextColor(60, 60, 60)
      
      data.tickets.slice(0, 20).forEach(ticket => {
        if (yPosition > 270) {
          pdf.addPage()
          yPosition = 20
        }
        
        pdf.text(String(ticket.ticket_number || '-'), 22, yPosition)
        pdf.text(String((ticket.title || '').substring(0, 30)), 45, yPosition)
        pdf.text(String(ticket.status || '-'), 110, yPosition)
        pdf.text(String(ticket.priority || '-'), 135, yPosition)
        pdf.text(String(formatDate(ticket.created_at)), 160, yPosition)
        yPosition += 8
      })
    }
    
    // Add footer
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(10)
      pdf.setTextColor(150, 150, 150)
      pdf.text(
        String(`Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`),
        105,
        285,
        { align: 'center' }
      )
    }
    
    // Save the PDF
    pdf.save(`relatorio_${config.type}_${new Date().getTime()}.pdf`)
  }

  const exportToExcel = async (data: ReportData) => {
    const wb = XLSX.utils.book_new()
    
    // Summary sheet
    const summaryData = [
      ['Resumo do Relatório'],
      [''],
      ['Métrica', 'Valor'],
      ['Total de Tickets', data.summary.totalTickets],
      ['Tickets Abertos', data.summary.openTickets],
      ['Tickets Resolvidos', data.summary.resolvedTickets],
      ['Tempo Médio de Resolução', data.summary.avgResolutionTime],
      ['Taxa de Satisfação', `${data.summary.satisfactionRate}%`]
    ]
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumo')
    
    // Tickets sheet
    if (data.tickets.length > 0) {
      const ticketsData = [
        ['Número', 'Título', 'Status', 'Prioridade', 'Categoria', 'Criado em', 'Resolvido em', 'Solicitante'],
        ...data.tickets.map(t => [
          t.ticket_number,
          t.title,
          t.status,
          t.priority,
          t.category,
          formatDate(t.created_at),
          t.resolved_at ? formatDate(t.resolved_at) : '',
          t.requester
        ])
      ]
      
      const ticketsSheet = XLSX.utils.aoa_to_sheet(ticketsData)
      XLSX.utils.book_append_sheet(wb, ticketsSheet, 'Tickets')
    }
    
    // Performance sheet
    const performanceData = [
      ['Métricas de Performance'],
      [''],
      ['Métrica', 'Valor'],
      ['Taxa de Resolução', `${data.performance.resolutionRate}%`],
      ['Tempo de Primeira Resposta', data.performance.firstResponseTime],
      ['Taxa de Reabertura', `${data.performance.reopenRate}%`],
      ['Taxa de Escalonamento', `${data.performance.escalationRate}%`]
    ]
    
    const performanceSheet = XLSX.utils.aoa_to_sheet(performanceData)
    XLSX.utils.book_append_sheet(wb, performanceSheet, 'Performance')
    
    // Categories sheet
    if (data.categoryStats.length > 0) {
      const categoriesData = [
        ['Categoria', 'Quantidade', 'Percentual'],
        ...data.categoryStats.map(c => [c.name, c.count, `${c.percentage}%`])
      ]
      
      const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesData)
      XLSX.utils.book_append_sheet(wb, categoriesSheet, 'Categorias')
    }
    
    // Users sheet
    if (data.userStats.length > 0) {
      const usersData = [
        ['Usuário', 'Tickets Criados', 'Tickets Resolvidos', 'Tempo Médio'],
        ...data.userStats.map(u => [u.name, u.created, u.resolved, u.avgTime])
      ]
      
      const usersSheet = XLSX.utils.aoa_to_sheet(usersData)
      XLSX.utils.book_append_sheet(wb, usersSheet, 'Usuários')
    }
    
    // Save the Excel file
    XLSX.writeFile(wb, `relatorio_${config.type}_${new Date().getTime()}.xlsx`)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  }

  const openReportConfig = (type: ReportConfig['type']) => {
    setConfig({ ...config, type })
    setShowConfig(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Central de Relatórios
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gere relatórios personalizados e exporte dados do sistema
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <button
            onClick={() => fetchSavedReports()}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ReportTemplate
          title="Relatório Geral"
          description="Visão completa do sistema com todas as métricas"
          icon={FileText}
          color="bg-blue-600"
          onClick={() => openReportConfig('summary')}
        />
        <ReportTemplate
          title="Relatório de Tickets"
          description="Detalhes completos de todos os tickets"
          icon={TicketIcon}
          color="bg-purple-600"
          onClick={() => openReportConfig('tickets')}
        />
        <ReportTemplate
          title="Relatório de Performance"
          description="Métricas de desempenho e KPIs"
          icon={TrendingUp}
          color="bg-green-600"
          onClick={() => openReportConfig('performance')}
        />
        <ReportTemplate
          title="Relatório por Categoria"
          description="Análise detalhada por categorias"
          icon={PieChart}
          color="bg-orange-600"
          onClick={() => openReportConfig('categories')}
        />
        <ReportTemplate
          title="Relatório de Usuários"
          description="Atividades e desempenho por usuário"
          icon={Users}
          color="bg-indigo-600"
          onClick={() => openReportConfig('users')}
        />
      </div>

      {/* Saved Reports */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Relatórios Recentes
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {savedReports.length > 0 ? (
            savedReports.map((report) => (
              <div key={report.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {report.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(report.created_at)} • {report.size}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
                      <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
                      <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <Archive className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Nenhum relatório salvo
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Configurar Relatório
                </h2>
                <button
                  onClick={() => setShowConfig(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Period Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Período
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={config.period.start_date}
                    onChange={(e) => setConfig({
                      ...config,
                      period: { ...config.period, start_date: e.target.value }
                    })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                  <input
                    type="date"
                    value={config.period.end_date}
                    onChange={(e) => setConfig({
                      ...config,
                      period: { ...config.period, end_date: e.target.value }
                    })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formato de Exportação
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setConfig({ ...config, format: 'preview' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      config.format === 'preview'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Eye className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-xs">Visualizar</span>
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, format: 'pdf' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      config.format === 'pdf'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <FileText className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-xs">PDF</span>
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, format: 'excel' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      config.format === 'excel'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <FileSpreadsheet className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-xs">Excel</span>
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={config.includeCharts}
                    onChange={(e) => setConfig({ ...config, includeCharts: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Incluir gráficos
                  </span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={config.includeDetails}
                    onChange={(e) => setConfig({ ...config, includeDetails: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Incluir detalhes dos tickets
                  </span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowConfig(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowConfig(false)
                  generateReport()
                }}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Gerando...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4" />
                    <span>Gerar Relatório</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && reportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Visualização do Relatório
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => exportToPDF(reportData)}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Exportar PDF"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => exportToExcel(reportData)}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Report Content Preview */}
              <div className="space-y-6">
                {/* Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Resumo Executivo
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {reportData.summary.totalTickets}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Total de Tickets
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {reportData.summary.openTickets}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Abertos
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {reportData.summary.resolvedTickets}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Resolvidos
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {reportData.summary.avgResolutionTime}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Tempo Médio
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {reportData.summary.satisfactionRate}%
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Satisfação
                      </p>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                {reportData.categoryStats.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Distribuição por Categoria
                    </h3>
                    <div className="space-y-2">
                      {reportData.categoryStats.slice(0, 5).map((cat, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {cat.name}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${cat.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                              {cat.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Tickets */}
                {config.includeDetails && reportData.tickets.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Tickets Recentes
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                          <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <th className="py-2">Número</th>
                            <th className="py-2">Título</th>
                            <th className="py-2">Status</th>
                            <th className="py-2">Prioridade</th>
                            <th className="py-2">Data</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {reportData.tickets.slice(0, 10).map((ticket) => (
                            <tr key={ticket.id}>
                              <td className="py-2 text-sm text-gray-900 dark:text-white">
                                {ticket.ticket_number}
                              </td>
                              <td className="py-2 text-sm text-gray-900 dark:text-white">
                                {ticket.title}
                              </td>
                              <td className="py-2">
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                  {ticket.status}
                                </span>
                              </td>
                              <td className="py-2">
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                                  {ticket.priority}
                                </span>
                              </td>
                              <td className="py-2 text-sm text-gray-600 dark:text-gray-400">
                                {formatDate(ticket.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}