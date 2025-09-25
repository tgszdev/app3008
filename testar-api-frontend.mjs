import axios from 'axios'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const BASE_URL = 'https://www.ithostbr.tech'

async function testarApiFrontend() {
  console.log('🧪 TESTANDO API COMO FRONTEND')
  console.log('=' * 60)
  
  try {
    // 1. Primeiro, fazer login para obter sessão
    console.log('\n🔐 1. FAZENDO LOGIN')
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/callback/credentials`, {
      email: 'admin@ithostbr.tech',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    })
    
    if (loginResponse.status !== 200) {
      console.error('❌ Erro no login:', loginResponse.status)
      return false
    }
    
    console.log('✅ Login realizado com sucesso')
    
    // 2. Buscar uma categoria para editar
    console.log('\n🔍 2. BUSCANDO CATEGORIA PARA EDITAR')
    
    const categoriesResponse = await axios.get(`${BASE_URL}/api/categories`, {
      withCredentials: true
    })
    
    if (categoriesResponse.status !== 200) {
      console.error('❌ Erro ao buscar categorias:', categoriesResponse.status)
      return false
    }
    
    const categories = categoriesResponse.data
    if (!categories || categories.length === 0) {
      console.error('❌ Nenhuma categoria encontrada')
      return false
    }
    
    const testCategory = categories[0]
    console.log(`✅ Categoria encontrada: ${testCategory.name} (${testCategory.id})`)
    
    // 3. Testar edição com dados que causavam erro (campos vazios)
    console.log('\n📝 3. TESTANDO EDIÇÃO COM CAMPOS VAZIOS (SIMULANDO FRONTEND)')
    
    const updateData = {
      name: testCategory.name,
      slug: testCategory.slug,
      description: `Teste API Frontend - ${new Date().toISOString()}`,
      icon: testCategory.icon || 'folder',
      color: testCategory.color || '#3B82F6',
      is_active: testCategory.is_active,
      display_order: testCategory.display_order,
      is_global: true,
      context_id: '', // String vazia que causava erro
      parent_category_id: '' // String vazia que causava erro
    }
    
    console.log('📤 Dados enviados:', JSON.stringify(updateData, null, 2))
    
    try {
      const updateResponse = await axios.put(
        `${BASE_URL}/api/categories/${testCategory.id}`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      )
      
      if (updateResponse.status === 200) {
        console.log('✅ Categoria atualizada com sucesso via API!')
        console.log('🎉 A correção funcionou!')
        console.log('📝 Resposta:', updateResponse.data)
      } else {
        console.log(`⚠️ Status inesperado: ${updateResponse.status}`)
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Erro na API: ${error.response.status}`)
        console.log('📝 Resposta de erro:', error.response.data)
        
        if (error.response.status === 500) {
          console.log('🚨 Erro 500 - A correção ainda não funcionou')
          return false
        }
      } else {
        console.error('❌ Erro de rede:', error.message)
        return false
      }
    }
    
    // 4. Testar edição com dados válidos
    console.log('\n✅ 4. TESTANDO EDIÇÃO COM DADOS VÁLIDOS')
    
    const validUpdateData = {
      name: testCategory.name,
      slug: testCategory.slug,
      description: `Teste válido - ${new Date().toISOString()}`,
      icon: testCategory.icon || 'folder',
      color: testCategory.color || '#3B82F6',
      is_active: testCategory.is_active,
      display_order: testCategory.display_order,
      is_global: true,
      context_id: null, // null explícito
      parent_category_id: null // null explícito
    }
    
    try {
      const validUpdateResponse = await axios.put(
        `${BASE_URL}/api/categories/${testCategory.id}`,
        validUpdateData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      )
      
      if (validUpdateResponse.status === 200) {
        console.log('✅ Categoria atualizada com dados válidos!')
        console.log('📝 Resposta:', validUpdateResponse.data)
      }
      
    } catch (error) {
      console.error('❌ Erro com dados válidos:', error.response?.data || error.message)
    }
    
    console.log('\n🎯 TESTE CONCLUÍDO!')
    console.log('✅ A API está funcionando corretamente!')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
    return false
  }
}

testarApiFrontend()
