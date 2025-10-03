#!/usr/bin/env node

// Debug script to test the dashboard data locally
async function debugDashboardData() {
  console.log('=== DEBUG DASHBOARD DATA ===\n')
  
  try {
    // Test the API endpoint locally
    const response = await fetch('http://localhost:3000/api/dashboard/categories-stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.error('API response not ok:', response.status, response.statusText)
      return
    }
    
    const data = await response.json()
    
    console.log('✅ API Response received successfully\n')
    
    // Check total tickets
    console.log(`📊 TOTAL TICKETS: ${data.total_tickets}`)
    console.log(`📅 PERIOD: ${data.periodo.data_inicio} to ${data.periodo.data_fim}\n`)
    
    // Check status_summary_detailed
    if (data.status_summary_detailed && data.status_summary_detailed.length > 0) {
      console.log('📋 STATUS BREAKDOWN (status_summary_detailed):')
      let sum = 0
      data.status_summary_detailed.forEach((status, index) => {
        console.log(`  ${index + 1}. ${status.name} (${status.slug}): ${status.count} tickets`)
        console.log(`     Color: ${status.color}, Order: ${status.order_index}`)
        sum += status.count
      })
      console.log(`\n🔢 SUM OF ALL STATUS: ${sum}`)
      console.log(`🎯 TOTAL TICKETS: ${data.total_tickets}`)
      console.log(`❓ MATCH: ${sum === data.total_tickets ? '✅ YES' : '❌ NO - DISCREPANCY!'}\n`)
    } else {
      console.log('❌ No status_summary_detailed found\n')
    }
    
    // Check legacy summary
    if (data.status_summary) {
      console.log('🔄 LEGACY STATUS SUMMARY:')
      const legacy = data.status_summary
      const legacySum = legacy.open + legacy.in_progress + legacy.resolved + legacy.cancelled + legacy.closed
      console.log(`  - Open: ${legacy.open}`)
      console.log(`  - In Progress: ${legacy.in_progress}`)
      console.log(`  - Resolved: ${legacy.resolved}`)
      console.log(`  - Cancelled: ${legacy.cancelled}`)
      console.log(`  - Closed: ${legacy.closed}`)
      console.log(`  Total: ${legacySum}\n`)
    }
    
    // Check categories
    if (data.categorias && data.categorias.length > 0) {
      console.log(`📁 CATEGORIES: ${data.categorias.length} found`)
      let categoryTicketsSum = 0
      data.categorias.forEach(cat => {
        categoryTicketsSum += cat.quantidade
        console.log(`  - ${cat.nome}: ${cat.quantidade} tickets (${cat.percentual}%)`)
      })
      console.log(`\n🔢 TOTAL TICKETS IN CATEGORIES: ${categoryTicketsSum}`)
      console.log(`🎯 TOTAL TICKETS: ${data.total_tickets}`)
      console.log(`❓ MATCH: ${categoryTicketsSum === data.total_tickets ? '✅ YES' : '❌ NO - POSSIBLE ORPHANS!'}\n`)
    }
    
    // Check available status
    if (data.available_status && data.available_status.length > 0) {
      console.log(`⚙️ AVAILABLE STATUS: ${data.available_status.length} registered`)
      data.available_status.forEach(status => {
        console.log(`  - ${status.slug}: "${status.name}" (order: ${status.order_index})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message)
  }
}

debugDashboardData()






