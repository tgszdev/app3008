import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugMultiClientAPI() {
  console.log('🔍 Debugando API Multi-Client Analytics...')
  
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
  
  // 2. Verificar contextos
  console.log('\n2. Verificando contextos:')
  const { data: contexts, error: contextsError } = await supabase
    .from('contexts')
    .select('id, name, type, slug')
    .limit(10)
  
  if (contextsError) {
    console.error('❌ Erro ao buscar contextos:', contextsError)
  } else {
    console.log(`✅ Encontrados ${contexts?.length || 0} contextos`)
    contexts?.forEach(context => {
      console.log(`  - ${context.name} (${context.type}): ${context.id}`)
    })
  }
  
  // 3. Verificar usuários
  console.log('\n3. Verificando usuários:')
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, user_type, context_id')
    .limit(5)
  
  if (usersError) {
    console.error('❌ Erro ao buscar usuários:', usersError)
  } else {
    console.log(`✅ Encontrados ${users?.length || 0} usuários`)
    users?.forEach(user => {
      console.log(`  - ${user.email} (${user.user_type}): ${user.context_id}`)
    })
  }
  
  // 4. Simular query da API multi-client-analytics
  console.log('\n4. Simulando query da API multi-client-analytics:')
  if (contexts && contexts.length > 0) {
    const contextId = contexts[0].id
    console.log(`Testando com contexto: ${contextId}`)
    
    const { data: testTickets, error: testError } = await supabase
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
    
    if (testError) {
      console.error('❌ Erro na query de teste:', testError)
    } else {
      console.log(`✅ Query de teste retornou ${testTickets?.length || 0} tickets`)
      testTickets?.forEach(ticket => {
        console.log(`  - #${ticket.ticket_number}: ${ticket.title}`)
      })
    }
  }
  
  // 5. Verificar user_contexts
  console.log('\n5. Verificando user_contexts:')
  const { data: userContexts, error: userContextsError } = await supabase
    .from('user_contexts')
    .select('user_id, context_id')
    .limit(10)
  
  if (userContextsError) {
    console.error('❌ Erro ao buscar user_contexts:', userContextsError)
  } else {
    console.log(`✅ Encontrados ${userContexts?.length || 0} associações user_contexts`)
    userContexts?.forEach(uc => {
      console.log(`  - User: ${uc.user_id} -> Context: ${uc.context_id}`)
    })
  }
}

debugMultiClientAPI().catch(console.error)