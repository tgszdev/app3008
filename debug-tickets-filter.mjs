#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gjjpddqdwdlnjryxtnmf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqanBkZHFkd2RsbmpyeXh0bm1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTYwMTcxMCwiZXhwIjoyMDQ3MTc3NzEwfQ.J7_YAGklLpX0CDPOLSrMJVMW8FbFQ2d4oZjGdRlN_3Q'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugTicketsFilter() {
  console.log('=== DEBUG TICKETS FILTER ===\n')
  
  try {
    // 1. Verificar tickets e seus status
    console.log('1. Verificando tickets e status:')
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, ticket_number, status, title, priority, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (ticketsError) {
      console.error('Erro ao buscar tickets:', ticketsError)
      return
    }
    
    console.log(`Total de tickets encontrados: ${tickets.length}`)
    
    // Contar por status
    const statusCount = {}
    tickets.forEach(ticket => {
      statusCount[ticket.status] = (statusCount[ticket.status] || 0) + 1
    })
    
    console.log('\nTickets por status:')
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} tickets`)
    })
    
    // 2. Verificar status registrados na tabela ticket_statuses
    console.log('\n2. Verificando status registrados:')
    const { data: statuses, error: statusError } = await supabase
      .from('ticket_statuses')
      .select('*')
      .order('order_index', { ascending: true })
    
    if (statusError) {
      console.error('Erro ao buscar status:', statusError)
      return
    }
    
    console.log('Status registrados na tabela ticket_statuses:')
    statuses.forEach(status => {
      const count = statusCount[status.slug] || 0
      console.log(`  - ${status.slug}: "${status.name}" (${count} tickets)`)
    })
    
    // 3. Verificar se há status nos tickets que não estão registrados
    console.log('\n3. Verificando status órfãos:')
    const registeredSlugs = new Set(statuses.map(s => s.slug))
    const ticketStatuses = new Set(tickets.map(t => t.status))
    
    const orphanStatuses = Array.from(ticketStatuses).filter(status => !registeredSlugs.has(status))
    
    if (orphanStatuses.length > 0) {
      console.log('⚠️  Status encontrados em tickets mas não registrados:')
      orphanStatuses.forEach(status => {
        console.log(`  - "${status}" (${statusCount[status]} tickets)`)
      })
    } else {
      console.log('✅ Todos os status dos tickets estão registrados na tabela ticket_statuses')
    }
    
    // 4. Simular API call com filtro
    console.log('\n4. Testando filtro por status específico:')
    
    const testStatuses = ['aberto', 'aguardando-cliente', 'resolvido']
    
    for (const testStatus of testStatuses) {
      const { data: filteredTickets, error } = await supabase
        .from('tickets')
        .select('id, ticket_number, status, title')
        .eq('status', testStatus)
        .limit(10)
      
      if (error) {
        console.error(`Erro ao filtrar por ${testStatus}:`, error)
      } else {
        console.log(`  - Status "${testStatus}": ${filteredTickets.length} tickets encontrados`)
        if (filteredTickets.length > 0) {
          console.log(`    Exemplo: #${filteredTickets[0].ticket_number} - ${filteredTickets[0].title.substring(0, 50)}...`)
        }
      }
    }
    
    // 5. Verificar prioridades
    console.log('\n5. Verificando prioridades:')
    const priorityCount = {}
    tickets.forEach(ticket => {
      priorityCount[ticket.priority] = (priorityCount[ticket.priority] || 0) + 1
    })
    
    console.log('Tickets por prioridade:')
    Object.entries(priorityCount).forEach(([priority, count]) => {
      console.log(`  - ${priority}: ${count} tickets`)
    })
    
  } catch (error) {
    console.error('Erro no debug:', error)
  }
}

debugTicketsFilter()
