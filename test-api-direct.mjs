import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAPIDirect() {
  console.log('🔍 Testando API diretamente...')
  
  // 1. Verificar tickets no banco
  console.log('\n1. Verificando tickets no banco:')
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('id, ticket_number, title, context_id, created_at, status')
    .limit(10)
  
  if (ticketsError) {
    console.error('❌ Erro ao buscar tickets:', ticketsError)
  } else {
    console.log(`✅ Encontrados ${tickets?.length || 0} tickets`)
    tickets?.forEach(ticket => {
      console.log(`  - #${ticket.ticket_number}: ${ticket.title} (context: ${ticket.context_id})`)
    })
  }
  
  // 2. Testar query exata da API
  console.log('\n2. Testando query exata da API:')
  const contextIds = ['18031594-558a-4f45-847c-b1d2b58087f0', '85879bd8-d1d1-416b-ae55-e564687af28b', '6486088e-72ae-461b-8b03-32ca84918882', 'a7791594-c44d-47aa-8ddd-97ecfb6cc8ed']
  
  for (const contextId of contextIds) {
    console.log(`\nTestando contexto: ${contextId}`)
    
    // Query exata da API
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
        resolved_at,
        created_by,
        assigned_to,
        category_id,
        categories(
          id,
          name,
          slug,
          color,
          icon,
          is_global,
          context_id
        )
      `)
      .eq('context_id', contextId)
      .gte('created_at', '2024-01-01T00:00:00.000Z')
      .lte('created_at', '2025-12-31T23:59:59.999Z')
    
    if (error) {
      console.error(`❌ Erro na query:`, error)
    } else {
      console.log(`✅ Query retornou ${tickets?.length || 0} tickets`)
      tickets?.forEach(ticket => {
        console.log(`  - #${ticket.ticket_number}: ${ticket.title}`)
        console.log(`    Status: ${ticket.status}`)
        console.log(`    Categoria: ${ticket.categories?.name || 'Sem categoria'}`)
      })
    }
  }
  
  // 3. Testar endpoint da API
  console.log('\n3. Testando endpoint da API:')
  try {
    const response = await fetch('https://www.ithostbr.tech/api/dashboard/multi-client-analytics?start_date=2024-01-01&end_date=2025-12-31&context_ids=18031594-558a-4f45-847c-b1d2b58087f0,85879bd8-d1d1-416b-ae55-e564687af28b,6486088e-72ae-461b-8b03-32ca84918882,a7791594-c44d-47aa-8ddd-97ecfb6cc8ed')
    const data = await response.json()
    
    console.log(`Status: ${response.status}`)
    if (response.ok) {
      console.log('✅ API retornou dados:', JSON.stringify(data, null, 2))
    } else {
      console.log('❌ API retornou erro:', data)
    }
  } catch (error) {
    console.error('❌ Erro ao chamar API:', error)
  }
}

testAPIDirect().catch(console.error)