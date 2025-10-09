#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugSatisfactionCalculation() {
  console.log('🔍 Debugando cálculo da Taxa de Satisfação...\n')

  try {
    // Simular exatamente o que a API multi-client-analytics faz
    const contextIds = ['6486088e-72ae-461b-8b03-32ca84918882', '18031594-558a-4f45-847c-b1d2b58087f0', '85879bd8-d1d1-416b-ae55-e564687af28b']
    
    let totalRatings = 0
    let totalRatingSum = 0
    const allRatings = []

    console.log('📊 Processando cada contexto como na API...\n')

    for (const contextId of contextIds) {
      console.log(`🔍 Processando contexto: ${contextId}`)
      
      // Buscar tickets com ratings (exatamente como na API)
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
        .eq('context_id', contextId)

      if (ticketsError) {
        console.error(`❌ Erro ao buscar tickets do contexto ${contextId}:`, ticketsError)
        continue
      }

      console.log(`  - Tickets encontrados: ${tickets.length}`)

      // Processar tickets como na API
      tickets.forEach(ticket => {
        if (ticket.ratings && ticket.ratings.length > 0) {
          console.log(`  - Ticket ${ticket.id} tem ${ticket.ratings.length} avaliação(ões)`)
          
          ticket.ratings.forEach(rating => {
            totalRatings++
            totalRatingSum += rating.rating || 0
            allRatings.push({
              context_id: contextId,
              ticket_id: ticket.id,
              rating: rating.rating,
              comment: rating.comment
            })
            console.log(`    * Rating: ${rating.rating} - "${rating.comment}"`)
          })
        }
      })
    }

    console.log('\n📊 Resumo do processamento:')
    console.log(`  - Total de ratings encontrados: ${totalRatings}`)
    console.log(`  - Soma total dos ratings: ${totalRatingSum}`)
    console.log(`  - Média dos ratings: ${totalRatings > 0 ? (totalRatingSum / totalRatings).toFixed(2) : 0}`)

    // Calcular exatamente como na API
    const satisfactionRate = totalRatings > 0 ? Math.round((totalRatingSum / totalRatings / 5) * 100) : 0

    console.log('\n📊 Cálculo da Taxa de Satisfação:')
    console.log(`  - Fórmula: (${totalRatingSum} / ${totalRatings} / 5) * 100`)
    console.log(`  - Passo 1: ${totalRatingSum} / ${totalRatings} = ${(totalRatingSum / totalRatings).toFixed(2)}`)
    console.log(`  - Passo 2: ${(totalRatingSum / totalRatings).toFixed(2)} / 5 = ${(totalRatingSum / totalRatings / 5).toFixed(2)}`)
    console.log(`  - Passo 3: ${(totalRatingSum / totalRatings / 5).toFixed(2)} * 100 = ${(totalRatingSum / totalRatings / 5 * 100).toFixed(2)}`)
    console.log(`  - Math.round: ${satisfactionRate}%`)

    // Verificar se há alguma diferença
    const expectedRate = 90
    if (satisfactionRate !== expectedRate) {
      console.log(`\n❌ PROBLEMA ENCONTRADO!`)
      console.log(`  - Esperado: ${expectedRate}%`)
      console.log(`  - Calculado: ${satisfactionRate}%`)
      console.log(`  - Diferença: ${satisfactionRate - expectedRate}%`)
    } else {
      console.log(`\n✅ Cálculo correto: ${satisfactionRate}%`)
    }

    // Verificar se há ratings duplicados ou problemas
    console.log('\n📊 Análise detalhada dos ratings:')
    allRatings.forEach((rating, index) => {
      console.log(`  ${index + 1}. Contexto: ${rating.context_id}, Ticket: ${rating.ticket_id}, Rating: ${rating.rating}`)
    })

    console.log('\n✅ Debug concluído!')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar debug
debugSatisfactionCalculation()
