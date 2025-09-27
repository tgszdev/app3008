import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function testFixedTickets() {
  console.log('🧪 TESTANDO CRIAÇÃO DE TICKETS APÓS CORREÇÃO...')
  
  try {
    // 1. Testar sequence
    console.log('1️⃣ Testando sequence...')
    const { data: ticketNumber, error: sequenceError } = await supabaseAdmin
      .rpc('get_next_ticket_number')
    
    if (sequenceError) {
      console.error('❌ Erro na sequence:', sequenceError)
      return
    }
    
    console.log(`✅ Sequence funcionando: ${ticketNumber}`)
    
    // 2. Criar ticket para usuário Agro (deve ir para contexto Agro)
    console.log('\n2️⃣ Criando ticket para usuário Agro...')
    
    const agroTicketData = {
      title: 'Teste Agro - Pós Correção',
      description: 'Teste após remover trigger conflitante',
      status: 'open',
      priority: 'medium',
      category: 'general',
      created_by: '3b855060-50d4-4eef-abf5-4eec96934159', // agro@agro.com.br
      context_id: '6486088e-72ae-461b-8b03-32ca84918882', // Contexto do usuário Agro
      ticket_number: ticketNumber,
      is_internal: false
    }
    
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
    
    console.log('✅ Ticket Agro criado:')
    console.log(`  ID: ${agroTicket.id}`)
    console.log(`  Ticket Number: ${agroTicket.ticket_number}`)
    console.log(`  Título: ${agroTicket.title}`)
    console.log(`  Context ID: ${agroTicket.context_id}`)
    console.log(`  Context Name: ${agroTicket.context_info?.name}`)
    console.log(`  Criador: ${agroTicket.created_by_user?.name} (${agroTicket.created_by_user?.email})`)
    console.log(`  Criador Context: ${agroTicket.created_by_user?.context_id}`)
    
    // Verificar se o contexto está correto
    if (agroTicket.context_id === agroTicket.created_by_user?.context_id) {
      console.log('✅ SUCESSO: Contexto do ticket = Contexto do criador')
    } else {
      console.log('❌ PROBLEMA: Contexto do ticket ≠ Contexto do criador')
      console.log(`  Ticket Context: ${agroTicket.context_id}`)
      console.log(`  Criador Context: ${agroTicket.created_by_user?.context_id}`)
    }
    
    // 3. Criar ticket para usuário Simas (deve ir para contexto Simas)
    console.log('\n3️⃣ Criando ticket para usuário Simas...')
    
    const { data: nextTicketNumber, error: nextSequenceError } = await supabaseAdmin
      .rpc('get_next_ticket_number')
    
    if (nextSequenceError) {
      console.error('❌ Erro na sequence:', nextSequenceError)
      return
    }
    
    const simasTicketData = {
      title: 'Teste Simas - Pós Correção',
      description: 'Teste após remover trigger conflitante',
      status: 'open',
      priority: 'medium',
      category: 'general',
      created_by: '3667610b-e7f0-4e79-85e8-4cecc0ebe5bc', // simas@simas.com.br
      context_id: '85879bd8-d1d1-416b-ae55-e564687af28b', // Contexto do usuário Simas
      ticket_number: nextTicketNumber,
      is_internal: false
    }
    
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
    
    console.log('✅ Ticket Simas criado:')
    console.log(`  ID: ${simasTicket.id}`)
    console.log(`  Ticket Number: ${simasTicket.ticket_number}`)
    console.log(`  Título: ${simasTicket.title}`)
    console.log(`  Context ID: ${simasTicket.context_id}`)
    console.log(`  Context Name: ${simasTicket.context_info?.name}`)
    console.log(`  Criador: ${simasTicket.created_by_user?.name} (${simasTicket.created_by_user?.email})`)
    console.log(`  Criador Context: ${simasTicket.created_by_user?.context_id}`)
    
    // Verificar se o contexto está correto
    if (simasTicket.context_id === simasTicket.created_by_user?.context_id) {
      console.log('✅ SUCESSO: Contexto do ticket = Contexto do criador')
    } else {
      console.log('❌ PROBLEMA: Contexto do ticket ≠ Contexto do criador')
      console.log(`  Ticket Context: ${simasTicket.context_id}`)
      console.log(`  Criador Context: ${simasTicket.created_by_user?.context_id}`)
    }
    
    // 4. Resumo final
    console.log('\n📊 RESUMO FINAL:')
    console.log('=' * 50)
    console.log(`✅ Ticket Agro: ${agroTicket.ticket_number} - Contexto: ${agroTicket.context_info?.name}`)
    console.log(`✅ Ticket Simas: ${simasTicket.ticket_number} - Contexto: ${simasTicket.context_info?.name}`)
    
    // Verificar se ambos têm contextos corretos
    const agroCorrect = agroTicket.context_id === agroTicket.created_by_user?.context_id
    const simasCorrect = simasTicket.context_id === simasTicket.created_by_user?.context_id
    
    if (agroCorrect && simasCorrect) {
      console.log('🎉 SUCESSO TOTAL: Ambos os tickets têm contextos corretos!')
    } else {
      console.log('❌ AINDA HÁ PROBLEMAS: Alguns tickets têm contextos incorretos')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testFixedTickets()
