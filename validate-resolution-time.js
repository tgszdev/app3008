#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function validateResolutionTime() {
  console.log('🔍 Validando Tempo Médio de Resolução na base de dados...\n')

  try {
    // 1. Buscar todos os tickets com dados de resolução
    const { data: allTickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, title, status, created_at, updated_at, resolved_at, context_id')

    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError)
      return
    }

    console.log(`📊 Total de tickets analisados: ${allTickets.length}`)

    // 2. Analisar estrutura dos dados de tempo
    console.log('\n📊 Estrutura dos dados de tempo:')
    const sampleTicket = allTickets[0]
    if (sampleTicket) {
      console.log('  - created_at:', sampleTicket.created_at)
      console.log('  - updated_at:', sampleTicket.updated_at)
      console.log('  - resolved_at:', sampleTicket.resolved_at)
    }

    // 3. Contar tickets por status
    const statusCount = {}
    allTickets.forEach(ticket => {
      statusCount[ticket.status] = (statusCount[ticket.status] || 0) + 1
    })

    console.log('\n📊 Tickets por status:')
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`)
    })

    // 4. Identificar tickets resolvidos (com resolved_at)
    const resolvedTickets = allTickets.filter(ticket => ticket.resolved_at)
    console.log(`\n📊 Tickets com resolved_at: ${resolvedTickets.length}`)

    // 5. Calcular tempo de resolução para tickets resolvidos
    const resolutionTimes = []
    resolvedTickets.forEach(ticket => {
      const created = new Date(ticket.created_at)
      const resolved = new Date(ticket.resolved_at)
      const diffHours = (resolved - created) / (1000 * 60 * 60) // em horas
      resolutionTimes.push({
        id: ticket.id,
        status: ticket.status,
        created_at: ticket.created_at,
        resolved_at: ticket.resolved_at,
        resolution_hours: diffHours,
        resolution_days: Math.round(diffHours / 24 * 100) / 100
      })
    })

    console.log('\n📊 Tempos de resolução calculados:')
    resolutionTimes.forEach(rt => {
      console.log(`  - ${rt.id}: ${rt.resolution_days} dias (${rt.resolution_hours.toFixed(2)} horas)`)
    })

    // 6. Calcular estatísticas
    if (resolutionTimes.length > 0) {
      const avgHours = resolutionTimes.reduce((sum, rt) => sum + rt.resolution_hours, 0) / resolutionTimes.length
      const avgDays = avgHours / 24
      const minHours = Math.min(...resolutionTimes.map(rt => rt.resolution_hours))
      const maxHours = Math.max(...resolutionTimes.map(rt => rt.resolution_hours))

      console.log('\n📊 Estatísticas de resolução:')
      console.log(`  - Média: ${avgDays.toFixed(2)} dias (${avgHours.toFixed(2)} horas)`)
      console.log(`  - Mínimo: ${(minHours / 24).toFixed(2)} dias (${minHours.toFixed(2)} horas)`)
      console.log(`  - Máximo: ${(maxHours / 24).toFixed(2)} dias (${maxHours.toFixed(2)} horas)`)
      console.log(`  - Total de tickets resolvidos: ${resolutionTimes.length}`)
    } else {
      console.log('\n❌ Nenhum ticket com resolved_at encontrado!')
    }

    // 7. Verificar tickets que deveriam estar resolvidos (status "Resolvido", "Fechado")
    const shouldBeResolved = allTickets.filter(ticket => 
      ticket.status === 'Resolvido' || ticket.status === 'Fechado'
    )
    console.log(`\n📊 Tickets com status "Resolvido" ou "Fechado": ${shouldBeResolved.length}`)

    const shouldBeResolvedWithoutResolvedAt = shouldBeResolved.filter(ticket => !ticket.resolved_at)
    console.log(`📊 Tickets resolvidos SEM resolved_at: ${shouldBeResolvedWithoutResolvedAt.length}`)

    if (shouldBeResolvedWithoutResolvedAt.length > 0) {
      console.log('\n📊 Tickets que precisam de resolved_at:')
      shouldBeResolvedWithoutResolvedAt.forEach(ticket => {
        console.log(`  - ${ticket.id}: ${ticket.status} (criado: ${ticket.created_at})`)
      })
    }

    // 8. Verificar se há tickets com status intermediários que podem ter tempo de resolução
    const intermediateStatuses = ['Em Atendimento', 'Ag. Deploy em Homologação', 'Em Homologação', 'Ag. Deploy em Produção']
    const intermediateTickets = allTickets.filter(ticket => 
      intermediateStatuses.includes(ticket.status)
    )
    console.log(`\n📊 Tickets em status intermediários: ${intermediateTickets.length}`)

    // 9. Calcular tempo desde criação para tickets não resolvidos
    const now = new Date()
    const nonResolvedTimes = allTickets
      .filter(ticket => !ticket.resolved_at)
      .map(ticket => {
        const created = new Date(ticket.created_at)
        const diffHours = (now - created) / (1000 * 60 * 60)
        return {
          id: ticket.id,
          status: ticket.status,
          created_at: ticket.created_at,
          hours_since_creation: diffHours,
          days_since_creation: Math.round(diffHours / 24 * 100) / 100
        }
      })

    console.log('\n📊 Tempo desde criação (tickets não resolvidos):')
    nonResolvedTimes.slice(0, 5).forEach(nt => {
      console.log(`  - ${nt.id}: ${nt.days_since_creation} dias (${nt.status})`)
    })

    console.log('\n✅ Validação de tempo de resolução concluída!')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar validação
validateResolutionTime()
