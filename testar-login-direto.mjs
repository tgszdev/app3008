import axios from 'axios'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const BASE_URL = 'https://www.ithostbr.tech'

async function testarLoginDireto() {
  console.log('🔐 TESTANDO LOGIN DIRETO')
  console.log('=' * 40)
  
  try {
    // 1. Testar login via NextAuth
    console.log('\n🔐 1. TESTANDO LOGIN VIA NEXTAUTH')
    
    const loginData = {
      email: 'agro@agro.com.br',
      password: 'agro123',
      redirect: false
    }
    
    console.log('📤 Dados de login:', loginData)
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/signin/credentials`, loginData, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      })
      
      console.log('✅ Login via NextAuth:', loginResponse.status)
      console.log('📝 Resposta:', loginResponse.data)
      
    } catch (error) {
      console.log('❌ Erro no login NextAuth:', error.response?.status || error.message)
      if (error.response?.data) {
        console.log('📝 Dados de erro:', error.response.data)
      }
    }
    
    // 2. Testar login via callback
    console.log('\n🔄 2. TESTANDO LOGIN VIA CALLBACK')
    
    try {
      const callbackResponse = await axios.post(`${BASE_URL}/api/auth/callback/credentials`, loginData, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      })
      
      console.log('✅ Login via callback:', callbackResponse.status)
      console.log('📝 Resposta:', callbackResponse.data)
      
    } catch (error) {
      console.log('❌ Erro no login callback:', error.response?.status || error.message)
      if (error.response?.data) {
        console.log('📝 Dados de erro:', error.response.data)
      }
    }
    
    // 3. Verificar sessão após login
    console.log('\n🔍 3. VERIFICANDO SESSÃO')
    
    try {
      const sessionResponse = await axios.get(`${BASE_URL}/api/auth/session`, {
        withCredentials: true
      })
      
      console.log('📝 Status da sessão:', sessionResponse.status)
      console.log('📝 Dados da sessão:', sessionResponse.data)
      
      if (sessionResponse.data && sessionResponse.data.user) {
        console.log('✅ Sessão ativa encontrada!')
        console.log('👤 Usuário:', sessionResponse.data.user.name)
        console.log('📧 Email:', sessionResponse.data.user.email)
        console.log('🏢 Tipo:', sessionResponse.data.user.userType)
        console.log('🏢 Contexto:', sessionResponse.data.user.contextName)
      } else {
        console.log('❌ Sessão não encontrada ou inválida')
      }
      
    } catch (error) {
      console.log('❌ Erro ao verificar sessão:', error.response?.status || error.message)
    }
    
    // 4. Testar API de categorias com sessão
    console.log('\n📋 4. TESTANDO API DE CATEGORIAS COM SESSÃO')
    
    try {
      const categoriesResponse = await axios.get(`${BASE_URL}/api/categories`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log('📝 Status da API:', categoriesResponse.status)
      
      if (categoriesResponse.status === 200) {
        const categories = categoriesResponse.data
        console.log('✅ API de categorias funcionando!')
        console.log(`📊 Total de categorias: ${categories?.length || 0}`)
        
        if (categories && categories.length > 0) {
          categories.forEach((cat, index) => {
            const type = cat.is_global ? '🌐 Global' : '🏢 Específica'
            const context = cat.contexts?.name || 'Sem contexto'
            console.log(`  ${index + 1}. ${cat.name} (${type}) - ${context}`)
          })
        }
      } else {
        console.log('❌ API retornou erro:', categoriesResponse.status)
        console.log('📝 Resposta:', categoriesResponse.data)
      }
      
    } catch (error) {
      console.log('❌ Erro na API de categorias:', error.response?.status || error.message)
      if (error.response?.data) {
        console.log('📝 Dados de erro:', error.response.data)
      }
    }
    
    console.log('\n🎯 TESTE CONCLUÍDO!')
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

testarLoginDireto()
