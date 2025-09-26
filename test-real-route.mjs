import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODUxODYsImV4cCI6MjA3MjE2MTE4Nn0.ht9a6MmtkfE5hVRmwpfyMcW24a4R7n-9hoW6eYd3K2w'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRealRoute() {
  console.log('🧪 TESTE: Rota real da aplicação')
  console.log('=' .repeat(60))
  
  try {
    // 1. VERIFICAR SE A ROTA ESTÁ FUNCIONANDO
    console.log('\n📊 1. TESTANDO ROTA /api/tickets:')
    console.log('-'.repeat(40))
    
    const testTicketData = {
      title: `Teste Real ${Date.now()}`,
      description: 'Teste direto na rota da aplicação',
      priority: 'medium',
      category_id: 'c17f9a82-9ec4-4f51-b78e-cc672b204a2b',
      created_by: '3667610b-e7f0-4e79-85e8-4cecc0ebe5bc',
      is_internal: false,
      context_id: '85879bd8-d1d1-416b-ae55-e564687af28b'
    }
    
    console.log('📤 Enviando dados do ticket:', testTicketData)
    
    const response = await fetch('https://www.ithostbr.tech/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testTicketData)
    })
    
    console.log(`📊 Status da resposta: ${response.status}`)
    
    if (response.ok) {
      const newTicket = await response.json()
      console.log('✅ TICKET CRIADO COM SUCESSO!')
      console.log(`🎫 Ticket ID: ${newTicket.id}`)
      console.log(`🎫 Ticket Number: #${newTicket.ticket_number}`)
      console.log(`🎫 Título: ${newTicket.title}`)
      console.log(`🎫 Context: ${newTicket.context_id}`)
      
      // 2. VERIFICAR SE O TICKET FOI CRIADO NO BANCO
      console.log('\n📊 2. VERIFICANDO TICKET NO BANCO:')
      console.log('-'.repeat(40))
      
      const { data: createdTicket, error: createdError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', newTicket.id)
        .single()
      
      if (createdError) {
        console.error('❌ Erro ao buscar ticket criado:', createdError)
      } else {
        console.log('✅ Ticket encontrado no banco!')
        console.log(`🎫 Ticket Number: #${createdTicket.ticket_number}`)
        console.log(`🎫 Status: ${createdTicket.status}`)
        console.log(`🎫 Context: ${createdTicket.context_id}`)
        console.log(`🎫 Criado em: ${createdTicket.created_at}`)
      }
      
      // 3. TESTAR CRIAÇÃO DE SEGUNDO TICKET
      console.log('\n📊 3. TESTANDO SEGUNDO TICKET:')
      console.log('-'.repeat(40))
      
      const testTicketData2 = {
        title: `Segundo Teste ${Date.now()}`,
        description: 'Segundo teste para verificar sequência',
        priority: 'high',
        category_id: 'c17f9a82-9ec4-4f51-b78e-cc672b204a2b',
        created_by: '3667610b-e7f0-4e79-85e8-4cecc0ebe5bc',
        is_internal: false,
        context_id: '85879bd8-d1d1-416b-ae55-e564687af28b'
      }
      
      const response2 = await fetch('https://www.ithostbr.tech/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testTicketData2)
      })
      
      if (response2.ok) {
        const newTicket2 = await response2.json()
        console.log('✅ SEGUNDO TICKET CRIADO COM SUCESSO!')
        console.log(`🎫 Ticket Number: #${newTicket2.ticket_number}`)
        console.log(`🎫 Título: ${newTicket2.title}`)
        
        // Verificar se os números são sequenciais
        const num1 = parseInt(newTicket.ticket_number)
        const num2 = parseInt(newTicket2.ticket_number)
        
        if (num2 === num1 + 1) {
          console.log('✅ SEQUÊNCIA FUNCIONANDO PERFEITAMENTE!')
          console.log(`📊 Números: #${num1} → #${num2}`)
        } else {
          console.log('❌ SEQUÊNCIA NÃO ESTÁ FUNCIONANDO!')
          console.log(`📊 Números: #${num1} → #${num2}`)
        }
      } else {
        const errorData2 = await response2.json()
        console.error('❌ Erro ao criar segundo ticket:', errorData2)
      }
      
    } else {
      const errorData = await response.json()
      console.error('❌ Erro ao criar ticket:', errorData)
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testRealRoute()
