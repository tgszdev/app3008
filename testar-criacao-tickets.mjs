import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function testarCriacaoTickets() {
  console.log('🧪 TESTANDO CRIAÇÃO DE TICKETS PARA IDENTIFICAR PROBLEMA...')
  console.log('=' * 60)
  
  try {
    // 1. Testar sequence
    console.log('1️⃣ TESTANDO SEQUENCE...')
    
    const { data: ticketNumber, error: sequenceError } = await supabaseAdmin
      .rpc('get_next_ticket_number')
    
    if (sequenceError) {
      console.error('❌ Erro na sequence:', sequenceError)
      return
    }
    
    console.log(`✅ Sequence funcionando: ${ticketNumber}`)
    
    // 2. Criar ticket para usuário Agro (deve ir para Luft Agro)
    console.log('\n2️⃣ CRIANDO TICKET PARA USUÁRIO AGRO...')
    
    const agroTicketData = {
      title: 'Teste Agro - Identificação Problema',
      description: 'Teste para identificar problema de contexto',
      status: 'open',
      priority: 'medium',
      category: 'general',
      created_by: '3b855060-50d4-4eef-abf5-4eec96934159', // agro@agro.com.br
      context_id: '6486088e-72ae-461b-8b03-32ca84918882', // Luft Agro
      ticket_number: ticketNumber,
      is_internal: false
    }
    
    console.log('📋 DADOS DO TICKET AGRO:')
    console.log(`  Criado por: ${agroTicketData.created_by}`)
    console.log(`  Context ID: ${agroTicketData.context_id}`)
    console.log(`  Ticket Number: ${agroTicketData.ticket_number}`)
    
    const { data: agroTicket, error: agroError } = await supabaseAdmin
      .from('tickets')
      .insert(agroTicketData)
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email, context_id),
        context_info:contexts!tickets_context_id_fkey(id, name)
      `)
      .single()
    
    if (agroError) {
      console.error('❌ Erro ao criar ticket Agro:', agroError)
      return
    }
    
    console.log('✅ TICKET AGRO CRIADO:')
    console.log(`  ID: ${agroTicket.id}`)
    console.log(`  Ticket Number: ${agroTicket.ticket_number}`)
    console.log(`  Título: ${agroTicket.title}`)
    console.log(`  Context ID: ${agroTicket.context_id}`)
    console.log(`  Context Name: ${agroTicket.context_info?.name}`)
    console.log(`  Criador: ${agroTicket.created_by_user?.name} (${agroTicket.created_by_user?.email})`)
    console.log(`  Criador Context: ${agroTicket.created_by_user?.context_id}`)
    
    // Verificar se o contexto está correto
    console.log('\n🔍 VERIFICAÇÃO DE CONSISTÊNCIA:')
    if (agroTicket.context_id === agroTicket.created_by_user?.context_id) {
      console.log('✅ SUCESSO: Contexto do ticket = Contexto do criador')
    } else {
      console.log('❌ PROBLEMA: Contexto do ticket ≠ Contexto do criador')
      console.log(`  Ticket Context: ${agroTicket.context_id}`)
      console.log(`  Criador Context: ${agroTicket.created_by_user?.context_id}`)
    }
    
    // 3. Criar ticket para usuário Simas (deve ir para Simas Log)
    console.log('\n3️⃣ CRIANDO TICKET PARA USUÁRIO SIMAS...')
    
    const { data: nextTicketNumber, error: nextSequenceError } = await supabaseAdmin
      .rpc('get_next_ticket_number')
    
    if (nextSequenceError) {
      console.error('❌ Erro na sequence:', nextSequenceError)
      return
    }
    
    const simasTicketData = {
      title: 'Teste Simas - Identificação Problema',
      description: 'Teste para identificar problema de contexto',
      status: 'open',
      priority: 'medium',
      category: 'general',
      created_by: '3667610b-e7f0-4e79-85e8-4cecc0ebe5bc', // simas@simas.com.br
      context_id: '85879bd8-d1d1-416b-ae55-e564687af28b', // Simas Log
      ticket_number: nextTicketNumber,
      is_internal: false
    }
    
    console.log('📋 DADOS DO TICKET SIMAS:')
    console.log(`  Criado por: ${simasTicketData.created_by}`)
    console.log(`  Context ID: ${simasTicketData.context_id}`)
    console.log(`  Ticket Number: ${simasTicketData.ticket_number}`)
    
    const { data: simasTicket, error: simasError } = await supabaseAdmin
      .from('tickets')
      .insert(simasTicketData)
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email, context_id),
        context_info:contexts!tickets_context_id_fkey(id, name)
      `)
      .single()
    
    if (simasError) {
      console.error('❌ Erro ao criar ticket Simas:', simasError)
      return
    }
    
    console.log('✅ TICKET SIMAS CRIADO:')
    console.log(`  ID: ${simasTicket.id}`)
    console.log(`  Ticket Number: ${simasTicket.ticket_number}`)
    console.log(`  Título: ${simasTicket.title}`)
    console.log(`  Context ID: ${simasTicket.context_id}`)
    console.log(`  Context Name: ${simasTicket.context_info?.name}`)
    console.log(`  Criador: ${simasTicket.created_by_user?.name} (${simasTicket.created_by_user?.email})`)
    console.log(`  Criador Context: ${simasTicket.created_by_user?.context_id}`)
    
    // Verificar se o contexto está correto
    console.log('\n🔍 VERIFICAÇÃO DE CONSISTÊNCIA:')
    if (simasTicket.context_id === simasTicket.created_by_user?.context_id) {
      console.log('✅ SUCESSO: Contexto do ticket = Contexto do criador')
    } else {
      console.log('❌ PROBLEMA: Contexto do ticket ≠ Contexto do criador')
      console.log(`  Ticket Context: ${simasTicket.context_id}`)
      console.log(`  Criador Context: ${simasTicket.created_by_user?.context_id}`)
    }
    
    // 4. Testar acesso dos usuários
    console.log('\n4️⃣ TESTANDO ACESSO DOS USUÁRIOS...')
    
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
    
    // 5. Resumo final
    console.log('\n5️⃣ RESUMO FINAL:')
    console.log('=' * 60)
    
    const agroCorrect = agroTicket.context_id === agroTicket.created_by_user?.context_id
    const simasCorrect = simasTicket.context_id === simasTicket.created_by_user?.context_id
    
    console.log(`✅ Ticket Agro: #${agroTicket.ticket_number} - Contexto: ${agroTicket.context_info?.name}`)
    console.log(`✅ Ticket Simas: #${simasTicket.ticket_number} - Contexto: ${simasTicket.context_info?.name}`)
    
    if (agroCorrect && simasCorrect) {
      console.log('🎉 SUCESSO TOTAL: Ambos os tickets têm contextos corretos!')
      console.log('✅ O problema foi resolvido!')
    } else {
      console.log('❌ PROBLEMA PERSISTE: Alguns tickets têm contextos incorretos')
      console.log('🔍 Ainda há interferência no contexto dos tickets')
    }
    
    // 6. Identificar o problema específico
    console.log('\n6️⃣ IDENTIFICAÇÃO DO PROBLEMA:')
    if (!agroCorrect) {
      console.log('❌ PROBLEMA NO TICKET AGRO:')
      console.log(`  Esperado: Contexto do criador (${agroTicket.created_by_user?.context_id})`)
      console.log(`  Recebido: Contexto do ticket (${agroTicket.context_id})`)
    }
    
    if (!simasCorrect) {
      console.log('❌ PROBLEMA NO TICKET SIMAS:')
      console.log(`  Esperado: Contexto do criador (${simasTicket.created_by_user?.context_id})`)
      console.log(`  Recebido: Contexto do ticket (${simasTicket.context_id})`)
    }
    
    if (agroCorrect && simasCorrect) {
      console.log('✅ NENHUM PROBLEMA IDENTIFICADO: Todos os tickets têm contextos corretos!')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testarCriacaoTickets()
