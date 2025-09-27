import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODUxODYsImV4cCI6MjA3MjE2MTE4Nn0.ht9a6MmtkfE5hVRmwpfyMcW24a4R7n-9hoW6eYd3K2w'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseExact() {
  console.log('🔍 VERIFICAÇÃO EXATA DA BASE DE DADOS')
  console.log('=' .repeat(80))
  
  try {
    // 1. VERIFICAR TODOS OS TICKETS
    console.log('\n📊 1. TODOS OS TICKETS NA BASE:')
    console.log('-'.repeat(60))
    
    const { data: allTickets, error: allError } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (allError) {
      console.error('❌ Erro ao buscar tickets:', allError)
      return
    }
    
    console.log(`📊 Total de tickets: ${allTickets?.length || 0}`)
    
    if (allTickets && allTickets.length > 0) {
      allTickets.forEach((ticket, index) => {
        console.log(`\n  ${index + 1}. TICKET DETALHADO:`)
        console.log(`     ID: ${ticket.id}`)
        console.log(`     Ticket Number: ${ticket.ticket_number}`)
        console.log(`     Título: ${ticket.title}`)
        console.log(`     Status: ${ticket.status}`)
        console.log(`     Context: ${ticket.context_id}`)
        console.log(`     Criado em: ${ticket.created_at}`)
        console.log(`     Criado por: ${ticket.created_by}`)
      })
    } else {
      console.log('📊 Nenhum ticket encontrado na base')
    }
    
    // 2. VERIFICAR SEQUENCE ATUAL
    console.log('\n📊 2. SEQUENCE ATUAL:')
    console.log('-'.repeat(60))
    
    const { data: sequenceResult, error: sequenceError } = await supabase
      .rpc('get_next_ticket_number')
    
    if (sequenceError) {
      console.error('❌ Erro ao testar sequence:', sequenceError)
    } else {
      console.log(`✅ Próximo número da sequence: ${sequenceResult}`)
    }
    
    // 3. VERIFICAR SE HÁ DUPLICATAS
    console.log('\n📊 3. VERIFICANDO DUPLICATAS:')
    console.log('-'.repeat(60))
    
    if (allTickets && allTickets.length > 0) {
      const ticketNumbers = allTickets.map(t => t.ticket_number)
      const uniqueNumbers = [...new Set(ticketNumbers)]
      
      console.log(`📊 Números únicos: ${uniqueNumbers.length}`)
      console.log(`📊 Total de tickets: ${ticketNumbers.length}`)
      
      if (ticketNumbers.length !== uniqueNumbers.length) {
        console.log('❌ DUPLICATAS ENCONTRADAS!')
        const duplicates = ticketNumbers.filter((item, index) => ticketNumbers.indexOf(item) !== index)
        console.log(`📊 Duplicatas: ${duplicates.join(', ')}`)
      } else {
        console.log('✅ Nenhuma duplicata encontrada')
      }
    }
    
    // 4. VERIFICAR SEQUENCE MÚLTIPLAS VEZES
    console.log('\n📊 4. TESTANDO SEQUENCE MÚLTIPLAS VEZES:')
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
    
    console.log(`📊 Sequência gerada: ${sequenceTests.join(' → ')}`)
    
    // 5. VERIFICAR SE O NÚMERO 2025090001 EXISTE
    console.log('\n📊 5. VERIFICANDO NÚMERO 2025090001:')
    console.log('-'.repeat(60))
    
    const { data: specificTicket, error: specificError } = await supabase
      .from('tickets')
      .select('*')
      .eq('ticket_number', '2025090001')
    
    if (specificError) {
      console.error('❌ Erro ao buscar ticket específico:', specificError)
    } else if (specificTicket && specificTicket.length > 0) {
      console.log('❌ TICKET 2025090001 EXISTE!')
      console.log(`📊 Detalhes: ${JSON.stringify(specificTicket[0], null, 2)}`)
    } else {
      console.log('✅ Número 2025090001 NÃO existe na base')
    }
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.message)
  }
}

checkDatabaseExact()
