import axios from 'axios'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const BASE_URL = 'https://www.ithostbr.tech'

async function testarCategoriasAutenticado() {
  console.log('🔐 TESTANDO CATEGORIAS COM AUTENTICAÇÃO')
  console.log('=' * 60)
  
  try {
    // 1. Fazer login como usuário da Agro
    console.log('\n🔐 1. FAZENDO LOGIN COMO USUÁRIO AGRO')
    
    const loginData = {
      email: 'agro@agro.com.br',
      password: 'agro123'
    }
    
    console.log('📤 Dados de login:', loginData)
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/signin`, loginData, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    })
    
    console.log('📝 Resposta do login:', loginResponse.status)
    
    if (loginResponse.status !== 200) {
      console.log('❌ Login falhou, tentando método alternativo...')
      
      // Tentar método alternativo
      const altLoginResponse = await axios.post(`${BASE_URL}/api/auth/callback/credentials`, loginData, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      })
      
      console.log('📝 Resposta alternativa:', altLoginResponse.status)
    }
    
    // 2. Testar API de categorias
    console.log('\n📋 2. TESTANDO API DE CATEGORIAS')
    
    try {
      const categoriesResponse = await axios.get(`${BASE_URL}/api/categories`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (categoriesResponse.status === 200) {
        const categories = categoriesResponse.data
        console.log('✅ API de categorias funcionando!')
        console.log(`📊 Total de categorias: ${categories?.length || 0}`)
        
        if (categories && categories.length > 0) {
          console.log('\n📋 CATEGORIAS DISPONÍVEIS:')
          categories.forEach((cat, index) => {
            const type = cat.is_global ? '🌐 Global' : '🏢 Específica'
            const context = cat.contexts?.name || 'Sem contexto'
            console.log(`  ${index + 1}. ${cat.name} (${type}) - ${context}`)
          })
          
          // Verificar se a categoria da Agro está presente
          const agroCategory = categories.find(cat => 
            cat.contexts?.name?.toLowerCase().includes('agro') || 
            cat.name?.toLowerCase().includes('agro')
          )
          
          if (agroCategory) {
            console.log('\n✅ CATEGORIA DA AGRO ENCONTRADA:')
            console.log(`  - Nome: ${agroCategory.name}`)
            console.log(`  - Contexto: ${agroCategory.contexts?.name}`)
            console.log(`  - Global: ${agroCategory.is_global}`)
            console.log(`  - Ativa: ${agroCategory.is_active}`)
          } else {
            console.log('\n❌ CATEGORIA DA AGRO NÃO ENCONTRADA')
            console.log('🔍 Verificando se há problema de filtro...')
          }
        }
      } else {
        console.log(`❌ API retornou status: ${categoriesResponse.status}`)
        console.log('📝 Resposta:', categoriesResponse.data)
      }
      
    } catch (error) {
      console.log('❌ Erro ao buscar categorias:', error.response?.status || error.message)
      if (error.response?.data) {
        console.log('📝 Dados de erro:', error.response.data)
      }
    }
    
    // 3. Testar com parâmetros específicos
    console.log('\n🎯 3. TESTANDO COM PARÂMETROS ESPECÍFICOS')
    
    try {
      // Testar com active_only=true
      const activeResponse = await axios.get(`${BASE_URL}/api/categories?active_only=true`, {
        withCredentials: true
      })
      
      if (activeResponse.status === 200) {
        console.log(`✅ Categorias ativas: ${activeResponse.data?.length || 0}`)
      }
      
      // Testar com include_global=true
      const globalResponse = await axios.get(`${BASE_URL}/api/categories?include_global=true`, {
        withCredentials: true
      })
      
      if (globalResponse.status === 200) {
        console.log(`✅ Categorias incluindo globais: ${globalResponse.data?.length || 0}`)
      }
      
    } catch (error) {
      console.log('❌ Erro nos testes específicos:', error.message)
    }
    
    // 4. Verificar se o problema é de sessão
    console.log('\n🔍 4. VERIFICANDO SESSÃO')
    
    try {
      const sessionResponse = await axios.get(`${BASE_URL}/api/auth/session`, {
        withCredentials: true
      })
      
      if (sessionResponse.status === 200) {
        console.log('✅ Sessão ativa encontrada')
        console.log('📝 Dados da sessão:', sessionResponse.data)
      } else {
        console.log('❌ Sessão não encontrada')
      }
      
    } catch (error) {
      console.log('❌ Erro ao verificar sessão:', error.message)
    }
    
    console.log('\n🎯 TESTE CONCLUÍDO!')
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

testarCategoriasAutenticado()
