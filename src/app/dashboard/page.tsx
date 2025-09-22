'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  TicketIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  BarChart,
  Activity,
  XCircle,
  Loader2,
  Calendar,
  Filter,
  PieChart as PieChartIcon,
  Folder,
  Cpu,
  Wifi,
  Printer,
  Code,
  Mail,
  Shield,
  Phone,
  User,
  FileDown
} from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { getIcon } from '@/lib/icons'


interface Stats {
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  resolvedTickets: number
  cancelledTickets: number
  ticketsTrend: string
}

interface StatusInfo {
  slug: string
  name: string
  color: string
  count: number
  order_index: number
}

interface CategoryStat {
  id: string
  nome: string
  icon: string | null
  color: string | null
  quantidade: number
  percentual: number
  status_breakdown: Record<string, number>
  status_breakdown_detailed: StatusInfo[]
}

interface DashboardData {
  total_tickets: number
  periodo: { data_inicio: string; data_fim: string }
  categorias: CategoryStat[]
  status_summary: {
    open: number
    in_progress: number
    resolved: number
    cancelled: number
  }
  status_summary_detailed: StatusInfo[]
  available_status: StatusInfo[]
  average_resolution_time: string
}

interface RecentTicket {
  id: string
  ticket_number: string
  title: string
  status: string
  priority: string
  requester: string
  created_at: string
}

interface PeriodFilter {
  start_date: string
  end_date: string
}

const StatCard = ({ title, value, icon: Icon, trend, color, statusColor }: any) => {
  // Get status color with fallback logic
  const getCardColor = (statusColor: string, title: string) => {
    if (statusColor && statusColor !== '#6b7280') {
      return statusColor
    }
    
    // Fallback colors based on title
    if (title.includes('Total')) return '#2563eb' // blue
    if (title.includes('Aberto') || title.includes('Open')) return '#3b82f6' // blue
    if (title.includes('Progresso') || title.includes('Progress') || title.includes('Aguardando') || title.includes('Deploy')) return '#f59e0b' // amber
    if (title.includes('Resolvido') || title.includes('Resolved') || title.includes('Fechado') || title.includes('Closed')) return '#10b981' // emerald
    if (title.includes('Cancelado') || title.includes('Cancelled')) return '#ef4444' // red
    return '#6b7280' // gray
  }
  
  const cardColor = getCardColor(statusColor, title)
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow duration-200"
      style={{
        borderLeftColor: cardColor,
        borderLeftWidth: '3px'
      }}
    >
      <div className="text-center">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <p 
          className="text-xl font-bold"
          style={{ color: cardColor }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

const CategoryCard = ({ category }: { category: CategoryStat }) => {
  const Icon = getIcon(category.icon)
  const backgroundColor = category.color ? `${category.color}20` : '#E5E7EB'
  const borderColor = category.color || '#6B7280'
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-6"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center flex-1 min-w-0">
          <div 
            className="p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0"
            style={{ backgroundColor, color: borderColor }}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
              {category.nome}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
              {category.percentual}% do total
            </p>
          </div>
        </div>
        <div className="text-right ml-2 flex-shrink-0">
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {category.quantidade}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            tickets
          </p>
        </div>
      </div>
      
      {/* Status breakdown bar - Dynamic */}
      <div className="mt-3 sm:mt-4">
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
          {category.status_breakdown_detailed.map((status, index) => {
            if (status.count <= 0) return null
            
            return (
              <div 
                key={status.slug}
                className="transition-all duration-300" 
                style={{ 
                  width: `${(status.count / category.quantidade) * 100}%`,
                  backgroundColor: status.color
                }}
                title={`${status.name}: ${status.count}`}
              />
            )
          })}
        </div>
        
        {/* Status breakdown with improved presentation */}
        <div className="mt-3 space-y-1">
          {category.status_breakdown_detailed
            .filter(status => status.count > 0)
            .map((status) => (
              <div key={status.slug} className="flex items-center justify-between text-xs">
                <div className="flex items-center">
                  <div 
                    className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-gray-600 dark:text-gray-400 truncate">
                    {status.name}
                  </span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white ml-2">
                  {status.count}
                </span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  }
  
  const labels: Record<string, string> = {
    open: 'Aberto',
    in_progress: 'Em Progresso',
    resolved: 'Resolvido',
    closed: 'Fechado',
    cancelled: 'Cancelado',
  }
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || colors.open}`}>
      {labels[status] || status}
    </span>
  )
}

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  }
  
  const labels: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    critical: 'Crítica',
  }
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority] || colors.medium}`}>
      {labels[priority] || priority}
    </span>
  )
}

export default function DashboardPage() {
  const { session } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  
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
  
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(getCurrentMonthDates())
  const [tempFilter, setTempFilter] = useState<PeriodFilter>(getCurrentMonthDates())
  const [myTicketsOnly, setMyTicketsOnly] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  
  const [stats, setStats] = useState<Stats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    cancelledTickets: 0,
    ticketsTrend: '+0%'
  })
  
  const [categoryStats, setCategoryStats] = useState<DashboardData | null>(null)
  
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([])

  useEffect(() => {
    setMounted(true)
    fetchDashboardData()
    fetchCategoryStats()
  }, [])

  useEffect(() => {
    fetchDashboardData()
    fetchCategoryStats()
  }, [periodFilter, myTicketsOnly])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        start_date: periodFilter.start_date,
        end_date: periodFilter.end_date
      })
      
      // Add user filter if "Meus Tickets" is active
      if (myTicketsOnly && session?.user?.id) {
        params.append('user_id', session.user.id)
      }
      
      const response = await axios.get(`/api/dashboard/stats?${params}`)
      
      if (response.data) {
        setStats(response.data.stats)
        setRecentTickets(response.data.recentTickets)
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Erro ao carregar dados do dashboard')
      
      if (error.response?.status === 401) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCategoryStats = async () => {
    try {
      
      const params = new URLSearchParams({
        start_date: periodFilter.start_date,
        end_date: periodFilter.end_date
      })
      
      // Add user filter if "Meus Tickets" is active
      if (myTicketsOnly && session?.user?.id) {
        params.append('user_id', session.user.id)
      }
      
      const response = await axios.get(`/api/dashboard/categories-stats?${params}`)
      
      if (response.data) {
        setCategoryStats(response.data)
      }
    } catch (error: any) {
      console.error('Error fetching category stats:', error)
      toast.error('Erro ao carregar estatísticas por categoria')
    }
  }

  const handleApplyFilter = () => {
    setPeriodFilter(tempFilter)
    setShowFilters(false)
  }

  const handleResetFilter = () => {
    const defaultDates = getCurrentMonthDates()
    setTempFilter(defaultDates)
    setPeriodFilter(defaultDates)
    setShowFilters(false)
  }

  const handleTicketClick = (ticketId: string) => {
    router.push(`/dashboard/tickets/${ticketId}`)
  }

  const handleExportPDF = async () => {
    try {
      setIsGeneratingPDF(true)
      
      // Create a temporary container for PDF content
      // A4 dimensions: 210mm x 297mm = 794px x 1123px at 96 DPI
      const pdfContainer = document.createElement('div')
      pdfContainer.style.position = 'absolute'
      pdfContainer.style.left = '-9999px'
      pdfContainer.style.top = '0'
      pdfContainer.style.width = '210mm' // Use mm for accurate A4 width
      pdfContainer.style.maxWidth = '210mm'
      pdfContainer.style.backgroundColor = '#ffffff'
      pdfContainer.style.fontFamily = 'Arial, Helvetica, sans-serif'
      pdfContainer.style.fontSize = '12px' // Slightly smaller for better fit
      pdfContainer.style.lineHeight = '1.4'
      pdfContainer.style.boxSizing = 'border-box'
      document.body.appendChild(pdfContainer)
      
      // Build PDF content with better layout
      const now = new Date()
      const formattedDateTime = now.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(',', ' às')
      
      // Calculate dynamic space allocation first
      const statusCount = (categoryStats?.status_summary_detailed?.filter(s => s.count > 0) || []).length + 1 // +1 for Total card
      
      // Build PDF HTML with A4 dimensions and margins
      // A4: 210mm x 297mm
      // Margins: 10mm all sides (uniform padding)
      // Usable area: 190mm x 277mm (297mm - 20mm margins)
      let pdfHTML = `
        <div style="width: 210mm; background: white; font-family: Arial, sans-serif; box-sizing: border-box; margin: 0;">
          
          <!-- PAGE 1 -->
          <div style="page-break-after: always; padding: 10mm; min-height: 297mm; box-sizing: border-box; position: relative;">
            <div style="width: 190mm; min-height: 277mm; max-height: 257mm; position: relative; overflow: hidden;">
            
            <!-- Header (15mm) -->
            <div style="text-align: center; margin-bottom: 8mm; padding-bottom: 2mm; border-bottom: 2px solid #3b82f6;">
              <h1 style="margin: 0; font-size: 20px; color: #111827; font-weight: bold;">RELATÓRIO DE TICKETS</h1>
              <h2 style="margin: 3px 0 0 0; font-size: 16px; color: #3b82f6; font-weight: 600;">DASHBOARD</h2>
              <p style="margin: 5px 0 2px 0; font-size: 11px; color: #6b7280;">
                <strong>Período:</strong> ${formatDateShort(periodFilter.start_date)} até ${formatDateShort(periodFilter.end_date)}
              </p>
              ${myTicketsOnly ? `<p style="margin: 2px 0; font-size: 10px; color: #3b82f6; font-weight: 500;"><strong>Filtrado por:</strong> Tickets de ${session?.user?.name}</p>` : ''}
            </div>
            
            <!-- Summary Box (20mm) -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 10px; border-radius: 6px; margin-bottom: 8mm; box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);">
              <div style="text-align: center;">
                <div style="font-size: 36px; font-weight: bold; line-height: 1;">${categoryStats?.total_tickets || 0}</div>
                <div style="font-size: 12px; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">TOTAL DE TICKETS</div>
              </div>
            </div>
            
            <!-- Clean Status Cards - ALL status without abbreviations -->
            <div style="margin-bottom: 8mm;">
              <h2 style="font-size: 16px; color: #111827; margin-bottom: 8px; font-weight: 700; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px;">TICKETS POR STATUS</h2>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 6px; max-height: 40mm; overflow: hidden;">
                <!-- Total Card -->
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: ${statusCount > 6 ? '6px' : '8px'}; text-align: center;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 4px;">
                    <div style="width: 6px; height: 6px; border-radius: 50%; background: #2563eb;"></div>
                    <div style="font-size: ${statusCount > 6 ? '8px' : '9px'}; color: #6b7280; font-weight: 600;">Total no Período</div>
                  </div>
                  <div style="font-size: ${statusCount > 6 ? '16px' : '20px'}; font-weight: 800; color: #111827;">${categoryStats?.total_tickets || 0}</div>
                </div>
                
                <!-- Status Cards - Only show status with tickets (count > 0) -->
                ${categoryStats?.status_summary_detailed?.filter(status => status.count > 0).map(status => 
                  `<div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: ${statusCount > 6 ? '6px' : '8px'}; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 4px;">
                      <div style="width: 6px; height: 6px; border-radius: 50%; background: ${status.color};"></div>
                      <div style="font-size: ${statusCount > 6 ? '8px' : '9px'}; color: #6b7280; font-weight: 600;">${status.name}</div>
                    </div>
                    <div style="font-size: ${statusCount > 6 ? '16px' : '20px'}; font-weight: 800; color: #111827;">${status.count}</div>
                  </div>`
                ).join('') || ''}
              </div>
            </div>
          
            <!-- Categories Section (dynamic space allocation) -->
            <div>
              <h2 style="font-size: 16px; color: #111827; margin-bottom: 8px; font-weight: 700; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px;">TICKETS POR CATEGORIA</h2>
      `
      
      // Calculate dynamic space allocation
      const categories = categoryStats?.categorias || []
      
      // Calculate dynamic heights (A4 usable area: 257mm - with header and footer on all pages)
      const headerHeight = 15      // Header section (on all pages)
      const summaryHeight = 20     // Summary box (only page 1)
      const statusHeight = Math.min(40, Math.ceil(statusCount / 4) * 15 + 15) // Dynamic based on status count (only page 1)
      const footerHeight = 20      // Footer space (fixed at bottom, increased for visibility)
      const marginHeight = 20      // Various margins and gaps
      
      const availableHeight = 257 - headerHeight - summaryHeight - statusHeight - footerHeight - marginHeight
      const maxCategoryHeight = Math.floor(availableHeight / 2) // 2 rows of categories
      
      // Adjust category card height dynamically
      const categoryCardHeight = Math.min(60, maxCategoryHeight)
      
      // Calculate how many categories fit on page 1 based on available space
      const categoriesPerPage = Math.floor(availableHeight / (categoryCardHeight + 6)) * 2 // 2 columns
      const firstPageCategories = categories.slice(0, Math.min(categoriesPerPage, 4))
      const secondPageCategories = categories.slice(firstPageCategories.length)
      
      // Add first page categories (up to 4)
      for (let i = 0; i < firstPageCategories.length; i += 2) {
        const pair = []
        if (firstPageCategories[i]) pair.push(firstPageCategories[i])
        if (firstPageCategories[i + 1]) pair.push(firstPageCategories[i + 1])
        
        if (pair.length > 0) {
          pdfHTML += `
            <div style="display: flex; gap: 6px; margin-bottom: 6px;">
          `
        
        pair.forEach(category => {
          const bgColor = category.color ? `${category.color}10` : '#f9fafb'
          const borderColor = category.color || '#d1d5db'
        
            pdfHTML += `
              <div style="flex: 1; position: relative; overflow: hidden; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%), linear-gradient(135deg, ${category.color || '#6b7280'}15 0%, ${category.color || '#6b7280'}10 100%); border-left: 5px solid ${category.color || '#6b7280'}; padding: 8px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8); border: 1px solid ${category.color || '#6b7280'}40; position: relative; min-height: ${categoryCardHeight}mm; max-width: 91mm;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                  <h3 style="margin: 0; font-size: 14px; color: #111827; font-weight: 700; text-transform: uppercase; flex: 1; padding-right: 10px;">${category.nome}</h3>
                  <div style="text-align: right; flex-shrink: 0;">
                    <div style="font-size: 10px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 2px;">Total de Tickets</div>
                    <div style="font-size: 24px; font-weight: bold; color: ${category.color || '#6b7280'}; line-height: 1;">${category.quantidade}</div>
                  </div>
                </div>
                <div style="margin: 12px 0;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="font-size: 11px; color: #6b7280;">Percentual</span>
                    <span style="font-size: 16px; font-weight: bold; color: ${category.color || '#6b7280'};">${category.percentual.toFixed(1)}%</span>
                  </div>
                  <div style="background: #f3f4f6; border-radius: 4px; height: 12px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);">
                    <div style="background: linear-gradient(90deg, ${category.color || '#6b7280'}, ${category.color || '#6b7280'}dd); height: 100%; width: ${category.percentual}%; border-radius: 3px;"></div>
                  </div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%); border-radius: 8px; padding: 8px; margin-top: 12px; border: 1px solid ${category.color || '#6b7280'}40; backdrop-filter: blur(10px); box-shadow: 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9);">
                  <div style="font-size: 11px; color: #374151; font-weight: 700; margin-bottom: 8px; text-transform: uppercase;">Distribuição por Status:</div>
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-size: 11px;">
                    ${category.status_breakdown_detailed.filter(s => s.count > 0).map(status => 
                      `<div style="display: flex; align-items: center;"><span style="color: ${status.color}; font-size: 14px; margin-right: 4px;">●</span> <span style="font-weight: 600; color: #374151;">${status.name}:</span> <span style="font-weight: 700; color: #111827; margin-left: 4px;">${status.count}</span></div>`
                    ).join('')}
                  </div>
                </div>
              </div>
            `
          })
          
          // Add empty div for single card
          if (pair.length === 1) {
            pdfHTML += `<div style="flex: 1;"></div>`
          }
          
          pdfHTML += `
            </div>
          `
        }
      }
      
      // Close categories section and first page
      pdfHTML += `
            </div>
            <!-- Footer for page 1 (always present) -->
            <div style="position: absolute; bottom: 5mm; left: 0; text-align: center; border-top: 1px solid #3b82f6; padding-top: 2mm; width: 190mm;">
              <p style="margin: 1px 0; font-size: 9px; color: #374151; font-weight: 600;">RELATÓRIO GERADO EM: ${formattedDateTime.toUpperCase()}</p>
              <p style="margin: 1px 0; font-size: 8px; color: #6b7280;">Dashboard gerado automaticamente pelo sistema de suporte técnico</p>
              <p style="margin: 1px 0; font-size: 7px; color: #9ca3af;">© 2025 - Sistema de Gestão de Tickets</p>
              <p style="margin: 2px 0 0 0; font-size: 8px; color: #6b7280; text-align: right;">Página 1${secondPageCategories.length > 0 ? ' de 2' : ''}</p>
            </div>
            </div>
          </div> <!-- End of Page 1 -->
          
          ${secondPageCategories.length > 0 ? `
          <!-- PAGE 2 -->
          <div style="page-break-before: always; padding: 10mm; min-height: 297mm; box-sizing: border-box; position: relative;">
            <div style="width: 190mm; min-height: 277mm; max-height: 257mm; position: relative; overflow: hidden;">
            
            <!-- Header for Page 2 -->
            <div style="text-align: center; margin-bottom: 8mm; padding-bottom: 2mm; border-bottom: 2px solid #3b82f6;">
              <h1 style="margin: 0; font-size: 20px; color: #111827; font-weight: bold;">RELATÓRIO DE TICKETS</h1>
              <h2 style="margin: 3px 0 0 0; font-size: 16px; color: #3b82f6; font-weight: 600;">DASHBOARD</h2>
              <p style="margin: 5px 0 2px 0; font-size: 11px; color: #6b7280;">
                <strong>Período:</strong> ${formatDateShort(periodFilter.start_date)} até ${formatDateShort(periodFilter.end_date)}
              </p>
              ${myTicketsOnly ? `<p style="margin: 2px 0; font-size: 10px; color: #3b82f6; font-weight: 500;"><strong>Filtrado por:</strong> Tickets de ${session?.user?.name}</p>` : ''}
            </div>
            
            ${(() => {
              let page2HTML = ''
              for (let i = 0; i < secondPageCategories.length; i += 2) {
                const pair = []
                if (secondPageCategories[i]) pair.push(secondPageCategories[i])
                if (secondPageCategories[i + 1]) pair.push(secondPageCategories[i + 1])
                
                if (pair.length > 0) {
                  page2HTML += '<div style="display: flex; gap: 8px; margin-bottom: 8px;">'
                  
                  pair.forEach(category => {
                    page2HTML += `
                      <div style="flex: 1; position: relative; overflow: hidden; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%), linear-gradient(135deg, ${category.color || '#6b7280'}15 0%, ${category.color || '#6b7280'}10 100%); border-left: 5px solid ${category.color || '#6b7280'}; padding: 8px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8); border: 1px solid ${category.color || '#6b7280'}40; position: relative; min-height: ${categoryCardHeight}mm; max-width: 91mm;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                          <h3 style="margin: 0; font-size: 14px; color: #111827; font-weight: 700; text-transform: uppercase; flex: 1; padding-right: 10px;">${category.nome}</h3>
                          <div style="text-align: right; flex-shrink: 0;">
                            <div style="font-size: 10px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 2px;">Total de Tickets</div>
                            <div style="font-size: 24px; font-weight: bold; color: ${category.color || '#6b7280'}; line-height: 1;">${category.quantidade}</div>
                          </div>
                        </div>
                        <div style="margin: 12px 0;">
                          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <span style="font-size: 11px; color: #6b7280;">Percentual</span>
                            <span style="font-size: 16px; font-weight: bold; color: ${category.color || '#6b7280'};">${category.percentual.toFixed(1)}%</span>
                          </div>
                          <div style="background: #f3f4f6; border-radius: 4px; height: 12px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);">
                            <div style="background: linear-gradient(90deg, ${category.color || '#6b7280'}, ${category.color || '#6b7280'}dd); height: 100%; width: ${category.percentual}%; border-radius: 3px;"></div>
                          </div>
                        </div>
                        <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%); border-radius: 8px; padding: 8px; margin-top: 12px; border: 1px solid ${category.color || '#6b7280'}40; backdrop-filter: blur(10px); box-shadow: 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9);">
                          <div style="font-size: 11px; color: #374151; font-weight: 700; margin-bottom: 8px; text-transform: uppercase;">Distribuição por Status:</div>
                          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-size: 11px;">
                            ${category.status_breakdown_detailed.filter(s => s.count > 0).map(status => 
                              `<div style="display: flex; align-items: center;"><span style="color: ${status.color}; font-size: 14px; margin-right: 4px;">●</span> <span style="font-weight: 600; color: #374151;">${status.name}:</span> <span style="font-weight: 700; color: #111827; margin-left: 4px;">${status.count}</span></div>`
                            ).join('')}
                          </div>
                        </div>
                      </div>
                    `
                  })
                  
                  if (pair.length === 1) {
                    page2HTML += '<div style="flex: 1;"></div>'
                  }
                  
                  page2HTML += '</div>'
                }
              }
              return page2HTML
            })()}
            
            <!-- Footer for page 2 -->
            <div style="position: absolute; bottom: 5mm; left: 0; text-align: center; border-top: 1px solid #3b82f6; padding-top: 2mm; width: 190mm;">
              <p style="margin: 1px 0; font-size: 9px; color: #374151; font-weight: 600;">RELATÓRIO GERADO EM: ${formattedDateTime.toUpperCase()}</p>
              <p style="margin: 1px 0; font-size: 8px; color: #6b7280;">Dashboard gerado automaticamente pelo sistema de suporte técnico</p>
              <p style="margin: 1px 0; font-size: 7px; color: #9ca3af;">© 2025 - Sistema de Gestão de Tickets</p>
              <p style="margin: 2px 0 0 0; font-size: 8px; color: #6b7280; text-align: right;">Página 2 de 2</p>
            </div>
            </div>
          </div> <!-- End of Page 2 -->
          ` : ''}
        </div>
      `
      
      pdfContainer.innerHTML = pdfHTML
      
      // Wait for layout to stabilize
      await new Promise(resolve => setTimeout(resolve, 500))
      pdfContainer.offsetHeight // Force reflow
      
      // Generate canvas from the container
      const canvas = await html2canvas(pdfContainer, {
        scale: 2, // Good quality, faster rendering
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: pdfContainer.scrollHeight,
        windowWidth: 794,
        windowHeight: pdfContainer.scrollHeight
      })
      
      // Remove temporary container
      document.body.removeChild(pdfContainer)
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      })
      
      // Calculate dimensions - A4: 210mm x 297mm
      const pdfWidth = 210 // A4 width in mm
      const pdfHeight = 297 // A4 height in mm
      const margin = 0 // No additional margins, already in HTML
      const contentWidth = pdfWidth
      const contentHeight = pdfHeight
      
      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png', 1.0)
      const imgWidth = contentWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      // Calculate pages needed
      const totalPages = Math.ceil(imgHeight / contentHeight)
      
      // Add pages
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage()
        }
        
        const yPosition = -(page * contentHeight)
        pdf.addImage(imgData, 'PNG', 0, yPosition, contentWidth, imgHeight, undefined, 'FAST')
      }
      
      // Generate filename with date
      const today = new Date().toISOString().split('T')[0]
      const filename = `relatorio_tickets_${today}${myTicketsOnly ? '_meus_tickets' : ''}.pdf`
      
      // Save PDF
      pdf.save(filename)
      
      toast.success('PDF exportado com sucesso!')
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Erro ao gerar PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const toggleMyTickets = () => {
    setMyTicketsOnly(!myTicketsOnly)
  }

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div id="dashboard-content" className="space-y-4 sm:space-y-6">
      {/* Header with Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard {myTicketsOnly && '- Meus Tickets'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Bem-vindo de volta, {session?.user?.name}! 
            {myTicketsOnly 
              ? 'Visualizando apenas seus tickets.'
              : 'Aqui está um resumo do sistema.'
            }
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* My Tickets Button */}
          <button
            onClick={toggleMyTickets}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border rounded-lg transition-colors ${
              myTicketsOnly 
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">Meus Tickets</span>
          </button>
          
          {/* Date Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate">
              {periodFilter.start_date === getCurrentMonthDates().start_date && 
               periodFilter.end_date === getCurrentMonthDates().end_date
                ? 'Mês Atual'
                : `${formatDateShort(periodFilter.start_date)} - ${formatDateShort(periodFilter.end_date)}`
              }
            </span>
            <Filter className="h-4 w-4 flex-shrink-0" />
          </button>
          
          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={isGeneratingPDF}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="text-xs sm:text-sm">
              {isGeneratingPDF ? 'Gerando...' : 'Exportar PDF'}
            </span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Filtrar por Período
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={tempFilter.start_date}
                onChange={(e) => setTempFilter({ ...tempFilter, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={tempFilter.end_date}
                onChange={(e) => setTempFilter({ ...tempFilter, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button
              onClick={handleApplyFilter}
              className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium"
            >
              Aplicar Filtro
            </button>
            <button
              onClick={handleResetFilter}
              className="flex-1 sm:flex-initial px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-800 transition-colors text-sm font-medium"
            >
              Limpar Filtro
            </button>
          </div>
        </div>
      )}

      {/* Period Info - Responsive */}
      {categoryStats && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
            <span className="font-medium block sm:inline">Período analisado:</span>
            <span className="block sm:inline sm:ml-1">
              {formatDateShort(categoryStats.periodo.data_inicio)} até {formatDateShort(categoryStats.periodo.data_fim)}
            </span>
            <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
              • <strong>{categoryStats.total_tickets}</strong> {myTicketsOnly ? 'seus tickets' : 'tickets'} no período
            </span>
            {myTicketsOnly && (
              <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
                • <span className="font-medium">Filtrado por: Meus Tickets</span>
              </span>
            )}
          </p>
        </div>
      )}

      {/* Status Stats Grid - Dynamic & Complete */}
      {categoryStats && categoryStats.status_summary_detailed && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
          <StatCard
            title="Total no Período"
            value={categoryStats.total_tickets}
            icon={TicketIcon}
            color="bg-blue-600"
            statusColor="#2563eb"
          />
          {/* Dynamic Status Cards - Only show status with tickets (count > 0) */}
          {categoryStats.status_summary_detailed
            .filter(status => status.count > 0)
            .map((status) => {
              // Map status slugs to appropriate icons
              const getStatusIcon = (slug: string) => {
                if (slug.includes('aberto') || slug.includes('open')) return AlertCircle
                if (slug.includes('progresso') || slug.includes('progress') || slug.includes('aguardando') || slug.includes('deploy')) return Clock
                if (slug.includes('resolvido') || slug.includes('resolved') || slug.includes('fechado') || slug.includes('closed')) return CheckCircle
                if (slug.includes('cancelled') || slug.includes('cancelado')) return XCircle
                return TicketIcon
              }
              
              const Icon = getStatusIcon(status.slug)
              
              return (
                <StatCard
                  key={status.slug}
                  title={status.name}
                  value={status.count}
                  icon={Icon}
                  statusColor={status.color}
                />
              )
            })}
        </div>
      )}



      {/* Category Stats Grid - MOVED AFTER STATUS STATS */}
      {categoryStats && categoryStats.categorias.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Tickets por Categoria
          </h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categoryStats.categorias.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Tickets (not affected by filter) */}
      <div id="recent-tickets-section" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            {myTicketsOnly ? 'Meus Chamados Recentes' : 'Chamados Recentes'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Últimos {myTicketsOnly ? 'seus' : ''} tickets criados {myTicketsOnly ? '' : '(não afetado pelo filtro de período)'}
          </p>
        </div>
        
        {recentTickets.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Prioridade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Solicitante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentTickets.map((ticket) => (
                    <tr 
                      key={ticket.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                      onClick={() => handleTicketClick(ticket.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        #{ticket.ticket_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div className="truncate max-w-xs" title={ticket.title}>
                          {ticket.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {ticket.requester}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDateShort(ticket.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                  onClick={() => handleTicketClick(ticket.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      #{ticket.ticket_number}
                    </span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {ticket.title.toUpperCase()}
                  </h3>
                  <div className="flex justify-between items-center">
                    <PriorityBadge priority={ticket.priority} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateShort(ticket.created_at)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    Solicitante: {ticket.requester}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum chamado encontrado
            </p>
          </div>
        )}
      </div>

      {/* View All Button */}
      {recentTickets.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => router.push('/dashboard/tickets')}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Ver todos os chamados →
          </button>
        </div>
      )}
    </div>
  )
}

function formatDateShort(date: string | null | undefined) {
  // Handle invalid dates
  if (!date) {
    return 'N/A'
  }
  
  // Check if it's a date in YYYY-MM-DD format (without time)
  if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
  }
  
  // Try to parse as ISO date with time (handles timestamps like "2024-01-15T10:30:00.000Z")
  const dateObj = new Date(date)
  if (!isNaN(dateObj.getTime())) {
    // Use toLocaleDateString com timezone do Brasil
    return dateObj.toLocaleDateString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
  
  // If not a valid date object, try parsing as YYYY-MM-DD manually
  const parts = date.split('-')
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number)
    // Fixed: Changed OR (||) to AND (&&) for proper validation
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
    }
  }
  
  return 'N/A'
}