import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkStatusTable() {
  console.log('🔍 VERIFICANDO TABELA DE STATUS')
  console.log('==============================')
  
  try {
    // 1. Verificar todos os status cadastrados na tabela
    console.log('\n📋 1. STATUS CADASTRADOS NA TABELA:')
    const { data: statuses } = await supabase
      .from('ticket_statuses')
      .select('*')
      .order('order_index', { ascending: true })
    
    console.log(`Total de status na tabela: ${statuses?.length || 0}`)
    statuses?.forEach((status, index) => {
      console.log(`${index + 1}. ${status.name} (${status.slug}) - Cor: ${status.color} - Ordem: ${status.order_index}`)
    })
    
    // 2. Verificar todos os status únicos dos tickets
    console.log('\n🎫 2. STATUS ÚNICOS DOS TICKETS:')
    const { data: tickets } = await supabase
      .from('tickets')
      .select('status')
      .not('status', 'is', null)
    
    const uniqueTicketStatuses = [...new Set(tickets?.map(t => t.status) || [])]
    console.log(`Total de status únicos nos tickets: ${uniqueTicketStatuses.length}`)
    uniqueTicketStatuses.forEach((status, index) => {
      console.log(`${index + 1}. ${status}`)
    })
    
    // 3. Verificar correspondência
    console.log('\n🔍 3. VERIFICAÇÃO DE CORRESPONDÊNCIA:')
    const statusSlugs = statuses?.map(s => s.slug) || []
    
    uniqueTicketStatuses.forEach(ticketStatus => {
      const exists = statusSlugs.includes(ticketStatus)
      console.log(`${exists ? '✅' : '❌'} ${ticketStatus} ${exists ? '→ ENCONTRADO' : '→ NÃO ENCONTRADO na tabela'}`)
    })
    
    // 4. Identificar status que precisam ser mapeados
    console.log('\n🔧 4. STATUS QUE PRECISAM SER MAPEADOS:')
    const statusToMap = uniqueTicketStatuses.filter(ticketStatus => !statusSlugs.includes(ticketStatus))
    
    if (statusToMap.length > 0) {
      console.log(`Status dos tickets que não existem na tabela:`)
      statusToMap.forEach((status, index) => {
        console.log(`${index + 1}. ${status}`)
      })
    } else {
      console.log('✅ Todos os status dos tickets existem na tabela')
    }
    
    // 5. Verificar se há status em inglês
    console.log('\n🌐 5. VERIFICAÇÃO DE STATUS EM INGLÊS:')
    const englishStatuses = uniqueTicketStatuses.filter(status => 
      ['open', 'in_progress', 'resolved', 'closed', 'cancelled'].includes(status)
    )
    
    if (englishStatuses.length > 0) {
      console.log(`❌ Status em inglês encontrados nos tickets:`)
      englishStatuses.forEach((status, index) => {
        console.log(`${index + 1}. ${status}`)
      })
    } else {
      console.log('✅ Nenhum status em inglês encontrado nos tickets')
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

checkStatusTable()
