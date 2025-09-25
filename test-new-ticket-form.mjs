#!/usr/bin/env node

console.log('🔍 TESTE: Formulário de Novo Ticket')
console.log('=====================================')

const testNewTicketPage = async () => {
  try {
    console.log('📡 Testando página de novo ticket...')
    
    const response = await fetch('https://www.ithostbr.tech/dashboard/tickets/new')
    
    console.log('📊 Status:', response.status)
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const html = await response.text()
      
      // Verificar se a página carregou
      if (html.includes('Novo Chamado')) {
        console.log('✅ Página carregou: "Novo Chamado" encontrado')
      } else {
        console.log('❌ Página não carregou corretamente')
      }
      
      // Verificar se há erro de categorias
      if (html.includes('Nenhuma categoria disponível')) {
        console.log('❌ PROBLEMA: "Nenhuma categoria disponível" encontrado')
      } else {
        console.log('✅ Não há erro de categorias na página')
      }
      
      // Verificar se há JavaScript de carregamento
      if (html.includes('Carregando categorias')) {
        console.log('✅ JavaScript de carregamento encontrado')
      } else {
        console.log('❌ JavaScript de carregamento não encontrado')
      }
      
    } else {
      console.log('❌ ERRO ao carregar página:', response.status)
    }
    
  } catch (error) {
    console.log('❌ ERRO DE CONEXÃO:', error.message)
  }
}

const testCategoriesAPI = async () => {
  try {
    console.log('\n📡 Testando API de categorias diretamente...')
    
    const response = await fetch('https://www.ithostbr.tech/api/categories/public?active_only=true')
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API funcionando:', data.length, 'categorias')
      
      // Verificar se há categorias do Luft Agro
      const agroCategories = data.filter(cat => cat.context_name === 'Luft Agro')
      console.log('🏢 Categorias do Luft Agro:', agroCategories.length)
      
      if (agroCategories.length > 0) {
        console.log('📋 Categorias do Luft Agro:')
        agroCategories.forEach(cat => {
          console.log(`  - ${cat.name}`)
        })
      }
      
    } else {
      console.log('❌ API não funcionando:', response.status)
    }
    
  } catch (error) {
    console.log('❌ ERRO na API:', error.message)
  }
}

// Executar testes
testNewTicketPage()
  .then(() => testCategoriesAPI())
  .then(() => {
    console.log('\n🏁 Testes do formulário concluídos!')
  })
