import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFixedAPI() {
  console.log('🧪 TESTANDO API CORRIGIDA...\n')
  
  // Simular exatamente a query da API corrigida
  console.log('📊 1. TESTANDO QUERY COM INNER JOIN:')
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select(`
      id,
      status,
      created_at,
      created_by,
      category_id,
      categories!inner (
        id,
        name,
        icon,
        color
      )
    `)
    .gte('created_at', '2025-09-01T00:00:00')
    .lte('created_at', '2025-09-30T23:59:59')

  if (ticketsError) {
    console.error('❌ Erro na query:', ticketsError)
    return
  }

  console.log(`✅ Query executada com sucesso: ${tickets?.length || 0} tickets encontrados`)
  
  if (tickets && tickets.length > 0) {
    console.log('\n📋 TICKETS COM CATEGORIAS (primeiros 5):')
    tickets.slice(0, 5).forEach((ticket, index) => {
      console.log(`${index + 1}. #${ticket.id} - ${ticket.status} - Categoria: "${ticket.categories.name}"`)
    })
  }

  // Simular a lógica de agrupamento
  console.log('\n🔄 2. SIMULANDO LÓGICA DE AGRUPAMENTO:')
  
  const categoryStats = new Map()
  
  tickets?.forEach((ticket) => {
    const category = ticket.categories
    const categoryId = category.id
    const categoryName = category.name

    if (!categoryStats.has(categoryId)) {
      categoryStats.set(categoryId, {
        id: categoryId,
        name: categoryName,
        icon: category.icon,
        color: category.color,
        count: 0,
        statusCounts: new Map()
      })
    }

    const stats = categoryStats.get(categoryId)
    stats.count++
    
    const ticketStatus = ticket.status
    const currentCount = stats.statusCounts.get(ticketStatus) || 0
    stats.statusCounts.set(ticketStatus, currentCount + 1)
  })

  console.log('\n📊 RESULTADO FINAL:')
  Array.from(categoryStats.values()).forEach(cat => {
    console.log(`\n📁 ${cat.name} (${cat.count} tickets):`)
    Array.from(cat.statusCounts.entries()).forEach(([status, count]) => {
      console.log(`  • ${status}: ${count}`)
    })
  })
  
  console.log(`\n✅ Total de categorias que aparecerão no dashboard: ${categoryStats.size}`)
  console.log('📭 Categorias zeradas: OCULTAS (não aparecem)')
}

testFixedAPI().catch(console.error)
