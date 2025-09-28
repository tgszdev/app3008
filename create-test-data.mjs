import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase com service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestData() {
  console.log('🔧 CRIANDO DADOS DE TESTE')
  console.log('========================')
  
  try {
    // 1. Criar status
    console.log('\n📋 1. CRIANDO STATUS:')
    
    const statuses = [
      { name: 'Aberto', slug: 'open', color: '#3B82F6', order_index: 1 },
      { name: 'Em Progresso', slug: 'in_progress', color: '#F59E0B', order_index: 2 },
      { name: 'Resolvido', slug: 'resolved', color: '#10B981', order_index: 3 },
      { name: 'Fechado', slug: 'closed', color: '#6B7280', order_index: 4 },
      { name: 'Cancelado', slug: 'cancelled', color: '#EF4444', order_index: 5 }
    ]
    
    const { data: insertedStatuses, error: statusError } = await supabase
      .from('ticket_statuses')
      .upsert(statuses, { onConflict: 'slug' })
      .select()
    
    if (statusError) {
      console.log('❌ Erro ao criar status:', statusError)
    } else {
      console.log('✅ Status criados:', insertedStatuses?.length || 0)
    }
    
    // 2. Criar contextos
    console.log('\n🏢 2. CRIANDO CONTEXTOS:')
    
    const contexts = [
      { name: 'Simas Log', slug: 'simas-log', type: 'organization' },
      { name: 'Luft Agro - Barueri', slug: 'luft-agro-barueri', type: 'organization' },
      { name: 'Luft - Solutions', slug: 'luft-solutions', type: 'organization' },
      { name: 'Cargo Lift', slug: 'cargo-lift', type: 'organization' }
    ]
    
    const { data: insertedContexts, error: contextError } = await supabase
      .from('contexts')
      .upsert(contexts, { onConflict: 'slug' })
      .select()
    
    if (contextError) {
      console.log('❌ Erro ao criar contextos:', contextError)
    } else {
      console.log('✅ Contextos criados:', insertedContexts?.length || 0)
    }
    
    // 3. Criar usuário de teste
    console.log('\n👤 3. CRIANDO USUÁRIO DE TESTE:')
    
    const testUser = {
      id: 'test-user-123',
      email: 'rodrigues2205@icloud.com',
      name: 'Rodrigues Test',
      role: 'admin',
      user_type: 'matrix'
    }
    
    const { data: insertedUser, error: userError } = await supabase
      .from('users')
      .upsert(testUser, { onConflict: 'email' })
      .select()
    
    if (userError) {
      console.log('❌ Erro ao criar usuário:', userError)
    } else {
      console.log('✅ Usuário criado:', insertedUser?.[0]?.email)
    }
    
    // 4. Associar usuário aos contextos
    console.log('\n🔗 4. ASSOCIANDO USUÁRIO AOS CONTEXTOS:')
    
    if (insertedContexts && insertedUser) {
      const userContexts = insertedContexts.map(context => ({
        user_id: insertedUser[0].id,
        context_id: context.id
      }))
      
      const { data: insertedUserContexts, error: userContextError } = await supabase
        .from('user_contexts')
        .upsert(userContexts, { onConflict: 'user_id,context_id' })
        .select()
      
      if (userContextError) {
        console.log('❌ Erro ao associar usuário aos contextos:', userContextError)
      } else {
        console.log('✅ Associações criadas:', insertedUserContexts?.length || 0)
      }
    }
    
    // 5. Criar tickets de teste
    console.log('\n🎫 5. CRIANDO TICKETS DE TESTE:')
    
    if (insertedContexts && insertedStatuses) {
      const simasContext = insertedContexts.find(c => c.name === 'Simas Log')
      const luftContext = insertedContexts.find(c => c.name === 'Luft Agro - Barueri')
      
      const testTickets = [
        {
          title: 'Ticket Simas 1',
          status: 'open',
          priority: 'medium',
          context_id: simasContext?.id,
          created_by: insertedUser?.[0]?.id,
          ticket_number: 61
        },
        {
          title: 'Ticket Simas 2',
          status: 'in_progress',
          priority: 'high',
          context_id: simasContext?.id,
          created_by: insertedUser?.[0]?.id,
          ticket_number: 62
        },
        {
          title: 'Ticket Simas 3',
          status: 'resolved',
          priority: 'low',
          context_id: simasContext?.id,
          created_by: insertedUser?.[0]?.id,
          ticket_number: 63
        },
        {
          title: 'Ticket Luft 1',
          status: 'open',
          priority: 'critical',
          context_id: luftContext?.id,
          created_by: insertedUser?.[0]?.id,
          ticket_number: 64
        },
        {
          title: 'Ticket Luft 2',
          status: 'in_progress',
          priority: 'medium',
          context_id: luftContext?.id,
          created_by: insertedUser?.[0]?.id,
          ticket_number: 65
        }
      ]
      
      const { data: insertedTickets, error: ticketError } = await supabase
        .from('tickets')
        .insert(testTickets)
        .select()
      
      if (ticketError) {
        console.log('❌ Erro ao criar tickets:', ticketError)
      } else {
        console.log('✅ Tickets criados:', insertedTickets?.length || 0)
      }
    }
    
    // 6. Verificar dados criados
    console.log('\n✅ 6. VERIFICAÇÃO FINAL:')
    
    const { data: finalStatuses } = await supabase
      .from('ticket_statuses')
      .select('*')
    
    const { data: finalContexts } = await supabase
      .from('contexts')
      .select('*')
    
    const { data: finalTickets } = await supabase
      .from('tickets')
      .select('*')
    
    console.log(`📋 Status: ${finalStatuses?.length || 0}`)
    console.log(`🏢 Contextos: ${finalContexts?.length || 0}`)
    console.log(`🎫 Tickets: ${finalTickets?.length || 0}`)
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar criação de dados
createTestData()
