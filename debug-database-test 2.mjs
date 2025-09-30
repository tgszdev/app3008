import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabaseQueries() {
  console.log('🔍 TESTE COMPLETO DO BANCO DE DADOS')
  console.log('=====================================')
  
  try {
    // 1. Verificar status disponíveis na tabela ticket_statuses
    console.log('\n📋 1. STATUS DISPONÍVEIS NA TABELA:')
    const { data: statuses, error: statusError } = await supabase
      .from('ticket_statuses')
      .select('id, name, slug, color, order_index')
      .order('order_index', { ascending: true })
    
    if (statusError) {
      console.error('❌ Erro ao buscar status:', statusError)
    } else {
      console.log(`✅ ${statuses?.length || 0} status encontrados:`)
      statuses?.forEach(status => {
        console.log(`  - ${status.name} (${status.slug}) - Cor: ${status.color}`)
      })
    }
    
    // 2. Verificar tickets do Simas Log
    console.log('\n🎫 2. TICKETS DO SIMAS LOG:')
    const { data: simasContext, error: contextError } = await supabase
      .from('contexts')
      .select('id, name')
      .ilike('name', '%simas%')
      .single()
    
    if (contextError) {
      console.error('❌ Erro ao buscar contexto Simas:', contextError)
    } else if (simasContext) {
      console.log(`✅ Contexto encontrado: ${simasContext.name} (${simasContext.id})`)
      
      // Buscar tickets do Simas Log
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, ticket_number, title, status, created_at')
        .eq('context_id', simasContext.id)
        .order('created_at', { ascending: false })
      
      if (ticketsError) {
        console.error('❌ Erro ao buscar tickets:', ticketsError)
      } else {
        console.log(`✅ ${tickets?.length || 0} tickets encontrados:`)
        tickets?.forEach(ticket => {
          console.log(`  - #${ticket.ticket_number}: ${ticket.title} (status: ${ticket.status})`)
        })
        
        // 3. Verificar status únicos dos tickets
        console.log('\n🎯 3. STATUS ÚNICOS DOS TICKETS:')
        const uniqueStatuses = [...new Set(tickets?.map(t => t.status) || [])]
        console.log(`✅ Status únicos encontrados:`, uniqueStatuses)
        
        // 4. Comparar com status da tabela
        console.log('\n🔍 4. COMPARAÇÃO STATUS vs TICKETS:')
        if (statuses && uniqueStatuses) {
          uniqueStatuses.forEach(ticketStatus => {
            const matchingStatus = statuses.find(s => s.slug === ticketStatus)
            if (matchingStatus) {
              const count = tickets?.filter(t => t.status === ticketStatus).length || 0
              console.log(`✅ MATCH: ${matchingStatus.name} (${ticketStatus}) - ${count} tickets`)
            } else {
              console.log(`❌ NO MATCH: Status "${ticketStatus}" não encontrado na tabela ticket_statuses`)
            }
          })
        }
        
        // 5. Testar query da API multi-client-analytics
        console.log('\n🔧 5. TESTE DA QUERY DA API:')
        const startDate = '2025-09-01'
        const endDate = '2025-09-30'
        
        const { data: apiTickets, error: apiError } = await supabase
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
          .eq('context_id', simasContext.id)
          .gte('created_at', `${startDate}T00:00:00.000Z`)
          .lte('created_at', `${endDate}T23:59:59.999Z`)
        
        if (apiError) {
          console.error('❌ Erro na query da API:', apiError)
        } else {
          console.log(`✅ Query da API retornou ${apiTickets?.length || 0} tickets`)
          apiTickets?.forEach(ticket => {
            console.log(`  - #${ticket.ticket_number}: ${ticket.title} (status: ${ticket.status})`)
          })
        }
      }
    } else {
      console.log('❌ Contexto Simas Log não encontrado')
    }
    
    // 6. Verificar todos os contextos
    console.log('\n🏢 6. TODOS OS CONTEXTOS:')
    const { data: allContexts, error: allContextsError } = await supabase
      .from('contexts')
      .select('id, name, type')
      .order('name')
    
    if (allContextsError) {
      console.error('❌ Erro ao buscar contextos:', allContextsError)
    } else {
      console.log(`✅ ${allContexts?.length || 0} contextos encontrados:`)
      allContexts?.forEach(context => {
        console.log(`  - ${context.name} (${context.type})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar teste
testDatabaseQueries()
