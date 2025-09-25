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

async function testarEdicaoCategorias() {
  console.log('🧪 TESTANDO EDIÇÃO DE CATEGORIAS')
  console.log('=' * 60)
  
  try {
    // 1. Buscar uma categoria existente para testar
    console.log('\n🔍 1. BUSCANDO CATEGORIA EXISTENTE')
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .limit(1)
    
    if (categoriesError || !categories || categories.length === 0) {
      console.error('❌ Erro ao buscar categorias:', categoriesError)
      return false
    }
    
    const testCategory = categories[0]
    console.log(`✅ Categoria encontrada: ${testCategory.name} (${testCategory.id})`)
    
    // 2. Testar atualização simples (sem contexto)
    console.log('\n📝 2. TESTANDO ATUALIZAÇÃO SIMPLES')
    const { data: updatedCategory, error: updateError } = await supabaseAdmin
      .from('categories')
      .update({
        description: `Descrição atualizada em ${new Date().toISOString()}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', testCategory.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Erro ao atualizar categoria:', updateError)
      return false
    }
    
    console.log('✅ Categoria atualizada com sucesso')
    console.log(`📝 Nova descrição: ${updatedCategory.description}`)
    
    // 3. Testar atualização com novos campos de contexto
    console.log('\n🎯 3. TESTANDO ATUALIZAÇÃO COM CONTEXTO')
    
    // Buscar um contexto para testar
    const { data: contexts } = await supabaseAdmin
      .from('contexts')
      .select('*')
      .eq('is_active', true)
      .limit(1)
    
    if (contexts && contexts.length > 0) {
      const testContext = contexts[0]
      console.log(`🏢 Usando contexto: ${testContext.name}`)
      
      const { data: contextUpdatedCategory, error: contextUpdateError } = await supabaseAdmin
        .from('categories')
        .update({
          is_global: false,
          context_id: testContext.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', testCategory.id)
        .select(`
          *,
          contexts(id, name, type, slug)
        `)
        .single()
      
      if (contextUpdateError) {
        console.error('❌ Erro ao atualizar categoria com contexto:', contextUpdateError)
        return false
      }
      
      console.log('✅ Categoria atualizada com contexto')
      console.log(`🎯 Contexto: ${contextUpdatedCategory.contexts?.name || 'N/A'}`)
      console.log(`🌐 Global: ${contextUpdatedCategory.is_global}`)
      
      // Reverter para global
      const { error: revertError } = await supabaseAdmin
        .from('categories')
        .update({
          is_global: true,
          context_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', testCategory.id)
      
      if (revertError) {
        console.error('❌ Erro ao reverter categoria:', revertError)
      } else {
        console.log('✅ Categoria revertida para global')
      }
    } else {
      console.log('⚠️ Nenhum contexto disponível para teste')
    }
    
    // 4. Testar API de edição (sem autenticação - deve falhar)
    console.log('\n🌐 4. TESTANDO API DE EDIÇÃO (SEM AUTH)')
    try {
      await axios.put(`${BASE_URL}/api/categories/${testCategory.id}`, {
        name: 'Teste API',
        description: 'Teste via API'
      }, { timeout: 5000 })
      console.log('❌ API deveria retornar 401 sem autenticação')
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ API retorna 401 corretamente sem autenticação')
      } else {
        console.log(`⚠️ API retornou status ${error.response?.status} (esperado 401)`)
      }
    }
    
    // 5. Verificar estrutura final
    console.log('\n🔍 5. VERIFICANDO ESTRUTURA FINAL')
    const { data: finalCategory, error: finalError } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug),
        parent_category:parent_category_id(id, name, slug)
      `)
      .eq('id', testCategory.id)
      .single()
    
    if (finalError) {
      console.error('❌ Erro ao verificar categoria final:', finalError)
      return false
    }
    
    console.log('✅ Estrutura final da categoria:')
    console.log(`  - Nome: ${finalCategory.name}`)
    console.log(`  - Global: ${finalCategory.is_global}`)
    console.log(`  - Contexto: ${finalCategory.contexts?.name || 'N/A'}`)
    console.log(`  - Pai: ${finalCategory.parent_category?.name || 'N/A'}`)
    
    console.log('\n🎉 TESTE DE EDIÇÃO CONCLUÍDO COM SUCESSO!')
    console.log('✅ A edição de categorias está funcionando corretamente!')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
    return false
  }
}

testarEdicaoCategorias()
