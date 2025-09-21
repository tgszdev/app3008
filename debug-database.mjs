import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugDatabase() {
  console.log('🔍 INVESTIGANDO INCONSISTÊNCIA NO DASHBOARD...\n')
  
  // 1. Verificar período de tickets
  console.log('📅 1. VERIFICANDO TICKETS NO PERÍODO 01/09/2025 - 30/09/2025:')
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select(`
      id,
      ticket_number,
      status,
      created_at,
      category_id,
      categories (
        id,
        name,
        icon,
        color
      )
    `)
    .gte('created_at', '2025-09-01T00:00:00')
    .lte('created_at', '2025-09-30T23:59:59')
    .order('created_at', { ascending: false })

  if (ticketsError) {
    console.error('❌ Erro ao buscar tickets:', ticketsError)
    return
  }

  console.log(`✅ Encontrados ${tickets?.length || 0} tickets no período`)
  
  if (tickets && tickets.length > 0) {
    console.log('\n📋 DETALHES DOS TICKETS:')
    tickets.forEach((ticket, index) => {
      console.log(`${index + 1}. #${ticket.ticket_number} - Status: "${ticket.status}" - Categoria: "${ticket.categories?.name || 'SEM CATEGORIA'}" - Data: ${ticket.created_at}`)
    })
  }

  // 2. Verificar status disponíveis
  console.log('\n🎯 2. VERIFICANDO STATUS DISPONÍVEIS:')
  const { data: statuses, error: statusError } = await supabase
    .from('ticket_statuses')
    .select('*')
    .order('order_index', { ascending: true })

  if (statusError) {
    console.error('❌ Erro ao buscar status:', statusError)
  } else {
    console.log(`✅ Encontrados ${statuses?.length || 0} status cadastrados:`)
    statuses?.forEach((status, index) => {
      console.log(`${index + 1}. "${status.slug}" - "${status.name}" - Cor: ${status.color} - Ordem: ${status.order_index}`)
    })
  }

  // 3. Verificar categorias
  console.log('\n📂 3. VERIFICANDO CATEGORIAS:')
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (categoriesError) {
    console.error('❌ Erro ao buscar categorias:', categoriesError)
  } else {
    console.log(`✅ Encontradas ${categories?.length || 0} categorias:`)
    categories?.forEach((category, index) => {
      console.log(`${index + 1}. "${category.name}" - ID: ${category.id} - Ícone: ${category.icon} - Cor: ${category.color}`)
    })
  }

  // 4. Análise de compatibilidade
  console.log('\n🔍 4. ANÁLISE DE COMPATIBILIDADE:')
  
  if (tickets && statuses) {
    const ticketStatuses = [...new Set(tickets.map(t => t.status))]
    const availableStatuses = statuses.map(s => s.slug)
    
    console.log('📊 Status dos tickets encontrados:', ticketStatuses)
    console.log('📋 Status cadastrados no sistema:', availableStatuses)
    
    const unmatchedTicketStatuses = ticketStatuses.filter(ts => !availableStatuses.includes(ts))
    const unmatchedSystemStatuses = availableStatuses.filter(as => !ticketStatuses.includes(as))
    
    if (unmatchedTicketStatuses.length > 0) {
      console.log('⚠️  STATUS NOS TICKETS QUE NÃO EXISTEM NO SISTEMA:', unmatchedTicketStatuses)
    }
    
    if (unmatchedSystemStatuses.length > 0) {
      console.log('ℹ️  Status no sistema sem tickets no período:', unmatchedSystemStatuses)
    }
    
    if (unmatchedTicketStatuses.length === 0) {
      console.log('✅ Todos os status dos tickets estão cadastrados no sistema')
    }
  }

  // 5. Teste direto da lógica da API
  console.log('\n🧪 5. SIMULANDO LÓGICA DA API:')
  
  if (categories && tickets && statuses) {
    const categoryStats = new Map()
    
    // Inicializar categorias
    categories.forEach(category => {
      categoryStats.set(category.id, {
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        count: 0,
        statusCounts: new Map()
      })
    })
    
    // Processar tickets
    tickets.forEach(ticket => {
      const categoryId = ticket.category_id || 'uncategorized'
      const stats = categoryStats.get(categoryId)
      
      if (stats) {
        stats.count++
        const currentCount = stats.statusCounts.get(ticket.status) || 0
        stats.statusCounts.set(ticket.status, currentCount + 1)
      } else {
        console.log(`⚠️  Ticket #${ticket.ticket_number} tem category_id "${categoryId}" que não existe nas categorias`)
      }
    })
    
    // Exibir resultado
    console.log('\n📊 RESULTADO DA SIMULAÇÃO:')
    Array.from(categoryStats.values()).forEach(cat => {
      console.log(`\n📁 ${cat.name} (${cat.count} tickets):`)
      if (cat.count > 0) {
        Array.from(cat.statusCounts.entries()).forEach(([status, count]) => {
          const statusInfo = statuses.find(s => s.slug === status)
          console.log(`  • ${statusInfo?.name || status}: ${count}`)
        })
      } else {
        console.log('  (Nenhum ticket no período)')
      }
    })
  }
}

debugDatabase().catch(console.error)
