import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testarCorrecaoUuid() {
  console.log('🧪 TESTANDO CORREÇÃO DE UUID VAZIO')
  console.log('=' * 60)
  
  try {
    // 1. Buscar uma categoria existente
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
    
    // 2. Testar atualização com campos vazios (que causavam o erro)
    console.log('\n📝 2. TESTANDO ATUALIZAÇÃO COM CAMPOS VAZIOS')
    
    const { data: updatedCategory, error: updateError } = await supabaseAdmin
      .from('categories')
      .update({
        name: testCategory.name,
        slug: testCategory.slug,
        description: `Teste UUID vazio - ${new Date().toISOString()}`,
        is_global: true,
        context_id: null, // Explicitamente null
        parent_category_id: null, // Explicitamente null
        updated_at: new Date().toISOString()
      })
      .eq('id', testCategory.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Erro ao atualizar categoria:', updateError)
      return false
    }
    
    console.log('✅ Categoria atualizada com sucesso (campos null)')
    console.log(`📝 Nova descrição: ${updatedCategory.description}`)
    
    // 3. Testar atualização com strings vazias (simulando o frontend)
    console.log('\n🎯 3. TESTANDO ATUALIZAÇÃO COM STRINGS VAZIAS')
    
    const { data: updatedCategory2, error: updateError2 } = await supabaseAdmin
      .from('categories')
      .update({
        name: testCategory.name,
        slug: testCategory.slug,
        description: `Teste string vazia - ${new Date().toISOString()}`,
        is_global: true,
        context_id: '', // String vazia (que causava erro)
        parent_category_id: '', // String vazia (que causava erro)
        updated_at: new Date().toISOString()
      })
      .eq('id', testCategory.id)
      .select()
      .single()
    
    if (updateError2) {
      console.error('❌ Erro ao atualizar categoria com strings vazias:', updateError2)
      console.log('⚠️ Este erro indica que a correção ainda não foi aplicada')
      return false
    }
    
    console.log('✅ Categoria atualizada com sucesso (strings vazias tratadas)')
    console.log(`📝 Nova descrição: ${updatedCategory2.description}`)
    
    // 4. Verificar estrutura final
    console.log('\n🔍 4. VERIFICANDO ESTRUTURA FINAL')
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
    console.log(`  - Context ID: ${finalCategory.context_id || 'null'}`)
    console.log(`  - Parent ID: ${finalCategory.parent_category_id || 'null'}`)
    
    console.log('\n🎉 TESTE DE CORREÇÃO CONCLUÍDO COM SUCESSO!')
    console.log('✅ O erro de UUID vazio foi corrigido!')
    console.log('✅ A edição de categorias agora funciona corretamente!')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
    return false
  }
}

testarCorrecaoUuid()
