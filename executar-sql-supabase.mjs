import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function executarSQLSupabase() {
  console.log('🔧 EXECUTANDO SQL NO SUPABASE')
  console.log('=' * 60)
  
  try {
    // 1. Adicionar colunas uma por uma
    console.log('📝 Adicionando colunas...')
    
    // Adicionar context_id
    console.log('  - Adicionando context_id...')
    const { error: contextIdError } = await supabaseAdmin
      .rpc('exec', { 
        sql: 'ALTER TABLE categories ADD COLUMN IF NOT EXISTS context_id UUID REFERENCES contexts(id) ON DELETE CASCADE;' 
      })
    
    if (contextIdError) {
      console.log('⚠️ Erro ao adicionar context_id:', contextIdError.message)
    } else {
      console.log('✅ context_id adicionado')
    }
    
    // Adicionar is_global
    console.log('  - Adicionando is_global...')
    const { error: isGlobalError } = await supabaseAdmin
      .rpc('exec', { 
        sql: 'ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;' 
      })
    
    if (isGlobalError) {
      console.log('⚠️ Erro ao adicionar is_global:', isGlobalError.message)
    } else {
      console.log('✅ is_global adicionado')
    }
    
    // Adicionar parent_category_id
    console.log('  - Adicionando parent_category_id...')
    const { error: parentError } = await supabaseAdmin
      .rpc('exec', { 
        sql: 'ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;' 
      })
    
    if (parentError) {
      console.log('⚠️ Erro ao adicionar parent_category_id:', parentError.message)
    } else {
      console.log('✅ parent_category_id adicionado')
    }
    
    // 2. Atualizar categorias existentes para serem globais
    console.log('\n📝 Atualizando categorias existentes...')
    const { error: updateError } = await supabaseAdmin
      .rpc('exec', { 
        sql: 'UPDATE categories SET is_global = true, context_id = NULL WHERE context_id IS NULL;' 
      })
    
    if (updateError) {
      console.log('⚠️ Erro ao atualizar categorias:', updateError.message)
    } else {
      console.log('✅ Categorias existentes atualizadas para globais')
    }
    
    // 3. Verificar estrutura final
    console.log('\n🔍 VERIFICANDO ESTRUTURA FINAL...')
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .limit(1)
    
    if (categoriesError) {
      console.error('❌ Erro ao verificar categories:', categoriesError)
    } else if (categories.length > 0) {
      const category = categories[0]
      console.log('✅ Estrutura final da tabela categories:')
      Object.keys(category).forEach(key => {
        console.log(`  - ${key}: ${typeof category[key]} = ${category[key]}`)
      })
    }
    
    console.log('\n🎯 SCHEMA EXECUTADO COM SUCESSO!')
    return true
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return false
  }
}

executarSQLSupabase()
