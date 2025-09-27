import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTicketStatuses() {
  console.log('🔍 Verificando tabela ticket_statuses...')
  
  // Verificar se há dados na tabela
  const { data: statuses, error: statusError } = await supabase
    .from('ticket_statuses')
    .select('*')
    .order('order_index', { ascending: true })
  
  if (statusError) {
    console.error('❌ Erro ao buscar status:', statusError)
    return
  }
  
  console.log(`✅ Encontrados ${statuses?.length || 0} status na tabela ticket_statuses`)
  
  if (statuses && statuses.length > 0) {
    console.log('Status encontrados:')
    statuses.forEach(status => {
      console.log(`  - ${status.name} (${status.slug}) - ${status.color} - Ativo: ${status.is_active}`)
    })
  } else {
    console.log('⚠️ Nenhum status encontrado na tabela ticket_statuses')
    console.log('Criando status padrão...')
    
    // Criar status padrão
    const defaultStatuses = [
      { name: 'Aberto', slug: 'open', color: '#3b82f6', order_index: 1, is_active: true },
      { name: 'Em Progresso', slug: 'in_progress', color: '#f59e0b', order_index: 2, is_active: true },
      { name: 'Resolvido', slug: 'resolved', color: '#10b981', order_index: 3, is_active: true },
      { name: 'Fechado', slug: 'closed', color: '#6b7280', order_index: 4, is_active: true }
    ]
    
    const { data: newStatuses, error: insertError } = await supabase
      .from('ticket_statuses')
      .insert(defaultStatuses)
      .select()
    
    if (insertError) {
      console.error('❌ Erro ao criar status padrão:', insertError)
    } else {
      console.log('✅ Status padrão criados com sucesso!')
      newStatuses?.forEach(status => {
        console.log(`  - ${status.name} (${status.slug})`)
      })
    }
  }
}

checkTicketStatuses().catch(console.error)
