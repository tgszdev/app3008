import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testAfterMigration() {
  console.log('🧪 TESTE APÓS MIGRAÇÃO')
  console.log('======================')
  
  try {
    // 1. Verificar status dos tickets após migração
    console.log('\n🎫 1. STATUS DOS TICKETS APÓS MIGRAÇÃO:')
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, status, ticket_number, title')
      .not('status', 'is', null)
    
    const uniqueStatuses = [...new Set(tickets?.map(t => t.status) || [])]
    console.log(`Status únicos: ${uniqueStatuses.length}`)
    uniqueStatuses.forEach((status, index) => {
      const count = tickets?.filter(t => t.status === status).length || 0
      console.log(`${index + 1}. ${status}: ${count} tickets`)
    })
    
    // 2. Verificar correspondência com tabela de status
    console.log('\n📋 2. VERIFICAÇÃO DE CORRESPONDÊNCIA:')
    const { data: statuses } = await supabase
      .from('ticket_statuses')
      .select('name, slug, color')
      .order('order_index', { ascending: true })
    
    console.log(`Status na tabela: ${statuses?.length || 0}`)
    statuses?.forEach((status, index) => {
      console.log(`${index + 1}. ${status.name} (${status.slug}) - ${status.color}`)
    })
    
    // 3. Verificar correspondência
    console.log('\n🔍 3. VERIFICAÇÃO DE CORRESPONDÊNCIA:')
    const statusSlugs = statuses?.map(s => s.slug) || []
    
    uniqueStatuses.forEach(ticketStatus => {
      const exists = statusSlugs.includes(ticketStatus)
      console.log(`${exists ? '✅' : '❌'} ${ticketStatus} ${exists ? '→ ENCONTRADO' : '→ NÃO ENCONTRADO na tabela'}`)
    })
    
    // 4. Simular API multi-client-analytics
    console.log('\n🔧 4. SIMULANDO API MULTI-CLIENT-ANALYTICS:')
    
    const startDate = '2025-09-01'
    const endDate = '2025-09-30'
    
    // Buscar tickets com contextos
    const { data: ticketsWithContexts } = await supabase
      .from('tickets')
      .select(`
        id,
        status,
        created_at,
        context_id,
        categories (
          id,
          name,
          icon,
          color
        )
      `)
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
    
    console.log(`Tickets encontrados: ${ticketsWithContexts?.length || 0}`)
    
    // Processar status dinamicamente
    const uniqueTicketStatuses = [...new Set(ticketsWithContexts?.map(t => t.status) || [])]
    console.log(`Status únicos dos tickets: ${uniqueTicketStatuses.length}`)
    
    const dynamicStatusStats = uniqueTicketStatuses.map(ticketStatus => {
      const existingStatus = statuses?.find(s => s.slug === ticketStatus)
      
      if (existingStatus) {
        const matchingTickets = ticketsWithContexts?.filter(ticket => ticket.status === ticketStatus) || []
        return {
          id: existingStatus.slug,
          name: existingStatus.name,
          slug: existingStatus.slug,
          color: existingStatus.color,
          count: matchingTickets.length,
          source: 'tabela'
        }
      } else {
        const matchingTickets = ticketsWithContexts?.filter(ticket => ticket.status === ticketStatus) || []
        return {
          id: `dynamic-${ticketStatus}`,
          name: ticketStatus,
          slug: ticketStatus,
          color: '#6B7280',
          count: matchingTickets.length,
          source: 'dinâmico'
        }
      }
    }).filter(status => status.count > 0)
    
    console.log(`\n📊 RESULTADO FINAL:`)
    console.log(`Status processados: ${dynamicStatusStats.length}`)
    dynamicStatusStats.forEach((status, index) => {
      console.log(`${index + 1}. ${status.name}: ${status.count} tickets (${status.source})`)
    })
    
    // 5. Verificar se todos os status são da tabela
    const allFromTable = dynamicStatusStats.every(status => status.source === 'tabela')
    console.log(`\n✅ Todos os status são da tabela: ${allFromTable ? 'SIM' : 'NÃO'}`)
    
    if (allFromTable) {
      console.log('🎉 PERFEITO! Sistema funcionando com status corretos da tabela!')
    } else {
      console.log('⚠️ Ainda há status dinâmicos sendo criados')
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

testAfterMigration()
