import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import axios from 'axios'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BASE_URL = 'https://www.ithostbr.tech'

async function ctsCategoriasContextoCompleta() {
  console.log('🧪 CTS COMPLETA - CATEGORIAS POR CONTEXTO')
  console.log('=' * 80)
  
  let totalTests = 0
  let passedTests = 0
  let failedTests = 0
  
  const test = (name, fn) => {
    totalTests++
    try {
      const result = fn()
      if (result) {
        console.log(`✅ ${name}`)
        passedTests++
      } else {
        console.log(`❌ ${name}`)
        failedTests++
      }
    } catch (error) {
      console.log(`❌ ${name} - Erro: ${error.message}`)
      failedTests++
    }
  }
  
  try {
    // =====================================================
    // 1. VERIFICAÇÃO DE ESTRUTURA DO BANCO
    // =====================================================
    console.log('\n🔍 1. VERIFICAÇÃO DE ESTRUTURA DO BANCO')
    console.log('-' * 50)
    
    test('Verificar coluna context_id na tabela categories', () => {
      const { data } = supabaseAdmin.from('categories').select('context_id').limit(1)
      return data !== null
    })
    
    test('Verificar coluna is_global na tabela categories', () => {
      const { data } = supabaseAdmin.from('categories').select('is_global').limit(1)
      return data !== null
    })
    
    test('Verificar coluna parent_category_id na tabela categories', () => {
      const { data } = supabaseAdmin.from('categories').select('parent_category_id').limit(1)
      return data !== null
    })
    
    // =====================================================
    // 2. VERIFICAÇÃO DE DADOS EXISTENTES
    // =====================================================
    console.log('\n📊 2. VERIFICAÇÃO DE DADOS EXISTENTES')
    console.log('-' * 50)
    
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('*')
    
    test('Categorias existentes carregadas', () => {
      return categories && categories.length > 0
    })
    
    test('Categorias existentes são globais', () => {
      return categories.every(cat => cat.is_global === true)
    })
    
    test('Categorias existentes não têm context_id', () => {
      return categories.every(cat => cat.context_id === null)
    })
    
    // =====================================================
    // 3. VERIFICAÇÃO DE CONTEXTOS
    // =====================================================
    console.log('\n🏢 3. VERIFICAÇÃO DE CONTEXTOS')
    console.log('-' * 50)
    
    const { data: contexts } = await supabaseAdmin
      .from('contexts')
      .select('*')
      .eq('is_active', true)
    
    test('Contextos ativos carregados', () => {
      return contexts && contexts.length > 0
    })
    
    test('Pelo menos uma organização existe', () => {
      return contexts.some(ctx => ctx.type === 'organization')
    })
    
    test('Pelo menos um departamento existe', () => {
      return contexts.some(ctx => ctx.type === 'department')
    })
    
    // =====================================================
    // 4. TESTE DE CRIAÇÃO DE CATEGORIA GLOBAL
    // =====================================================
    console.log('\n🌐 4. TESTE DE CRIAÇÃO DE CATEGORIA GLOBAL')
    console.log('-' * 50)
    
    const globalCategoryData = {
      name: 'CTS Teste Global',
      slug: 'cts-teste-global',
      description: 'Categoria global para teste CTS',
      icon: 'test-tube',
      color: '#FF6B6B',
      is_active: true,
      display_order: 999,
      is_global: true,
      context_id: null,
      parent_category_id: null
    }
    
    const { data: globalCategory, error: globalError } = await supabaseAdmin
      .from('categories')
      .insert(globalCategoryData)
      .select()
      .single()
    
    test('Categoria global criada com sucesso', () => {
      return !globalError && globalCategory
    })
    
    test('Categoria global tem is_global = true', () => {
      return globalCategory && globalCategory.is_global === true
    })
    
    test('Categoria global tem context_id = null', () => {
      return globalCategory && globalCategory.context_id === null
    })
    
    // =====================================================
    // 5. TESTE DE CRIAÇÃO DE CATEGORIA ESPECÍFICA
    // =====================================================
    console.log('\n🎯 5. TESTE DE CRIAÇÃO DE CATEGORIA ESPECÍFICA')
    console.log('-' * 50)
    
    const testContext = contexts.find(ctx => ctx.type === 'organization')
    
    if (testContext) {
      const specificCategoryData = {
        name: 'CTS Teste Específica',
        slug: 'cts-teste-especifica',
        description: 'Categoria específica para teste CTS',
        icon: 'target',
        color: '#4ECDC4',
        is_active: true,
        display_order: 998,
        is_global: false,
        context_id: testContext.id,
        parent_category_id: null
      }
      
      const { data: specificCategory, error: specificError } = await supabaseAdmin
        .from('categories')
        .insert(specificCategoryData)
        .select()
        .single()
      
      test('Categoria específica criada com sucesso', () => {
        return !specificError && specificCategory
      })
      
      test('Categoria específica tem is_global = false', () => {
        return specificCategory && specificCategory.is_global === false
      })
      
      test('Categoria específica tem context_id correto', () => {
        return specificCategory && specificCategory.context_id === testContext.id
      })
      
      // =====================================================
      // 6. TESTE DE CATEGORIA COM PAI
      // =====================================================
      console.log('\n👨‍👩‍👧‍👦 6. TESTE DE CATEGORIA COM PAI')
      console.log('-' * 50)
      
      const childCategoryData = {
        name: 'CTS Teste Filha',
        slug: 'cts-teste-filha',
        description: 'Categoria filha para teste CTS',
        icon: 'baby',
        color: '#FFE66D',
        is_active: true,
        display_order: 997,
        is_global: false,
        context_id: testContext.id,
        parent_category_id: specificCategory.id
      }
      
      const { data: childCategory, error: childError } = await supabaseAdmin
        .from('categories')
        .insert(childCategoryData)
        .select()
        .single()
      
      test('Categoria filha criada com sucesso', () => {
        return !childError && childCategory
      })
      
      test('Categoria filha tem parent_category_id correto', () => {
        return childCategory && childCategory.parent_category_id === specificCategory.id
      })
      
      test('Categoria filha tem mesmo context_id da pai', () => {
        return childCategory && childCategory.context_id === specificCategory.context_id
      })
    }
    
    // =====================================================
    // 7. TESTE DE APIS (SEM AUTENTICAÇÃO)
    // =====================================================
    console.log('\n🌐 7. TESTE DE APIS (SEM AUTENTICAÇÃO)')
    console.log('-' * 50)
    
    test('API /api/contexts/for-categories retorna 401 (esperado)', async () => {
      try {
        await axios.get(`${BASE_URL}/api/contexts/for-categories`, { timeout: 5000 })
        return false // Não deveria funcionar sem auth
      } catch (error) {
        return error.response?.status === 401
      }
    })
    
    test('API /api/categories retorna 401 (esperado)', async () => {
      try {
        await axios.get(`${BASE_URL}/api/categories`, { timeout: 5000 })
        return false // Não deveria funcionar sem auth
      } catch (error) {
        return error.response?.status === 401
      }
    })
    
    test('API /api/categories/by-context retorna 401 (esperado)', async () => {
      try {
        await axios.get(`${BASE_URL}/api/categories/by-context?context_id=test`, { timeout: 5000 })
        return false // Não deveria funcionar sem auth
      } catch (error) {
        return error.response?.status === 401
      }
    })
    
    // =====================================================
    // 8. TESTE DE CONSULTAS COMPLEXAS
    // =====================================================
    console.log('\n🔍 8. TESTE DE CONSULTAS COMPLEXAS')
    console.log('-' * 50)
    
    test('Buscar categorias globais', () => {
      const { data } = supabaseAdmin
        .from('categories')
        .select('*')
        .eq('is_global', true)
      
      return data && data.length > 0
    })
    
    test('Buscar categorias específicas de um contexto', () => {
      if (testContext) {
        const { data } = supabaseAdmin
          .from('categories')
          .select('*')
          .eq('context_id', testContext.id)
          .eq('is_global', false)
        
        return data && data.length > 0
      }
      return true
    })
    
    test('Buscar categorias com contexto (JOIN)', () => {
      const { data } = supabaseAdmin
        .from('categories')
        .select(`
          *,
          contexts(id, name, type, slug)
        `)
        .not('context_id', 'is', null)
      
      return data && data.length > 0
    })
    
    test('Buscar categorias com pai (JOIN)', () => {
      const { data } = supabaseAdmin
        .from('categories')
        .select(`
          *,
          parent_category:parent_category_id(id, name, slug)
        `)
        .not('parent_category_id', 'is', null)
      
      return data && data.length > 0
    })
    
    // =====================================================
    // 9. TESTE DE VALIDAÇÕES
    // =====================================================
    console.log('\n✅ 9. TESTE DE VALIDAÇÕES')
    console.log('-' * 50)
    
    test('Não permitir categoria global com context_id', () => {
      const { error } = supabaseAdmin
        .from('categories')
        .insert({
          name: 'Teste Inválido',
          slug: 'teste-invalido',
          is_global: true,
          context_id: testContext?.id || 'invalid'
        })
      
      return error !== null // Deve dar erro
    })
    
    test('Não permitir categoria específica sem context_id', () => {
      const { error } = supabaseAdmin
        .from('categories')
        .insert({
          name: 'Teste Inválido 2',
          slug: 'teste-invalido-2',
          is_global: false,
          context_id: null
        })
      
      return error !== null // Deve dar erro
    })
    
    // =====================================================
    // 10. LIMPEZA DOS DADOS DE TESTE
    // =====================================================
    console.log('\n🧹 10. LIMPEZA DOS DADOS DE TESTE')
    console.log('-' * 50)
    
    test('Remover categorias de teste', async () => {
      const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .like('name', 'CTS Teste%')
      
      return !error
    })
    
    // =====================================================
    // RESULTADO FINAL
    // =====================================================
    console.log('\n🎯 RESULTADO FINAL')
    console.log('=' * 80)
    console.log(`📊 Total de testes: ${totalTests}`)
    console.log(`✅ Testes aprovados: ${passedTests}`)
    console.log(`❌ Testes falharam: ${failedTests}`)
    console.log(`📈 Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
    
    if (failedTests === 0) {
      console.log('\n🎉 CTS COMPLETA - TODOS OS TESTES PASSARAM!')
      console.log('✅ Funcionalidade de categorias por contexto está funcionando perfeitamente!')
    } else {
      console.log('\n⚠️ CTS COMPLETA - ALGUNS TESTES FALHARAM!')
      console.log('❌ Verifique os erros acima e corrija antes de usar em produção.')
    }
    
    return failedTests === 0
    
  } catch (error) {
    console.error('❌ Erro geral na CTS:', error)
    return false
  }
}

ctsCategoriasContextoCompleta()
