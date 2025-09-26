import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODUxODYsImV4cCI6MjA3MjE2MTE4Nn0.ht9a6MmtkfE5hVRmwpfyMcW24a4R7n-9hoW6eYd3K2w'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupTicketSequence() {
  console.log('🔧 CONFIGURANDO SEQUENCE PARA TICKET_NUMBER')
  console.log('=' .repeat(60))
  
  try {
    // 1. CRIAR SEQUENCE
    console.log('\n📊 1. CRIANDO SEQUENCE:')
    console.log('-'.repeat(40))
    
    const { data: createSequence, error: createError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          CREATE SEQUENCE IF NOT EXISTS ticket_number_seq 
          START WITH 1 
          INCREMENT BY 1 
          NO MINVALUE 
          NO MAXVALUE 
          CACHE 1;
        ` 
      })
    
    if (createError) {
      console.error('❌ Erro ao criar sequence:', createError)
      return
    }
    
    console.log('✅ Sequence criada com sucesso!')
    
    // 2. CRIAR FUNÇÃO PARA OBTER PRÓXIMO NÚMERO
    console.log('\n📊 2. CRIANDO FUNÇÃO:')
    console.log('-'.repeat(40))
    
    const { data: createFunction, error: functionError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          CREATE OR REPLACE FUNCTION get_next_ticket_number()
          RETURNS INTEGER AS $$
          BEGIN
            RETURN nextval('ticket_number_seq');
          END;
          $$ LANGUAGE plpgsql;
        ` 
      })
    
    if (functionError) {
      console.error('❌ Erro ao criar função:', functionError)
      return
    }
    
    console.log('✅ Função criada com sucesso!')
    
    // 3. TESTAR FUNÇÃO
    console.log('\n📊 3. TESTANDO FUNÇÃO:')
    console.log('-'.repeat(40))
    
    const { data: testResult, error: testError } = await supabase
      .rpc('get_next_ticket_number')
    
    if (testError) {
      console.error('❌ Erro ao testar função:', testError)
      return
    }
    
    console.log(`✅ Próximo ticket_number: ${testResult}`)
    
    // 4. TESTAR NOVAMENTE
    console.log('\n📊 4. TESTANDO NOVAMENTE:')
    console.log('-'.repeat(40))
    
    const { data: testResult2, error: testError2 } = await supabase
      .rpc('get_next_ticket_number')
    
    if (testError2) {
      console.error('❌ Erro ao testar função novamente:', testError2)
      return
    }
    
    console.log(`✅ Próximo ticket_number: ${testResult2}`)
    
    console.log('\n🎉 CONFIGURAÇÃO COMPLETA!')
    console.log('Agora você pode usar a API de tickets normalmente.')
    
  } catch (error) {
    console.error('❌ Erro no script:', error.message)
  }
}

setupTicketSequence()
