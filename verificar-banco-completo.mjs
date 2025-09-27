import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function verificarBancoCompleto() {
  console.log('🔍 VERIFICAÇÃO COMPLETA DO BANCO DE DADOS...')
  console.log('=' * 60)
  
  try {
    // 1. VERIFICAR TODOS OS TICKETS RECENTES
    console.log('\n1️⃣ TODOS OS TICKETS RECENTES:')
    console.log('-' * 40)
    
    const { data: allTickets, error: allTicketsError } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email, context_id),
        context_info:contexts!tickets_context_id_fkey(id, name)
      `)
      .gte('ticket_number', 50)
      .order('ticket_number')
    
    if (allTicketsError) {
      console.error('❌ Erro ao buscar tickets:', allTicketsError)
      return
    }
    
    console.log(`📋 Total de tickets recentes: ${allTickets.length}`)
    for (const ticket of allTickets) {
      console.log(`\n🎫 TICKET #${ticket.ticket_number}:`)
      console.log(`  Título: ${ticket.title}`)
      console.log(`  Status: ${ticket.status}`)
      console.log(`  Context: ${ticket.context_info?.name} (${ticket.context_id})`)
      console.log(`  Criador: ${ticket.created_by_user?.name} (${ticket.created_by_user?.email})`)
      console.log(`  Criador Context: ${ticket.created_by_user?.context_id}`)
      
      // Verificar consistência
      if (ticket.context_id === ticket.created_by_user?.context_id) {
        console.log(`  ✅ CONSISTENTE`)
      } else {
        console.log(`  ❌ INCONSISTENTE`)
      }
    }
    
    // 2. VERIFICAR USUÁRIOS E SEUS CONTEXTOS
    console.log('\n2️⃣ USUÁRIOS E SEUS CONTEXTOS:')
    console.log('-' * 40)
    
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        user_contexts:user_contexts!user_contexts_user_id_fkey(
          context_id,
          context:contexts!user_contexts_context_id_fkey(id, name, type)
        )
      `)
      .in('email', ['agro@agro.com.br', 'simas@simas.com.br', 'rodrigues2205@icloud.com'])
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError)
      return
    }
    
    for (const user of users) {
      console.log(`\n👤 USUÁRIO: ${user.name} (${user.email})`)
      console.log(`  ID: ${user.id}`)
      console.log(`  Tipo: ${user.user_type}`)
      console.log(`  Role: ${user.role}`)
      console.log(`  Context Principal: ${user.context_id}`)
      console.log(`  Contextos Vinculados: ${user.user_contexts?.length || 0}`)
      
      if (user.user_contexts && user.user_contexts.length > 0) {
        for (const uc of user.user_contexts) {
          console.log(`    - ${uc.context?.name} (${uc.context?.type}) - ID: ${uc.context_id}`)
        }
      }
    }
    
    // 3. VERIFICAR CONTEXTOS/ORGANIZAÇÕES
    console.log('\n3️⃣ CONTEXTOS/ORGANIZAÇÕES:')
    console.log('-' * 40)
    
    const { data: contexts, error: contextsError } = await supabaseAdmin
      .from('contexts')
      .select(`
        *,
        users:user_contexts!user_contexts_context_id_fkey(
          user_id,
          user:users!user_contexts_user_id_fkey(id, name, email)
        )
      `)
      .order('name')
    
    if (contextsError) {
      console.error('❌ Erro ao buscar contextos:', contextsError)
      return
    }
    
    for (const context of contexts) {
      console.log(`\n🏢 CONTEXTO: ${context.name}`)
      console.log(`  ID: ${context.id}`)
      console.log(`  Tipo: ${context.type}`)
      console.log(`  Usuários Vinculados: ${context.users?.length || 0}`)
      
      if (context.users && context.users.length > 0) {
        for (const userContext of context.users) {
          console.log(`    - ${userContext.user?.name} (${userContext.user?.email})`)
        }
      }
    }
    
    // 4. VERIFICAR TICKETS POR CONTEXTO
    console.log('\n4️⃣ TICKETS POR CONTEXTO:')
    console.log('-' * 40)
    
    for (const context of contexts) {
      const { data: contextTickets, error: contextTicketsError } = await supabaseAdmin
        .from('tickets')
        .select(`
          *,
          created_by_user:users!tickets_created_by_fkey(id, name, email, context_id)
        `)
        .eq('context_id', context.id)
        .order('ticket_number')
      
      if (!contextTicketsError && contextTickets) {
        console.log(`\n📋 TICKETS DO CONTEXTO ${context.name}:`)
        console.log(`  Total: ${contextTickets.length}`)
        
        for (const ticket of contextTickets) {
          console.log(`    #${ticket.ticket_number}: ${ticket.title} - ${ticket.created_by_user?.name}`)
        }
      }
    }
    
    // 5. VERIFICAR RELACIONAMENTOS USER_CONTEXTS
    console.log('\n5️⃣ RELACIONAMENTOS USER_CONTEXTS:')
    console.log('-' * 40)
    
    const { data: userContexts, error: userContextsError } = await supabaseAdmin
      .from('user_contexts')
      .select(`
        *,
        user:users!user_contexts_user_id_fkey(id, name, email),
        context:contexts!user_contexts_context_id_fkey(id, name, type)
      `)
      .order('created_at')
    
    if (userContextsError) {
      console.error('❌ Erro ao buscar user_contexts:', userContextsError)
      return
    }
    
    console.log(`📋 Total de relacionamentos: ${userContexts.length}`)
    for (const uc of userContexts) {
      console.log(`  ${uc.user?.name} → ${uc.context?.name} (${uc.context?.type})`)
      console.log(`    User ID: ${uc.user_id}`)
      console.log(`    Context ID: ${uc.context_id}`)
      console.log(`    Criado em: ${uc.created_at}`)
    }
    
    // 6. VERIFICAR TICKETS RECENTES (ÚLTIMOS 10)
    console.log('\n6️⃣ ÚLTIMOS 10 TICKETS:')
    console.log('-' * 40)
    
    const { data: recentTickets, error: recentTicketsError } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email, context_id),
        context_info:contexts!tickets_context_id_fkey(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (recentTicketsError) {
      console.error('❌ Erro ao buscar tickets recentes:', recentTicketsError)
      return
    }
    
    console.log(`📋 Últimos 10 tickets:`)
    for (const ticket of recentTickets) {
      console.log(`  #${ticket.ticket_number}: ${ticket.title}`)
      console.log(`    Context: ${ticket.context_info?.name}`)
      console.log(`    Criador: ${ticket.created_by_user?.name}`)
      console.log(`    Criado em: ${ticket.created_at}`)
    }
    
    // 7. RESUMO FINAL
    console.log('\n7️⃣ RESUMO FINAL:')
    console.log('=' * 60)
    
    console.log(`📊 ESTATÍSTICAS:`)
    console.log(`  Total de tickets: ${allTickets.length}`)
    console.log(`  Total de usuários: ${users.length}`)
    console.log(`  Total de contextos: ${contexts.length}`)
    console.log(`  Total de relacionamentos: ${userContexts.length}`)
    
    // Verificar tickets inconsistentes
    const inconsistentTickets = allTickets.filter(t => 
      t.context_id !== t.created_by_user?.context_id
    )
    
    console.log(`\n🔍 VERIFICAÇÃO DE CONSISTÊNCIA:`)
    if (inconsistentTickets.length > 0) {
      console.log(`  ❌ ${inconsistentTickets.length} tickets com contextos inconsistentes`)
      for (const ticket of inconsistentTickets) {
        console.log(`    - Ticket #${ticket.ticket_number}: Contexto ${ticket.context_id} ≠ Criador ${ticket.created_by_user?.context_id}`)
      }
    } else {
      console.log(`  ✅ Todos os tickets têm contextos consistentes`)
    }
    
    // Verificar usuários sem contextos
    const usersWithoutContexts = users.filter(u => !u.context_id)
    if (usersWithoutContexts.length > 0) {
      console.log(`  ❌ ${usersWithoutContexts.length} usuários sem contexto principal`)
    } else {
      console.log(`  ✅ Todos os usuários têm contexto principal`)
    }
    
    console.log(`\n🎯 STATUS GERAL:`)
    if (inconsistentTickets.length === 0 && usersWithoutContexts.length === 0) {
      console.log(`  🎉 BANCO DE DADOS ESTÁ CORRETO!`)
    } else {
      console.log(`  ⚠️ HÁ PROBLEMAS NO BANCO DE DADOS`)
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

verificarBancoCompleto()
