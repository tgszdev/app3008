import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugCategoriaAgroFinal() {
  console.log('🔍 DEBUG FINAL - CATEGORIA AGRO')
  console.log('=' * 50)
  
  try {
    // 1. Verificar usuário agro
    console.log('\n👤 1. VERIFICANDO USUÁRIO AGRO')
    
    const { data: agroUser, error: agroError } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('email', 'agro@agro.com.br')
      .single()
    
    if (agroError) {
      console.error('❌ Erro ao buscar usuário agro:', agroError)
      return false
    }
    
    if (!agroUser) {
      console.log('❌ Usuário agro não encontrado')
      return false
    }
    
    console.log('✅ Usuário agro encontrado:')
    console.log(`  - Nome: ${agroUser.name}`)
    console.log(`  - Email: ${agroUser.email}`)
    console.log(`  - Ativo: ${agroUser.is_active}`)
    console.log(`  - Tipo: ${agroUser.user_type}`)
    console.log(`  - Context ID: ${agroUser.context_id}`)
    console.log(`  - Contexto: ${agroUser.contexts?.name}`)
    
    // 2. Verificar categoria Agro Financeiro
    console.log('\n📋 2. VERIFICANDO CATEGORIA AGRO FINANCEIRO')
    
    const { data: agroCategory, error: categoryError } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('name', 'Agro Financeiro')
      .eq('is_active', true)
      .single()
    
    if (categoryError) {
      console.error('❌ Erro ao buscar categoria Agro Financeiro:', categoryError)
      return false
    }
    
    if (!agroCategory) {
      console.log('❌ Categoria Agro Financeiro não encontrada')
      return false
    }
    
    console.log('✅ Categoria Agro Financeiro encontrada:')
    console.log(`  - Nome: ${agroCategory.name}`)
    console.log(`  - ID: ${agroCategory.id}`)
    console.log(`  - Context ID: ${agroCategory.context_id}`)
    console.log(`  - Contexto: ${agroCategory.contexts?.name}`)
    console.log(`  - Global: ${agroCategory.is_global}`)
    console.log(`  - Ativa: ${agroCategory.is_active}`)
    
    // 3. Verificar se o contexto da categoria é o mesmo do usuário
    console.log('\n🔗 3. VERIFICANDO VINCULAÇÃO CONTEXTO')
    
    if (agroCategory.context_id === agroUser.context_id) {
      console.log('✅ Contexto da categoria é o mesmo do usuário')
    } else {
      console.log('❌ PROBLEMA: Contexto da categoria é diferente do usuário')
      console.log(`  - Categoria Context ID: ${agroCategory.context_id}`)
      console.log(`  - Usuário Context ID: ${agroUser.context_id}`)
    }
    
    // 4. Simular exatamente o que a API deveria retornar
    console.log('\n🔍 4. SIMULANDO QUERY DA API')
    
    let query = supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug),
        parent_category:parent_category_id(id, name, slug)
      `)
      .eq('is_active', true)
    
    // Aplicar filtro baseado no tipo de usuário
    if (agroUser.user_type === 'context' && agroUser.context_id) {
      // Usuários context veem categorias globais + do seu contexto
      query = query.or(`is_global.eq.true,context_id.eq.${agroUser.context_id}`)
    } else if (agroUser.user_type === 'matrix') {
      // Usuários matrix veem todas as categorias
      // Não adicionar filtro
    } else {
      // Fallback: apenas categorias globais
      query = query.eq('is_global', true)
    }
    
    query = query.order('display_order', { ascending: true })
    
    const { data: categories, error: queryError } = await query
    
    if (queryError) {
      console.error('❌ Erro na query:', queryError)
      return false
    }
    
    console.log(`✅ Categorias retornadas pela query: ${categories?.length || 0}`)
    
    if (categories && categories.length > 0) {
      console.log('\n📋 CATEGORIAS QUE O USUÁRIO AGRO DEVERIA VER:')
      categories.forEach((cat, index) => {
        const type = cat.is_global ? '🌐 Global' : '🏢 Específica'
        const context = cat.contexts?.name || 'Sem contexto'
        console.log(`  ${index + 1}. ${cat.name} (${type}) - ${context}`)
      })
      
      // Verificar se a categoria da Agro está presente
      const agroCategoryFound = categories.find(cat => 
        cat.name === 'Agro Financeiro' || 
        cat.contexts?.name?.toLowerCase().includes('agro')
      )
      
      if (agroCategoryFound) {
        console.log('\n✅ CATEGORIA AGRO FINANCEIRO ENCONTRADA NA QUERY!')
        console.log(`  - Nome: ${agroCategoryFound.name}`)
        console.log(`  - Contexto: ${agroCategoryFound.contexts?.name}`)
        console.log(`  - Global: ${agroCategoryFound.is_global}`)
      } else {
        console.log('\n❌ CATEGORIA AGRO FINANCEIRO NÃO ENCONTRADA NA QUERY!')
        console.log('🔍 Isso explica por que não aparece no frontend')
      }
    } else {
      console.log('❌ Nenhuma categoria retornada pela query')
    }
    
    // 5. Verificar se há problema de contexto
    console.log('\n🔍 5. VERIFICANDO PROBLEMA DE CONTEXTO')
    
    if (agroCategory.context_id !== agroUser.context_id) {
      console.log('🚨 PROBLEMA IDENTIFICADO:')
      console.log('   A categoria está vinculada a um contexto diferente do usuário!')
      console.log(`   - Categoria Context: ${agroCategory.context_id}`)
      console.log(`   - Usuário Context: ${agroUser.context_id}`)
      
      console.log('\n🔧 CORRIGINDO VINCULAÇÃO...')
      
      const { error: updateError } = await supabaseAdmin
        .from('categories')
        .update({ context_id: agroUser.context_id })
        .eq('id', agroCategory.id)
      
      if (updateError) {
        console.error('❌ Erro ao corrigir vinculação:', updateError)
      } else {
        console.log('✅ Vinculação corrigida!')
        console.log('🎯 Agora a categoria deveria aparecer para o usuário agro')
      }
    }
    
    console.log('\n🎯 DEBUG CONCLUÍDO!')
    console.log('📋 RESUMO:')
    console.log(`- Usuário agro: ${agroUser.name} (${agroUser.email})`)
    console.log(`- Contexto do usuário: ${agroUser.contexts?.name}`)
    console.log(`- Categoria Agro Financeiro: ${agroCategory.name}`)
    console.log(`- Contexto da categoria: ${agroCategory.contexts?.name}`)
    console.log(`- Categorias na query: ${categories?.length || 0}`)
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral no debug:', error)
    return false
  }
}

debugCategoriaAgroFinal()
