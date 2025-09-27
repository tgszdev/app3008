import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testCategoriesDirect() {
  console.log('🔍 Testando API categories-stats diretamente...')
  
  // 1. Verificar usuário
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, user_type, context_id')
    .eq('email', 'rodrigues2205@icloud.com')
    .single()
  
  if (userError) {
    console.error('❌ Erro ao buscar usuário:', userError)
    return
  }
  
  // 2. Verificar contextos associados
  const { data: userContexts, error: contextsError } = await supabase
    .from('user_contexts')
    .select('context_id')
    .eq('user_id', user.id)
  
  if (contextsError) {
    console.error('❌ Erro ao buscar contextos:', contextsError)
    return
  }
  
  const contextIds = userContexts?.map(uc => uc.context_id) || []
  console.log(`✅ Contextos: ${contextIds.length}`)
  
  // 3. Testar query exata da API categories-stats
  console.log('\n🔍 Testando query da API categories-stats...')
  
  // Query exata da API
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select(`
      id,
      status,
      created_at,
      context_id,
      categories (
        id,
        name,
        icon,
        color
      )
    `)
    .gte('created_at', '2025-09-01T00:00:00')
    .lte('created_at', '2025-09-30T23:59:59')
    .in('context_id', contextIds)
  
  if (ticketsError) {
    console.error('❌ Erro na query:', ticketsError)
  } else {
    console.log(`✅ Query retornou ${tickets?.length || 0} tickets`)
    
    // Verificar tickets encontrados
    tickets?.forEach(ticket => {
      console.log(`  - Ticket ${ticket.id}: status=${ticket.status}, context=${ticket.context_id}`)
    })
  }
  
  // 4. Testar status da tabela ticket_statuses
  console.log('\n🔍 Testando status da tabela ticket_statuses...')
  const { data: statuses, error: statusError } = await supabase
    .from('ticket_statuses')
    .select('id, name, slug, color, order_index')
    .order('order_index', { ascending: true })
  
  if (statusError) {
    console.error('❌ Erro ao buscar status:', statusError)
  } else {
    console.log(`✅ Status encontrados: ${statuses?.length || 0}`)
    statuses?.forEach(status => {
      console.log(`  - ${status.name} (${status.slug}) - ${status.color}`)
    })
  }
  
  // 5. Simular processamento da API
  console.log('\n🔍 Simulando processamento da API...')
  
  if (tickets && statuses) {
    console.log(`🔍 Processando ${tickets.length} tickets para status stats`)
    console.log(`🔍 Tickets encontrados:`, tickets.map(t => ({ id: t.id, status: t.status })))
    
    statuses.forEach(status => {
      const matchingTickets = tickets.filter(t => t.status === status.slug)
      const count = matchingTickets.length
      console.log(`📊 Status ${status.name} (${status.slug}): ${count} tickets`)
      if (matchingTickets.length > 0) {
        console.log(`  - Tickets correspondentes:`, matchingTickets.map(t => t.id))
      }
    })
  }
  
  // 6. Testar endpoint da API
  console.log('\n🔍 Testando endpoint da API...')
  try {
    const contextIdsString = contextIds.join(',')
    const response = await fetch(`https://www.ithostbr.tech/api/dashboard/categories-stats?start_date=2025-09-01&end_date=2025-09-30&context_ids=${contextIdsString}`)
    const data = await response.json()
    
    console.log(`Status: ${response.status}`)
    if (response.ok) {
      console.log('✅ API retornou dados:')
      console.log(`  - Total tickets: ${data.total_tickets}`)
      console.log(`  - Status summary detailed: ${data.status_summary_detailed?.length || 0}`)
      
      if (data.status_summary_detailed) {
        console.log('📊 Status summary detailed:')
        data.status_summary_detailed.forEach(status => {
          console.log(`  - ${status.name}: ${status.count} tickets`)
        })
      }
    } else {
      console.log('❌ API retornou erro:', data)
    }
  } catch (error) {
    console.error('❌ Erro ao chamar API:', error)
  }
}

testCategoriesDirect().catch(console.error)
