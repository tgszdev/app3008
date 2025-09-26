import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qjqjqjqjqjqjqjqj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testTicketCreation() {
  console.log('🧪 TESTE: Criação de tickets com ticket_number único')
  console.log('=' .repeat(60))
  
  try {
    // 1. VERIFICAR TICKETS EXISTENTES
    console.log('\n📊 1. VERIFICANDO TICKETS EXISTENTES:')
    console.log('-'.repeat(40))
    
    const { data: existingTickets, error: existingError } = await supabase
      .from('tickets')
      .select('id, ticket_number, context_id, title, created_at')
      .order('ticket_number', { ascending: false })
      .limit(5)
    
    if (existingError) {
      console.error('❌ Erro ao buscar tickets existentes:', existingError)
      return
    }
    
    console.log(`📊 Tickets existentes: ${existingTickets?.length || 0}`)
    if (existingTickets && existingTickets.length > 0) {
      console.log('📋 Últimos 5 tickets:')
      existingTickets.forEach((ticket, index) => {
        console.log(`  ${index + 1}. #${ticket.ticket_number} - ${ticket.title} - Context: ${ticket.context_id}`)
      })
    }
    
    // 2. TESTAR CRIAÇÃO DE TICKET VIA API
    console.log('\n🧪 2. TESTANDO CRIAÇÃO DE TICKET VIA API:')
    console.log('-'.repeat(40))
    
    const testTicketData = {
      title: `Teste Ticket ${Date.now()}`,
      description: 'Ticket de teste para verificar geração de ticket_number',
      priority: 'medium',
      category: 'general',
      created_by: '2a33241e-ed38-48b5-9c84-e8c354ae9606', // Usuário de teste
      is_internal: false,
      context_id: '6486088e-72ae-461b-8b03-32ca84918882' // Luft Agro
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
      console.log('✅ Ticket criado com sucesso!')
      console.log(`🎫 Ticket ID: ${newTicket.id}`)
      console.log(`🎫 Ticket Number: #${newTicket.ticket_number}`)
      console.log(`🎫 Título: ${newTicket.title}`)
      console.log(`🎫 Context: ${newTicket.context_id}`)
      
      // 3. VERIFICAR SE O TICKET FOI CRIADO NO BANCO
      console.log('\n📊 3. VERIFICANDO TICKET NO BANCO:')
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
      }
      
    } else {
      const errorData = await response.json()
      console.error('❌ Erro ao criar ticket:', errorData)
    }
    
    // 4. VERIFICAR SE HÁ DUPLICATAS
    console.log('\n📊 4. VERIFICANDO DUPLICATAS:')
    console.log('-'.repeat(40))
    
    const { data: allTickets, error: allError } = await supabase
      .from('tickets')
      .select('ticket_number, context_id')
      .order('ticket_number')
    
    if (allError) {
      console.error('❌ Erro ao buscar todos os tickets:', allError)
    } else {
      // Agrupar por ticket_number
      const ticketsByNumber = {}
      allTickets?.forEach(ticket => {
        if (!ticketsByNumber[ticket.ticket_number]) {
          ticketsByNumber[ticket.ticket_number] = []
        }
        ticketsByNumber[ticket.ticket_number].push(ticket.context_id)
      })
      
      // Encontrar duplicatas
      const duplicates = Object.keys(ticketsByNumber).filter(number => 
        ticketsByNumber[number].length > 1
      )
      
      console.log(`📊 Total de tickets: ${allTickets?.length || 0}`)
      console.log(`📊 Números únicos: ${Object.keys(ticketsByNumber).length}`)
      console.log(`📊 Duplicatas encontradas: ${duplicates.length}`)
      
      if (duplicates.length > 0) {
        console.log('❌ Números duplicados:')
        duplicates.forEach(number => {
          const contexts = ticketsByNumber[number]
          console.log(`  #${number}: ${contexts.join(', ')}`)
        })
      } else {
        console.log('✅ Nenhuma duplicata encontrada!')
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testTicketCreation()
