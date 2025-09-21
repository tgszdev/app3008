import { supabaseAdmin } from './src/lib/supabase-admin.js'

async function testRating() {
  try {
    // Buscar um ticket resolvido
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('id, ticket_number, status, created_by')
      .eq('status', 'resolved')
      .limit(1)
    
    if (ticketsError) {
      console.error('Erro ao buscar tickets:', ticketsError)
      return
    }
    
    if (!tickets || tickets.length === 0) {
      console.log('Nenhum ticket resolvido encontrado.')
      console.log('Buscando qualquer ticket para teste...')
      
      const { data: anyTickets, error: anyError } = await supabaseAdmin
        .from('tickets')
        .select('id, ticket_number, status, created_by')
        .limit(5)
      
      if (anyTickets && anyTickets.length > 0) {
        console.log('Tickets disponíveis:')
        anyTickets.forEach(t => {
          console.log(`- Ticket #${t.ticket_number} (Status: ${t.status}, ID: ${t.id})`)
        })
      }
      return
    }
    
    const ticket = tickets[0]
    console.log('Ticket encontrado para teste:')
    console.log(`- Número: #${ticket.ticket_number}`)
    console.log(`- ID: ${ticket.id}`)
    console.log(`- Status: ${ticket.status}`)
    console.log(`- Criado por: ${ticket.created_by}`)
    
    // Tentar criar uma avaliação
    console.log('\nTentando criar avaliação...')
    const { data: rating, error: ratingError } = await supabaseAdmin
      .from('ticket_ratings')
      .insert({
        ticket_id: ticket.id,
        user_id: ticket.created_by,
        rating: 5,
        comment: 'Excelente atendimento! Problema resolvido rapidamente.'
      })
      .select()
      .single()
    
    if (ratingError) {
      console.error('Erro ao criar avaliação:', ratingError)
    } else {
      console.log('✅ Avaliação criada com sucesso!')
      console.log('Dados:', rating)
    }
    
  } catch (error) {
    console.error('Erro inesperado:', error)
  }
}

testRating()