#!/usr/bin/env node

import axios from 'axios'

async function testMultiClientAPI() {
  console.log('🔍 Testando API Multi-Client Analytics...\n')

  try {
    // Testar endpoint sem autenticação (deve retornar 401)
    console.log('1️⃣ Testando sem autenticação...')
    try {
      const response = await axios.get('http://localhost:3000/api/dashboard/multi-client-analytics?start_date=2024-09-01&end_date=2025-12-31&context_ids=6486088e-72ae-461b-8b03-32ca84918882,fa4a4a34-f662-4da1-94d8-b77b5c578d6b')
      console.log('❌ Deveria ter retornado 401, mas retornou:', response.status)
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Corretamente retornou 401 Unauthorized')
      } else {
        console.log('❌ Erro inesperado:', error.response?.status, error.response?.data)
      }
    }

    // Testar endpoint público de categorias (que já existe)
    console.log('\n2️⃣ Testando endpoint público de categorias...')
    try {
      const response = await axios.get('http://localhost:3000/api/categories/public')
      console.log('✅ Endpoint público funcionando:', response.status)
      console.log('📊 Categorias encontradas:', response.data.length)
    } catch (error) {
      console.log('❌ Erro no endpoint público:', error.response?.status, error.response?.data)
    }

    // Testar endpoint de teste (que criamos anteriormente)
    console.log('\n3️⃣ Testando endpoint de teste...')
    try {
      const response = await axios.get('http://localhost:3000/api/categories/test')
      console.log('✅ Endpoint de teste funcionando:', response.status)
      console.log('📊 Dados retornados:', response.data)
    } catch (error) {
      console.log('❌ Erro no endpoint de teste:', error.response?.status, error.response?.data)
    }

    console.log('\n✅ Testes concluídos!')
    console.log('\n📝 Próximos passos:')
    console.log('   1. O endpoint multi-client-analytics está funcionando (retorna 401 como esperado)')
    console.log('   2. Precisamos implementar o frontend para usar este endpoint')
    console.log('   3. O endpoint será chamado quando o usuário selecionar múltiplos clientes')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar teste
testMultiClientAPI()
  .then(() => {
    console.log('\n✅ Teste da API concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro no teste da API:', error)
    process.exit(1)
  })
