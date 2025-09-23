#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gjjpddqdwdlnjryxtnmf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqanBkZHFkd2RsbmpyeXh0bm1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTYwMTcxMCwiZXhwIjoyMDQ3MTc3NzEwfQ.J7_YAGklLpX0CDPOLSrMJVMW8FbFQ2d4oZjGdRlN_3Q'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugStatusCards() {
  console.log('=== DEBUG STATUS CARDS ===\n')
  
  try {
    // 1. Check ticket_statuses table
    console.log('1. Checking ticket_statuses table:')
    const { data: statuses, error: statusError } = await supabase
      .from('ticket_statuses')
      .select('*')
      .order('order_index', { ascending: true })
    
    if (statusError) {
      console.error('Error fetching statuses:', statusError)
      return
    }
    
    console.log('Available statuses:')
    statuses.forEach(status => {
      console.log(`  - ${status.slug}: "${status.name}" (color: ${status.color}, order: ${status.order_index})`)
    })
    
    // 2. Check actual tickets and their status
    console.log('\n2. Checking tickets and their status:')
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, status, created_at')
      .order('created_at', { ascending: false })
    
    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError)
      return
    }
    
    console.log(`Total tickets in database: ${tickets.length}`)
    
    // Count tickets by status
    const statusCount = {}
    tickets.forEach(ticket => {
      statusCount[ticket.status] = (statusCount[ticket.status] || 0) + 1
    })
    
    console.log('\nTickets by status:')
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} tickets`)
    })
    
    // 3. Check current month filter
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const startDate = firstDay.toISOString().split('T')[0]
    const endDate = lastDay.toISOString().split('T')[0]
    
    console.log(`\n3. Current month filter: ${startDate} to ${endDate}`)
    
    const { data: monthTickets, error: monthError } = await supabase
      .from('tickets')
      .select('id, status, created_at')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
    
    if (monthError) {
      console.error('Error fetching month tickets:', monthError)
      return
    }
    
    console.log(`Tickets in current month: ${monthTickets.length}`)
    
    const monthStatusCount = {}
    monthTickets.forEach(ticket => {
      monthStatusCount[ticket.status] = (monthStatusCount[ticket.status] || 0) + 1
    })
    
    console.log('\nCurrent month tickets by status:')
    Object.entries(monthStatusCount).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} tickets`)
    })
    
    // 4. Build status_summary_detailed like the API
    console.log('\n4. Building status_summary_detailed like API:')
    const statusList = statuses
    const statusCountsDetailed = []
    
    statusList.forEach(status => {
      const count = monthTickets?.filter(t => t.status === status.slug).length || 0
      statusCountsDetailed.push({
        slug: status.slug,
        name: status.name,
        color: status.color,
        count: count,
        order_index: status.order_index
      })
    })
    
    statusCountsDetailed.sort((a, b) => a.order_index - b.order_index)
    
    console.log('Final status_summary_detailed:')
    statusCountsDetailed.forEach(status => {
      console.log(`  - ${status.slug}: "${status.name}" = ${status.count} tickets (color: ${status.color})`)
    })
    
    // 5. Check if any tickets have unregistered status
    console.log('\n5. Checking for unregistered status:')
    const registeredSlugs = new Set(statuses.map(s => s.slug))
    const allTicketStatuses = new Set(tickets.map(t => t.status))
    
    const unregistered = Array.from(allTicketStatuses).filter(status => !registeredSlugs.has(status))
    if (unregistered.length > 0) {
      console.log('⚠️  UNREGISTERED STATUS FOUND:')
      unregistered.forEach(status => {
        console.log(`  - "${status}" (${statusCount[status]} tickets)`)
      })
    } else {
      console.log('✅ All ticket statuses are registered in ticket_statuses table')
    }
    
  } catch (error) {
    console.error('Debug error:', error)
  }
}

debugStatusCards()

