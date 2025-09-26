import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODUxODYsImV4cCI6MjA3MjE2MTE4Nn0.ht9a6MmtkfE5hVRmwpfyMcW24a4R7n-9hoW6eYd3K2w'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseTickets() {
  console.log('🔍 VERIFICANDO BANCO DE DADOS - TICKETS')
  console.log('=' .repeat(60))
  
  try {
    // 1. VERIFICAR TODOS OS TICKETS
    console.log('\n📊 1. VERIFICANDO TODOS OS TICKETS:')
    console.log('-'.repeat(40))
    
    const { data: allTickets, error: allError } = await supabase
      .from('tickets')
      .select('id, ticket_number, title, created_at, context_id')
      .order('created_at', { ascending: false })
    
    if (allError) {
      console.error('❌ Erro ao buscar tickets:', allError)
      return
    }
    
    console.log(`📊 Total de tickets: ${allTickets?.length || 0}`)
    if (allTickets && allTickets.length > 0) {
      console.log('📋 Últimos 10 tickets:')
      allTickets.slice(0, 10).forEach((ticket, index) => {
        console.log(`  ${index + 1}. #${ticket.ticket_number} - ${ticket.title} - ${ticket.created_at}`)
      })
    }
    
    // 2. VERIFICAR TICKET_NUMBERS DUPLICADOS
    console.log('\n📊 2. VERIFICANDO TICKET_NUMBERS DUPLICADOS:')
    console.log('-'.repeat(40))
    
    const ticketNumbers = allTickets?.map(t => t.ticket_number) || []
    const uniqueNumbers = [...new Set(ticketNumbers)]
    
    console.log(`📊 Total de tickets: ${ticketNumbers.length}`)
    console.log(`📊 Números únicos: ${uniqueNumbers.length}`)
    
    if (ticketNumbers.length !== uniqueNumbers.length) {
      console.log('❌ DUPLICATAS ENCONTRADAS!')
      
      // Encontrar duplicatas
      const duplicates = ticketNumbers.filter((number, index) => 
        ticketNumbers.indexOf(number) !== index
      )
      
      console.log('❌ Números duplicados:', [...new Set(duplicates)])
      
      // Mostrar tickets com números duplicados
      const duplicateNumbers = [...new Set(duplicates)]
      duplicateNumbers.forEach(dupNumber => {
        const ticketsWithDup = allTickets.filter(t => t.ticket_number === dupNumber)
        console.log(`\n📋 Tickets com número ${dupNumber}:`)
        ticketsWithDup.forEach(ticket => {
          console.log(`  - ID: ${ticket.id}, Título: ${ticket.title}, Data: ${ticket.created_at}`)
        })
      })
    } else {
      console.log('✅ Nenhuma duplicata encontrada!')
    }
    
    // 3. VERIFICAR ÚLTIMO TICKET_NUMBER
    console.log('\n📊 3. VERIFICANDO ÚLTIMO TICKET_NUMBER:')
    console.log('-'.repeat(40))
    
    const sortedNumbers = ticketNumbers.sort((a, b) => {
      const numA = parseInt(String(a).replace(/\D/g, '')) || 0
      const numB = parseInt(String(b).replace(/\D/g, '')) || 0
      return numA - numB
    })
    
    if (sortedNumbers.length > 0) {
      const lastNumber = sortedNumbers[sortedNumbers.length - 1]
      console.log(`📊 Último número: #${lastNumber}`)
      
      // Extrair número sequencial
      const lastSequential = parseInt(String(lastNumber).replace(/\D/g, '')) || 0
      console.log(`📊 Último número sequencial: ${lastSequential}`)
      console.log(`📊 Próximo número deveria ser: ${lastSequential + 1}`)
    } else {
      console.log('📊 Nenhum ticket encontrado')
    }
    
    // 4. VERIFICAR TICKETS POR CONTEXTO
    console.log('\n📊 4. VERIFICANDO TICKETS POR CONTEXTO:')
    console.log('-'.repeat(40))
    
    const ticketsByContext = {}
    allTickets?.forEach(ticket => {
      const contextId = ticket.context_id || 'null'
      if (!ticketsByContext[contextId]) {
        ticketsByContext[contextId] = []
      }
      ticketsByContext[contextId].push(ticket)
    })
    
    console.log('📋 Tickets por contexto:')
    Object.keys(ticketsByContext).forEach(contextId => {
      const tickets = ticketsByContext[contextId]
      console.log(`  Contexto ${contextId}: ${tickets.length} tickets`)
      if (tickets.length > 0) {
        console.log(`    Último: #${tickets[0].ticket_number} - ${tickets[0].title}`)
      }
    })
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.message)
  }
}

checkDatabaseTickets()
