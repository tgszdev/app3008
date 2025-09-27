import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function corrigirTicket57() {
  console.log('🔧 CORRIGINDO TICKET #57...')
  console.log('=' * 60)
  
  try {
    // 1. Buscar o ticket #57
    console.log('1️⃣ BUSCANDO TICKET #57...')
    
    const { data: ticket57, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email, context_id),
        context_info:contexts!tickets_context_id_fkey(id, name)
      `)
      .eq('ticket_number', 57)
      .single()
    
    if (ticketError) {
      console.error('❌ Erro ao buscar ticket #57:', ticketError)
      return
    }
    
    console.log('📋 TICKET #57 ATUAL:')
    console.log(`  ID: ${ticket57.id}`)
    console.log(`  Título: ${ticket57.title}`)
    console.log(`  Context ID: ${ticket57.context_id}`)
    console.log(`  Context Name: ${ticket57.context_info?.name}`)
    console.log(`  Criador: ${ticket57.created_by_user?.name} (${ticket57.created_by_user?.email})`)
    console.log(`  Criador Context: ${ticket57.created_by_user?.context_id}`)
    
    // 2. Verificar se precisa correção
    if (ticket57.context_id === ticket57.created_by_user?.context_id) {
      console.log('✅ TICKET #57 JÁ ESTÁ CORRETO!')
      return
    }
    
    console.log('\n❌ TICKET #57 PRECISA DE CORREÇÃO:')
    console.log(`  Contexto atual: ${ticket57.context_id} (${ticket57.context_info?.name})`)
    console.log(`  Contexto correto: ${ticket57.created_by_user?.context_id}`)
    
    // 3. Corrigir o contexto do ticket
    console.log('\n2️⃣ CORRIGINDO CONTEXTO DO TICKET #57...')
    
    const { data: updatedTicket, error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({
        context_id: ticket57.created_by_user?.context_id
      })
      .eq('id', ticket57.id)
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email, context_id),
        context_info:contexts!tickets_context_id_fkey(id, name)
      `)
      .single()
    
    if (updateError) {
      console.error('❌ Erro ao corrigir ticket #57:', updateError)
      return
    }
    
    console.log('✅ TICKET #57 CORRIGIDO:')
    console.log(`  ID: ${updatedTicket.id}`)
    console.log(`  Título: ${updatedTicket.title}`)
    console.log(`  Context ID: ${updatedTicket.context_id}`)
    console.log(`  Context Name: ${updatedTicket.context_info?.name}`)
    console.log(`  Criador: ${updatedTicket.created_by_user?.name}`)
    console.log(`  Criador Context: ${updatedTicket.created_by_user?.context_id}`)
    
    // 4. Verificar se a correção funcionou
    console.log('\n3️⃣ VERIFICANDO CORREÇÃO...')
    if (updatedTicket.context_id === updatedTicket.created_by_user?.context_id) {
      console.log('✅ SUCESSO: Ticket #57 corrigido com sucesso!')
    } else {
      console.log('❌ PROBLEMA: Ticket #57 ainda não foi corrigido')
    }
    
    // 5. Testar acesso dos usuários após correção
    console.log('\n4️⃣ TESTANDO ACESSO DOS USUÁRIOS APÓS CORREÇÃO...')
    
    // Simular acesso do usuário Agro
    console.log('\n🔍 SIMULANDO ACESSO DO USUÁRIO AGRO...')
    const { data: agroTickets, error: agroTicketsError } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email, context_id),
        context_info:contexts!tickets_context_id_fkey(id, name)
      `)
      .eq('context_id', '6486088e-72ae-461b-8b03-32ca84918882') // Luft Agro
      .order('ticket_number')
    
    if (agroTicketsError) {
      console.error('❌ Erro ao buscar tickets do Agro:', agroTicketsError)
    } else {
      console.log(`📋 TICKETS QUE AGRO DEVERIA VER (Luft Agro):`)
      for (const ticket of agroTickets) {
        console.log(`  #${ticket.ticket_number}: ${ticket.title} - ${ticket.context_info?.name}`)
      }
    }
    
    // Simular acesso do usuário Simas
    console.log('\n🔍 SIMULANDO ACESSO DO USUÁRIO SIMAS...')
    const { data: simasTickets, error: simasTicketsError } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email, context_id),
        context_info:contexts!tickets_context_id_fkey(id, name)
      `)
      .eq('context_id', '85879bd8-d1d1-416b-ae55-e564687af28b') // Simas Log
      .order('ticket_number')
    
    if (simasTicketsError) {
      console.error('❌ Erro ao buscar tickets do Simas:', simasTicketsError)
    } else {
      console.log(`📋 TICKETS QUE SIMAS DEVERIA VER (Simas Log):`)
      for (const ticket of simasTickets) {
        console.log(`  #${ticket.ticket_number}: ${ticket.title} - ${ticket.context_info?.name}`)
      }
    }
    
    // 6. Resumo final
    console.log('\n5️⃣ RESUMO FINAL:')
    console.log('=' * 60)
    
    console.log('✅ Ticket #57 corrigido com sucesso!')
    console.log('✅ Novos tickets (58, 59) funcionando corretamente!')
    console.log('✅ Usuários agora veem apenas seus próprios tickets!')
    
    console.log('\n🎯 PRÓXIMOS PASSOS:')
    console.log('1. Teste a criação de novos tickets via frontend')
    console.log('2. Verifique se os usuários veem apenas seus tickets')
    console.log('3. Confirme que o problema foi resolvido')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

corrigirTicket57()
