import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function verifyMigrationStatus() {
  console.log('🔍 VERIFICAÇÃO DO STATUS DA MIGRAÇÃO')
  console.log('===================================')
  
  try {
    // 1. Verificar todos os tickets e seus status
    console.log('\n🎫 1. STATUS ATUAIS DOS TICKETS:')
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, ticket_number, title, status, created_at')
      .order('created_at', { ascending: false })
    
    console.log(`Total de tickets: ${tickets?.length || 0}`)
    
    // Agrupar por status
    const statusGroups = {}
    tickets?.forEach(ticket => {
      if (!statusGroups[ticket.status]) {
        statusGroups[ticket.status] = []
      }
      statusGroups[ticket.status].push(ticket)
    })
    
    // Mostrar tickets por status
    Object.entries(statusGroups).forEach(([status, ticketList]) => {
      console.log(`\n📋 Status: ${status} (${ticketList.length} tickets)`)
      ticketList.forEach((ticket, index) => {
        console.log(`  ${index + 1}. #${ticket.ticket_number}: ${ticket.title}`)
      })
    })
    
    // 2. Verificar se ainda há status em inglês
    console.log('\n🌐 2. VERIFICAÇÃO DE STATUS EM INGLÊS:')
    const englishStatuses = ['open', 'in_progress', 'resolved', 'closed', 'cancelled']
    const ticketsWithEnglishStatus = tickets?.filter(ticket => 
      englishStatuses.includes(ticket.status)
    ) || []
    
    if (ticketsWithEnglishStatus.length > 0) {
      console.log(`❌ Ainda há ${ticketsWithEnglishStatus.length} tickets com status em inglês:`)
      ticketsWithEnglishStatus.forEach(ticket => {
        console.log(`  - #${ticket.ticket_number}: ${ticket.status}`)
      })
    } else {
      console.log(`✅ Nenhum ticket com status em inglês encontrado!`)
    }
    
    // 3. Verificar status em português
    console.log('\n🇧🇷 3. STATUS EM PORTUGUÊS:')
    const portugueseStatuses = tickets?.filter(ticket => 
      !englishStatuses.includes(ticket.status)
    ) || []
    
    console.log(`✅ ${portugueseStatuses.length} tickets com status em português`)
    
    // 4. Verificar correspondência com tabela de status
    console.log('\n📋 4. VERIFICAÇÃO COM TABELA DE STATUS:')
    const { data: statuses } = await supabase
      .from('ticket_statuses')
      .select('name, slug, color, order_index')
      .order('order_index', { ascending: true })
    
    console.log(`Status cadastrados na tabela: ${statuses?.length || 0}`)
    statuses?.forEach((status, index) => {
      console.log(`${index + 1}. ${status.name} (${status.slug}) - Ordem: ${status.order_index}`)
    })
    
    // 5. Verificar correspondência
    console.log('\n🔍 5. VERIFICAÇÃO DE CORRESPONDÊNCIA:')
    const statusSlugs = statuses?.map(s => s.slug) || []
    const uniqueTicketStatuses = [...new Set(tickets?.map(t => t.status) || [])]
    
    uniqueTicketStatuses.forEach(ticketStatus => {
      const exists = statusSlugs.includes(ticketStatus)
      console.log(`${exists ? '✅' : '❌'} ${ticketStatus} ${exists ? '→ ENCONTRADO na tabela' : '→ NÃO ENCONTRADO na tabela'}`)
    })
    
    // 6. Resumo final
    console.log('\n📊 6. RESUMO FINAL:')
    console.log(`Total de tickets: ${tickets?.length || 0}`)
    console.log(`Tickets com status em inglês: ${ticketsWithEnglishStatus.length}`)
    console.log(`Tickets com status em português: ${portugueseStatuses.length}`)
    console.log(`Status únicos nos tickets: ${uniqueTicketStatuses.length}`)
    console.log(`Status na tabela: ${statuses?.length || 0}`)
    
    if (ticketsWithEnglishStatus.length === 0) {
      console.log('\n🎉 MIGRAÇÃO COMPLETA! Todos os tickets estão com status em português!')
    } else {
      console.log('\n⚠️ Ainda há tickets com status em inglês que precisam ser migrados.')
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

verifyMigrationStatus()
