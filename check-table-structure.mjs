import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function checkTableStructure() {
  console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA TICKETS...')
  
  try {
    // Verificar se há DEFAULT na coluna ticket_number
    const { data: columns, error } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, column_default, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'tickets' 
          AND column_name = 'ticket_number'
        `
      })
    
    if (error) {
      console.error('❌ Erro ao verificar colunas:', error)
      return
    }
    
    console.log('📋 Estrutura da coluna ticket_number:')
    console.log(JSON.stringify(columns, null, 2))
    
    // Verificar se há TRIGGERS
    const { data: triggers, error: triggerError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT trigger_name, event_manipulation, action_statement
          FROM information_schema.triggers 
          WHERE event_object_table = 'tickets'
        `
      })
    
    if (triggerError) {
      console.error('❌ Erro ao verificar triggers:', triggerError)
      return
    }
    
    console.log('🔧 Triggers na tabela tickets:')
    console.log(JSON.stringify(triggers, null, 2))
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkTableStructure()