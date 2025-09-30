import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkRealStatus() {
  console.log('🔍 VERIFICANDO STATUS REAIS DO BANCO')
  console.log('===================================')
  
  try {
    // 1. Verificar TODOS os status cadastrados
    console.log('\n📋 1. TODOS OS STATUS CADASTRADOS:')
    const { data: allStatuses, error: statusError } = await supabase
      .from('ticket_statuses')
      .select('id, name, slug, color, order_index')
      .order('order_index')
    
    if (statusError) {
      console.log('❌ Erro ao buscar status:', statusError)
      return
    }
    
    console.log(`✅ ${allStatuses?.length || 0} status encontrados:`)
    allStatuses?.forEach(s => {
      console.log(`  - ID: ${s.id}`)
      console.log(`    Nome: ${s.name}`)
      console.log(`    Slug: ${s.slug}`)
      console.log(`    Cor: ${s.color}`)
      console.log(`    Ordem: ${s.order_index}`)
      console.log('    ---')
    })
    
    // 2. Verificar TODOS os status dos tickets
    console.log('\n🎫 2. TODOS OS STATUS DOS TICKETS:')
    const { data: allTickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, ticket_number, title, status, context_id, contexts(name)')
      .not('status', 'is', null)
    
    if (ticketsError) {
      console.log('❌ Erro ao buscar tickets:', ticketsError)
      return
    }
    
    console.log(`✅ ${allTickets?.length || 0} tickets encontrados:`)
    allTickets?.forEach(t => {
      console.log(`  - #${t.ticket_number}: ${t.title}`)
      console.log(`    Status: ${t.status}`)
      console.log(`    Cliente: ${t.contexts?.name}`)
      console.log('    ---')
    })
    
    // 3. Identificar status únicos dos tickets
    const uniqueTicketStatuses = [...new Set(allTickets?.map(t => t.status) || [])]
    console.log('\n🎯 3. STATUS ÚNICOS DOS TICKETS:')
    uniqueTicketStatuses.forEach(status => console.log(`  - ${status}`))
    
    // 4. Verificar correspondência
    console.log('\n🔍 4. VERIFICAÇÃO DE CORRESPONDÊNCIA:')
    uniqueTicketStatuses.forEach(ticketStatus => {
      const matchingStatus = allStatuses?.find(s => s.slug === ticketStatus)
      if (matchingStatus) {
        console.log(`✅ ${ticketStatus} → ${matchingStatus.name} (${matchingStatus.slug})`)
      } else {
        console.log(`❌ ${ticketStatus} → NÃO ENCONTRADO na tabela ticket_statuses`)
      }
    })
    
    // 5. Identificar quais status precisam ser criados
    console.log('\n🔧 5. STATUS QUE PRECISAM SER CRIADOS:')
    const missingStatuses = uniqueTicketStatuses.filter(ticketStatus => 
      !allStatuses?.some(s => s.slug === ticketStatus)
    )
    
    if (missingStatuses.length > 0) {
      console.log('Status faltantes:')
      missingStatuses.forEach(status => console.log(`  - ${status}`))
      
      console.log('\n💡 SUGESTÃO: Criar estes status na tabela ticket_statuses')
    } else {
      console.log('✅ Todos os status dos tickets têm correspondência na tabela!')
    }
    
    // 6. Verificar se há status na tabela que não são usados
    console.log('\n📊 6. STATUS NÃO UTILIZADOS:')
    const unusedStatuses = allStatuses?.filter(status => 
      !uniqueTicketStatuses.includes(status.slug)
    ) || []
    
    if (unusedStatuses.length > 0) {
      console.log('Status não utilizados:')
      unusedStatuses.forEach(status => console.log(`  - ${status.name} (${status.slug})`))
    } else {
      console.log('✅ Todos os status da tabela são utilizados!')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkRealStatus()
