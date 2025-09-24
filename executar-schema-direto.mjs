import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import fs from 'fs'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function executarSchemaDireto() {
  console.log('🔧 EXECUTANDO SCHEMA DIRETAMENTE')
  console.log('=' * 60)
  
  try {
    // 1. Adicionar coluna context_id
    console.log('📝 Adicionando coluna context_id...')
    const { error: contextIdError } = await supabaseAdmin
      .from('categories')
      .select('context_id')
      .limit(1)
    
    if (contextIdError && contextIdError.code === 'PGRST116') {
      console.log('⚠️ Coluna context_id não existe, será adicionada via SQL direto')
    } else {
      console.log('✅ Coluna context_id já existe')
    }
    
    // 2. Adicionar coluna is_global
    console.log('📝 Adicionando coluna is_global...')
    const { error: isGlobalError } = await supabaseAdmin
      .from('categories')
      .select('is_global')
      .limit(1)
    
    if (isGlobalError && isGlobalError.code === 'PGRST116') {
      console.log('⚠️ Coluna is_global não existe, será adicionada via SQL direto')
    } else {
      console.log('✅ Coluna is_global já existe')
    }
    
    // 3. Adicionar coluna parent_category_id
    console.log('📝 Adicionando coluna parent_category_id...')
    const { error: parentError } = await supabaseAdmin
      .from('categories')
      .select('parent_category_id')
      .limit(1)
    
    if (parentError && parentError.code === 'PGRST116') {
      console.log('⚠️ Coluna parent_category_id não existe, será adicionada via SQL direto')
    } else {
      console.log('✅ Coluna parent_category_id já existe')
    }
    
    // 4. Verificar estrutura atual
    console.log('\n🔍 VERIFICANDO ESTRUTURA ATUAL...')
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
      console.log('📊 Estrutura atual da tabela categories:')
      Object.keys(category).forEach(key => {
        console.log(`  - ${key}: ${typeof category[key]}`)
      })
    }
    
    // 5. Verificar contextos disponíveis
    console.log('\n🏢 CONTEXTOS DISPONÍVEIS...')
    const { data: contexts, error: contextsError } = await supabaseAdmin
      .from('contexts')
      .select('id, name, type, is_active')
      .order('created_at', { ascending: false })
    
    if (contextsError) {
      console.error('❌ Erro ao buscar contexts:', contextsError)
    } else {
      console.log('✅ Contextos encontrados:', contexts.length)
      contexts.forEach(ctx => {
        console.log(`  - ${ctx.name} (${ctx.type}) - Ativo: ${ctx.is_active}`)
      })
    }
    
    console.log('\n🎯 PRÓXIMOS PASSOS:')
    console.log('1. Executar SQL diretamente no Supabase Dashboard')
    console.log('2. Verificar se as colunas foram adicionadas')
    console.log('3. Testar as funções criadas')
    console.log('4. Implementar as APIs')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return false
  }
}

executarSchemaDireto()
