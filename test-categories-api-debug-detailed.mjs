async function testCategoriesApiDebugDetailed() {
  console.log('🔍 DEBUG DETALHADO DA API CATEGORIES-STATS')
  console.log('=' .repeat(50))
  
  try {
    console.log('📡 Testando API categories-stats...')
    const response = await fetch('https://www.ithostbr.tech/api/dashboard/categories-stats')
    
    console.log('📊 Status da resposta:', response.status)
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()))
    
    const data = await response.json()
    console.log('📊 Dados da resposta:', JSON.stringify(data, null, 2))
    
    if (data.error) {
      console.log('❌ Erro detalhado:', data.error)
    }
    
    // Verificar se há stack trace ou detalhes do erro
    if (data.stack) {
      console.log('📊 Stack trace:', data.stack)
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
    console.error('❌ Stack trace:', error.stack)
  }
}

testCategoriesApiDebugDetailed()
