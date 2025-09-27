import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkStatusSlugs() {
  console.log('🔍 Verificando slugs dos status...')
  
  // 1. Verificar status na tabela ticket_statuses
  const { data: statuses, error: statusError } = await supabase
    .from('ticket_statuses')
    .select('id, name, slug, color, order_index')
    .order('order_index', { ascending: true })
  
  if (statusError) {
    console.error('❌ Erro ao buscar status:', statusError)
    return
  }
  
  console.log(`✅ Status na tabela ticket_statuses:`)
  statuses?.forEach(status => {
    console.log(`  - ${status.name} (slug: ${status.slug}) - ${status.color}`)
  })
  
  // 2. Verificar status únicos nos tickets
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('status')
    .limit(10)
  
  if (ticketsError) {
    console.error('❌ Erro ao buscar tickets:', ticketsError)
    return
  }
  
  const uniqueStatuses = [...new Set(tickets?.map(t => t.status) || [])]
  console.log(`\n✅ Status únicos nos tickets:`)
  uniqueStatuses.forEach(status => {
    console.log(`  - ${status}`)
  })
  
  // 3. Verificar correspondência
  console.log(`\n🔍 Verificando correspondência:`)
  statuses?.forEach(status => {
    const matchingTickets = tickets?.filter(t => t.status === status.slug).length
    console.log(`  - ${status.name} (${status.slug}): ${matchingTickets} tickets correspondentes`)
  })
}

checkStatusSlugs().catch(console.error)
