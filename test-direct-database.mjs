import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function testDirectDatabase() {
  console.log('🔍 TESTANDO CRIAÇÃO DIRETA NO BANCO...')
  
  try {
    // 1. Testar a sequence
    console.log('1️⃣ Testando sequence...')
    const { data: ticketNumber, error: sequenceError } = await supabaseAdmin
      .rpc('get_next_ticket_number')
    
    if (sequenceError) {
      console.error('❌ Erro na sequence:', sequenceError)
      return
    }
    
    console.log(`✅ Sequence funcionando: ${ticketNumber}`)
    
    // 2. Criar ticket diretamente
    console.log('2️⃣ Criando ticket diretamente...')
    
    const ticketData = {
      title: 'Teste Direto Banco',
      description: 'Teste de criação direta no banco',
      status: 'open',
      priority: 'medium',
      category: 'general',
      created_by: '3667610b-e7f0-4e79-85e8-4cecc0ebe5bc',
      context_id: '85879bd8-d1d1-416b-ae55-e564687af28b',
      ticket_number: ticketNumber,
      is_internal: false
    }
    
    const { data: newTicket, error: insertError } = await supabaseAdmin
      .from('tickets')
      .insert(ticketData)
      .select('*')
      .single()
    
    if (insertError) {
      console.error('❌ Erro ao inserir:', insertError)
      return
    }
    
    console.log('✅ Ticket criado com sucesso:')
    console.log('ID:', newTicket.id)
    console.log('Ticket Number:', newTicket.ticket_number)
    console.log('Título:', newTicket.title)
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testDirectDatabase()
