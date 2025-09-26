import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qjqjqjqjqjqjqjqj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugTicketNumberConstraint() {
  console.log('🔍 DEBUG: Conflito de ticket_number entre organizações')
  console.log('=' .repeat(60))
  
  try {
    // 1. VERIFICAR ESTRUTURA DA TABELA TICKETS
    console.log('\n📊 1. VERIFICANDO ESTRUTURA DA TABELA TICKETS:')
    console.log('-'.repeat(40))
    
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, ticket_number, context_id, created_at, title')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError)
      return
    }
    
    console.log(`📊 Tickets encontrados: ${tickets?.length || 0}`)
    if (tickets && tickets.length > 0) {
      console.log('📋 Últimos 10 tickets:')
      tickets.forEach((ticket, index) => {
        console.log(`  ${index + 1}. #${ticket.ticket_number} - ${ticket.title} - Context: ${ticket.context_id}`)
      })
    }
    
    // 2. VERIFICAR TICKET_NUMBERS DUPLICADOS
    console.log('\n📊 2. VERIFICANDO TICKET_NUMBERS DUPLICADOS:')
    console.log('-'.repeat(40))
    
    const { data: duplicateTickets, error: duplicateError } = await supabase
      .from('tickets')
      .select('ticket_number, context_id, count(*)')
      .group('ticket_number, context_id')
      .having('count(*) > 1')
    
    if (duplicateError) {
      console.error('❌ Erro ao verificar duplicatas:', duplicateError)
    } else {
      console.log(`📊 Tickets duplicados encontrados: ${duplicateTickets?.length || 0}`)
      if (duplicateTickets && duplicateTickets.length > 0) {
        duplicateTickets.forEach(ticket => {
          console.log(`  - #${ticket.ticket_number} (Context: ${ticket.context_id})`)
        })
      }
    }
    
    // 3. VERIFICAR TICKET_NUMBERS POR CONTEXTO
    console.log('\n📊 3. VERIFICANDO TICKET_NUMBERS POR CONTEXTO:')
    console.log('-'.repeat(40))
    
    const { data: contextTickets, error: contextError } = await supabase
      .from('tickets')
      .select('context_id, ticket_number')
      .order('context_id')
      .order('ticket_number')
    
    if (contextError) {
      console.error('❌ Erro ao buscar tickets por contexto:', contextError)
    } else {
      console.log(`📊 Total de tickets: ${contextTickets?.length || 0}`)
      
      // Agrupar por contexto
      const ticketsByContext = {}
      contextTickets?.forEach(ticket => {
        if (!ticketsByContext[ticket.context_id]) {
          ticketsByContext[ticket.context_id] = []
        }
        ticketsByContext[ticket.context_id].push(ticket.ticket_number)
      })
      
      console.log('📋 Tickets por contexto:')
      Object.keys(ticketsByContext).forEach(contextId => {
        const tickets = ticketsByContext[contextId]
        console.log(`  Contexto ${contextId}: ${tickets.length} tickets`)
        console.log(`    Ticket numbers: ${tickets.slice(0, 5).join(', ')}${tickets.length > 5 ? '...' : ''}`)
      })
    }
    
    // 4. VERIFICAR SE HÁ CONFLITO ENTRE CONTEXTOS
    console.log('\n📊 4. VERIFICANDO CONFLITOS ENTRE CONTEXTOS:')
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
      
      // Encontrar conflitos
      const conflicts = Object.keys(ticketsByNumber).filter(number => 
        ticketsByNumber[number].length > 1
      )
      
      console.log(`📊 Conflitos encontrados: ${conflicts.length}`)
      if (conflicts.length > 0) {
        console.log('❌ Ticket numbers com múltiplos contextos:')
        conflicts.forEach(number => {
          const contexts = ticketsByNumber[number]
          console.log(`  #${number}: ${contexts.join(', ')}`)
        })
      } else {
        console.log('✅ Nenhum conflito encontrado entre contextos')
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.message)
  }
}

debugTicketNumberConstraint()
