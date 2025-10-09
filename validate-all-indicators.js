#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function validateAllIndicators() {
  console.log('🔍 Validando todos os indicadores da página Analytics...\n')

  try {
    const contextIds = ['6486088e-72ae-461b-8b03-32ca84918882', '18031594-558a-4f45-847c-b1d2b58087f0', '85879bd8-d1d1-416b-ae55-e564687af28b']
    
    // Buscar todos os tickets com dados completos
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        id,
        context_id,
        status,
        priority,
        created_at,
        updated_at,
        resolved_at,
        ratings:ticket_ratings(
          id,
          rating,
          comment,
          created_at
        )
      `)
      .in('context_id', contextIds)

    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError)
      return
    }

    console.log(`📊 Total de tickets encontrados: ${tickets.length}`)

    // 1. TOTAL DE TICKETS
    const totalTickets = tickets.length
    console.log(`\n📊 1. TOTAL DE TICKETS: ${totalTickets}`)

    // 2. TEMPO MÉDIO DE RESOLUÇÃO
    let totalResolutionTime = 0
    let resolvedTicketsCount = 0
    const resolutionTimes = []

    tickets.forEach(ticket => {
      if (ticket.resolved_at) {
        const created = new Date(ticket.created_at)
        const resolved = new Date(ticket.resolved_at)
        const diffHours = (resolved - created) / (1000 * 60 * 60)
        totalResolutionTime += diffHours
        resolvedTicketsCount++
        resolutionTimes.push({
          ticket_id: ticket.id,
          hours: diffHours,
          days: diffHours / 24
        })
      }
    })

    const avgResolutionHours = resolvedTicketsCount > 0 ? totalResolutionTime / resolvedTicketsCount : 0
    const avgResolutionDays = avgResolutionHours / 24
    const avgResolutionTime = resolvedTicketsCount > 0 ? `${avgResolutionDays.toFixed(1)} dias` : 'N/A'
    const resolutionRate = resolvedTicketsCount > 0 ? Math.round((resolvedTicketsCount / totalTickets) * 100) : 0

    console.log(`\n📊 2. TEMPO MÉDIO DE RESOLUÇÃO:`)
    console.log(`  - Tickets resolvidos: ${resolvedTicketsCount}`)
    console.log(`  - Tempo total (horas): ${totalResolutionTime.toFixed(2)}`)
    console.log(`  - Tempo médio (horas): ${avgResolutionHours.toFixed(2)}`)
    console.log(`  - Tempo médio (dias): ${avgResolutionDays.toFixed(2)}`)
    console.log(`  - Resultado: ${avgResolutionTime}`)
    console.log(`  - Taxa de resolução: ${resolutionRate}%`)

    // 3. TAXA DE SATISFAÇÃO
    let totalRatings = 0
    let totalRatingSum = 0
    const allRatings = []

    tickets.forEach(ticket => {
      if (ticket.ratings && ticket.ratings.length > 0) {
        ticket.ratings.forEach(rating => {
          totalRatings++
          totalRatingSum += rating.rating || 0
          allRatings.push({
            ticket_id: ticket.id,
            rating: rating.rating,
            comment: rating.comment
          })
        })
      }
    })

    const satisfactionRate = totalRatings > 0 ? Math.round((totalRatingSum / totalRatings / 5) * 100) : 0

    console.log(`\n📊 3. TAXA DE SATISFAÇÃO:`)
    console.log(`  - Total de avaliações: ${totalRatings}`)
    console.log(`  - Soma dos ratings: ${totalRatingSum}`)
    console.log(`  - Média dos ratings: ${totalRatings > 0 ? (totalRatingSum / totalRatings).toFixed(2) : 0}`)
    console.log(`  - Taxa de satisfação: ${satisfactionRate}%`)
    console.log(`  - Detalhes das avaliações:`)
    allRatings.forEach((rating, index) => {
      console.log(`    ${index + 1}. Ticket ${rating.ticket_id}: Rating ${rating.rating} - "${rating.comment}"`)
    })

    // 4. DISTRIBUIÇÃO POR STATUS
    const statusCounts = {}
    tickets.forEach(ticket => {
      statusCounts[ticket.status] = (statusCounts[ticket.status] || 0) + 1
    })

    console.log(`\n📊 4. DISTRIBUIÇÃO POR STATUS:`)
    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = Math.round((count / totalTickets) * 100)
      console.log(`  - ${status}: ${count} (${percentage}%)`)
    })

    // 5. DISTRIBUIÇÃO POR PRIORIDADE
    const priorityCounts = { low: 0, medium: 0, high: 0, critical: 0 }
    tickets.forEach(ticket => {
      if (ticket.priority === 'low') priorityCounts.low++
      else if (ticket.priority === 'medium') priorityCounts.medium++
      else if (ticket.priority === 'high') priorityCounts.high++
      else if (ticket.priority === 'critical') priorityCounts.critical++
    })

    console.log(`\n📊 5. DISTRIBUIÇÃO POR PRIORIDADE:`)
    Object.entries(priorityCounts).forEach(([priority, count]) => {
      const percentage = Math.round((count / totalTickets) * 100)
      console.log(`  - ${priority}: ${count} (${percentage}%)`)
    })

    // 6. PEAK HOURS
    const peakHours = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }))
    tickets.forEach(ticket => {
      const hour = new Date(ticket.created_at).getHours()
      peakHours[hour].count++
    })

    const topHours = peakHours
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    console.log(`\n📊 6. PEAK HOURS (Top 5):`)
    topHours.forEach(({ hour, count }) => {
      console.log(`  - ${hour}:00 - ${count} tickets`)
    })

    // 7. RESUMO FINAL
    console.log(`\n📊 RESUMO FINAL DOS INDICADORES:`)
    console.log(`  ✅ Total de Tickets: ${totalTickets}`)
    console.log(`  ✅ Tempo Médio de Resolução: ${avgResolutionTime}`)
    console.log(`  ✅ Taxa de Satisfação: ${satisfactionRate}%`)
    console.log(`  ✅ Taxa de Resolução: ${resolutionRate}%`)
    console.log(`  ✅ Status únicos: ${Object.keys(statusCounts).length}`)
    console.log(`  ✅ Prioridades únicas: ${Object.values(priorityCounts).filter(c => c > 0).length}`)

    console.log('\n✅ Validação concluída!')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar validação
validateAllIndicators()
