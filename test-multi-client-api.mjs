import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testMultiClientAPI() {
  console.log('🔍 Testando API Multi-Client Analytics...')
  
  // 1. Verificar usuário rodrigues2205@icloud.com
  console.log('\n1. Verificando usuário rodrigues2205@icloud.com:')
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, user_type, context_id')
    .eq('email', 'rodrigues2205@icloud.com')
    .single()
  
  if (userError) {
    console.error('❌ Erro ao buscar usuário:', userError)
    return
  }
  
  console.log('✅ Usuário encontrado:', user)
  
  // 2. Verificar contextos associados ao usuário
  console.log('\n2. Verificando contextos associados:')
  const { data: userContexts, error: contextsError } = await supabase
    .from('user_contexts')
    .select('context_id')
    .eq('user_id', user.id)
  
  if (contextsError) {
    console.error('❌ Erro ao buscar contextos:', contextsError)
    return
  }
  
  console.log(`✅ Encontrados ${userContexts?.length || 0} contextos associados`)
  userContexts?.forEach(uc => {
    console.log(`  - Context ID: ${uc.context_id}`)
  })
  
  // 3. Buscar detalhes dos contextos
  if (userContexts && userContexts.length > 0) {
    console.log('\n3. Detalhes dos contextos:')
    const contextIds = userContexts.map(uc => uc.context_id)
    
    const { data: contexts, error: contextsDetailError } = await supabase
      .from('contexts')
      .select('id, name, type, slug')
      .in('id', contextIds)
    
    if (contextsDetailError) {
      console.error('❌ Erro ao buscar detalhes dos contextos:', contextsDetailError)
    } else {
      console.log(`✅ Encontrados ${contexts?.length || 0} contextos`)
      contexts?.forEach(context => {
        console.log(`  - ${context.name} (${context.type}): ${context.id}`)
      })
    }
    
    // 4. Simular query da API multi-client-analytics
    console.log('\n4. Simulando query da API multi-client-analytics:')
    const contextIdsString = contextIds.join(',')
    console.log(`Context IDs: ${contextIdsString}`)
    
    for (const contextId of contextIds) {
      console.log(`\nTestando contexto: ${contextId}`)
      
      const { data: tickets, error: ticketsError } = await supabase
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
      
      if (ticketsError) {
        console.error(`❌ Erro na query:`, ticketsError)
      } else {
        console.log(`✅ Query retornou ${tickets?.length || 0} tickets`)
        tickets?.forEach(ticket => {
          console.log(`  - #${ticket.ticket_number}: ${ticket.title}`)
          console.log(`    Status: ${ticket.status}`)
          console.log(`    Categoria: ${ticket.categories?.name || 'Sem categoria'}`)
        })
      }
    }
  }
  
  // 5. Testar endpoint da API diretamente
  console.log('\n5. Testando endpoint da API:')
  try {
    const response = await fetch('https://www.ithostbr.tech/api/dashboard/multi-client-analytics?start_date=2024-01-01&end_date=2025-12-31&context_ids=85879bd8-d1d1-416b-ae55-e564687af28b,6486088e-72ae-461b-8b03-32ca84918882')
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ API retornou dados:', JSON.stringify(data, null, 2))
    } else {
      console.log('❌ API retornou erro:', data)
    }
  } catch (error) {
    console.error('❌ Erro ao chamar API:', error)
  }
}

testMultiClientAPI().catch(console.error)