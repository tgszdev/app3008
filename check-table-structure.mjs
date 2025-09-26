import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODUxODYsImV4cCI6MjA3MjE2MTE4Nn0.ht9a6MmtkfE5hVRmwpfyMcW24a4R7n-9hoW6eYd3K2w'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTableStructure() {
  console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA TICKETS')
  console.log('=' .repeat(60))
  
  try {
    // 1. VERIFICAR SE A TABELA EXISTE
    console.log('\n📊 1. VERIFICANDO SE A TABELA EXISTE:')
    console.log('-'.repeat(40))
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('tickets')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Erro ao acessar tabela tickets:', tableError)
      return
    }
    
    console.log('✅ Tabela tickets existe e é acessível')
    
    // 2. VERIFICAR ESTRUTURA DA TABELA
    console.log('\n📊 2. VERIFICANDO ESTRUTURA DA TABELA:')
    console.log('-'.repeat(40))
    
    const { data: sampleData, error: sampleError } = await supabase
      .from('tickets')
      .select('*')
      .limit(1)
    
    if (sampleError) {
      console.error('❌ Erro ao buscar dados da tabela:', sampleError)
    } else {
      console.log('✅ Tabela acessível, mas vazia')
    }
    
    // 3. TENTAR INSERIR UM TICKET DE TESTE
    console.log('\n📊 3. TESTANDO INSERÇÃO DE TICKET:')
    console.log('-'.repeat(40))
    
    const testTicket = {
      title: 'Teste de inserção',
      description: 'Teste para verificar constraint',
      status: 'open',
      priority: 'medium',
      category: 'general',
      created_by: '3667610b-e7f0-4e79-85e8-4cecc0ebe5bc',
      ticket_number: '1',
      context_id: '85879bd8-d1d1-416b-ae55-e564687af28b'
    }
    
    console.log('📤 Tentando inserir ticket de teste:', testTicket)
    
    const { data: insertResult, error: insertError } = await supabase
      .from('tickets')
      .insert(testTicket)
      .select()
    
    if (insertError) {
      console.error('❌ Erro ao inserir ticket:', insertError)
      console.log('🔍 Detalhes do erro:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
    } else {
      console.log('✅ Ticket inserido com sucesso:', insertResult)
      
      // Remover o ticket de teste
      if (insertResult && insertResult.length > 0) {
        const { error: deleteError } = await supabase
          .from('tickets')
          .delete()
          .eq('id', insertResult[0].id)
        
        if (deleteError) {
          console.log('⚠️ Erro ao remover ticket de teste:', deleteError)
        } else {
          console.log('✅ Ticket de teste removido')
        }
      }
    }
    
    // 4. VERIFICAR CONSTRAINTS
    console.log('\n📊 4. VERIFICANDO CONSTRAINTS:')
    console.log('-'.repeat(40))
    
    // Tentar inserir ticket com ticket_number duplicado
    const duplicateTicket = {
      title: 'Teste duplicata',
      description: 'Teste para verificar constraint de duplicata',
      status: 'open',
      priority: 'medium',
      category: 'general',
      created_by: '3667610b-e7f0-4e79-85e8-4cecc0ebe5bc',
      ticket_number: '1', // Mesmo número do teste anterior
      context_id: '85879bd8-d1d1-416b-ae55-e564687af28b'
    }
    
    console.log('📤 Tentando inserir ticket com número duplicado:', duplicateTicket)
    
    const { data: duplicateResult, error: duplicateError } = await supabase
      .from('tickets')
      .insert(duplicateTicket)
      .select()
    
    if (duplicateError) {
      console.log('✅ Constraint funcionando - erro esperado:', duplicateError.message)
    } else {
      console.log('❌ Constraint não funcionando - ticket duplicado inserido:', duplicateResult)
    }
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.message)
  }
}

checkTableStructure()
