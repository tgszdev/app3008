async function testFrontendReal() {
  console.log('🧪 TESTE DO FRONTEND REAL')
  console.log('=' .repeat(50))
  
  try {
    // Simular o que o frontend faz
    console.log('📡 Simulando chamada do frontend...')
    
    // Testar com contexto Luft Agro
    const luftAgroContextId = '6486088e-72ae-461b-8b03-32ca84918882'
    const response = await fetch(`https://www.ithostbr.tech/api/dashboard/stats?context_id=${luftAgroContextId}`)
    
    if (!response.ok) {
      console.error('❌ Erro na API:', response.status)
      return
    }
    
    const data = await response.json()
    console.log('✅ Resposta da API:')
    console.log('📋 Estrutura da resposta:', Object.keys(data))
    
    // Verificar se há stats
    if (data.stats) {
      console.log('📊 Estatísticas dentro de stats:')
      console.log(`  Total: ${data.stats.totalTickets || 'undefined'}`)
      console.log(`  Abertos: ${data.stats.openTickets || 'undefined'}`)
      console.log(`  Fechados: ${data.stats.closedTickets || 'undefined'}`)
    }
    
    // Verificar se há estatísticas diretas
    if (data.totalTickets !== undefined) {
      console.log('📊 Estatísticas diretas:')
      console.log(`  Total: ${data.totalTickets}`)
      console.log(`  Abertos: ${data.openTickets}`)
      console.log(`  Fechados: ${data.closedTickets}`)
    }
    
    // Verificar tickets recentes
    if (data.recentTickets) {
      console.log(`📊 Tickets recentes: ${data.recentTickets.length}`)
      if (data.recentTickets.length > 0) {
        console.log('📋 Primeiro ticket recente:')
        console.log(`  Título: ${data.recentTickets[0].title}`)
        console.log(`  Status: ${data.recentTickets[0].status}`)
        console.log(`  Context ID: ${data.recentTickets[0].context_id}`)
      }
    }
    
    // Verificar se há erro
    if (data.error) {
      console.log('❌ Erro na API:', data.error)
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testFrontendReal()
