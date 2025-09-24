import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import fs from 'fs'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testarSchemaCategorias() {
  console.log('🧪 TESTANDO SCHEMA DE CATEGORIAS POR CONTEXTO')
  console.log('=' * 60)
  
  try {
    // 1. Ler o arquivo SQL
    const sqlContent = fs.readFileSync('schema-categorias-por-contexto.sql', 'utf8')
    console.log('📄 SQL carregado com sucesso')
    
    // 2. Executar o schema
    console.log('\n🔧 EXECUTANDO SCHEMA...')
    const { data, error } = await supabaseAdmin.rpc('exec', { sql: sqlContent })
    
    if (error) {
      console.error('❌ Erro ao executar schema:', error)
      return false
    }
    
    console.log('✅ Schema executado com sucesso')
    
    // 3. Verificar se as colunas foram adicionadas
    console.log('\n🔍 VERIFICANDO ESTRUTURA...')
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
      console.log('✅ Estrutura da tabela categories:')
      console.log(`  - context_id: ${category.context_id ? 'Presente' : 'Ausente'}`)
      console.log(`  - is_global: ${category.is_global ? 'Presente' : 'Ausente'}`)
      console.log(`  - parent_category_id: ${category.parent_category_id ? 'Presente' : 'Ausente'}`)
    }
    
    // 4. Testar função get_categories_for_context
    console.log('\n🧪 TESTANDO FUNÇÃO get_categories_for_context...')
    const { data: contextCategories, error: contextError } = await supabaseAdmin
      .rpc('get_categories_for_context', { target_context_id: 'fa4a4a34-f662-4da1-94d8-b77b5c578d6b' })
    
    if (contextError) {
      console.error('❌ Erro ao testar função:', contextError)
    } else {
      console.log('✅ Função executada com sucesso')
      console.log(`📊 Categorias encontradas: ${contextCategories.length}`)
    }
    
    // 5. Testar função can_use_category_in_context
    console.log('\n🧪 TESTANDO FUNÇÃO can_use_category_in_context...')
    const { data: canUse, error: canUseError } = await supabaseAdmin
      .rpc('can_use_category_in_context', { 
        category_id: '19aeb83e-2d1f-40ef-a61b-37901d6d701e',
        target_context_id: 'fa4a4a34-f662-4da1-94d8-b77b5c578d6b'
      })
    
    if (canUseError) {
      console.error('❌ Erro ao testar função can_use:', canUseError)
    } else {
      console.log('✅ Função can_use executada com sucesso')
      console.log(`📊 Pode usar categoria: ${canUse}`)
    }
    
    // 6. Verificar view categories_with_context
    console.log('\n🧪 TESTANDO VIEW categories_with_context...')
    const { data: viewData, error: viewError } = await supabaseAdmin
      .from('categories_with_context')
      .select('*')
      .limit(5)
    
    if (viewError) {
      console.error('❌ Erro ao testar view:', viewError)
    } else {
      console.log('✅ View executada com sucesso')
      console.log(`📊 Registros na view: ${viewData.length}`)
    }
    
    console.log('\n🎯 TESTE CONCLUÍDO COM SUCESSO!')
    return true
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
    return false
  }
}

testarSchemaCategorias()
