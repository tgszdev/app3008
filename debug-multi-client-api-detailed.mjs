import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugMultiClientAPIDetailed() {
  console.log('🔍 Debugando API Multi-Client Analytics - Análise Detalhada...')
  
  // 1. Verificar tickets com contextos específicos
  console.log('\n1. Verificando tickets por contexto:')
  const contextos = [
    '85879bd8-d1d1-416b-ae55-e564687af28b', // Simas Log
    '6486088e-72ae-461b-8b03-32ca84918882', // Luft Agro
    'a7791594-c44d-47aa-8ddd-97ecfb6cc8ed', // Luft Solutions
    '18031594-558a-4f45-847c-b1d2b58087f0'  // Cargo Lift
  ]
  
  for (const contextId of contextos) {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, ticket_number, title, context_id, created_at, status')
      .eq('context_id', contextId)
    
    if (error) {
      console.error(`❌ Erro ao buscar tickets do contexto ${contextId}:`, error)
    } else {
      console.log(`✅ Contexto ${contextId}: ${tickets?.length || 0} tickets`)
      tickets?.forEach(ticket => {
        console.log(`  - #${ticket.ticket_number}: ${ticket.title}`)
      })
    }
  }
  
  // 2. Simular query exata da API multi-client-analytics
  console.log('\n2. Simulando query exata da API multi-client-analytics:')
  const contextIds = ['85879bd8-d1d1-416b-ae55-e564687af28b', '6486088e-72ae-461b-8b03-32ca84918882']
  
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
        categories!inner(
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
        console.log(`    Categoria: ${ticket.categories?.name || 'N/A'}`)
      })
    }
  }
  
  // 3. Verificar se o problema é o JOIN com categories
  console.log('\n3. Testando query sem JOIN com categories:')
  for (const contextId of contextIds) {
    console.log(`\nTestando contexto: ${contextId} (sem JOIN)`)
    
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
        category_id
      `)
      .eq('context_id', contextId)
      .gte('created_at', '2024-01-01T00:00:00.000Z')
      .lte('created_at', '2025-12-31T23:59:59.999Z')
    
    if (error) {
      console.error(`❌ Erro na query sem JOIN:`, error)
    } else {
      console.log(`✅ Query sem JOIN retornou ${tickets?.length || 0} tickets`)
      tickets?.forEach(ticket => {
        console.log(`  - #${ticket.ticket_number}: ${ticket.title} (category_id: ${ticket.category_id})`)
      })
    }
  }
  
  // 4. Verificar categorias
  console.log('\n4. Verificando categorias:')
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name, context_id, is_global')
    .limit(10)
  
  if (categoriesError) {
    console.error('❌ Erro ao buscar categorias:', categoriesError)
  } else {
    console.log(`✅ Encontradas ${categories?.length || 0} categorias`)
    categories?.forEach(category => {
      console.log(`  - ${category.name} (context: ${category.context_id}, global: ${category.is_global})`)
    })
  }
  
  // 5. Verificar se tickets têm category_id
  console.log('\n5. Verificando category_id dos tickets:')
  const { data: ticketsWithCategory, error: ticketsError } = await supabase
    .from('tickets')
    .select('id, ticket_number, title, category_id, context_id')
    .not('category_id', 'is', null)
  
  if (ticketsError) {
    console.error('❌ Erro ao buscar tickets com category_id:', ticketsError)
  } else {
    console.log(`✅ Encontrados ${ticketsWithCategory?.length || 0} tickets com category_id`)
    ticketsWithCategory?.forEach(ticket => {
      console.log(`  - #${ticket.ticket_number}: ${ticket.title} (category_id: ${ticket.category_id})`)
    })
  }
}

debugMultiClientAPIDetailed().catch(console.error)
