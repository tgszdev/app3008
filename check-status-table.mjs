import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkStatusTable() {
  console.log('🔍 Verificando tabelas de status...')
  
  // Tentar diferentes nomes de tabela
  const possibleTables = ['statuses', 'ticket_statuses', 'status', 'ticket_status']
  
  for (const tableName of possibleTables) {
    console.log(`\nTestando tabela: ${tableName}`)
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`❌ ${tableName}: ${error.message}`)
    } else {
      console.log(`✅ ${tableName}: Encontrada!`)
      console.log(`   Dados:`, data)
    }
  }
  
  // Verificar estrutura da tabela tickets para ver como os status são armazenados
  console.log('\n🔍 Verificando estrutura da tabela tickets...')
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('status')
    .limit(5)
  
  if (!ticketsError && tickets) {
    console.log('✅ Status únicos encontrados nos tickets:')
    const uniqueStatuses = [...new Set(tickets.map(t => t.status))]
    uniqueStatuses.forEach(status => {
      console.log(`  - ${status}`)
    })
  }
}

checkStatusTable().catch(console.error)
