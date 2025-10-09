#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugMissingRating() {
  console.log('🔍 Investigando por que o segundo ticket com rating não está sendo incluído...\n')

  try {
    const contextIds = ['6486088e-72ae-461b-8b03-32ca84918882', '18031594-558a-4f45-847c-b1d2b58087f0', '85879bd8-d1d1-416b-ae55-e564687af28b']
    const startDate = '2025-09-09'
    const endDate = '2025-10-09'

    console.log(`📅 Período: ${startDate} a ${endDate}`)
    console.log(`🏢 Contextos: ${contextIds.length}`)

    // 1. Verificar todos os tickets com ratings (sem filtro de data)
    console.log('\n1️⃣ Verificando TODOS os tickets com ratings (sem filtro de data):')
    const { data: allTicketsWithRatings, error: allError } = await supabase
      .from('tickets')
      .select(`
        id,
        context_id,
        created_at,
        ratings:ticket_ratings(
          id,
          rating,
          comment,
          created_at
        )
      `)
      .in('context_id', contextIds)
      .not('ratings', 'is', null)

    if (allError) {
      console.error('❌ Erro ao buscar todos os tickets:', allError)
      return
    }

    console.log(`📊 Total de tickets com ratings encontrados: ${allTicketsWithRatings.length}`)
    allTicketsWithRatings.forEach((ticket, index) => {
      console.log(`  ${index + 1}. Ticket ${ticket.id} (contexto: ${ticket.context_id})`)
      console.log(`     - Criado em: ${ticket.created_at}`)
      console.log(`     - Ratings: ${ticket.ratings.length}`)
      ticket.ratings.forEach((rating, rIndex) => {
        console.log(`       ${rIndex + 1}. Rating ${rating.rating} - "${rating.comment}"`)
      })
    })

    // 2. Verificar tickets com ratings no período específico
    console.log('\n2️⃣ Verificando tickets com ratings no período específico:')
    const { data: periodTicketsWithRatings, error: periodError } = await supabase
      .from('tickets')
      .select(`
        id,
        context_id,
        created_at,
        ratings:ticket_ratings(
          id,
          rating,
          comment,
          created_at
        )
      `)
      .in('context_id', contextIds)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('ratings', 'is', null)

    if (periodError) {
      console.error('❌ Erro ao buscar tickets do período:', periodError)
      return
    }

    console.log(`📊 Tickets com ratings no período: ${periodTicketsWithRatings.length}`)
    periodTicketsWithRatings.forEach((ticket, index) => {
      console.log(`  ${index + 1}. Ticket ${ticket.id} (contexto: ${ticket.context_id})`)
      console.log(`     - Criado em: ${ticket.created_at}`)
      console.log(`     - Ratings: ${ticket.ratings.length}`)
      ticket.ratings.forEach((rating, rIndex) => {
        console.log(`       ${rIndex + 1}. Rating ${rating.rating} - "${rating.comment}"`)
      })
    })

    // 3. Verificar se há diferença entre os dois resultados
    const allTicketIds = allTicketsWithRatings.map(t => t.id)
    const periodTicketIds = periodTicketsWithRatings.map(t => t.id)
    const missingTickets = allTicketIds.filter(id => !periodTicketIds.includes(id))

    console.log('\n3️⃣ Análise de diferenças:')
    console.log(`📊 Total sem filtro de data: ${allTicketIds.length}`)
    console.log(`📊 Total com filtro de data: ${periodTicketIds.length}`)
    console.log(`📊 Tickets excluídos pelo filtro de data: ${missingTickets.length}`)

    if (missingTickets.length > 0) {
      console.log('\n❌ Tickets excluídos pelo filtro de data:')
      missingTickets.forEach(ticketId => {
        const ticket = allTicketsWithRatings.find(t => t.id === ticketId)
        console.log(`  - ${ticketId} (criado em: ${ticket.created_at})`)
      })
    }

    // 4. Verificar se o problema é com o filtro de data ou com a query
    console.log('\n4️⃣ Verificando se o problema é com o filtro de data:')
    const { data: ticketsInRange, error: rangeError } = await supabase
      .from('tickets')
      .select(`
        id,
        context_id,
        created_at,
        ratings:ticket_ratings(
          id,
          rating,
          comment,
          created_at
        )
      `)
      .in('context_id', contextIds)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (rangeError) {
      console.error('❌ Erro ao buscar tickets no período:', rangeError)
      return
    }

    const ticketsWithRatingsInRange = ticketsInRange.filter(ticket => ticket.ratings && ticket.ratings.length > 0)
    console.log(`📊 Tickets no período com ratings: ${ticketsWithRatingsInRange.length}`)

    console.log('\n✅ Investigação concluída!')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar investigação
debugMissingRating()

