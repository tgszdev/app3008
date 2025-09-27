import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testFixedAPI() {
  console.log('🔍 Testando API corrigida...')
  
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
  
  // 3. Testar query exata da API para um contexto específico
  const testContextId = '85879bd8-d1d1-416b-ae55-e564687af28b' // Simas Log
  console.log(`\n🔍 Testando contexto: ${testContextId}`)
  
  // Query exata da API
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
    .eq('context_id', testContextId)
    .gte('created_at', '2024-01-01T00:00:00.000Z')
    .lte('created_at', '2025-12-31T23:59:59.999Z')
  
  if (ticketsError) {
    console.error('❌ Erro na query:', ticketsError)
  } else {
    console.log(`✅ Query retornou ${tickets?.length || 0} tickets`)
    tickets?.forEach(ticket => {
      console.log(`  - #${ticket.ticket_number}: ${ticket.title}`)
      console.log(`    Status: ${ticket.status}`)
      console.log(`    Categoria: ${ticket.categories?.name || 'Sem categoria'}`)
    })
  }
  
  // 4. Testar status
  const { data: statuses, error: statusError } = await supabase
    .from('ticket_statuses')
    .select('id, name, slug, color, order_index')
    .order('order_index', { ascending: true })
  
  if (statusError) {
    console.error('❌ Erro ao buscar status:', statusError)
  } else {
    console.log(`✅ Status encontrados: ${statuses?.length || 0}`)
    statuses?.forEach(status => {
      console.log(`  - ${status.name} (${status.slug})`)
    })
  }
  
  // 5. Testar endpoint da API
  console.log('\n🔍 Testando endpoint da API...')
  try {
    const contextIdsString = contextIds.join(',')
    const response = await fetch(`https://www.ithostbr.tech/api/dashboard/multi-client-analytics?start_date=2024-01-01&end_date=2025-12-31&context_ids=${contextIdsString}`)
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

testFixedAPI().catch(console.error)
