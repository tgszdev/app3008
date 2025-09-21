const { createClient } = require('@supabase/supabase-js')

// Usar APENAS a Anon Key (como está em produção)
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODUxODYsImV4cCI6MjA3MjE2MTE4Nn0.ht9a6MmtkfE5hVRmwpfyMcW24a4R7n-9hoW6eYd3K2w'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testar() {
  console.log('====================================')
  console.log('TESTE DE CONEXÃO COM ANON KEY')
  console.log('====================================\n')
  
  // IDs reais de tickets
  const ticketIds = [
    'f15e9573-7ca6-48df-bf87-5f9166f01a8f',
    '4e49d8ee-0ee9-4eaa-a43b-2559195b47ea'
  ]
  
  for (const ticketId of ticketIds) {
    console.log(`\nTestando ticket ID: ${ticketId}`)
    console.log('----------------------------------------')
    
    // Tentar buscar o ticket
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('id, created_by, ticket_number, status')
      .eq('id', ticketId)
      .single()
    
    if (error) {
      console.log('❌ Erro ao buscar ticket:', error.message)
      console.log('   Código:', error.code)
      if (error.code === 'PGRST116') {
        console.log('   -> Ticket não encontrado ou sem permissão')
      }
    } else if (ticket) {
      console.log('✅ Ticket encontrado!')
      console.log('   Número:', ticket.ticket_number)
      console.log('   Status:', ticket.status)
      console.log('   Created by:', ticket.created_by)
    } else {
      console.log('⚠️  Nenhum resultado retornado')
    }
  }
  
  // Testar buscar QUALQUER ticket
  console.log('\n\nTestando buscar QUALQUER ticket')
  console.log('----------------------------------------')
  
  const { data: anyTickets, error: anyError } = await supabase
    .from('tickets')
    .select('id, ticket_number')
    .limit(5)
  
  if (anyError) {
    console.log('❌ Erro ao buscar tickets:', anyError.message)
    console.log('   Código:', anyError.code)
  } else if (anyTickets && anyTickets.length > 0) {
    console.log(`✅ ${anyTickets.length} tickets encontrados:`)
    anyTickets.forEach(t => {
      console.log(`   - #${t.ticket_number} (${t.id})`)
    })
  } else {
    console.log('⚠️  Nenhum ticket retornado')
  }
  
  // Verificar RLS (Row Level Security)
  console.log('\n\nVERIFICANDO RLS (Row Level Security)')
  console.log('----------------------------------------')
  console.log('Se os tickets não são encontrados com Anon Key,')
  console.log('pode ser que a tabela tickets tenha RLS habilitado')
  console.log('e requer autenticação para acessar os dados.')
  
  console.log('\n\n====================================')
  console.log('CONCLUSÃO')
  console.log('====================================')
  console.log('\nSe os tickets NÃO foram encontrados:')
  console.log('1. A tabela tickets tem RLS habilitado')
  console.log('2. Precisa de autenticação para acessar')
  console.log('3. Ou usar Service Role Key em vez de Anon Key')
  console.log('\nSe os tickets FORAM encontrados:')
  console.log('1. O problema está em outro lugar')
  console.log('2. Verifique os logs do servidor em produção')
}

testar().catch(console.error)