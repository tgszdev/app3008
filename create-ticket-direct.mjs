import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODUxODYsImV4cCI6MjA3MjE2MTE4Nn0.ht9a6MmtkfE5hVRmwpfyMcW24a4R7n-9hoW6eYd3K2w'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTicketDirect() {
  console.log('🧪 TESTE: Criar ticket direto no banco de dados')
  console.log('=' .repeat(80))
  
  try {
    // 1. VERIFICAR SEQUENCE PRIMEIRO
    console.log('\n📊 1. VERIFICANDO SEQUENCE:')
    console.log('-'.repeat(60))
    
    const { data: sequenceResult, error: sequenceError } = await supabase
      .rpc('get_next_ticket_number')
    
    if (sequenceError) {
      console.error('❌ Erro ao testar sequence:', sequenceError)
      return
    }
    
    console.log(`✅ Próximo número da sequence: ${sequenceResult}`)
    
    // 2. CRIAR TICKET DIRETO NO BANCO
    console.log('\n📊 2. CRIANDO TICKET DIRETO NO BANCO:')
    console.log('-'.repeat(60))
    
    const ticketData = {
      title: 'Teste Direto no Banco',
      description: 'Ticket criado diretamente no banco de dados',
      status: 'open',
      priority: 'medium',
      category: 'general',
      created_by: '3667610b-e7f0-4e79-85e8-4cecc0ebe5bc',
      context_id: '85879bd8-d1d1-416b-ae55-e564687af28b',
      ticket_number: sequenceResult // Usar o número da sequence
    }
    
    console.log('📤 Dados do ticket:', ticketData)
    
    const { data: newTicket, error: insertError } = await supabase
      .from('tickets')
      .insert(ticketData)
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
      console.log('✅ TICKET CRIADO COM SUCESSO!')
      console.log(`🎫 Ticket ID: ${newTicket[0].id}`)
      console.log(`🎫 Ticket Number: ${newTicket[0].ticket_number}`)
      console.log(`🎫 Título: ${newTicket[0].title}`)
      console.log(`🎫 Status: ${newTicket[0].status}`)
      
      // 3. VERIFICAR SE O TICKET FOI CRIADO
      console.log('\n📊 3. VERIFICANDO TICKET CRIADO:')
      console.log('-'.repeat(60))
      
      const { data: createdTicket, error: createdError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', newTicket[0].id)
        .single()
      
      if (createdError) {
        console.error('❌ Erro ao buscar ticket criado:', createdError)
      } else {
        console.log('✅ Ticket encontrado no banco!')
        console.log(`🎫 Ticket Number: ${createdTicket.ticket_number}`)
        console.log(`🎫 Título: ${createdTicket.title}`)
        console.log(`🎫 Criado em: ${createdTicket.created_at}`)
      }
      
      // 4. TESTAR SEQUENCE NOVAMENTE
      console.log('\n📊 4. TESTANDO SEQUENCE APÓS CRIAÇÃO:')
      console.log('-'.repeat(60))
      
      const { data: nextSequence, error: nextError } = await supabase
        .rpc('get_next_ticket_number')
      
      if (nextError) {
        console.error('❌ Erro ao testar sequence:', nextError)
      } else {
        console.log(`✅ Próximo número da sequence: ${nextSequence}`)
        console.log(`📊 Número anterior: ${sequenceResult}`)
        console.log(`📊 Incremento: ${nextSequence - sequenceResult}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

createTicketDirect()
