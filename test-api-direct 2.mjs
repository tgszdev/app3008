import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testAPIDirectly() {
  console.log('🔍 TESTE DIRETO DA API')
  console.log('====================')
  
  try {
    // 1. Buscar contextos existentes
    console.log('\n🏢 1. CONTEXTOS EXISTENTES:')
    const { data: contexts, error: contextError } = await supabase
      .from('contexts')
      .select('id, name, type')
      .order('name')
    
    if (contextError) {
      console.log('❌ Erro ao buscar contextos:', contextError)
    } else {
      console.log(`✅ ${contexts?.length || 0} contextos encontrados:`)
      contexts?.forEach(context => {
        console.log(`  - ${context.name} (${context.type}) - ID: ${context.id}`)
      })
    }
    
    // 2. Buscar status existentes
    console.log('\n📋 2. STATUS EXISTENTES:')
    const { data: statuses, error: statusError } = await supabase
      .from('ticket_statuses')
      .select('id, name, slug, color, order_index')
      .order('order_index', { ascending: true })
    
    if (statusError) {
      console.log('❌ Erro ao buscar status:', statusError)
    } else {
      console.log(`✅ ${statuses?.length || 0} status encontrados:`)
      statuses?.forEach(status => {
        console.log(`  - ${status.name} (${status.slug}) - Cor: ${status.color}`)
      })
    }
    
    // 3. Buscar tickets do Simas Log
    console.log('\n🎫 3. TICKETS DO SIMAS LOG:')
    const simasContext = contexts?.find(c => c.name.includes('Simas'))
    
    if (simasContext) {
      console.log(`✅ Contexto Simas encontrado: ${simasContext.name} (${simasContext.id})`)
      
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
        .eq('context_id', simasContext.id)
        .gte('created_at', '2025-09-01T00:00:00.000Z')
        .lte('created_at', '2025-09-30T23:59:59.999Z')
        .order('created_at', { ascending: false })
      
      if (ticketsError) {
        console.log('❌ Erro ao buscar tickets:', ticketsError)
      } else {
        console.log(`✅ ${tickets?.length || 0} tickets encontrados:`)
        tickets?.forEach(ticket => {
          console.log(`  - #${ticket.ticket_number}: ${ticket.title} (status: ${ticket.status})`)
        })
        
        // 4. Testar lógica da API
        console.log('\n🔍 4. TESTE DA LÓGICA DA API:')
        
        if (tickets && statuses) {
          // Identificar status únicos dos tickets
          const uniqueTicketStatuses = [...new Set(tickets.map(t => t.status))]
          console.log(`🎯 Status únicos dos tickets:`, uniqueTicketStatuses)
          
          // Buscar status que correspondem aos tickets
          const relevantStatuses = statuses.filter(status => 
            uniqueTicketStatuses.includes(status.slug)
          )
          console.log(`✅ Status relevantes encontrados:`, relevantStatuses.map(s => `${s.name} (${s.slug})`))
          
          // Calcular estatísticas
          const statusStats = relevantStatuses.map(status => {
            const matchingTickets = tickets.filter(ticket => ticket.status === status.slug)
            const count = matchingTickets.length
            console.log(`📊 ${status.name} (${status.slug}): ${count} tickets`)
            return {
              ...status,
              count
            }
          }).filter(status => status.count > 0)
          
          console.log(`\n📊 RESULTADO FINAL:`)
          console.log(`Status com tickets: ${statusStats.length}`)
          statusStats.forEach(stat => {
            console.log(`  - ${stat.name}: ${stat.count} tickets`)
          })
        }
      }
    } else {
      console.log('❌ Contexto Simas Log não encontrado')
    }
    
    // 5. Testar com todos os contextos
    console.log('\n🌐 5. TESTE COM TODOS OS CONTEXTOS:')
    
    if (contexts && contexts.length > 0) {
      const contextIds = contexts.map(c => c.id)
      console.log(`🎯 Testando com ${contextIds.length} contextos:`, contextIds)
      
      const { data: allTickets, error: allTicketsError } = await supabase
        .from('tickets')
        .select(`
          id,
          ticket_number,
          title,
          status,
          context_id,
          contexts(name)
        `)
        .in('context_id', contextIds)
        .gte('created_at', '2025-09-01T00:00:00.000Z')
        .lte('created_at', '2025-09-30T23:59:59.999Z')
        .order('created_at', { ascending: false })
      
      if (allTicketsError) {
        console.log('❌ Erro ao buscar todos os tickets:', allTicketsError)
      } else {
        console.log(`✅ ${allTickets?.length || 0} tickets encontrados no período:`)
        allTickets?.forEach(ticket => {
          console.log(`  - #${ticket.ticket_number}: ${ticket.title} (${ticket.status}) - ${ticket.contexts?.name}`)
        })
        
        // Agrupar por contexto
        const ticketsByContext = {}
        allTickets?.forEach(ticket => {
          const contextName = ticket.contexts?.name || 'Sem contexto'
          if (!ticketsByContext[contextName]) {
            ticketsByContext[contextName] = []
          }
          ticketsByContext[contextName].push(ticket)
        })
        
        console.log('\n📊 TICKETS POR CONTEXTO:')
        Object.entries(ticketsByContext).forEach(([contextName, contextTickets]) => {
          console.log(`\n🏢 ${contextName}: ${contextTickets.length} tickets`)
          const statusCounts = {}
          contextTickets.forEach(ticket => {
            statusCounts[ticket.status] = (statusCounts[ticket.status] || 0) + 1
          })
          Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`  - ${status}: ${count} tickets`)
          })
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar teste
testAPIDirectly()
