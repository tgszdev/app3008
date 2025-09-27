import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function diagnosticoCompleto() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO BANCO DE DADOS...')
  console.log('=' * 60)
  
  try {
    // 1. ANÁLISE DO TICKET 57
    console.log('\n1️⃣ ANÁLISE DO TICKET 57:')
    console.log('-' * 40)
    
    const { data: ticket57, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email, user_type, context_id),
        context_info:contexts!tickets_context_id_fkey(id, name)
      `)
      .eq('ticket_number', 57)
      .single()
    
    if (ticketError) {
      console.error('❌ Erro ao buscar ticket 57:', ticketError)
      return
    }
    
    console.log('📋 TICKET 57:')
    console.log(`  ID: ${ticket57.id}`)
    console.log(`  Ticket Number: ${ticket57.ticket_number}`)
    console.log(`  Título: ${ticket57.title}`)
    console.log(`  Status: ${ticket57.status}`)
    console.log(`  Context ID: ${ticket57.context_id}`)
    console.log(`  Context Name: ${ticket57.context_info?.name}`)
    console.log(`  Criado por: ${ticket57.created_by_user?.name} (${ticket57.created_by_user?.email})`)
    console.log(`  Criador Context: ${ticket57.created_by_user?.context_id}`)
    console.log(`  É Interno: ${ticket57.is_internal}`)
    
    // 2. ANÁLISE DOS USUÁRIOS
    console.log('\n2️⃣ ANÁLISE DOS USUÁRIOS:')
    console.log('-' * 40)
    
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        user_contexts:user_contexts!user_contexts_user_id_fkey(
          context_id,
          context:contexts!user_contexts_context_id_fkey(id, name)
        )
      `)
      .in('email', ['agro@agro.com.br', 'simas@simas.com.br'])
    
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
          console.log(`    - ${uc.context?.name} (ID: ${uc.context_id})`)
        }
      }
    }
    
    // 3. ANÁLISE DOS CONTEXTOS/ORGANIZAÇÕES
    console.log('\n3️⃣ ANÁLISE DOS CONTEXTOS:')
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
      .in('id', ['6486088e-72ae-461b-8b03-32ca84918882', '85879bd8-d1d1-416b-ae55-e564687af28b'])
    
    if (contextsError) {
      console.error('❌ Erro ao buscar contextos:', contextsError)
      return
    }
    
    for (const context of contexts) {
      console.log(`\n🏢 CONTEXTO: ${context.name}`)
      console.log(`  ID: ${context.id}`)
      console.log(`  Descrição: ${context.description || 'N/A'}`)
      console.log(`  Usuários Vinculados: ${context.users?.length || 0}`)
      
      if (context.users && context.users.length > 0) {
        for (const userContext of context.users) {
          console.log(`    - ${userContext.user?.name} (${userContext.user?.email})`)
        }
      }
    }
    
    // 4. ANÁLISE DA TABELA USER_CONTEXTS
    console.log('\n4️⃣ ANÁLISE DA TABELA USER_CONTEXTS:')
    console.log('-' * 40)
    
    const { data: userContexts, error: userContextsError } = await supabaseAdmin
      .from('user_contexts')
      .select(`
        *,
        user:users!user_contexts_user_id_fkey(id, name, email),
        context:contexts!user_contexts_context_id_fkey(id, name)
      `)
      .in('user_id', users.map(u => u.id))
    
    if (userContextsError) {
      console.error('❌ Erro ao buscar user_contexts:', userContextsError)
      return
    }
    
    console.log('📋 RELACIONAMENTOS USER_CONTEXTS:')
    for (const uc of userContexts) {
      console.log(`  ${uc.user?.name} → ${uc.context?.name}`)
      console.log(`    User ID: ${uc.user_id}`)
      console.log(`    Context ID: ${uc.context_id}`)
      console.log(`    Criado em: ${uc.created_at}`)
    }
    
    // 5. ANÁLISE DE TODOS OS TICKETS RECENTES
    console.log('\n5️⃣ ANÁLISE DE TODOS OS TICKETS RECENTES:')
    console.log('-' * 40)
    
    const { data: allTickets, error: allTicketsError } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email, context_id),
        context_info:contexts!tickets_context_id_fkey(id, name)
      `)
      .gte('ticket_number', 52)
      .order('ticket_number')
    
    if (allTicketsError) {
      console.error('❌ Erro ao buscar todos os tickets:', allTicketsError)
      return
    }
    
    console.log('📋 TICKETS RECENTES:')
    for (const ticket of allTickets) {
      console.log(`\n🎫 TICKET #${ticket.ticket_number}:`)
      console.log(`  Título: ${ticket.title}`)
      console.log(`  Context: ${ticket.context_info?.name} (${ticket.context_id})`)
      console.log(`  Criador: ${ticket.created_by_user?.name} (${ticket.created_by_user?.email})`)
      console.log(`  Criador Context: ${ticket.created_by_user?.context_id}`)
      
      // Verificar consistência
      if (ticket.context_id === ticket.created_by_user?.context_id) {
        console.log(`  ✅ CONSISTENTE: Contexto do ticket = Contexto do criador`)
      } else {
        console.log(`  ❌ INCONSISTENTE: Contexto do ticket ≠ Contexto do criador`)
      }
    }
    
    // 6. ANÁLISE DE POLÍTICAS RLS
    console.log('\n6️⃣ ANÁLISE DE POLÍTICAS RLS:')
    console.log('-' * 40)
    
    const { data: rlsPolicies, error: rlsError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
          FROM pg_policies 
          WHERE tablename = 'tickets'
        `
      })
    
    if (rlsError) {
      console.log('⚠️ Não foi possível verificar políticas RLS (função exec_sql não disponível)')
    } else {
      console.log('📋 POLÍTICAS RLS NA TABELA TICKETS:')
      console.log(JSON.stringify(rlsPolicies, null, 2))
    }
    
    // 7. TESTE DE ACESSO SIMULADO
    console.log('\n7️⃣ TESTE DE ACESSO SIMULADO:')
    console.log('-' * 40)
    
    // Simular acesso do usuário simas@simas.com.br
    console.log('🔍 Simulando acesso do usuário simas@simas.com.br...')
    
    const simasUser = users.find(u => u.email === 'simas@simas.com.br')
    if (simasUser) {
      console.log(`Usuário: ${simasUser.name} (${simasUser.email})`)
      console.log(`Tipo: ${simasUser.user_type}`)
      console.log(`Context Principal: ${simasUser.context_id}`)
      
      // Verificar quais tickets ele deveria ver
      const { data: simasTickets, error: simasTicketsError } = await supabaseAdmin
        .from('tickets')
        .select(`
          *,
          created_by_user:users!tickets_created_by_fkey(id, name, email, context_id),
          context_info:contexts!tickets_context_id_fkey(id, name)
        `)
        .eq('context_id', simasUser.context_id)
        .order('ticket_number')
      
      if (simasTicketsError) {
        console.error('❌ Erro ao buscar tickets do Simas:', simasTicketsError)
      } else {
        console.log(`\n📋 TICKETS QUE SIMAS DEVERIA VER (context_id: ${simasUser.context_id}):`)
        for (const ticket of simasTickets) {
          console.log(`  #${ticket.ticket_number}: ${ticket.title} - ${ticket.context_info?.name}`)
        }
      }
    }
    
    // 8. RESUMO FINAL
    console.log('\n8️⃣ RESUMO FINAL:')
    console.log('=' * 60)
    
    console.log('📊 ESTATÍSTICAS:')
    console.log(`  Total de usuários analisados: ${users.length}`)
    console.log(`  Total de contextos analisados: ${contexts.length}`)
    console.log(`  Total de relacionamentos user_contexts: ${userContexts.length}`)
    console.log(`  Total de tickets recentes: ${allTickets.length}`)
    
    console.log('\n🔍 PROBLEMAS IDENTIFICADOS:')
    
    // Verificar se há tickets com contextos incorretos
    const inconsistentTickets = allTickets.filter(t => 
      t.context_id !== t.created_by_user?.context_id
    )
    
    if (inconsistentTickets.length > 0) {
      console.log(`  ❌ ${inconsistentTickets.length} tickets com contextos inconsistentes`)
      for (const ticket of inconsistentTickets) {
        console.log(`    - Ticket #${ticket.ticket_number}: Contexto ${ticket.context_id} ≠ Criador ${ticket.created_by_user?.context_id}`)
      }
    } else {
      console.log(`  ✅ Todos os tickets têm contextos consistentes`)
    }
    
    // Verificar se há usuários sem contextos
    const usersWithoutContexts = users.filter(u => !u.context_id)
    if (usersWithoutContexts.length > 0) {
      console.log(`  ❌ ${usersWithoutContexts.length} usuários sem contexto principal`)
    } else {
      console.log(`  ✅ Todos os usuários têm contexto principal`)
    }
    
    console.log('\n🎯 PRÓXIMOS PASSOS SUGERIDOS:')
    console.log('1. Verificar se as políticas RLS estão corretas')
    console.log('2. Verificar se há triggers ou funções que estão interferindo')
    console.log('3. Testar a API de listagem de tickets com diferentes usuários')
    console.log('4. Verificar se o frontend está aplicando filtros corretos')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

diagnosticoCompleto()
