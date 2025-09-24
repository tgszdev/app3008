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

async function testarAPIsCategorias() {
  console.log('🧪 TESTANDO APIS DE CATEGORIAS POR CONTEXTO')
  console.log('=' * 60)
  
  try {
    // 1. Verificar estrutura atual da tabela
    console.log('\n🔍 1. VERIFICANDO ESTRUTURA DA TABELA CATEGORIES')
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .limit(1)
    
    if (categoriesError) {
      console.error('❌ Erro ao verificar categories:', categoriesError)
      return false
    }
    
    if (categories.length > 0) {
      const category = categories[0]
      console.log('📊 Estrutura atual:')
      Object.keys(category).forEach(key => {
        console.log(`  - ${key}: ${typeof category[key]} = ${category[key]}`)
      })
      
      // Verificar se as novas colunas existem
      const hasContextId = 'context_id' in category
      const hasIsGlobal = 'is_global' in category
      const hasParentId = 'parent_category_id' in category
      
      console.log(`\n✅ Colunas adicionadas:`)
      console.log(`  - context_id: ${hasContextId ? '✅' : '❌'}`)
      console.log(`  - is_global: ${hasIsGlobal ? '✅' : '❌'}`)
      console.log(`  - parent_category_id: ${hasParentId ? '✅' : '❌'}`)
      
      if (!hasContextId || !hasIsGlobal || !hasParentId) {
        console.log('\n⚠️ ATENÇÃO: Execute o SQL no Supabase Dashboard primeiro!')
        console.log('📄 Consulte o arquivo: instrucoes-sql-supabase.md')
        return false
      }
    }
    
    // 2. Verificar contextos disponíveis
    console.log('\n🏢 2. VERIFICANDO CONTEXTOS DISPONÍVEIS')
    const { data: contexts, error: contextsError } = await supabaseAdmin
      .from('contexts')
      .select('id, name, type, is_active')
      .eq('is_active', true)
    
    if (contextsError) {
      console.error('❌ Erro ao buscar contexts:', contextsError)
      return false
    }
    
    console.log('✅ Contextos encontrados:', contexts.length)
    contexts.forEach(ctx => {
      console.log(`  - ${ctx.name} (${ctx.type})`)
    })
    
    // 3. Testar API de contextos para categorias
    console.log('\n🌐 3. TESTANDO API /api/contexts/for-categories')
    try {
      const response = await axios.get(`${BASE_URL}/api/contexts/for-categories`, {
        timeout: 10000
      })
      
      if (response.status === 200) {
        console.log('✅ API de contextos funcionando')
        console.log(`📊 Organizações: ${response.data.organizations?.length || 0}`)
        console.log(`📊 Departamentos: ${response.data.departments?.length || 0}`)
      } else {
        console.log('❌ API de contextos com erro:', response.status)
      }
    } catch (error) {
      console.log('❌ Erro na API de contextos:', error.message)
    }
    
    // 4. Testar API de categorias por contexto
    console.log('\n🌐 4. TESTANDO API /api/categories/by-context')
    if (contexts.length > 0) {
      const testContextId = contexts[0].id
      try {
        const response = await axios.get(`${BASE_URL}/api/categories/by-context?context_id=${testContextId}`, {
          timeout: 10000
        })
        
        if (response.status === 200) {
          console.log('✅ API de categorias por contexto funcionando')
          console.log(`📊 Contexto: ${response.data.context?.name}`)
          console.log(`📊 Categorias: ${response.data.categories?.length || 0}`)
        } else {
          console.log('❌ API de categorias por contexto com erro:', response.status)
        }
      } catch (error) {
        console.log('❌ Erro na API de categorias por contexto:', error.message)
      }
    }
    
    // 5. Testar API principal de categorias
    console.log('\n🌐 5. TESTANDO API /api/categories')
    try {
      const response = await axios.get(`${BASE_URL}/api/categories`, {
        timeout: 10000
      })
      
      if (response.status === 200) {
        console.log('✅ API principal de categorias funcionando')
        console.log(`📊 Categorias: ${response.data?.length || 0}`)
      } else {
        console.log('❌ API principal com erro:', response.status)
      }
    } catch (error) {
      console.log('❌ Erro na API principal:', error.message)
    }
    
    console.log('\n🎯 TESTE CONCLUÍDO!')
    console.log('\n📋 PRÓXIMOS PASSOS:')
    console.log('1. Execute o SQL no Supabase Dashboard')
    console.log('2. Teste as APIs novamente')
    console.log('3. Implemente o frontend')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
    return false
  }
}

testarAPIsCategorias()
