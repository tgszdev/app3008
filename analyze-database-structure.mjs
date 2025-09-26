import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODUxODYsImV4cCI6MjA3MjE2MTE4Nn0.ht9a6MmtkfE5hVRmwpfyMcW24a4R7n-9hoW6eYd3K2w'

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeDatabaseStructure() {
  console.log('🔍 ANÁLISE COMPLETA DA ESTRUTURA DE TICKETS')
  console.log('=' .repeat(80))
  
  try {
    // 1. VERIFICAR ESTRUTURA DA TABELA TICKETS
    console.log('\n📊 1. ESTRUTURA DA TABELA TICKETS:')
    console.log('-'.repeat(60))
    
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .limit(1)
    
    if (ticketsError) {
      console.error('❌ Erro ao acessar tabela tickets:', ticketsError)
      return
    }
    
    console.log('✅ Tabela tickets acessível')
    
    // 2. VERIFICAR TICKETS EXISTENTES
    console.log('\n📊 2. TICKETS EXISTENTES:')
    console.log('-'.repeat(60))
    
    const { data: existingTickets, error: existingError } = await supabase
      .from('tickets')
      .select('id, ticket_number, title, created_at, context_id')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (existingError) {
      console.error('❌ Erro ao buscar tickets:', existingError)
    } else {
      console.log(`📊 Total de tickets: ${existingTickets?.length || 0}`)
      if (existingTickets && existingTickets.length > 0) {
        existingTickets.forEach((ticket, index) => {
          console.log(`  ${index + 1}. #${ticket.ticket_number} - ${ticket.title} - ${ticket.created_at}`)
        })
      }
    }
    
    // 3. VERIFICAR SEQUENCE
    console.log('\n📊 3. VERIFICANDO SEQUENCE:')
    console.log('-'.repeat(60))
    
    const { data: sequenceResult, error: sequenceError } = await supabase
      .rpc('get_next_ticket_number')
    
    if (sequenceError) {
      console.error('❌ Erro ao testar sequence:', sequenceError)
    } else {
      console.log(`✅ Sequence funcionando: ${sequenceResult}`)
    }
    
    // 4. TESTAR CRIAÇÃO DE TICKET DIRETO NO BANCO
    console.log('\n📊 4. TESTANDO CRIAÇÃO DIRETA NO BANCO:')
    console.log('-'.repeat(60))
    
    const testTicket = {
      title: 'Teste Estrutura',
      description: 'Teste para verificar estrutura',
      status: 'open',
      priority: 'medium',
      category: 'general',
      created_by: '3667610b-e7f0-4e79-85e8-4cecc0ebe5bc',
      context_id: '85879bd8-d1d1-416b-ae55-e564687af28b',
      ticket_number: '999999' // Número pequeno para teste
    }
    
    console.log('📤 Tentando inserir ticket de teste:', testTicket)
    
    const { data: insertResult, error: insertError } = await supabase
      .from('tickets')
      .insert(testTicket)
      .select()
    
    if (insertError) {
      console.error('❌ Erro ao inserir ticket:', insertError)
      console.log('🔍 Detalhes do erro:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
    } else {
      console.log('✅ Ticket inserido com sucesso:', insertResult)
      
      // Remover ticket de teste
      if (insertResult && insertResult.length > 0) {
        const { error: deleteError } = await supabase
          .from('tickets')
          .delete()
          .eq('id', insertResult[0].id)
        
        if (deleteError) {
          console.log('⚠️ Erro ao remover ticket de teste:', deleteError)
        } else {
          console.log('✅ Ticket de teste removido')
        }
      }
    }
    
    // 5. VERIFICAR CONSTRAINTS
    console.log('\n📊 5. VERIFICANDO CONSTRAINTS:')
    console.log('-'.repeat(60))
    
    // Tentar inserir ticket com ticket_number duplicado
    const duplicateTicket = {
      title: 'Teste Duplicata',
      description: 'Teste para verificar constraint de duplicata',
      status: 'open',
      priority: 'medium',
      category: 'general',
      created_by: '3667610b-e7f0-4e79-85e8-4cecc0ebe5bc',
      context_id: '85879bd8-d1d1-416b-ae55-e564687af28b',
      ticket_number: '999999' // Mesmo número do teste anterior
    }
    
    console.log('📤 Tentando inserir ticket com número duplicado:', duplicateTicket)
    
    const { data: duplicateResult, error: duplicateError } = await supabase
      .from('tickets')
      .insert(duplicateTicket)
      .select()
    
    if (duplicateError) {
      console.log('✅ Constraint funcionando - erro esperado:', duplicateError.message)
    } else {
      console.log('❌ Constraint não funcionando - ticket duplicado inserido:', duplicateResult)
    }
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.message)
  }
}

analyzeDatabaseStructure()