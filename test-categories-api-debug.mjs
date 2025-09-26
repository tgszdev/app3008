async function testCategoriesApiDebug() {
  console.log('🔍 DEBUG DA API CATEGORIES-STATS')
  console.log('=' .repeat(50))
  
  const luftAgroContextId = '6486088e-72ae-461b-8b03-32ca84918882'
  
  try {
    console.log('📡 Testando API categories-stats...')
    const response = await fetch(`https://www.ithostbr.tech/api/dashboard/categories-stats?context_id=${luftAgroContextId}`)
    
    console.log('📊 Status da resposta:', response.status)
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()))
    
    const data = await response.json()
    console.log('📊 Dados da resposta:', JSON.stringify(data, null, 2))
    
    if (data.error) {
      console.log('❌ Erro detalhado:', data.error)
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testCategoriesApiDebug()
