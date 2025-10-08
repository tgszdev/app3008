#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function validateTotalTickets() {
  console.log('🔍 Validando Total de Tickets na base de dados...\n')

  try {
    // 1. Contar total de tickets na tabela tickets
    const { count: totalTickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })

    if (ticketsError) {
      console.error('❌ Erro ao contar tickets:', ticketsError)
      return
    }

    console.log('📊 Total de tickets na tabela tickets:', totalTickets)

    // 2. Buscar todos os tickets para análise
    const { data: allTickets, error: allTicketsError } = await supabase
      .from('tickets')
      .select('id, status, priority, context_id, created_at, title')

    if (allTicketsError) {
      console.error('❌ Erro ao buscar tickets:', allTicketsError)
      return
    }

    // 3. Contar por status
    const statusCount = {}
    allTickets.forEach(ticket => {
      statusCount[ticket.status] = (statusCount[ticket.status] || 0) + 1
    })

    console.log('\n📊 Tickets por status:')
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`)
    })

    // 4. Contar por prioridade
    const priorityCount = {}
    allTickets.forEach(ticket => {
      priorityCount[ticket.priority] = (priorityCount[ticket.priority] || 0) + 1
    })

    console.log('\n📊 Tickets por prioridade:')
    Object.entries(priorityCount).forEach(([priority, count]) => {
      console.log(`  - ${priority}: ${count}`)
    })

    // 5. Contar por contexto/organização
    const contextCount = {}
    allTickets.forEach(ticket => {
      contextCount[ticket.context_id] = (contextCount[ticket.context_id] || 0) + 1
    })

    console.log('\n📊 Tickets por contexto:')
    Object.entries(contextCount).forEach(([contextId, count]) => {
      console.log(`  - ${contextId}: ${count}`)
    })

    // 6. Verificar tickets dos últimos 30 dias
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentTickets = allTickets.filter(ticket => 
      new Date(ticket.created_at) >= thirtyDaysAgo
    ).length

    console.log(`\n📊 Tickets dos últimos 30 dias: ${recentTickets}`)

    // 7. Verificar amostra de tickets
    console.log('\n📊 Amostra de tickets (primeiros 5):')
    allTickets.slice(0, 5).forEach(ticket => {
      console.log(`  - ID: ${ticket.id}, Status: ${ticket.status}, Priority: ${ticket.priority}, Context: ${ticket.context_id}`)
    })

    // 8. Verificar tickets com context_id específicos
    const contextIds = ['6486088e-72ae-461b-8b03-32ca84918882', '18031594-558a-4f45-847c-b1d2b58087f0', '85879bd8-d1d1-416b-ae55-e564687af28b']
    
    console.log('\n📊 Tickets por contexto específico:')
    contextIds.forEach(contextId => {
      const contextTickets = allTickets.filter(ticket => ticket.context_id === contextId)
      console.log(`  - ${contextId}: ${contextTickets.length} tickets`)
    })

    // 9. Verificar tickets sem context_id
    const ticketsWithoutContext = allTickets.filter(ticket => !ticket.context_id)
    console.log(`\n📊 Tickets sem context_id: ${ticketsWithoutContext.length}`)

    // 10. Verificar tickets com status específicos
    const statusSlugs = ['open', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled']
    console.log('\n📊 Verificação de status slugs:')
    statusSlugs.forEach(status => {
      const count = allTickets.filter(ticket => ticket.status === status).length
      console.log(`  - ${status}: ${count} tickets`)
    })

    console.log('\n✅ Validação concluída!')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar validação
validateTotalTickets()
