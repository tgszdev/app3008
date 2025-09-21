import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugPeriodo() {
  console.log('🔍 DEBUG: PROBLEMA COM PERÍODOS EXPANDIDOS\n')
  
  // Testar diferentes períodos
  const periodos = [
    {
      nome: 'Setembro 2025 (original)',
      inicio: '2025-09-01T00:00:00',
      fim: '2025-09-30T23:59:59'
    },
    {
      nome: 'Período expandido (atual)',
      inicio: '2025-02-01T00:00:00', 
      fim: '2025-09-30T23:59:59'
    },
    {
      nome: 'Todo 2025',
      inicio: '2025-01-01T00:00:00',
      fim: '2025-12-31T23:59:59'
    }
  ]
  
  for (const periodo of periodos) {
    console.log(`\n📅 TESTANDO: ${periodo.nome}`)
    console.log(`   De: ${periodo.inicio.split('T')[0]}`)
    console.log(`   Até: ${periodo.fim.split('T')[0]}`)
    
    // Buscar tickets do período
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        status,
        created_at,
        category_id,
        categories!inner (
          id,
          name,
          icon,
          color
        )
      `)
      .gte('created_at', periodo.inicio)
      .lte('created_at', periodo.fim)
    
    if (error) {
      console.error('❌ Erro:', error)
      continue
    }
    
    console.log(`   📊 Total de tickets: ${tickets?.length || 0}`)
    
    if (!tickets || tickets.length === 0) {
      console.log('   📭 Nenhum ticket encontrado')
      continue
    }
    
    // Agrupar por categoria
    const categorias = new Map()
    
    tickets.forEach(ticket => {
      const catName = ticket.categories.name
      const status = ticket.status
      
      if (!categorias.has(catName)) {
        categorias.set(catName, {
          total: 0,
          status: new Map()
        })
      }
      
      const cat = categorias.get(catName)
      cat.total++
      cat.status.set(status, (cat.status.get(status) || 0) + 1)
    })
    
    // Mostrar top 5 categorias
    console.log('   🏆 Top 5 categorias:')
    Array.from(categorias.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .forEach(([nome, dados], i) => {
        console.log(`   ${i+1}. ${nome}: ${dados.total} tickets`)
        
        // Mostrar breakdown de status
        const statusEntries = Array.from(dados.status.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3) // Top 3 status
        
        statusEntries.forEach(([status, count]) => {
          console.log(`      • ${status}: ${count}`)
        })
      })
    
    // Verificar casos específicos dos prints
    const melhoria = categorias.get('Melhoria')
    const seguranca = categorias.get('Segurança')
    const software = categorias.get('Software')
    
    if (melhoria) {
      console.log(`   🔍 Melhoria: ${melhoria.total} total`)
      console.log(`      - aberto: ${melhoria.status.get('aberto') || 0}`)
      console.log(`      - resolvido: ${melhoria.status.get('resolvido') || 0}`)
    }
    
    if (seguranca) {
      console.log(`   🔍 Segurança: ${seguranca.total} total`)
      console.log(`      - resolvido: ${seguranca.status.get('resolvido') || 0}`)
    }
    
    if (software) {
      console.log(`   🔍 Software: ${software.total} total`)
      console.log(`      - aberto: ${software.status.get('aberto') || 0}`)
      console.log(`      - em-progresso: ${software.status.get('em-progresso') || 0}`)
      console.log(`      - resolvido: ${software.status.get('resolvido') || 0}`)
    }
  }
  
  // Verificar se há tickets fora dos períodos esperados
  console.log('\n\n📊 DISTRIBUIÇÃO TEMPORAL DOS TICKETS:')
  
  const { data: allTicketsWithDates, error: dateError } = await supabase
    .from('tickets')
    .select('id, created_at, categories(name)')
    .order('created_at', { ascending: false })
    .limit(100)
  
  if (!dateError && allTicketsWithDates) {
    console.log('📅 Últimos 10 tickets criados:')
    allTicketsWithDates.slice(0, 10).forEach((ticket, i) => {
      const date = new Date(ticket.created_at).toLocaleDateString('pt-BR')
      console.log(`   ${i+1}. ${date} - ${ticket.categories?.name || 'SEM CATEGORIA'}`)
    })
    
    // Agrupar por mês/ano
    const porMes = new Map()
    allTicketsWithDates.forEach(ticket => {
      const date = new Date(ticket.created_at)
      const mesAno = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      porMes.set(mesAno, (porMes.get(mesAno) || 0) + 1)
    })
    
    console.log('\n📈 Tickets por mês (últimos 100):')
    Array.from(porMes.entries())
      .sort()
      .forEach(([mesAno, count]) => {
        console.log(`   ${mesAno}: ${count} tickets`)
      })
  }
  
  // Verificar se o problema é com status específicos no período expandido
  console.log('\n\n🔍 ANÁLISE DE STATUS NO PERÍODO EXPANDIDO:')
  
  const { data: ticketsPeriodoExpandido } = await supabase
    .from('tickets')
    .select('id, status, created_at, categories(name)')
    .gte('created_at', '2025-02-01T00:00:00')
    .lte('created_at', '2025-09-30T23:59:59')
  
  if (ticketsPeriodoExpandido) {
    const statusCount = new Map()
    
    ticketsPeriodoExpandido.forEach(ticket => {
      statusCount.set(ticket.status, (statusCount.get(ticket.status) || 0) + 1)
    })
    
    console.log('📊 Status no período expandido:')
    Array.from(statusCount.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        console.log(`   • ${status}: ${count} tickets`)
      })
  }
}

debugPeriodo().catch(console.error)
