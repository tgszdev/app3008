import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qjqjqjqjqjqjqjqj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTicketConstraints() {
  console.log('🔍 VERIFICANDO CONSTRAINTS DE TICKET_NUMBER')
  console.log('=' .repeat(60))
  
  try {
    // 1. VERIFICAR TICKETS EXISTENTES
    console.log('\n📊 1. VERIFICANDO TICKETS EXISTENTES:')
    console.log('-'.repeat(40))
    
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, ticket_number, context_id, created_at, title')
      .order('ticket_number')
      .limit(20)
    
    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError)
      return
    }
    
    console.log(`📊 Tickets encontrados: ${tickets?.length || 0}`)
    if (tickets && tickets.length > 0) {
      console.log('📋 Primeiros 20 tickets:')
      tickets.forEach((ticket, index) => {
        console.log(`  ${index + 1}. #${ticket.ticket_number} - ${ticket.title} - Context: ${ticket.context_id}`)
      })
    }
    
    // 2. VERIFICAR SE HÁ DUPLICATAS
    console.log('\n📊 2. VERIFICANDO DUPLICATAS:')
    console.log('-'.repeat(40))
    
    const ticketNumbers = tickets?.map(t => t.ticket_number) || []
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
    } else {
      console.log('✅ Nenhuma duplicata encontrada')
    }
    
    // 3. VERIFICAR PADRÃO DE NUMERAÇÃO
    console.log('\n📊 3. VERIFICANDO PADRÃO DE NUMERAÇÃO:')
    console.log('-'.repeat(40))
    
    const sortedNumbers = ticketNumbers.sort((a, b) => {
      // Converter para número para ordenação correta
      const numA = parseInt(a.replace(/\D/g, '')) || 0
      const numB = parseInt(b.replace(/\D/g, '')) || 0
      return numA - numB
    })
    
    console.log('📋 Números ordenados:')
    sortedNumbers.slice(0, 10).forEach((number, index) => {
      console.log(`  ${index + 1}. #${number}`)
    })
    
    if (sortedNumbers.length > 10) {
      console.log(`  ... e mais ${sortedNumbers.length - 10} números`)
    }
    
    // 4. VERIFICAR ÚLTIMO NÚMERO
    console.log('\n📊 4. VERIFICANDO ÚLTIMO NÚMERO:')
    console.log('-'.repeat(40))
    
    const lastNumber = sortedNumbers[sortedNumbers.length - 1]
    console.log(`📊 Último número: #${lastNumber}`)
    
    // Extrair número sequencial
    const lastSequential = parseInt(lastNumber.replace(/\D/g, '')) || 0
    console.log(`📊 Último número sequencial: ${lastSequential}`)
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.message)
  }
}

checkTicketConstraints()
