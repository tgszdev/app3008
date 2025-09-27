import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugMultiClientStatus() {
  console.log('🔍 DEBUG: Verificando dados de status no multi-client...')
  
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
  
  // 3. Testar endpoint da API multi-client-analytics
  console.log('\n🔍 Testando API multi-client-analytics...')
  try {
    const contextIdsString = contextIds.join(',')
    const apiUrl = `https://www.ithostbr.tech/api/dashboard/multi-client-analytics?start_date=2024-01-01&end_date=2025-12-31&context_ids=${contextIdsString}`
    
    console.log(`🔗 URL: ${apiUrl}`)
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test' // Simular sessão
      }
    })
    
    console.log(`📊 Status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API retornou dados:')
      console.log(`  - Total de clientes: ${data.clients?.length || 0}`)
      console.log(`  - Total de tickets consolidados: ${data.consolidated?.total_tickets || 0}`)
      
      if (data.clients && data.clients.length > 0) {
        console.log('\n📊 Dados por cliente:')
        data.clients.forEach((client, index) => {
          console.log(`  Cliente ${index + 1}: ${client.context.name}`)
          console.log(`    - Total tickets: ${client.summary.total_tickets}`)
          console.log(`    - Status stats: ${client.status_stats?.length || 0}`)
          console.log(`    - Category stats: ${client.category_stats?.length || 0}`)
          
          if (client.status_stats && client.status_stats.length > 0) {
            console.log(`    Status encontrados:`)
            client.status_stats.forEach(status => {
              console.log(`      - ${status.name}: ${status.count} tickets`)
            })
          }
        })
      }
      
      if (data.consolidated && data.consolidated.status_stats) {
        console.log('\n📊 Status consolidados:')
        data.consolidated.status_stats.forEach(status => {
          console.log(`  - ${status.name}: ${status.count} tickets`)
        })
      }
    } else {
      const errorData = await response.json()
      console.log('❌ API retornou erro:', errorData)
    }
  } catch (error) {
    console.error('❌ Erro ao chamar API:', error)
  }
  
  // 4. Verificar se há tickets com status diferentes de 'open'
  console.log('\n🔍 Verificando tickets com diferentes status...')
  for (const contextId of contextIds) {
    const { data: context, error: contextError } = await supabase
      .from('contexts')
      .select('id, name')
      .eq('id', contextId)
      .single()
    
    if (contextError) continue
    
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('ticket_number, title, status')
      .eq('context_id', contextId)
      .gte('created_at', '2024-01-01T00:00:00.000Z')
      .lte('created_at', '2025-12-31T23:59:59.999Z')
    
    if (!ticketsError && tickets) {
      console.log(`\n📊 ${context.name}:`)
      const statusCounts = {}
      tickets.forEach(ticket => {
        statusCounts[ticket.status] = (statusCounts[ticket.status] || 0) + 1
      })
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count} tickets`)
      })
    }
  }
}

debugMultiClientStatus().catch(console.error)
