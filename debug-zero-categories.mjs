import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugZeroCategories() {
  console.log('🔍 INVESTIGANDO CATEGORIAS COM 0 TICKETS...\n')
  
  // Categorias que aparecem zeradas no dashboard
  const zeroCategoriesInDashboard = [
    'E-mail',
    'Inventario', 
    'Outros',
    'Relatorios',
    'Segurança',
    'Software',
    'Telefonia'
  ]
  
  console.log('📋 CATEGORIAS QUE APARECEM ZERADAS NO DASHBOARD:')
  console.log(zeroCategoriesInDashboard.join(', '))
  console.log('')
  
  // 1. Verificar se essas categorias têm tickets EM QUALQUER PERÍODO
  console.log('🔍 1. VERIFICANDO SE HÁ TICKETS NESSAS CATEGORIAS (TODOS OS TEMPOS):')
  
  for (const categoryName of zeroCategoriesInDashboard) {
    const { data: ticketsAllTime, error } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        status,
        created_at,
        categories!inner (
          id,
          name
        )
      `)
      .eq('categories.name', categoryName)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error(`❌ Erro ao buscar tickets para ${categoryName}:`, error)
      continue
    }

    if (ticketsAllTime && ticketsAllTime.length > 0) {
      console.log(`\n📁 ${categoryName}: ${ticketsAllTime.length} ticket(s) encontrado(s) (todos os tempos)`)
      ticketsAllTime.forEach((ticket, i) => {
        console.log(`  ${i+1}. #${ticket.ticket_number} - ${ticket.status} - ${ticket.created_at}`)
      })
    } else {
      console.log(`\n📁 ${categoryName}: ✅ REALMENTE VAZIA (nunca teve tickets)`)
    }
  }
  
  // 2. Verificar se essas categorias têm tickets NO PERÍODO ESPECÍFICO
  console.log('\n🔍 2. VERIFICANDO PERÍODO ESPECÍFICO (01/09/2025 - 30/09/2025):')
  
  for (const categoryName of zeroCategoriesInDashboard) {
    const { data: ticketsPeriod, error } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        status,
        created_at,
        categories!inner (
          id,
          name
        )
      `)
      .eq('categories.name', categoryName)
      .gte('created_at', '2025-09-01T00:00:00')
      .lte('created_at', '2025-09-30T23:59:59')

    if (error) {
      console.error(`❌ Erro ao buscar tickets para ${categoryName}:`, error)
      continue
    }

    if (ticketsPeriod && ticketsPeriod.length > 0) {
      console.log(`\n📁 ${categoryName}: ⚠️  ${ticketsPeriod.length} ticket(s) NO PERÍODO - DEVERIA APARECER!`)
      ticketsPeriod.forEach((ticket, i) => {
        console.log(`  ${i+1}. #${ticket.ticket_number} - ${ticket.status} - ${ticket.created_at}`)
      })
    } else {
      console.log(`📁 ${categoryName}: ✅ Sem tickets no período (correto estar zerado)`)
    }
  }
  
  // 3. Verificar se há tickets órfãos (sem categoria ou categoria inexistente)
  console.log('\n🔍 3. VERIFICANDO TICKETS ÓRFÃOS OU COM CATEGORIAS INEXISTENTES:')
  
  const { data: orphanTickets, error: orphanError } = await supabase
    .from('tickets')
    .select(`
      id,
      ticket_number,
      status,
      created_at,
      category_id,
      categories (
        id,
        name
      )
    `)
    .gte('created_at', '2025-09-01T00:00:00')
    .lte('created_at', '2025-09-30T23:59:59')
    .is('categories.id', null)
  
  if (orphanError) {
    console.error('❌ Erro ao buscar tickets órfãos:', orphanError)
  } else if (orphanTickets && orphanTickets.length > 0) {
    console.log(`⚠️  Encontrados ${orphanTickets.length} tickets órfãos:`)
    orphanTickets.forEach((ticket, i) => {
      console.log(`  ${i+1}. #${ticket.ticket_number} - category_id: ${ticket.category_id} - ${ticket.created_at}`)
    })
  } else {
    console.log('✅ Nenhum ticket órfão encontrado')
  }
  
  // 4. Verificar categorias que deveriam ter tickets mas não aparecem
  console.log('\n🔍 4. VERIFICANDO TODAS AS CATEGORIAS vs TICKETS NO PERÍODO:')
  
  const { data: allCategories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')
  
  const { data: allTicketsInPeriod } = await supabase
    .from('tickets')
    .select('category_id, categories(name)')
    .gte('created_at', '2025-09-01T00:00:00')
    .lte('created_at', '2025-09-30T23:59:59')
  
  console.log('\n📊 RESUMO POR CATEGORIA:')
  
  const categoryTicketCount = new Map()
  allTicketsInPeriod?.forEach(ticket => {
    const categoryName = ticket.categories?.name || 'SEM CATEGORIA'
    categoryTicketCount.set(categoryName, (categoryTicketCount.get(categoryName) || 0) + 1)
  })
  
  allCategories?.forEach(category => {
    const count = categoryTicketCount.get(category.name) || 0
    const status = count > 0 ? '✅ TEM TICKETS' : '📭 VAZIA'
    console.log(`${status} ${category.name}: ${count} tickets`)
  })
  
  // Verificar tickets sem categoria
  const uncategorizedCount = allTicketsInPeriod?.filter(t => !t.categories?.name).length || 0
  if (uncategorizedCount > 0) {
    console.log(`⚠️  SEM CATEGORIA: ${uncategorizedCount} tickets`)
  }
}

debugZeroCategories().catch(console.error)
