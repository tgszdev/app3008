import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODUxODYsImV4cCI6MjA3MjE2MTE4Nn0.ht9a6MmtkfE5hVRmwpfyMcW24a4R7n-9hoW6eYd3K2w'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSequenceViaSQL() {
  console.log('🔧 CRIANDO SEQUENCE VIA SQL DIRETO')
  console.log('=' .repeat(60))
  
  try {
    // 1. VERIFICAR SE A SEQUENCE JÁ EXISTE
    console.log('\n📊 1. VERIFICANDO SEQUENCE EXISTENTE:')
    console.log('-'.repeat(40))
    
    const { data: sequenceCheck, error: sequenceError } = await supabase
      .from('pg_sequences')
      .select('*')
      .eq('sequencename', 'ticket_number_seq')
    
    if (sequenceError) {
      console.log('⚠️ Erro ao verificar sequence:', sequenceError.message)
    } else if (sequenceCheck && sequenceCheck.length > 0) {
      console.log('✅ Sequence já existe:', sequenceCheck[0])
    } else {
      console.log('❌ Sequence não existe, criando...')
    }
    
    // 2. TENTAR CRIAR SEQUENCE VIA RPC
    console.log('\n📊 2. TENTANDO CRIAR SEQUENCE:')
    console.log('-'.repeat(40))
    
    // Tentar criar sequence via função SQL
    const { data: createResult, error: createError } = await supabase
      .rpc('create_ticket_sequence')
    
    if (createError) {
      console.log('⚠️ Função create_ticket_sequence não existe:', createError.message)
      console.log('📝 INSTRUÇÕES MANUAIS:')
      console.log('1. Acesse o Supabase Dashboard')
      console.log('2. Vá para SQL Editor')
      console.log('3. Execute o seguinte SQL:')
      console.log('')
      console.log('-- Criar sequence')
      console.log('CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START WITH 1 INCREMENT BY 1;')
      console.log('')
      console.log('-- Criar função')
      console.log('CREATE OR REPLACE FUNCTION get_next_ticket_number()')
      console.log('RETURNS INTEGER AS $$')
      console.log('BEGIN')
      console.log('  RETURN nextval(\'ticket_number_seq\');')
      console.log('END;')
      console.log('$$ LANGUAGE plpgsql;')
      console.log('')
      console.log('-- Testar função')
      console.log('SELECT get_next_ticket_number();')
      console.log('')
      return
    }
    
    console.log('✅ Sequence criada via função:', createResult)
    
  } catch (error) {
    console.error('❌ Erro no script:', error.message)
  }
}

createSequenceViaSQL()
