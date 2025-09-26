async function testMultipleClientsFilter() {
  console.log('🔍 TESTE DE FILTRO COM MÚLTIPLOS CLIENTES')
  console.log('=' .repeat(60))
  
  const luftAgroContextId = '6486088e-72ae-461b-8b03-32ca84918882'
  
  try {
    // 1. TESTAR COM LUFT AGRO
    console.log('\n📡 1. TESTANDO COM LUFT AGRO:')
    console.log('-'.repeat(40))
    
    const luftResponse = await fetch(`https://www.ithostbr.tech/api/dashboard/stats?context_id=${luftAgroContextId}`)
    const luftData = await luftResponse.json()
    
    console.log('✅ Resposta Luft Agro:')
    console.log(`  Total: ${luftData.totalTickets || 'undefined'}`)
    console.log(`  Abertos: ${luftData.openTickets || 'undefined'}`)
    console.log(`  Fechados: ${luftData.closedTickets || 'undefined'}`)
    console.log(`  Recentes: ${luftData.recentTickets?.length || 0}`)
    
    // 2. TESTAR COM CATEGORIES-STATS LUFT AGRO
    console.log('\n📡 2. TESTANDO CATEGORIES-STATS COM LUFT AGRO:')
    console.log('-'.repeat(40))
    
    const luftCategoriesResponse = await fetch(`https://www.ithostbr.tech/api/dashboard/categories-stats?context_id=${luftAgroContextId}`)
    const luftCategoriesData = await luftCategoriesResponse.json()
    
    console.log('✅ Resposta Categories Luft Agro:')
    console.log(`  Total: ${luftCategoriesData.total_tickets || 'undefined'}`)
    console.log(`  Categorias: ${luftCategoriesData.categorias?.length || 0}`)
    console.log(`  Status Summary: ${JSON.stringify(luftCategoriesData.status_summary || {})}`)
    
    // 3. TESTAR SEM CONTEXTO (DADOS GLOBAIS)
    console.log('\n📡 3. TESTANDO SEM CONTEXTO (DADOS GLOBAIS):')
    console.log('-'.repeat(40))
    
    const globalResponse = await fetch('https://www.ithostbr.tech/api/dashboard/stats')
    const globalData = await globalResponse.json()
    
    console.log('✅ Resposta Global:')
    console.log(`  Total: ${globalData.totalTickets || 'undefined'}`)
    console.log(`  Abertos: ${globalData.openTickets || 'undefined'}`)
    console.log(`  Fechados: ${globalData.closedTickets || 'undefined'}`)
    console.log(`  Recentes: ${globalData.recentTickets?.length || 0}`)
    
    // 4. TESTAR CATEGORIES-STATS SEM CONTEXTO
    console.log('\n📡 4. TESTANDO CATEGORIES-STATS SEM CONTEXTO:')
    console.log('-'.repeat(40))
    
    const globalCategoriesResponse = await fetch('https://www.ithostbr.tech/api/dashboard/categories-stats')
    const globalCategoriesData = await globalCategoriesResponse.json()
    
    console.log('✅ Resposta Categories Global:')
    console.log(`  Total: ${globalCategoriesData.total_tickets || 'undefined'}`)
    console.log(`  Categorias: ${globalCategoriesData.categorias?.length || 0}`)
    console.log(`  Status Summary: ${JSON.stringify(globalCategoriesData.status_summary || {})}`)
    
    // 5. COMPARAR RESULTADOS
    console.log('\n🔍 5. COMPARAÇÃO:')
    console.log('-'.repeat(40))
    
    console.log('📊 Stats API:')
    console.log(`  Luft Agro: ${luftData.totalTickets}`)
    console.log(`  Global: ${globalData.totalTickets}`)
    
    console.log('📊 Categories API:')
    console.log(`  Luft Agro: ${luftCategoriesData.total_tickets}`)
    console.log(`  Global: ${globalCategoriesData.total_tickets}`)
    
    if (luftData.totalTickets !== globalData.totalTickets) {
      console.log('✅ FILTRO STATS FUNCIONANDO: Valores diferentes')
    } else {
      console.log('❌ FILTRO STATS NÃO FUNCIONANDO: Valores iguais')
    }
    
    if (luftCategoriesData.total_tickets !== globalCategoriesData.total_tickets) {
      console.log('✅ FILTRO CATEGORIES FUNCIONANDO: Valores diferentes')
    } else {
      console.log('❌ FILTRO CATEGORIES NÃO FUNCIONANDO: Valores iguais')
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testMultipleClientsFilter()
