import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugDatabase() {
  console.log('🔍 ANÁLISE DETALHADA DO BANCO DE DADOS')
  console.log('=====================================')
  
  try {
    // 1. Verificar se as tabelas existem
    console.log('\n📋 1. VERIFICANDO TABELAS:')
    
    // Testar tabela ticket_statuses
    const { data: statuses, error: statusError } = await supabase
      .from('ticket_statuses')
      .select('*')
      .limit(1)
    
    if (statusError) {
      console.log('❌ Tabela ticket_statuses:', statusError.message)
    } else {
      console.log('✅ Tabela ticket_statuses existe')
    }
    
    // Testar tabela contexts
    const { data: contexts, error: contextError } = await supabase
      .from('contexts')
      .select('*')
      .limit(1)
    
    if (contextError) {
      console.log('❌ Tabela contexts:', contextError.message)
    } else {
      console.log('✅ Tabela contexts existe')
    }
    
    // Testar tabela tickets
    const { data: tickets, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .limit(1)
    
    if (ticketError) {
      console.log('❌ Tabela tickets:', ticketError.message)
    } else {
      console.log('✅ Tabela tickets existe')
    }
    
    // 2. Verificar dados existentes
    console.log('\n📊 2. DADOS EXISTENTES:')
    
    // Contar registros em cada tabela
    const { count: statusCount } = await supabase
      .from('ticket_statuses')
      .select('*', { count: 'exact', head: true })
    
    const { count: contextCount } = await supabase
      .from('contexts')
      .select('*', { count: 'exact', head: true })
    
    const { count: ticketCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
    
    console.log(`📋 ticket_statuses: ${statusCount || 0} registros`)
    console.log(`🏢 contexts: ${contextCount || 0} registros`)
    console.log(`🎫 tickets: ${ticketCount || 0} registros`)
    
    // 3. Se não há dados, criar dados de teste
    if (statusCount === 0) {
      console.log('\n🔧 3. CRIANDO STATUS DE TESTE:')
      
      const testStatuses = [
        { name: 'Aberto', slug: 'open', color: '#3B82F6', order_index: 1 },
        { name: 'Em Progresso', slug: 'in_progress', color: '#F59E0B', order_index: 2 },
        { name: 'Resolvido', slug: 'resolved', color: '#10B981', order_index: 3 },
        { name: 'Fechado', slug: 'closed', color: '#6B7280', order_index: 4 },
        { name: 'Cancelado', slug: 'cancelled', color: '#EF4444', order_index: 5 }
      ]
      
      const { data: insertedStatuses, error: insertError } = await supabase
        .from('ticket_statuses')
        .insert(testStatuses)
        .select()
      
      if (insertError) {
        console.log('❌ Erro ao inserir status:', insertError)
      } else {
        console.log('✅ Status criados:', insertedStatuses?.length || 0)
      }
    }
    
    if (contextCount === 0) {
      console.log('\n🔧 4. CRIANDO CONTEXTOS DE TESTE:')
      
      const testContexts = [
        { name: 'Simas Log', slug: 'simas-log', type: 'organization' },
        { name: 'Luft Agro - Barueri', slug: 'luft-agro-barueri', type: 'organization' },
        { name: 'Luft - Solutions', slug: 'luft-solutions', type: 'organization' },
        { name: 'Cargo Lift', slug: 'cargo-lift', type: 'organization' }
      ]
      
      const { data: insertedContexts, error: insertError } = await supabase
        .from('contexts')
        .insert(testContexts)
        .select()
      
      if (insertError) {
        console.log('❌ Erro ao inserir contextos:', insertError)
      } else {
        console.log('✅ Contextos criados:', insertedContexts?.length || 0)
      }
    }
    
    // 4. Verificar tickets existentes
    console.log('\n🎫 5. VERIFICANDO TICKETS:')
    
    const { data: allTickets, error: allTicketsError } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        title,
        status,
        context_id,
        contexts(name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (allTicketsError) {
      console.log('❌ Erro ao buscar tickets:', allTicketsError)
    } else {
      console.log(`✅ ${allTickets?.length || 0} tickets encontrados:`)
      allTickets?.forEach(ticket => {
        console.log(`  - #${ticket.ticket_number}: ${ticket.title} (status: ${ticket.status}) - ${ticket.contexts?.name || 'Sem contexto'}`)
      })
    }
    
    // 5. Testar query específica do Simas Log
    console.log('\n🔍 6. TESTE ESPECÍFICO SIMAS LOG:')
    
    const { data: simasTickets, error: simasError } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        title,
        status,
        created_at,
        contexts(name)
      `)
      .ilike('contexts.name', '%simas%')
      .order('created_at', { ascending: false })
    
    if (simasError) {
      console.log('❌ Erro ao buscar tickets do Simas:', simasError)
    } else {
      console.log(`✅ ${simasTickets?.length || 0} tickets do Simas encontrados:`)
      simasTickets?.forEach(ticket => {
        console.log(`  - #${ticket.ticket_number}: ${ticket.title} (status: ${ticket.status})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar debug
debugDatabase()
