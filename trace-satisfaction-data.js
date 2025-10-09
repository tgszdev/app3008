#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function traceSatisfactionData() {
  console.log('🔍 Rastreando dados da Taxa de Satisfação...\n')

  try {
    // 1. Buscar tickets com ratings (simulando a API)
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        id,
        context_id,
        status,
        created_at,
        ratings:ticket_ratings(
          id,
          rating,
          comment,
          created_at
        )
      `)
      .in('context_id', ['6486088e-72ae-461b-8b03-32ca84918882', '18031594-558a-4f45-847c-b1d2b58087f0', '85879bd8-d1d1-416b-ae55-e564687af28b'])

    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError)
      return
    }

    console.log(`📊 Tickets encontrados: ${tickets.length}`)

    // 2. Processar dados como na API
    let totalRatings = 0
    let totalRatingSum = 0
    const ratingsDetails = []

    tickets.forEach(ticket => {
      if (ticket.ratings && ticket.ratings.length > 0) {
        ticket.ratings.forEach(rating => {
          totalRatings++
          totalRatingSum += rating.rating || 0
          ratingsDetails.push({
            ticket_id: ticket.id,
            rating: rating.rating,
            comment: rating.comment,
            created_at: rating.created_at
          })
        })
      }
    })

    console.log('\n📊 Detalhes das avaliações:')
    ratingsDetails.forEach((rating, index) => {
      console.log(`  ${index + 1}. Ticket ${rating.ticket_id}: Rating ${rating.rating} - "${rating.comment}"`)
    })

    // 3. Calcular taxa de satisfação como na API
    const satisfactionRate = totalRatings > 0 
      ? Math.round((totalRatingSum / totalRatings / 5) * 100) 
      : 0

    console.log('\n📊 Cálculo da Taxa de Satisfação:')
    console.log(`  - Total de avaliações: ${totalRatings}`)
    console.log(`  - Soma dos ratings: ${totalRatingSum}`)
    console.log(`  - Média dos ratings: ${totalRatings > 0 ? (totalRatingSum / totalRatings).toFixed(2) : 0}`)
    console.log(`  - Taxa de satisfação: ${satisfactionRate}%`)

    // 4. Verificar tickets por contexto
    const contextCounts = {}
    tickets.forEach(ticket => {
      contextCounts[ticket.context_id] = (contextCounts[ticket.context_id] || 0) + 1
    })

    console.log('\n📊 Tickets por contexto:')
    Object.entries(contextCounts).forEach(([contextId, count]) => {
      console.log(`  - ${contextId}: ${count} tickets`)
    })

    // 5. Verificar se há tickets resolvidos com avaliações
    const resolvedTickets = tickets.filter(t => t.status === 'Resolvido' || t.status === 'Fechado')
    const resolvedWithRatings = resolvedTickets.filter(t => t.ratings && t.ratings.length > 0)

    console.log('\n📊 Análise de tickets resolvidos:')
    console.log(`  - Tickets resolvidos: ${resolvedTickets.length}`)
    console.log(`  - Tickets resolvidos com avaliações: ${resolvedWithRatings.length}`)
    console.log(`  - Taxa de resposta: ${resolvedTickets.length > 0 ? Math.round((resolvedWithRatings.length / resolvedTickets.length) * 100) : 0}%`)

    console.log('\n✅ Rastreamento concluído!')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar rastreamento
traceSatisfactionData()

