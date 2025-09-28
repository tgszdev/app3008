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

async function testAPIComplete() {
  console.log('🧪 TESTE COMPLETO DA API')
  console.log('=======================')
  
  try {
    // 1. Simular exatamente a API multi-client-analytics
    console.log('\n🔍 1. SIMULANDO API MULTI-CLIENT-ANALYTICS:')
    
    const startDate = '2025-09-01'
    const endDate = '2025-09-30'
    
    // Buscar contextos (Simas Log)
    const { data: simasContext, error: contextError } = await supabase
      .from('contexts')
      .select('id, name, type, slug')
      .ilike('name', '%simas%')
      .single()
    
    if (contextError || !simasContext) {
      console.log('❌ Erro ao buscar contexto Simas:', contextError)
      return
    }
    
    console.log(`✅ Contexto encontrado: ${simasContext.name} (${simasContext.id})`)
    
    // Buscar tickets do Simas Log
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
      .gte('created_at', `${startDate}T00:00:00.000Z`)
      .lte('created_at', `${endDate}T23:59:59.999Z`)
    
    if (ticketsError) {
      console.log('❌ Erro ao buscar tickets:', ticketsError)
      return
    }
    
    console.log(`✅ ${tickets?.length || 0} tickets encontrados:`)
    tickets?.forEach(ticket => {
      console.log(`  - #${ticket.ticket_number}: ${ticket.title} (status: ${ticket.status})`)
    })
    
    // Buscar status disponíveis
    const { data: statuses, error: statusError } = await supabase
      .from('ticket_statuses')
      .select('id, name, slug, color, order_index')
      .order('order_index', { ascending: true })
    
    if (statusError) {
      console.log('❌ Erro ao buscar status:', statusError)
      return
    }
    
    console.log(`✅ ${statuses?.length || 0} status disponíveis:`)
    statuses?.forEach(status => {
      console.log(`  - ${status.name} (${status.slug}) - Cor: ${status.color}`)
    })
    
    // 2. Aplicar lógica da API
    console.log('\n🔧 2. APLICANDO LÓGICA DA API:')
    
    // Identificar status únicos dos tickets
    const uniqueTicketStatuses = [...new Set(tickets?.map(t => t.status) || [])]
    console.log(`🎯 Status únicos dos tickets:`, uniqueTicketStatuses)
    
    // Buscar status que correspondem aos tickets
    const relevantStatuses = statuses.filter(status => 
      uniqueTicketStatuses.includes(status.slug)
    )
    console.log(`✅ Status relevantes encontrados:`, relevantStatuses.map(s => `${s.name} (${s.slug})`))
    
    // Calcular estatísticas
    const statusStats = relevantStatuses.map(status => {
      const matchingTickets = tickets?.filter(ticket => {
        const matches = ticket.status === status.slug
        if (matches) {
          console.log(`✅ MATCH: Ticket ${ticket.ticket_number} (${ticket.status}) === Status ${status.name} (${status.slug})`)
        }
        return matches
      }) || []
      
      const count = matchingTickets.length
      console.log(`📊 Status ${status.name} (${status.slug}): ${count} tickets`)
      
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
    
    // 3. Verificar se há problemas
    console.log('\n🔍 3. VERIFICAÇÃO DE PROBLEMAS:')
    
    if (statusStats.length === 0) {
      console.log('❌ PROBLEMA: Nenhum status encontrado!')
      console.log('🔍 Investigando...')
      
      console.log('\n📋 Status dos tickets vs Status da tabela:')
      uniqueTicketStatuses.forEach(ticketStatus => {
        const matchingStatus = statuses.find(s => s.slug === ticketStatus)
        if (matchingStatus) {
          console.log(`✅ ${ticketStatus} → ${matchingStatus.name} (${matchingStatus.slug})`)
        } else {
          console.log(`❌ ${ticketStatus} → NÃO ENCONTRADO na tabela ticket_statuses`)
        }
      })
      
      console.log('\n📋 Todos os slugs da tabela:')
      statuses.forEach(status => {
        console.log(`  - ${status.slug}`)
      })
    } else {
      console.log('✅ Status encontrados corretamente!')
    }
    
    // 4. Testar com outros contextos
    console.log('\n🌐 4. TESTE COM OUTROS CONTEXTOS:')
    
    const { data: allContexts } = await supabase
      .from('contexts')
      .select('id, name')
      .order('name')
    
    for (const context of allContexts || []) {
      const { data: contextTickets } = await supabase
        .from('tickets')
        .select('id, ticket_number, title, status')
        .eq('context_id', context.id)
        .gte('created_at', `${startDate}T00:00:00.000Z`)
        .lte('created_at', `${endDate}T23:59:59.999Z`)
      
      if (contextTickets && contextTickets.length > 0) {
        console.log(`\n🏢 ${context.name}: ${contextTickets.length} tickets`)
        const contextStatuses = [...new Set(contextTickets.map(t => t.status))]
        console.log(`  Status únicos:`, contextStatuses)
        
        const contextRelevantStatuses = statuses.filter(status => 
          contextStatuses.includes(status.slug)
        )
        console.log(`  Status relevantes: ${contextRelevantStatuses.length}`)
        contextRelevantStatuses.forEach(status => {
          const count = contextTickets.filter(t => t.status === status.slug).length
          console.log(`    - ${status.name}: ${count} tickets`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar teste
testAPIComplete()
