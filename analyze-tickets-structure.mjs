import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function analyzeTicketsStructure() {
  console.log('🔍 ANÁLISE COMPLETA DOS TICKETS 52, 53 E 54...')
  
  try {
    // 1. Buscar os tickets específicos
    console.log('1️⃣ Buscando tickets 52, 53 e 54...')
    
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email, user_type, context_id),
        assigned_to_user:users!tickets_assigned_to_fkey(id, name, email, user_type, context_id),
        context_info:contexts!tickets_context_id_fkey(id, name)
      `)
      .in('ticket_number', [52, 53, 54])
      .order('ticket_number')
    
    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError)
      return
    }
    
    console.log(`✅ Encontrados ${tickets.length} tickets`)
    
    // 2. Analisar cada ticket
    for (const ticket of tickets) {
      console.log(`\n📋 TICKET #${ticket.ticket_number}:`)
      console.log('=' * 50)
      
      // Informações básicas
      console.log('📝 INFORMAÇÕES BÁSICAS:')
      console.log(`  ID: ${ticket.id}`)
      console.log(`  Título: ${ticket.title}`)
      console.log(`  Descrição: ${ticket.description}`)
      console.log(`  Status: ${ticket.status}`)
      console.log(`  Prioridade: ${ticket.priority}`)
      console.log(`  Categoria: ${ticket.category}`)
      console.log(`  Ticket Number: ${ticket.ticket_number}`)
      console.log(`  É Interno: ${ticket.is_internal}`)
      console.log(`  Context ID: ${ticket.context_id}`)
      console.log(`  Criado em: ${ticket.created_at}`)
      console.log(`  Atualizado em: ${ticket.updated_at}`)
      
      // Informações do criador
      console.log('\n👤 CRIADOR:')
      if (ticket.created_by_user) {
        console.log(`  ID: ${ticket.created_by_user.id}`)
        console.log(`  Nome: ${ticket.created_by_user.name}`)
        console.log(`  Email: ${ticket.created_by_user.email}`)
        console.log(`  Tipo: ${ticket.created_by_user.user_type}`)
        console.log(`  Context ID: ${ticket.created_by_user.context_id}`)
      } else {
        console.log('  ❌ Criador não encontrado')
      }
      
      // Informações do responsável
      console.log('\n🎯 RESPONSÁVEL:')
      if (ticket.assigned_to_user) {
        console.log(`  ID: ${ticket.assigned_to_user.id}`)
        console.log(`  Nome: ${ticket.assigned_to_user.name}`)
        console.log(`  Email: ${ticket.assigned_to_user.email}`)
        console.log(`  Tipo: ${ticket.assigned_to_user.user_type}`)
        console.log(`  Context ID: ${ticket.assigned_to_user.context_id}`)
      } else {
        console.log('  ❌ Responsável não atribuído')
      }
      
      // Informações do contexto
      console.log('\n🏢 CONTEXTO/ORGANIZAÇÃO:')
      if (ticket.context_info) {
        console.log(`  ID: ${ticket.context_info.id}`)
        console.log(`  Nome: ${ticket.context_info.name}`)
      } else {
        console.log('  ❌ Contexto não encontrado')
      }
      
      // Verificar consistência
      console.log('\n✅ VERIFICAÇÃO DE CONSISTÊNCIA:')
      
      // Verificar se o contexto do ticket bate com o contexto do criador
      if (ticket.created_by_user && ticket.context_id === ticket.created_by_user.context_id) {
        console.log('  ✅ Contexto do ticket = Contexto do criador')
      } else {
        console.log('  ❌ Contexto do ticket ≠ Contexto do criador')
        console.log(`    Ticket Context: ${ticket.context_id}`)
        console.log(`    Criador Context: ${ticket.created_by_user?.context_id}`)
      }
      
      // Verificar se o ticket_number está correto
      if (ticket.ticket_number >= 52 && ticket.ticket_number <= 54) {
        console.log('  ✅ Ticket number está na faixa esperada')
      } else {
        console.log('  ❌ Ticket number fora da faixa esperada')
      }
      
      // Verificar se não é interno (deve ser false)
      if (ticket.is_internal === false) {
        console.log('  ✅ Ticket não é interno (correto)')
      } else {
        console.log('  ❌ Ticket é interno (incorreto)')
      }
    }
    
    // 3. Verificar organizações/contextos
    console.log('\n🏢 VERIFICANDO ORGANIZAÇÕES:')
    
    const { data: contexts, error: contextsError } = await supabaseAdmin
      .from('contexts')
      .select('*')
      .in('id', tickets.map(t => t.context_id))
    
    if (contextsError) {
      console.error('❌ Erro ao buscar contextos:', contextsError)
      return
    }
    
    console.log('📋 Contextos encontrados:')
    for (const context of contexts) {
      console.log(`  ${context.name} (ID: ${context.id})`)
    }
    
    // 4. Verificar usuários
    console.log('\n👥 VERIFICANDO USUÁRIOS:')
    
    const userIds = tickets.map(t => t.created_by).filter(Boolean)
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .in('id', userIds)
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError)
      return
    }
    
    console.log('📋 Usuários encontrados:')
    for (const user of users) {
      console.log(`  ${user.name} (${user.email}) - Tipo: ${user.user_type} - Context: ${user.context_id}`)
    }
    
    // 5. Resumo final
    console.log('\n📊 RESUMO FINAL:')
    console.log('=' * 50)
    
    const luftTickets = tickets.filter(t => t.context_id === '85879bd8-d1d1-416b-ae55-e564687af28b')
    const simasTickets = tickets.filter(t => t.context_id === '85879bd8-d1d1-416b-ae55-e564687af28b')
    
    console.log(`✅ Tickets Luft Agro: ${luftTickets.length}`)
    console.log(`✅ Tickets Simas Log: ${simasTickets.length}`)
    console.log(`✅ Total de tickets: ${tickets.length}`)
    
    // Verificar se todos têm contexto correto
    const ticketsWithContext = tickets.filter(t => t.context_id)
    console.log(`✅ Tickets com contexto: ${ticketsWithContext.length}/${tickets.length}`)
    
    // Verificar se todos têm ticket_number correto
    const ticketsWithNumber = tickets.filter(t => t.ticket_number >= 52 && t.ticket_number <= 54)
    console.log(`✅ Tickets com número correto: ${ticketsWithNumber.length}/${tickets.length}`)
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

analyzeTicketsStructure()
