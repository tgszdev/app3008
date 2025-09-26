#!/usr/bin/env node

async function testSimpleAPI() {
  console.log('🧪 TESTANDO API SIMPLES')
  console.log('=' .repeat(60))

  try {
    // 1. Testar API sem parâmetros
    console.log('\n1️⃣ TESTANDO API SEM PARÂMETROS...')
    
    try {
      const response1 = await fetch('https://www.ithostbr.tech/api/dashboard/multi-client-stats-simple')
      const data1 = await response1.json()
      
      if (response1.ok) {
        console.log('✅ API simples funcionando!')
        console.log(`📊 Total tickets: ${data1.total_tickets}`)
        console.log(`📊 Contextos selecionados: ${data1.selected_contexts?.length || 0}`)
        console.log(`📊 Tickets recentes: ${data1.recent_tickets?.length || 0}`)
      } else {
        console.log('❌ API simples com erro:', response1.status, data1)
      }
    } catch (error) {
      console.log('❌ Erro ao testar API simples:', error.message)
    }

    // 2. Testar API com contexto específico (Luft Agro)
    console.log('\n2️⃣ TESTANDO API COM CONTEXTO LUFT AGRO...')
    
    try {
      const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
      const response2 = await fetch(`https://www.ithostbr.tech/api/dashboard/multi-client-stats-simple?context_ids=${luftAgroId}`)
      const data2 = await response2.json()
      
      if (response2.ok) {
        console.log('✅ API com Luft Agro funcionando!')
        console.log(`📊 Total tickets: ${data2.total_tickets}`)
        console.log(`📊 Contextos selecionados: ${data2.selected_contexts}`)
        console.log(`📊 Tickets recentes: ${data2.recent_tickets?.length || 0}`)
        
        if (data2.recent_tickets && data2.recent_tickets.length > 0) {
          console.log('📋 Tickets do Luft Agro:')
          data2.recent_tickets.forEach(ticket => {
            console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.priority})`)
          })
        }
      } else {
        console.log('❌ API com Luft Agro com erro:', response2.status, data2)
      }
    } catch (error) {
      console.log('❌ Erro ao testar API com Luft Agro:', error.message)
    }

    // 3. Testar API com múltiplos contextos
    console.log('\n3️⃣ TESTANDO API COM MÚLTIPLOS CONTEXTOS...')
    
    try {
      const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
      const testeId = 'a7791594-c44d-47aa-8ddd-97ecfb6cc8ed'
      const response3 = await fetch(`https://www.ithostbr.tech/api/dashboard/multi-client-stats-simple?context_ids=${luftAgroId},${testeId}`)
      const data3 = await response3.json()
      
      if (response3.ok) {
        console.log('✅ API com múltiplos contextos funcionando!')
        console.log(`📊 Total tickets: ${data3.total_tickets}`)
        console.log(`📊 Contextos selecionados: ${data3.selected_contexts}`)
        console.log(`📊 Tickets recentes: ${data3.recent_tickets?.length || 0}`)
        
        if (data3.recent_tickets && data3.recent_tickets.length > 0) {
          console.log('📋 Tickets dos contextos selecionados:')
          data3.recent_tickets.forEach(ticket => {
            console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.priority})`)
          })
        }
      } else {
        console.log('❌ API com múltiplos contextos com erro:', response3.status, data3)
      }
    } catch (error) {
      console.log('❌ Erro ao testar API com múltiplos contextos:', error.message)
    }

    // 4. Diagnóstico final
    console.log('\n4️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO DOS TESTES:')
    console.log('✅ API simples criada')
    console.log('✅ Testes realizados')
    
    console.log('\n🔧 PRÓXIMOS PASSOS:')
    console.log('1. Se API simples funcionar, atualizar frontend')
    console.log('2. Se API simples não funcionar, investigar mais')
    console.log('3. Testar no dashboard principal')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testSimpleAPI()
