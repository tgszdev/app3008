import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function fixTriggerConflict() {
  console.log('🔧 CORRIGINDO CONFLITO DE TRIGGER...')
  
  try {
    // 1. Desabilitar o trigger conflitante
    console.log('1️⃣ Desabilitando trigger conflitante...')
    
    const { data: dropTrigger, error: dropError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `DROP TRIGGER IF EXISTS generate_contextual_ticket_number_trigger ON tickets;`
      })
    
    if (dropError) {
      console.error('❌ Erro ao desabilitar trigger:', dropError)
      return
    }
    
    console.log('✅ Trigger desabilitado com sucesso')
    
    // 2. Verificar se a função ainda existe
    console.log('2️⃣ Verificando função...')
    
    const { data: checkFunction, error: functionError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'generate_contextual_ticket_number';`
      })
    
    if (functionError) {
      console.error('❌ Erro ao verificar função:', functionError)
      return
    }
    
    console.log('📋 Função encontrada:', checkFunction)
    
    // 3. Testar criação de ticket após correção
    console.log('3️⃣ Testando criação de ticket...')
    
    const { data: ticketNumber, error: sequenceError } = await supabaseAdmin
      .rpc('get_next_ticket_number')
    
    if (sequenceError) {
      console.error('❌ Erro na sequence:', sequenceError)
      return
    }
    
    console.log(`✅ Sequence funcionando: ${ticketNumber}`)
    
    const ticketData = {
      title: 'Teste Após Correção',
      description: 'Teste após remover trigger conflitante',
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
    
    // Verificar se o número está correto
    if (newTicket.ticket_number === ticketNumber) {
      console.log('🎉 SUCESSO: O número do ticket está correto!')
    } else {
      console.log('❌ PROBLEMA: O número ainda está incorreto')
      console.log('Esperado:', ticketNumber)
      console.log('Recebido:', newTicket.ticket_number)
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

fixTriggerConflict()
