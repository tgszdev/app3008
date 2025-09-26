import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODUxODYsImV4cCI6MjA3MjE2MTE4Nn0.ht9a6MmtkfE5hVRmwpfyMcW24a4R7n-9hoW6eYd3K2w'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSequenceFunction() {
  console.log('🧪 TESTE: Função get_next_ticket_number')
  console.log('=' .repeat(60))
  
  try {
    // 1. TESTAR FUNÇÃO DIRETAMENTE
    console.log('\n📊 1. TESTANDO FUNÇÃO get_next_ticket_number:')
    console.log('-'.repeat(40))
    
    const { data: result1, error: error1 } = await supabase
      .rpc('get_next_ticket_number')
    
    if (error1) {
      console.error('❌ Erro ao chamar função:', error1)
      return
    }
    
    console.log(`✅ Primeiro valor: ${result1}`)
    
    // 2. TESTAR NOVAMENTE
    console.log('\n📊 2. TESTANDO NOVAMENTE:')
    console.log('-'.repeat(40))
    
    const { data: result2, error: error2 } = await supabase
      .rpc('get_next_ticket_number')
    
    if (error2) {
      console.error('❌ Erro ao chamar função novamente:', error2)
      return
    }
    
    console.log(`✅ Segundo valor: ${result2}`)
    
    // 3. TESTAR MAIS UMA VEZ
    console.log('\n📊 3. TESTANDO MAIS UMA VEZ:')
    console.log('-'.repeat(40))
    
    const { data: result3, error: error3 } = await supabase
      .rpc('get_next_ticket_number')
    
    if (error3) {
      console.error('❌ Erro ao chamar função terceira vez:', error3)
      return
    }
    
    console.log(`✅ Terceiro valor: ${result3}`)
    
    // 4. VERIFICAR SE OS VALORES SÃO SEQUENCIAIS
    console.log('\n📊 4. VERIFICANDO SEQUÊNCIA:')
    console.log('-'.repeat(40))
    
    if (result1 < result2 && result2 < result3) {
      console.log('✅ SEQUENCE FUNCIONANDO CORRETAMENTE!')
      console.log(`📊 Valores: ${result1} → ${result2} → ${result3}`)
    } else {
      console.log('❌ SEQUENCE NÃO ESTÁ FUNCIONANDO!')
      console.log(`📊 Valores: ${result1} → ${result2} → ${result3}`)
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testSequenceFunction()
