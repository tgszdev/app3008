const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODUxODYsImV4cCI6MjA3MjE2MTE4Nn0.ht9a6MmtkfE5hVRmwpfyMcW24a4R7n-9hoW6eYd3K2w'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testRating() {
  try {
    console.log('Buscando tickets...')
    
    // Buscar tickets
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, ticket_number, status, created_by')
      .limit(5)
    
    if (ticketsError) {
      console.error('Erro ao buscar tickets:', ticketsError)
      return
    }
    
    if (!tickets || tickets.length === 0) {
      console.log('Nenhum ticket encontrado.')
      return
    }
    
    console.log('Tickets encontrados:')
    tickets.forEach(t => {
      console.log(`- Ticket #${t.ticket_number}`)
      console.log(`  Status: ${t.status}`)
      console.log(`  ID: ${t.id}`)
      console.log(`  Criado por: ${t.created_by}`)
      console.log('')
    })
    
    // Pegar o primeiro ticket resolvido ou o primeiro ticket
    const resolvedTicket = tickets.find(t => t.status === 'resolved') || tickets[0]
    
    if (resolvedTicket.status !== 'resolved') {
      console.log(`\\nTicket #${resolvedTicket.ticket_number} não está resolvido (status: ${resolvedTicket.status}).`)
      console.log('Para testar avaliação real, resolva um ticket primeiro.')
      return
    }
    
    console.log(`\\nTentando criar avaliação para ticket #${resolvedTicket.ticket_number}...`)
    
    // Tentar criar avaliação
    const { data: rating, error: ratingError } = await supabase
      .from('ticket_ratings')
      .insert({
        ticket_id: resolvedTicket.id,
        user_id: resolvedTicket.created_by,
        rating: 5,
        comment: 'Teste de avaliação - Excelente atendimento!'
      })
      .select()
      .single()
    
    if (ratingError) {
      if (ratingError.code === '23505') {
        console.log('⚠️  Já existe uma avaliação para este ticket pelo mesmo usuário.')
      } else {
        console.error('Erro ao criar avaliação:', ratingError)
      }
    } else {
      console.log('✅ Avaliação criada com sucesso!')
      console.log('Dados da avaliação:', rating)
    }
    
    // Verificar se a avaliação foi salva
    console.log('\\nVerificando avaliações no banco...')
    const { data: allRatings, error: allError } = await supabase
      .from('ticket_ratings')
      .select('*')
      .limit(10)
    
    if (allError) {
      console.error('Erro ao buscar avaliações:', allError)
    } else {
      console.log(`Total de avaliações no banco: ${allRatings.length}`)
      if (allRatings.length > 0) {
        console.log('Primeira avaliação:', allRatings[0])
      }
    }
    
  } catch (error) {
    console.error('Erro inesperado:', error)
  }
}

testRating()