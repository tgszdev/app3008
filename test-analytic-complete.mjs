import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODUxODYsImV4cCI6MjA3MjE2MTE4Nn0.ht9a6MmtkfE5hVRmwpfyMcW24a4R7n-9hoW6eYd3K2w'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAnalyticComplete() {
  console.log('🧪 TESTE ANALÍTICO COMPLETO: Criação de tickets com SEQUENCE')
  console.log('=' .repeat(80))
  
  try {
    // 1. TESTE DA SEQUENCE ISOLADAMENTE
    console.log('\n📊 1. TESTE DA SEQUENCE ISOLADAMENTE:')
    console.log('-'.repeat(60))
    
    const sequenceTests = []
    for (let i = 1; i <= 5; i++) {
      const { data: result, error: error } = await supabase
        .rpc('get_next_ticket_number')
      
      if (error) {
        console.error(`❌ Teste ${i} falhou:`, error)
        return
      }
      
      sequenceTests.push(result)
      console.log(`✅ Teste ${i}: ${result}`)
    }
    
    // Verificar se são sequenciais
    const isSequential = sequenceTests.every((val, index) => 
      index === 0 || val === sequenceTests[index - 1] + 1
    )
    
    if (isSequential) {
      console.log('✅ SEQUENCE funcionando perfeitamente!')
      console.log(`📊 Sequência: ${sequenceTests.join(' → ')}`)
    } else {
      console.log('❌ SEQUENCE não está funcionando!')
      console.log(`📊 Valores: ${sequenceTests.join(' → ')}`)
    }
    
    // 2. TESTE DA API COMPLETA
    console.log('\n📊 2. TESTE DA API COMPLETA:')
    console.log('-'.repeat(60))
    
    const testTicketData = {
      title: `Teste Analítico ${Date.now()}`,
      description: 'Teste analítico completo da API',
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
      
      // 3. VERIFICAR NO BANCO DE DADOS
      console.log('\n📊 3. VERIFICAÇÃO NO BANCO DE DADOS:')
      console.log('-'.repeat(60))
      
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
      
      // 4. TESTE DE MÚLTIPLOS TICKETS SEQUENCIAIS
      console.log('\n📊 4. TESTE DE MÚLTIPLOS TICKETS SEQUENCIAIS:')
      console.log('-'.repeat(60))
      
      const multipleTickets = []
      for (let i = 1; i <= 3; i++) {
        const ticketData = {
          title: `Ticket Sequencial ${i}`,
          description: `Teste de ticket sequencial ${i}`,
          priority: 'medium',
          category_id: 'c17f9a82-9ec4-4f51-b78e-cc672b204a2b',
          created_by: '3667610b-e7f0-4e79-85e8-4cecc0ebe5bc',
          is_internal: false,
          context_id: '85879bd8-d1d1-416b-ae55-e564687af28b'
        }
        
        console.log(`📤 Criando ticket ${i}...`)
        
        const ticketResponse = await fetch('https://www.ithostbr.tech/api/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ticketData)
        })
        
        if (ticketResponse.ok) {
          const ticket = await ticketResponse.json()
          multipleTickets.push(ticket)
          console.log(`✅ Ticket ${i} criado: #${ticket.ticket_number}`)
        } else {
          const errorData = await ticketResponse.json()
          console.error(`❌ Erro ao criar ticket ${i}:`, errorData)
        }
      }
      
      // 5. ANÁLISE DE SEQUÊNCIA
      console.log('\n📊 5. ANÁLISE DE SEQUÊNCIA:')
      console.log('-'.repeat(60))
      
      if (multipleTickets.length > 0) {
        const ticketNumbers = multipleTickets.map(t => parseInt(t.ticket_number))
        console.log(`📊 Números gerados: ${ticketNumbers.join(', ')}`)
        
        const isSequential = ticketNumbers.every((val, index) => 
          index === 0 || val === ticketNumbers[index - 1] + 1
        )
        
        if (isSequential) {
          console.log('✅ SEQUÊNCIA FUNCIONANDO PERFEITAMENTE!')
          console.log(`📊 Sequência: ${ticketNumbers.join(' → ')}`)
        } else {
          console.log('❌ SEQUÊNCIA NÃO ESTÁ FUNCIONANDO!')
          console.log(`📊 Números: ${ticketNumbers.join(' → ')}`)
        }
      }
      
      // 6. VERIFICAÇÃO FINAL NO BANCO
      console.log('\n📊 6. VERIFICAÇÃO FINAL NO BANCO:')
      console.log('-'.repeat(60))
      
      const { data: allTickets, error: allError } = await supabase
        .from('tickets')
        .select('id, ticket_number, title, created_at')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (allError) {
        console.error('❌ Erro ao buscar todos os tickets:', allError)
      } else {
        console.log(`📊 Total de tickets no banco: ${allTickets?.length || 0}`)
        if (allTickets && allTickets.length > 0) {
          allTickets.forEach((ticket, index) => {
            console.log(`  ${index + 1}. #${ticket.ticket_number} - ${ticket.title} - ${ticket.created_at}`)
          })
        }
      }
      
    } else {
      const errorData = await response.json()
      console.error('❌ Erro ao criar ticket:', errorData)
    }
    
  } catch (error) {
    console.error('❌ Erro no teste analítico:', error.message)
  }
}

testAnalyticComplete()
