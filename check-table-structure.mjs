import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTableStructure() {
  console.log('🔍 Verificando estrutura da tabela ticket_statuses...')
  
  // Tentar buscar com select * para ver todas as colunas
  const { data: statuses, error: statusError } = await supabase
    .from('ticket_statuses')
    .select('*')
    .limit(1)
  
  if (statusError) {
    console.error('❌ Erro ao buscar estrutura:', statusError)
    return
  }
  
  console.log('✅ Estrutura da tabela ticket_statuses:')
  if (statuses && statuses.length > 0) {
    console.log('Colunas encontradas:', Object.keys(statuses[0]))
  } else {
    console.log('⚠️ Tabela vazia, tentando inserir dados básicos...')
    
    // Tentar inserir sem is_active
    const basicStatuses = [
      { name: 'Aberto', slug: 'open', color: '#3b82f6', order_index: 1 },
      { name: 'Em Progresso', slug: 'in_progress', color: '#f59e0b', order_index: 2 },
      { name: 'Resolvido', slug: 'resolved', color: '#10b981', order_index: 3 },
      { name: 'Fechado', slug: 'closed', color: '#6b7280', order_index: 4 }
    ]
    
    const { data: newStatuses, error: insertError } = await supabase
      .from('ticket_statuses')
      .insert(basicStatuses)
      .select()
    
    if (insertError) {
      console.error('❌ Erro ao criar status básicos:', insertError)
    } else {
      console.log('✅ Status básicos criados com sucesso!')
      newStatuses?.forEach(status => {
        console.log(`  - ${status.name} (${status.slug})`)
      })
    }
  }
}

checkTableStructure().catch(console.error)