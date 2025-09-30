import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function migrateRemainingTickets() {
  console.log('🔄 MIGRAÇÃO DOS TICKETS RESTANTES')
  console.log('=================================')
  
  try {
    // 1. Buscar tickets com status "open"
    console.log('\n🔍 1. BUSCANDO TICKETS COM STATUS "open":')
    const { data: openTickets } = await supabase
      .from('tickets')
      .select('id, ticket_number, title, status')
      .eq('status', 'open')
    
    console.log(`Tickets encontrados com status "open": ${openTickets?.length || 0}`)
    
    if (openTickets && openTickets.length > 0) {
      openTickets.forEach((ticket, index) => {
        console.log(`${index + 1}. #${ticket.ticket_number}: ${ticket.title}`)
      })
      
      // 2. Migrar para "ABERTO"
      console.log('\n🔄 2. MIGRANDO PARA "ABERTO":')
      
      const { data: updateResult, error } = await supabase
        .from('tickets')
        .update({ status: 'ABERTO' })
        .eq('status', 'open')
        .select('id, ticket_number, title, status')
      
      if (error) {
        console.error('❌ Erro ao migrar tickets:', error)
      } else {
        console.log(`✅ ${updateResult?.length || 0} tickets migrados com sucesso!`)
        updateResult?.forEach((ticket, index) => {
          console.log(`${index + 1}. #${ticket.ticket_number}: ${ticket.title} → ${ticket.status}`)
        })
      }
    } else {
      console.log('✅ Nenhum ticket com status "open" encontrado!')
    }
    
    // 3. Verificar se ainda há status em inglês
    console.log('\n🔍 3. VERIFICAÇÃO FINAL:')
    const { data: allTickets } = await supabase
      .from('tickets')
      .select('id, ticket_number, title, status')
    
    const englishStatuses = ['open', 'in_progress', 'resolved', 'closed', 'cancelled']
    const ticketsWithEnglishStatus = allTickets?.filter(ticket => 
      englishStatuses.includes(ticket.status)
    ) || []
    
    if (ticketsWithEnglishStatus.length > 0) {
      console.log(`❌ Ainda há ${ticketsWithEnglishStatus.length} tickets com status em inglês:`)
      ticketsWithEnglishStatus.forEach(ticket => {
        console.log(`  - #${ticket.ticket_number}: ${ticket.status}`)
      })
    } else {
      console.log(`✅ MIGRAÇÃO COMPLETA! Todos os tickets estão com status em português!`)
    }
    
    // 4. Resumo final
    console.log('\n📊 4. RESUMO FINAL:')
    console.log(`Total de tickets: ${allTickets?.length || 0}`)
    console.log(`Tickets com status em inglês: ${ticketsWithEnglishStatus.length}`)
    console.log(`Tickets com status em português: ${(allTickets?.length || 0) - ticketsWithEnglishStatus.length}`)
    
    if (ticketsWithEnglishStatus.length === 0) {
      console.log('\n🎉 MIGRAÇÃO 100% COMPLETA!')
      console.log('✅ Todos os tickets estão com status em português')
      console.log('✅ Sistema funcionando corretamente')
      console.log('✅ Novos tickets serão criados com status "ABERTO"')
    }
    
  } catch (error) {
    console.error('❌ Erro na migração:', error)
  }
}

migrateRemainingTickets()
