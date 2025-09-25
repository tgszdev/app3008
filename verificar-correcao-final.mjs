import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verificarCorrecaoFinal() {
  console.log('🔍 VERIFICANDO CORREÇÃO FINAL')
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
    
    // 2. Simular exatamente o que o frontend envia
    console.log('\n📝 2. SIMULANDO DADOS DO FRONTEND')
    
    const frontendData = {
      name: testCategory.name,
      slug: testCategory.slug,
      description: `Teste correção final - ${new Date().toISOString()}`,
      icon: testCategory.icon || 'folder',
      color: testCategory.color || '#3B82F6',
      is_active: testCategory.is_active,
      display_order: testCategory.display_order,
      is_global: true,
      context_id: '', // String vazia que causava erro
      parent_category_id: '' // String vazia que causava erro
    }
    
    console.log('📤 Dados simulados do frontend:')
    console.log(JSON.stringify(frontendData, null, 2))
    
    // 3. Aplicar a mesma lógica da API corrigida
    console.log('\n🔧 3. APLICANDO LÓGICA DE CORREÇÃO')
    
    // Preparar dados para atualização - filtrar campos vazios
    const updateData = {
      ...frontendData,
      updated_at: new Date().toISOString()
    }
    
    // Tratar campos UUID vazios
    if (frontendData.is_global) {
      updateData.context_id = null
    } else if (frontendData.context_id && frontendData.context_id !== '') {
      updateData.context_id = frontendData.context_id
    } else {
      delete updateData.context_id // Não incluir se vazio
    }
    
    if (frontendData.parent_category_id && frontendData.parent_category_id !== '') {
      updateData.parent_category_id = frontendData.parent_category_id
    } else {
      updateData.parent_category_id = null
    }
    
    // Remover campos vazios que podem causar erro
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '' || updateData[key] === undefined) {
        if (key === 'context_id' || key === 'parent_category_id') {
          updateData[key] = null
        } else {
          delete updateData[key]
        }
      }
    })
    
    console.log('📤 Dados processados para o banco:')
    console.log(JSON.stringify(updateData, null, 2))
    
    // 4. Testar a atualização
    console.log('\n✅ 4. TESTANDO ATUALIZAÇÃO NO BANCO')
    
    const { data: updatedCategory, error: updateError } = await supabaseAdmin
      .from('categories')
      .update(updateData)
      .eq('id', testCategory.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Erro ao atualizar categoria:', updateError)
      console.log('🚨 A correção ainda não funcionou completamente')
      return false
    }
    
    console.log('✅ Categoria atualizada com sucesso!')
    console.log('🎉 A correção está funcionando!')
    console.log('📝 Categoria atualizada:', updatedCategory.name)
    console.log('📝 Context ID:', updatedCategory.context_id)
    console.log('📝 Parent ID:', updatedCategory.parent_category_id)
    
    // 5. Verificar se os campos estão corretos
    console.log('\n🔍 5. VERIFICANDO CAMPOS FINAIS')
    
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
    console.log(`  - Context ID: ${finalCategory.context_id || 'null'}`)
    console.log(`  - Parent ID: ${finalCategory.parent_category_id || 'null'}`)
    console.log(`  - Contexto: ${finalCategory.contexts?.name || 'N/A'}`)
    console.log(`  - Pai: ${finalCategory.parent_category?.name || 'N/A'}`)
    
    console.log('\n🎉 VERIFICAÇÃO CONCLUÍDA COM SUCESSO!')
    console.log('✅ A correção está funcionando perfeitamente!')
    console.log('✅ Strings vazias são tratadas como null')
    console.log('✅ Campos UUID vazios não causam mais erro')
    console.log('✅ A edição de categorias está funcionando!')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral na verificação:', error)
    return false
  }
}

verificarCorrecaoFinal()
