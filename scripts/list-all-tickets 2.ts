import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listAllTickets() {
  console.log('🔍 Listando todos os tickets do banco de dados...\n')
  
  // Buscar todos os tickets com informações de categoria
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select(`
      id,
      ticket_number,
      title,
      status,
      priority,
      created_at,
      updated_at,
      categories (
        name,
        icon,
        color
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Erro ao buscar tickets:', error)
    return
  }
  
  console.log(`📊 Total de tickets encontrados: ${tickets.length}\n`)
  
  // Agrupar tickets por mês/ano
  const ticketsByMonth: Record<string, any[]> = {}
  
  tickets.forEach(ticket => {
    const date = new Date(ticket.created_at)
    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`
    
    if (!ticketsByMonth[monthYear]) {
      ticketsByMonth[monthYear] = []
    }
    
    ticketsByMonth[monthYear].push({
      ...ticket,
      dateObj: date
    })
  })
  
  // Exibir tickets agrupados por mês
  console.log('=== TICKETS AGRUPADOS POR MÊS ===\n')
  
  Object.keys(ticketsByMonth)
    .sort((a, b) => {
      const [monthA, yearA] = a.split('/').map(Number)
      const [monthB, yearB] = b.split('/').map(Number)
      if (yearA !== yearB) return yearB - yearA
      return monthB - monthA
    })
    .forEach(monthYear => {
      const monthTickets = ticketsByMonth[monthYear]
      const [month, year] = monthYear.split('/')
      const monthName = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      
      console.log(`📅 ${monthName.toUpperCase()} (${monthTickets.length} tickets)`)
      console.log('─'.repeat(50))
      
      // Contar por categoria neste mês
      const categoryCount: Record<string, number> = {}
      const statusCount: Record<string, number> = {}
      
      monthTickets.forEach(ticket => {
        const categoryName = ticket.categories?.name || 'Sem Categoria'
        categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1
        statusCount[ticket.status] = (statusCount[ticket.status] || 0) + 1
      })
      
      console.log('Por Categoria:')
      Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
          const percentage = ((count / monthTickets.length) * 100).toFixed(1)
          console.log(`  • ${cat}: ${count} (${percentage}%)`)
        })
      
      console.log('\nPor Status:')
      Object.entries(statusCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
          const percentage = ((count / monthTickets.length) * 100).toFixed(1)
          const statusLabel = {
            'open': 'Aberto',
            'in_progress': 'Em Progresso',
            'resolved': 'Resolvido',
            'cancelled': 'Cancelado'
          }[status] || status
          console.log(`  • ${statusLabel}: ${count} (${percentage}%)`)
        })
      
      console.log('\nPrimeiros 5 tickets do mês:')
      monthTickets.slice(0, 5).forEach(ticket => {
        const date = ticket.dateObj.toLocaleDateString('pt-BR')
        const time = ticket.dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        console.log(`  📋 #${ticket.ticket_number} - ${date} ${time}`)
        console.log(`     "${ticket.title}"`)
        console.log(`     Categoria: ${ticket.categories?.name || 'N/A'} | Status: ${ticket.status} | Prioridade: ${ticket.priority}`)
      })
      
      console.log('\n')
    })
  
  // Estatísticas gerais
  console.log('=== ESTATÍSTICAS GERAIS ===\n')
  
  const now = new Date()
  const ticketsByPeriod = {
    hoje: 0,
    ultimos7Dias: 0,
    ultimos30Dias: 0,
    ultimos90Dias: 0
  }
  
  tickets.forEach(ticket => {
    const ticketDate = new Date(ticket.created_at)
    const diffTime = now.getTime() - ticketDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) ticketsByPeriod.hoje++
    if (diffDays <= 7) ticketsByPeriod.ultimos7Dias++
    if (diffDays <= 30) ticketsByPeriod.ultimos30Dias++
    if (diffDays <= 90) ticketsByPeriod.ultimos90Dias++
  })
  
  console.log(`Tickets criados hoje: ${ticketsByPeriod.hoje}`)
  console.log(`Tickets nos últimos 7 dias: ${ticketsByPeriod.ultimos7Dias}`)
  console.log(`Tickets nos últimos 30 dias: ${ticketsByPeriod.ultimos30Dias}`)
  console.log(`Tickets nos últimos 90 dias: ${ticketsByPeriod.ultimos90Dias}`)
  
  // Datas extremas
  console.log('\n=== INTERVALO DE DATAS ===\n')
  if (tickets.length > 0) {
    const sortedByDate = [...tickets].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    
    const oldestTicket = sortedByDate[0]
    const newestTicket = sortedByDate[sortedByDate.length - 1]
    
    console.log(`Ticket mais antigo: ${new Date(oldestTicket.created_at).toLocaleString('pt-BR')}`)
    console.log(`  #${oldestTicket.ticket_number} - "${oldestTicket.title}"`)
    
    console.log(`\nTicket mais recente: ${new Date(newestTicket.created_at).toLocaleString('pt-BR')}`)
    console.log(`  #${newestTicket.ticket_number} - "${newestTicket.title}"`)
  }
  
  // Listar todos os períodos únicos (mês/ano)
  console.log('\n=== PERÍODOS DISPONÍVEIS PARA FILTRO ===\n')
  const uniquePeriods = new Set<string>()
  
  tickets.forEach(ticket => {
    const date = new Date(ticket.created_at)
    const period = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
    uniquePeriods.add(period)
  })
  
  Array.from(uniquePeriods)
    .sort()
    .forEach(period => {
      const [month, year] = period.split('/')
      const monthName = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      const count = tickets.filter(t => {
        const d = new Date(t.created_at)
        return d.getMonth() + 1 === Number(month) && d.getFullYear() === Number(year)
      }).length
      console.log(`• ${monthName}: ${count} tickets`)
    })
}

listAllTickets()
  .then(() => {
    console.log('\n✅ Análise concluída!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error)
    process.exit(1)
  })