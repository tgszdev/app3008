async function testCategoriesApiSimple() {
  console.log('🔍 TESTE SIMPLES DA API CATEGORIES-STATS')
  console.log('=' .repeat(50))
  
  try {
    console.log('📡 Testando API categories-stats sem parâmetros...')
    const response = await fetch('https://www.ithostbr.tech/api/dashboard/categories-stats')
    
    console.log('📊 Status da resposta:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Resposta da API:')
      console.log('📋 Chaves:', Object.keys(data))
      console.log('📊 Total tickets:', data.total_tickets)
      console.log('📊 Categorias:', data.categorias?.length || 0)
    } else {
      const errorData = await response.json()
      console.log('❌ Erro na API:', errorData)
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testCategoriesApiSimple()
