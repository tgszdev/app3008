import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function verificarTicket60() {
  console.log('🔍 VERIFICANDO TICKET #60...')
  console.log('=' * 60)
  
  try {
    // 1. Buscar o ticket #60
    console.log('1️⃣ BUSCANDO TICKET #60...')
    
    const { data: ticket60, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email, context_id),
        context_info:contexts!tickets_context_id_fkey(id, name)
      `)
      .eq('ticket_number', 60)
      .single()
    
    if (ticketError) {
      console.error('❌ Erro ao buscar ticket #60:', ticketError)
      return
    }
    
    console.log('📋 TICKET #60:')
    console.log(`  ID: ${ticket60.id}`)
    console.log(`  Ticket Number: ${ticket60.ticket_number}`)
    console.log(`  Título: ${ticket60.title}`)
    console.log(`  Descrição: ${ticket60.description}`)
    console.log(`  Status: ${ticket60.status}`)
    console.log(`  Prioridade: ${ticket60.priority}`)
    console.log(`  Categoria: ${ticket60.category}`)
    console.log(`  Context ID: ${ticket60.context_id}`)
    console.log(`  Context Name: ${ticket60.context_info?.name}`)
    console.log(`  Criado por: ${ticket60.created_by_user?.name} (${ticket60.created_by_user?.email})`)
    console.log(`  Criador Context: ${ticket60.created_by_user?.context_id}`)
    console.log(`  É Interno: ${ticket60.is_internal}`)
    console.log(`  Criado em: ${ticket60.created_at}`)
    
    // 2. Verificar consistência
    console.log('\n2️⃣ VERIFICAÇÃO DE CONSISTÊNCIA:')
    if (ticket60.context_id === ticket60.created_by_user?.context_id) {
      console.log('✅ SUCESSO: Contexto do ticket = Contexto do criador')
    } else {
      console.log('❌ PROBLEMA: Contexto do ticket ≠ Contexto do criador')
      console.log(`  Ticket Context: ${ticket60.context_id}`)
      console.log(`  Criador Context: ${ticket60.created_by_user?.context_id}`)
    }
    
    // 3. Verificar qual usuário criou
    console.log('\n3️⃣ INFORMAÇÕES DO CRIADOR:')
    if (ticket60.created_by_user) {
      console.log(`  Nome: ${ticket60.created_by_user.name}`)
      console.log(`  Email: ${ticket60.created_by_user.email}`)
      console.log(`  Context ID: ${ticket60.created_by_user.context_id}`)
      
      // Buscar contexto do criador
      const { data: creatorContext, error: creatorContextError } = await supabaseAdmin
        .from('contexts')
        .select('id, name')
        .eq('id', ticket60.created_by_user.context_id)
        .single()
      
      if (!creatorContextError && creatorContext) {
        console.log(`  Context Name: ${creatorContext.name}`)
      }
    }
    
    // 4. Verificar contexto do ticket
    console.log('\n4️⃣ INFORMAÇÕES DO CONTEXTO DO TICKET:')
    if (ticket60.context_info) {
      console.log(`  Context ID: ${ticket60.context_info.id}`)
      console.log(`  Context Name: ${ticket60.context_info.name}`)
    }
    
    // 5. Testar acesso dos usuários
    console.log('\n5️⃣ TESTANDO ACESSO DOS USUÁRIOS:')
    
    // Simular acesso do usuário Agro
    console.log('\n🔍 SIMULANDO ACESSO DO USUÁRIO AGRO (Luft Agro):')
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
    console.log('\n🔍 SIMULANDO ACESSO DO USUÁRIO SIMAS (Simas Log):')
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
    console.log('\n6️⃣ RESUMO FINAL:')
    console.log('=' * 60)
    
    const isConsistent = ticket60.context_id === ticket60.created_by_user?.context_id
    
    if (isConsistent) {
      console.log('🎉 SUCESSO: Ticket #60 foi criado com contexto correto!')
      console.log('✅ O problema foi resolvido!')
    } else {
      console.log('❌ PROBLEMA: Ticket #60 ainda tem contexto incorreto')
      console.log('🔍 Ainda há interferência no contexto dos tickets')
    }
    
    console.log(`\n📊 DETALHES DO TICKET #60:`)
    console.log(`  Criador: ${ticket60.created_by_user?.name} (${ticket60.created_by_user?.email})`)
    console.log(`  Contexto do Criador: ${ticket60.created_by_user?.context_id}`)
    console.log(`  Contexto do Ticket: ${ticket60.context_id}`)
    console.log(`  Organização do Ticket: ${ticket60.context_info?.name}`)
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

verificarTicket60()
