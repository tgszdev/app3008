#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function validateSatisfactionRate() {
  console.log('🔍 Validando Taxa de Satisfação na base de dados...\n')

  try {
    // 1. Verificar se existe tabela de ratings
    const { data: ratingsTable, error: tableError } = await supabase
      .from('ticket_ratings')
      .select('*')
      .limit(1)

    if (tableError) {
      console.log('❌ Tabela ticket_ratings não encontrada ou erro:', tableError.message)
      
      // Verificar se existe tabela de avaliações com nome diferente
      const { data: alternativeTable, error: altError } = await supabase
        .from('ticket_evaluations')
        .select('*')
        .limit(1)
      
      if (altError) {
        console.log('❌ Tabela ticket_evaluations também não encontrada:', altError.message)
      } else {
        console.log('✅ Tabela ticket_evaluations encontrada!')
      }
      
      // Verificar outras possíveis tabelas
      const { data: feedbackTable, error: feedbackError } = await supabase
        .from('ticket_feedback')
        .select('*')
        .limit(1)
      
      if (feedbackError) {
        console.log('❌ Tabela ticket_feedback também não encontrada:', feedbackError.message)
      } else {
        console.log('✅ Tabela ticket_feedback encontrada!')
      }
      
      return
    }

    console.log('✅ Tabela ticket_ratings encontrada!')

    // 2. Buscar todas as avaliações
    const { data: allRatings, error: ratingsError } = await supabase
      .from('ticket_ratings')
      .select('*')

    if (ratingsError) {
      console.error('❌ Erro ao buscar avaliações:', ratingsError)
      return
    }

    console.log(`📊 Total de avaliações encontradas: ${allRatings.length}`)

    if (allRatings.length === 0) {
      console.log('❌ Nenhuma avaliação encontrada na base de dados!')
      console.log('💡 Isso explica por que a Taxa de Satisfação está como N/A')
      return
    }

    // 3. Analisar estrutura das avaliações
    console.log('\n📊 Estrutura das avaliações:')
    const sampleRating = allRatings[0]
    if (sampleRating) {
      console.log('  - Campos disponíveis:', Object.keys(sampleRating))
      console.log('  - Amostra:', sampleRating)
    }

    // 4. Contar avaliações por rating
    const ratingCounts = {}
    allRatings.forEach(rating => {
      const ratingValue = rating.rating || rating.score || rating.value
      ratingCounts[ratingValue] = (ratingCounts[ratingValue] || 0) + 1
    })

    console.log('\n📊 Distribuição das avaliações:')
    Object.entries(ratingCounts).forEach(([rating, count]) => {
      console.log(`  - Rating ${rating}: ${count} avaliações`)
    })

    // 5. Calcular taxa de satisfação
    const totalRatings = allRatings.length
    const positiveRatings = allRatings.filter(rating => {
      const ratingValue = rating.rating || rating.score || rating.value
      return ratingValue >= 4 // Considerar 4+ como satisfatório
    }).length

    const satisfactionRate = totalRatings > 0 ? Math.round((positiveRatings / totalRatings) * 100) : 0

    console.log('\n📊 Taxa de Satisfação calculada:')
    console.log(`  - Total de avaliações: ${totalRatings}`)
    console.log(`  - Avaliações positivas (4+): ${positiveRatings}`)
    console.log(`  - Taxa de satisfação: ${satisfactionRate}%`)

    // 6. Verificar tickets com avaliações
    const ticketIds = [...new Set(allRatings.map(rating => rating.ticket_id))]
    console.log(`\n📊 Tickets com avaliações: ${ticketIds.length}`)

    // 7. Verificar se há tickets sem avaliações
    const { data: allTickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, status')
      .in('status', ['Resolvido', 'Fechado'])

    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError)
    } else {
      const resolvedTickets = allTickets.length
      const ticketsWithRatings = ticketIds.length
      const ticketsWithoutRatings = resolvedTickets - ticketsWithRatings

      console.log(`\n📊 Análise de tickets resolvidos vs avaliações:`)
      console.log(`  - Tickets resolvidos: ${resolvedTickets}`)
      console.log(`  - Tickets com avaliações: ${ticketsWithRatings}`)
      console.log(`  - Tickets sem avaliações: ${ticketsWithoutRatings}`)
      console.log(`  - Taxa de resposta: ${resolvedTickets > 0 ? Math.round((ticketsWithRatings / resolvedTickets) * 100) : 0}%`)
    }

    console.log('\n✅ Validação de taxa de satisfação concluída!')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar validação
validateSatisfactionRate()

