#!/usr/bin/env node

console.log('🔍 TESTE: Categorias por Usuário')
console.log('=====================================')

const testUserCategories = async (userEmail, userDescription) => {
  try {
    console.log(`\n👤 Testando usuário: ${userDescription}`)
    console.log(`📧 Email: ${userEmail}`)
    console.log('─'.repeat(50))
    
    // Simular login do usuário (isso seria feito via cookies/session)
    console.log('📡 Testando API de categorias...')
    
    const response = await fetch('https://www.ithostbr.tech/api/categories?active_only=true')
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ API funcionando: ${data.length} categorias`)
      
      // Analisar categorias por contexto
      const contextGroups = {}
      data.forEach(cat => {
        const contextName = cat.context_name || 'Sem contexto'
        if (!contextGroups[contextName]) {
          contextGroups[contextName] = []
        }
        contextGroups[contextName].push(cat)
      })
      
      console.log('\n📊 Categorias por contexto:')
      Object.keys(contextGroups).forEach(context => {
        const categories = contextGroups[context]
        console.log(`  🏢 ${context}: ${categories.length} categorias`)
        categories.slice(0, 3).forEach(cat => {
          console.log(`    - ${cat.name} (${cat.is_global ? 'Global' : 'Específica'})`)
        })
        if (categories.length > 3) {
          console.log(`    ... e mais ${categories.length - 3} categorias`)
        }
      })
      
      // Verificar se há categorias globais
      const globalCategories = data.filter(cat => cat.is_global)
      console.log(`\n🌐 Categorias globais: ${globalCategories.length}`)
      
      // Verificar se há categorias específicas do Luft Agro
      const agroCategories = data.filter(cat => cat.context_name === 'Luft Agro')
      console.log(`🏢 Categorias do Luft Agro: ${agroCategories.length}`)
      
      // Verificar se há categorias da Organização Padrão
      const defaultCategories = data.filter(cat => cat.context_name === 'Organização Padrão')
      console.log(`🏢 Categorias da Organização Padrão: ${defaultCategories.length}`)
      
    } else {
      console.log('❌ API não funcionando:', response.status)
      const errorText = await response.text()
      console.log('❌ Erro:', errorText)
    }
    
  } catch (error) {
    console.log('❌ ERRO:', error.message)
  }
}

const testCategoriesWithContext = async (contextId, contextName) => {
  try {
    console.log(`\n🔍 Testando categorias para contexto: ${contextName}`)
    console.log(`🆔 Context ID: ${contextId}`)
    console.log('─'.repeat(50))
    
    const response = await fetch(`https://www.ithostbr.tech/api/categories?active_only=true&context_id=${contextId}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Categorias para ${contextName}: ${data.length}`)
      
      data.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.is_global ? 'Global' : 'Específica'})`)
      })
      
    } else {
      console.log('❌ Erro ao buscar categorias do contexto:', response.status)
    }
    
  } catch (error) {
    console.log('❌ ERRO:', error.message)
  }
}

// Executar testes
const runTests = async () => {
  // Teste 1: Usuário rodrigues2205@icloud.com (matrix user)
  await testUserCategories('rodrigues2205@icloud.com', 'Rodrigues (Matrix User)')
  
  // Teste 2: Usuário agro2@agro.com.br (context user)
  await testUserCategories('agro2@agro.com.br', 'Agro2 (Context User)')
  
  // Teste 3: Categorias específicas do Luft Agro
  await testCategoriesWithContext('6486088e-72ae-461b-8b03-32ca84918882', 'Luft Agro')
  
  // Teste 4: Categorias específicas da Organização Padrão
  await testCategoriesWithContext('a7791594-c44d-47aa-8ddd-97ecfb6cc8ed', 'Organização Padrão')
  
  console.log('\n🏁 Testes concluídos!')
}

runTests()
