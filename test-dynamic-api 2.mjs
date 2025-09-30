import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testDynamicAPI() {
  console.log('🧪 TESTE DA API DINÂMICA')
  console.log('========================')
  
  try {
    // 1. Simular exatamente a nova lógica da API
    console.log('\n🔍 1. SIMULANDO NOVA LÓGICA DINÂMICA:')
    
    // Buscar contextos
    const { data: contexts } = await supabase
      .from('contexts')
      .select('id, name, type, slug')
      .order('name')
    
    console.log(`✅ ${contexts?.length || 0} contextos encontrados:`)
    contexts?.forEach(c => console.log(`  - ${c.name} (${c.id})`))
    
    // Buscar status da tabela
    const { data: statuses } = await supabase
      .from('ticket_statuses')
      .select('id, name, slug, color, order_index')
      .order('order_index')
    
    console.log(`✅ ${statuses?.length || 0} status na tabela:`)
    statuses?.forEach(s => console.log(`  - ${s.name} (${s.slug})`))
    
    // Buscar tickets do Simas Log
    const simasContext = contexts?.find(c => c.name === 'Simas Log')
    if (!simasContext) {
      console.log('❌ Contexto Simas Log não encontrado')
      return
    }
    
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, ticket_number, title, status')
      .eq('context_id', simasContext.id)
    
    console.log(`✅ ${tickets?.length || 0} tickets do Simas Log:`)
    tickets?.forEach(t => console.log(`  - #${t.ticket_number}: ${t.title} (${t.status})`))
    
    // 2. Aplicar nova lógica dinâmica
    console.log('\n🔧 2. APLICANDO LÓGICA DINÂMICA:')
    
    const uniqueTicketStatuses = [...new Set(tickets?.map(t => t.status) || [])]
    console.log(`🎯 Status únicos dos tickets:`, uniqueTicketStatuses)
    
    const dynamicStatusStats = uniqueTicketStatuses.map(ticketStatus => {
      // Buscar se existe na tabela
      const existingStatus = statuses?.find(s => s.slug === ticketStatus)
      
      if (existingStatus) {
        // Usar status da tabela
        const matchingTickets = tickets?.filter(ticket => ticket.status === ticketStatus) || []
        return {
          id: existingStatus.id,
          name: existingStatus.name,
          slug: existingStatus.slug,
          color: existingStatus.color,
          order_index: existingStatus.order_index,
          count: matchingTickets.length
        }
      } else {
        // Criar status dinâmico baseado no slug do ticket
        const matchingTickets = tickets?.filter(ticket => ticket.status === ticketStatus) || []
        const dynamicName = ticketStatus
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        
        return {
          id: `dynamic-${ticketStatus}`,
          name: dynamicName,
          slug: ticketStatus,
          color: '#6B7280', // Cor padrão
          order_index: 999,
          count: matchingTickets.length
        }
      }
    }).filter(status => status.count > 0)
    
    console.log(`\n📊 RESULTADO FINAL DINÂMICO:`)
    console.log(`Status encontrados: ${dynamicStatusStats.length}`)
    dynamicStatusStats.forEach(stat => {
      console.log(`  - ${stat.name} (${stat.slug}): ${stat.count} tickets`)
      if (stat.id.startsWith('dynamic-')) {
        console.log(`    ⚡ Status dinâmico criado automaticamente`)
      } else {
        console.log(`    📋 Status da tabela ticket_statuses`)
      }
    })
    
    // 3. Verificar se todos os status dos tickets foram processados
    console.log('\n✅ 3. VERIFICAÇÃO FINAL:')
    const processedStatuses = dynamicStatusStats.map(s => s.slug)
    const missingStatuses = uniqueTicketStatuses.filter(status => 
      !processedStatuses.includes(status)
    )
    
    if (missingStatuses.length === 0) {
      console.log('✅ Todos os status dos tickets foram processados!')
    } else {
      console.log('❌ Status não processados:', missingStatuses)
    }
    
    // 4. Testar com outros contextos
    console.log('\n🌐 4. TESTE COM OUTROS CONTEXTOS:')
    for (const context of contexts || []) {
      const { data: contextTickets } = await supabase
        .from('tickets')
        .select('id, ticket_number, title, status')
        .eq('context_id', context.id)
      
      if (contextTickets && contextTickets.length > 0) {
        console.log(`\n🏢 ${context.name}: ${contextTickets.length} tickets`)
        const contextStatuses = [...new Set(contextTickets.map(t => t.status))]
        console.log(`  Status únicos:`, contextStatuses)
        
        const contextDynamicStats = contextStatuses.map(ticketStatus => {
          const existingStatus = statuses?.find(s => s.slug === ticketStatus)
          const matchingTickets = contextTickets.filter(t => t.status === ticketStatus)
          
          if (existingStatus) {
            return {
              name: existingStatus.name,
              slug: existingStatus.slug,
              count: matchingTickets.length,
              source: 'tabela'
            }
          } else {
            const dynamicName = ticketStatus
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
            return {
              name: dynamicName,
              slug: ticketStatus,
              count: matchingTickets.length,
              source: 'dinâmico'
            }
          }
        }).filter(s => s.count > 0)
        
        contextDynamicStats.forEach(stat => {
          console.log(`    - ${stat.name}: ${stat.count} tickets (${stat.source})`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testDynamicAPI()
