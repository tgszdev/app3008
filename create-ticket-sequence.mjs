import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODUxODYsImV4cCI6MjA3MjE2MTE4Nn0.ht9a6MmtkfE5hVRmwpfyMcW24a4R7n-9hoW6eYd3K2w'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTicketSequence() {
  console.log('🔧 CRIANDO SEQUENCE PARA TICKET_NUMBER')
  console.log('=' .repeat(60))
  
  try {
    // 1. VERIFICAR SE A SEQUENCE JÁ EXISTE
    console.log('\n📊 1. VERIFICANDO SEQUENCE EXISTENTE:')
    console.log('-'.repeat(40))
    
    const { data: sequenceCheck, error: sequenceError } = await supabase
      .rpc('check_sequence_exists', { sequence_name: 'ticket_number_seq' })
    
    if (sequenceError) {
      console.log('⚠️ Função check_sequence_exists não existe, criando sequence...')
    } else {
      console.log('✅ Sequence já existe:', sequenceCheck)
    }
    
    // 2. CRIAR SEQUENCE
    console.log('\n📊 2. CRIANDO SEQUENCE:')
    console.log('-'.repeat(40))
    
    const { data: createSequence, error: createError } = await supabase
      .rpc('create_ticket_sequence')
    
    if (createError) {
      console.error('❌ Erro ao criar sequence:', createError)
      return
    }
    
    console.log('✅ Sequence criada com sucesso!')
    
    // 3. TESTAR SEQUENCE
    console.log('\n📊 3. TESTANDO SEQUENCE:')
    console.log('-'.repeat(40))
    
    const { data: nextValue, error: nextError } = await supabase
      .rpc('get_next_ticket_number')
    
    if (nextError) {
      console.error('❌ Erro ao obter próximo valor:', nextError)
      return
    }
    
    console.log(`✅ Próximo ticket_number: ${nextValue}`)
    
  } catch (error) {
    console.error('❌ Erro no script:', error.message)
  }
}

createTicketSequence()
