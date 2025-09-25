#!/usr/bin/env node

console.log('🔍 TESTE: Categorias em Produção')
console.log('=====================================')

const testCategories = async () => {
  try {
    console.log('📡 Testando endpoint de categorias...')
    
    const response = await fetch('https://www.ithostbr.tech/api/categories?active_only=true')
    
    console.log('📊 Status:', response.status)
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ SUCESSO: Categorias encontradas:', data.length)
      console.log('📋 Primeiras 3 categorias:')
      data.slice(0, 3).forEach((cat, i) => {
        console.log(`  ${i+1}. ${cat.name} (${cat.context_name})`)
      })
    } else {
      const errorText = await response.text()
      console.log('❌ ERRO:', errorText)
    }
    
  } catch (error) {
    console.log('❌ ERRO DE CONEXÃO:', error.message)
  }
}

const testCategoriesDebug = async () => {
  try {
    console.log('\n🔧 Testando endpoint de debug...')
    
    const response = await fetch('https://www.ithostbr.tech/api/categories/debug')
    
    console.log('📊 Status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Debug OK:', data)
    } else {
      const errorText = await response.text()
      console.log('❌ Debug Error:', errorText)
    }
    
  } catch (error) {
    console.log('❌ ERRO DE CONEXÃO DEBUG:', error.message)
  }
}

const testCategoriesPublic = async () => {
  try {
    console.log('\n🔧 Testando endpoint público...')
    
    const response = await fetch('https://www.ithostbr.tech/api/categories/public-fix?active_only=true')
    
    console.log('📊 Status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Público OK:', data.length, 'categorias')
    } else {
      const errorText = await response.text()
      console.log('❌ Público Error:', errorText)
    }
    
  } catch (error) {
    console.log('❌ ERRO DE CONEXÃO PÚBLICO:', error.message)
  }
}

// Executar testes
testCategories()
  .then(() => testCategoriesDebug())
  .then(() => testCategoriesPublic())
  .then(() => {
    console.log('\n🏁 Testes concluídos!')
  })
