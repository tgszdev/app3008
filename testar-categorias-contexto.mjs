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

async function testarCategoriasContexto() {
  console.log('🧪 TESTANDO CATEGORIAS POR CONTEXTO')
  console.log('=' * 60)
  
  try {
    // 1. Verificar se as colunas foram adicionadas
    console.log('\n🔍 1. VERIFICANDO ESTRUTURA DA TABELA')
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
      const hasContextId = 'context_id' in category
      const hasIsGlobal = 'is_global' in category
      const hasParentId = 'parent_category_id' in category
      
      console.log('📊 Estrutura da tabela categories:')
      console.log(`  - context_id: ${hasContextId ? '✅' : '❌'}`)
      console.log(`  - is_global: ${hasIsGlobal ? '✅' : '❌'}`)
      console.log(`  - parent_category_id: ${hasParentId ? '✅' : '❌'}`)
      
      if (!hasContextId || !hasIsGlobal || !hasParentId) {
        console.log('\n⚠️ ATENÇÃO: Execute o SQL no Supabase Dashboard primeiro!')
        console.log('📄 Consulte o arquivo: instrucoes-sql-supabase.md')
        return false
      }
    }
    
    // 2. Testar API de contextos para categorias
    console.log('\n🌐 2. TESTANDO API /api/contexts/for-categories')
    try {
      const response = await axios.get(`${BASE_URL}/api/contexts/for-categories`, {
        timeout: 10000
      })
      
      if (response.status === 200) {
        console.log('✅ API de contextos funcionando')
        console.log(`📊 Organizações: ${response.data.organizations?.length || 0}`)
        console.log(`📊 Departamentos: ${response.data.departments?.length || 0}`)
        console.log(`📊 Total: ${response.data.all?.length || 0}`)
        
        if (response.data.all && response.data.all.length > 0) {
          console.log('📋 Contextos disponíveis:')
          response.data.all.forEach(ctx => {
            console.log(`  - ${ctx.name} (${ctx.type})`)
          })
        }
      } else {
        console.log('❌ API de contextos com erro:', response.status)
      }
    } catch (error) {
      console.log('❌ Erro na API de contextos:', error.message)
    }
    
    // 3. Testar API principal de categorias
    console.log('\n🌐 3. TESTANDO API /api/categories')
    try {
      const response = await axios.get(`${BASE_URL}/api/categories`, {
        timeout: 10000
      })
      
      if (response.status === 200) {
        console.log('✅ API principal de categorias funcionando')
        console.log(`📊 Categorias: ${response.data?.length || 0}`)
        
        if (response.data && response.data.length > 0) {
          console.log('📋 Categorias encontradas:')
          response.data.forEach(cat => {
            const contextInfo = cat.contexts ? `(${cat.contexts.name})` : cat.is_global ? '(Global)' : '(Sem contexto)'
            console.log(`  - ${cat.name} ${contextInfo}`)
          })
        }
      } else {
        console.log('❌ API principal com erro:', response.status)
      }
    } catch (error) {
      console.log('❌ Erro na API principal:', error.message)
    }
    
    // 4. Testar API de categorias por contexto (se houver contextos)
    console.log('\n🌐 4. TESTANDO API /api/categories/by-context')
    try {
      const contextsResponse = await axios.get(`${BASE_URL}/api/contexts/for-categories`, {
        timeout: 10000
      })
      
      if (contextsResponse.status === 200 && contextsResponse.data.all && contextsResponse.data.all.length > 0) {
        const testContextId = contextsResponse.data.all[0].id
        const testContextName = contextsResponse.data.all[0].name
        
        const response = await axios.get(`${BASE_URL}/api/categories/by-context?context_id=${testContextId}`, {
          timeout: 10000
        })
        
        if (response.status === 200) {
          console.log('✅ API de categorias por contexto funcionando')
          console.log(`📊 Contexto: ${response.data.context?.name || testContextName}`)
          console.log(`📊 Categorias: ${response.data.categories?.length || 0}`)
          
          if (response.data.categories && response.data.categories.length > 0) {
            console.log('📋 Categorias do contexto:')
            response.data.categories.forEach(cat => {
              const type = cat.is_global ? 'Global' : 'Específica'
              console.log(`  - ${cat.name} (${type})`)
            })
          }
        } else {
          console.log('❌ API de categorias por contexto com erro:', response.status)
        }
      } else {
        console.log('⚠️ Nenhum contexto disponível para teste')
      }
    } catch (error) {
      console.log('❌ Erro na API de categorias por contexto:', error.message)
    }
    
    console.log('\n🎯 TESTE CONCLUÍDO!')
    console.log('\n📋 PRÓXIMOS PASSOS:')
    console.log('1. Execute o SQL no Supabase Dashboard se necessário')
    console.log('2. Teste o frontend no navegador')
    console.log('3. Crie categorias específicas para organizações')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
    return false
  }
}

testarCategoriasContexto()
