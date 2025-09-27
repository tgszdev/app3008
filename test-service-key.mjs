import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function testServiceKey() {
  console.log('🧪 TESTE: Verificar se a chave de serviço está funcionando')
  console.log('=' .repeat(80))
  
  try {
    // 1. TESTAR SEQUENCE COM CHAVE DE SERVIÇO
    console.log('\n📊 1. TESTANDO SEQUENCE COM CHAVE DE SERVIÇO:')
    console.log('-'.repeat(60))
    
    const { data: sequenceResult, error: sequenceError } = await supabaseAdmin
      .rpc('get_next_ticket_number')
    
    if (sequenceError) {
      console.error('❌ Erro ao testar sequence:', sequenceError)
      return
    }
    
    console.log(`✅ Sequence funcionando: ${sequenceResult}`)
    
    // 2. TESTAR INSERÇÃO COM CHAVE DE SERVIÇO
    console.log('\n📊 2. TESTANDO INSERÇÃO COM CHAVE DE SERVIÇO:')
    console.log('-'.repeat(60))
    
    const ticketData = {
      title: 'Teste Chave de Serviço',
      description: 'Ticket criado com chave de serviço',
      status: 'open',
      priority: 'medium',
      category: 'general',
      created_by: '3667610b-e7f0-4e79-85e8-4cecc0ebe5bc',
      context_id: '85879bd8-d1d1-416b-ae55-e564687af28b',
      ticket_number: sequenceResult
    }
    
    console.log('📤 Tentando inserir com chave de serviço...')
    
    const { data: newTicket, error: insertError } = await supabaseAdmin
      .from('tickets')
      .insert(ticketData)
      .select()
    
    if (insertError) {
      console.error('❌ Erro ao inserir com chave de serviço:', insertError)
      console.log('🔍 Detalhes do erro:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
    } else {
      console.log('✅ TICKET CRIADO COM CHAVE DE SERVIÇO!')
      console.log(`🎫 Ticket ID: ${newTicket[0].id}`)
      console.log(`🎫 Ticket Number: ${newTicket[0].ticket_number}`)
      console.log(`🎫 Título: ${newTicket[0].title}`)
      
      // Remover ticket de teste
      const { error: deleteError } = await supabaseAdmin
        .from('tickets')
        .delete()
        .eq('id', newTicket[0].id)
      
      if (deleteError) {
        console.log('⚠️ Erro ao remover ticket de teste:', deleteError)
      } else {
        console.log('✅ Ticket de teste removido')
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testServiceKey()
