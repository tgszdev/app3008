#!/usr/bin/env node

async function testAPITickets() {
  console.log('🧪 TESTANDO API /api/tickets')
  console.log('=' .repeat(60))

  try {
    // 1. Testar API /api/tickets
    console.log('\n1️⃣ TESTANDO API /api/tickets...')
    
    try {
      const response = await fetch('https://www.ithostbr.tech/api/tickets')
      const data = await response.json()
      
      console.log('📡 Status:', response.status)
      console.log('📋 Dados:', data)
      
    } catch (error) {
      console.log('❌ Erro ao testar API /api/tickets:', error.message)
    }

    // 2. Testar API /api/tickets com parâmetros
    console.log('\n2️⃣ TESTANDO API /api/tickets COM PARÂMETROS...')
    
    try {
      const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
      const response = await fetch(`https://www.ithostbr.tech/api/tickets?context_ids=${luftAgroId}`)
      const data = await response.json()
      
      console.log('📡 Status:', response.status)
      console.log('📋 Dados:', data)
      
    } catch (error) {
      console.log('❌ Erro ao testar API /api/tickets com parâmetros:', error.message)
    }

    // 3. Verificar se existe API de tickets
    console.log('\n3️⃣ VERIFICANDO APIS DISPONÍVEIS...')
    
    const apis = [
      '/api/tickets',
      '/api/dashboard/stats',
      '/api/dashboard/analytics',
      '/api/dashboard/multi-client-stats'
    ]
    
    for (const api of apis) {
      try {
        const response = await fetch(`https://www.ithostbr.tech${api}`)
        console.log(`📡 ${api}: ${response.status}`)
      } catch (error) {
        console.log(`❌ ${api}: Erro - ${error.message}`)
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testAPITickets()
