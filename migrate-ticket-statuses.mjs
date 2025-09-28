import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function migrateTicketStatuses() {
  console.log('🔄 MIGRAÇÃO DE STATUS DOS TICKETS')
  console.log('=================================')
  
  try {
    // 1. Mapeamento dos status atuais para os corretos
    const statusMapping = {
      // Status em inglês → Status correto em português
      'open': 'ABERTO',
      'in_progress': 'EM ATENDIMENTO', 
      'resolved': 'RESOLVIDO',
      
      // Status com slugs diferentes → Status correto
      'em-homologacao': 'EM HOMOLOGAÇÃO',
      'ag-deploy-em-homologacao': 'AG DEPLOY EM HOMOLOGAÇÃO',
      'ag-deploy-em-producao': 'AG DEPLOY EM PRODUÇÃO',
      'cancelado': 'CANCELADO'
    }
    
    console.log('\n📋 1. MAPEAMENTO DE STATUS:')
    Object.entries(statusMapping).forEach(([from, to]) => {
      console.log(`${from} → ${to}`)
    })
    
    // 2. Verificar quantos tickets serão afetados
    console.log('\n🔍 2. VERIFICANDO TICKETS AFETADOS:')
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, status, ticket_number')
      .not('status', 'is', null)
    
    const ticketsToUpdate = tickets?.filter(ticket => 
      Object.keys(statusMapping).includes(ticket.status)
    ) || []
    
    console.log(`Total de tickets: ${tickets?.length || 0}`)
    console.log(`Tickets que serão atualizados: ${ticketsToUpdate.length}`)
    
    // 3. Mostrar quais tickets serão atualizados
    console.log('\n📝 3. TICKETS QUE SERÃO ATUALIZADOS:')
    ticketsToUpdate.forEach((ticket, index) => {
      const newStatus = statusMapping[ticket.status]
      console.log(`${index + 1}. Ticket #${ticket.ticket_number}: ${ticket.status} → ${newStatus}`)
    })
    
    // 4. Confirmar antes de executar
    console.log('\n⚠️ 4. CONFIRMAÇÃO:')
    console.log('Esta migração irá atualizar os status dos tickets para usar os status corretos cadastrados na tabela.')
    console.log('Deseja continuar? (Sim/Não)')
    
    // Para este script, vamos simular a confirmação
    const confirm = true // Em produção, você pediria confirmação do usuário
    
    if (confirm) {
      console.log('\n🔄 5. EXECUTANDO MIGRAÇÃO:')
      
      // Atualizar cada status
      for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
        console.log(`\nAtualizando ${oldStatus} → ${newStatus}...`)
        
        const { data: updateResult, error } = await supabase
          .from('tickets')
          .update({ status: newStatus })
          .eq('status', oldStatus)
          .select('id, ticket_number, status')
        
        if (error) {
          console.error(`❌ Erro ao atualizar ${oldStatus}:`, error)
        } else {
          console.log(`✅ ${updateResult?.length || 0} tickets atualizados de ${oldStatus} para ${newStatus}`)
        }
      }
      
      // 5. Verificar resultado final
      console.log('\n✅ 6. VERIFICAÇÃO FINAL:')
      const { data: finalTickets } = await supabase
        .from('tickets')
        .select('status')
        .not('status', 'is', null)
      
      const finalStatuses = [...new Set(finalTickets?.map(t => t.status) || [])]
      console.log(`Status únicos após migração: ${finalStatuses.length}`)
      finalStatuses.forEach((status, index) => {
        console.log(`${index + 1}. ${status}`)
      })
      
      // Verificar se ainda há status em inglês
      const englishStatuses = finalStatuses.filter(status => 
        ['open', 'in_progress', 'resolved', 'closed', 'cancelled'].includes(status)
      )
      
      if (englishStatuses.length > 0) {
        console.log(`\n⚠️ Ainda há status em inglês: ${englishStatuses.join(', ')}`)
      } else {
        console.log(`\n✅ Migração concluída! Todos os status estão em português.`)
      }
      
    } else {
      console.log('❌ Migração cancelada pelo usuário.')
    }
    
  } catch (error) {
    console.error('❌ Erro na migração:', error)
  }
}

migrateTicketStatuses()
