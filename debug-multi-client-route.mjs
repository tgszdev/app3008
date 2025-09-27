import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugMultiClientRoute() {
  console.log('🔍 DEBUG COMPLETO DA ROTA /dashboard/multi-client')
  console.log('=' .repeat(60))
  
  // 1. Verificar usuário
  console.log('\n1. VERIFICANDO USUÁRIO:')
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, user_type, context_id, role')
    .eq('email', 'rodrigues2205@icloud.com')
    .single()
  
  if (userError) {
    console.error('❌ Erro ao buscar usuário:', userError)
    return
  }
  
  console.log('✅ Usuário encontrado:', {
    id: user.id,
    email: user.email,
    user_type: user.user_type,
    context_id: user.context_id,
    role: user.role
  })
  
  // 2. Verificar contextos associados
  console.log('\n2. VERIFICANDO CONTEXTOS ASSOCIADOS:')
  const { data: userContexts, error: contextsError } = await supabase
    .from('user_contexts')
    .select('context_id')
    .eq('user_id', user.id)
  
  if (contextsError) {
    console.error('❌ Erro ao buscar contextos:', contextsError)
    return
  }
  
  console.log(`✅ Encontrados ${userContexts?.length || 0} contextos associados`)
  const contextIds = userContexts?.map(uc => uc.context_id) || []
  console.log('Context IDs:', contextIds)
  
  // 3. Verificar detalhes dos contextos
  console.log('\n3. VERIFICANDO DETALHES DOS CONTEXTOS:')
  for (const contextId of contextIds) {
    const { data: context, error: contextError } = await supabase
      .from('contexts')
      .select('id, name, type, slug')
      .eq('id', contextId)
      .single()
    
    if (contextError) {
      console.error(`❌ Erro ao buscar contexto ${contextId}:`, contextError)
    } else {
      console.log(`✅ Contexto: ${context.name} (${context.type}) - ${contextId}`)
    }
  }
  
  // 4. Verificar tickets por contexto
  console.log('\n4. VERIFICANDO TICKETS POR CONTEXTO:')
  for (const contextId of contextIds) {
    const { data: context, error: contextError } = await supabase
      .from('contexts')
      .select('id, name, type, slug')
      .eq('id', contextId)
      .single()
    
    if (contextError) {
      console.error(`❌ Erro ao buscar contexto ${contextId}:`, contextError)
      continue
    }
    
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
        context_id,
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
      console.error(`❌ Erro na query para ${context.name}:`, ticketsError)
    } else {
      console.log(`✅ ${context.name}: ${tickets?.length || 0} tickets encontrados`)
      if (tickets && tickets.length > 0) {
        tickets.forEach(ticket => {
          console.log(`  - #${ticket.ticket_number}: ${ticket.title}`)
          console.log(`    Status: ${ticket.status}`)
          console.log(`    Categoria: ${ticket.categories?.name || 'Sem categoria'}`)
          console.log(`    Context ID: ${ticket.context_id}`)
          console.log(`    Created: ${ticket.created_at}`)
        })
      }
    }
  }
  
  // 5. Verificar status disponíveis
  console.log('\n5. VERIFICANDO STATUS DISPONÍVEIS:')
  const { data: statuses, error: statusError } = await supabase
    .from('statuses')
    .select('id, name, slug, color, order_index')
    .eq('is_active', true)
    .order('order_index', { ascending: true })
  
  if (statusError) {
    console.error('❌ Erro ao buscar status:', statusError)
  } else {
    console.log(`✅ Encontrados ${statuses?.length || 0} status ativos:`)
    statuses?.forEach(status => {
      console.log(`  - ${status.name} (${status.slug}) - ${status.color}`)
    })
  }
  
  // 6. Testar endpoint da API
  console.log('\n6. TESTANDO ENDPOINT DA API:')
  try {
    const contextIdsString = contextIds.join(',')
    const apiUrl = `https://www.ithostbr.tech/api/dashboard/multi-client-analytics?start_date=2024-01-01&end_date=2025-12-31&context_ids=${contextIdsString}`
    
    console.log(`🔗 URL da API: ${apiUrl}`)
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test' // Simular sessão
      }
    })
    
    console.log(`📊 Status da resposta: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API retornou dados:', JSON.stringify(data, null, 2))
    } else {
      const errorData = await response.json()
      console.log('❌ API retornou erro:', errorData)
    }
  } catch (error) {
    console.error('❌ Erro ao chamar API:', error)
  }
  
  // 7. Verificar se há tickets sem categoria
  console.log('\n7. VERIFICANDO TICKETS SEM CATEGORIA:')
  for (const contextId of contextIds) {
    const { data: context, error: contextError } = await supabase
      .from('contexts')
      .select('id, name')
      .eq('id', contextId)
      .single()
    
    if (contextError) continue
    
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, ticket_number, title, category_id, categories')
      .eq('context_id', contextId)
      .gte('created_at', '2024-01-01T00:00:00.000Z')
      .lte('created_at', '2025-12-31T23:59:59.999Z')
    
    if (!ticketsError && tickets) {
      const ticketsWithoutCategory = tickets.filter(t => !t.category_id || !t.categories)
      console.log(`✅ ${context.name}: ${ticketsWithoutCategory.length} tickets sem categoria`)
      ticketsWithoutCategory.forEach(ticket => {
        console.log(`  - #${ticket.ticket_number}: ${ticket.title} (category_id: ${ticket.category_id})`)
      })
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('🏁 DEBUG COMPLETO FINALIZADO')
}

debugMultiClientRoute().catch(console.error)
