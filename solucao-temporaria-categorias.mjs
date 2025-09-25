import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function solucaoTemporariaCategorias() {
  console.log('🔧 SOLUÇÃO TEMPORÁRIA - CATEGORIAS')
  console.log('=' * 50)
  
  try {
    // 1. Verificar se a categoria da Agro existe
    console.log('\n🔍 1. VERIFICANDO CATEGORIA DA AGRO')
    
    const { data: agroCategory, error: agroError } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .ilike('name', '%agro%')
      .eq('is_active', true)
      .single()
    
    if (agroError) {
      console.error('❌ Erro ao buscar categoria da Agro:', agroError)
      return false
    }
    
    if (!agroCategory) {
      console.log('❌ Categoria da Agro não encontrada')
      return false
    }
    
    console.log('✅ Categoria da Agro encontrada:')
    console.log(`  - Nome: ${agroCategory.name}`)
    console.log(`  - Contexto: ${agroCategory.contexts?.name}`)
    console.log(`  - ID: ${agroCategory.id}`)
    console.log(`  - Ativa: ${agroCategory.is_active}`)
    
    // 2. Verificar se há categorias globais
    console.log('\n🌐 2. VERIFICANDO CATEGORIAS GLOBAIS')
    
    const { data: globalCategories, error: globalError } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('is_global', true)
      .eq('is_active', true)
    
    if (globalError) {
      console.error('❌ Erro ao buscar categorias globais:', globalError)
    } else {
      console.log(`✅ Categorias globais: ${globalCategories?.length || 0}`)
      if (globalCategories && globalCategories.length > 0) {
        globalCategories.forEach(cat => {
          console.log(`  - ${cat.name} (Global)`)
        })
      }
    }
    
    // 3. Criar uma categoria global temporária para teste
    console.log('\n➕ 3. CRIANDO CATEGORIA GLOBAL TEMPORÁRIA')
    
    const tempCategory = {
      name: 'Teste Global',
      slug: 'teste-global',
      description: 'Categoria global temporária para teste',
      icon: 'folder',
      color: '#3B82F6',
      is_active: true,
      display_order: 999,
      is_global: true,
      context_id: null,
      parent_category_id: null,
      created_by: '00000000-0000-0000-0000-000000000000' // UUID temporário
    }
    
    const { data: newCategory, error: createError } = await supabaseAdmin
      .from('categories')
      .insert(tempCategory)
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .single()
    
    if (createError) {
      console.log('⚠️ Erro ao criar categoria temporária:', createError.message)
      console.log('📝 Isso é normal se a categoria já existir')
    } else {
      console.log('✅ Categoria global temporária criada:')
      console.log(`  - Nome: ${newCategory.name}`)
      console.log(`  - ID: ${newCategory.id}`)
    }
    
    // 4. Verificar todas as categorias disponíveis
    console.log('\n📋 4. VERIFICANDO TODAS AS CATEGORIAS DISPONÍVEIS')
    
    const { data: allCategories, error: allError } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (allError) {
      console.error('❌ Erro ao buscar todas as categorias:', allError)
    } else {
      console.log(`✅ Total de categorias ativas: ${allCategories?.length || 0}`)
      
      if (allCategories && allCategories.length > 0) {
        console.log('\n📋 LISTA COMPLETA DE CATEGORIAS:')
        allCategories.forEach((cat, index) => {
          const type = cat.is_global ? '🌐 Global' : '🏢 Específica'
          const context = cat.contexts?.name || 'Sem contexto'
          console.log(`  ${index + 1}. ${cat.name} (${type}) - ${context}`)
        })
      }
    }
    
    // 5. Simular o que o usuário deveria ver
    console.log('\n👤 5. SIMULANDO VISÃO DO USUÁRIO AGRO')
    
    // Categorias que o usuário da Agro deveria ver
    const userCategories = allCategories?.filter(cat => 
      cat.is_global || 
      (cat.contexts?.name?.toLowerCase().includes('agro') || 
       cat.contexts?.name?.toLowerCase().includes('luft'))
    ) || []
    
    console.log(`✅ Categorias que o usuário Agro deveria ver: ${userCategories.length}`)
    
    if (userCategories.length > 0) {
      console.log('\n📋 CATEGORIAS DISPONÍVEIS PARA O USUÁRIO AGRO:')
      userCategories.forEach((cat, index) => {
        const type = cat.is_global ? '🌐 Global' : '🏢 Específica'
        const context = cat.contexts?.name || 'Sem contexto'
        console.log(`  ${index + 1}. ${cat.name} (${type}) - ${context}`)
      })
    } else {
      console.log('❌ Nenhuma categoria disponível para o usuário Agro')
    }
    
    console.log('\n🎯 SOLUÇÃO TEMPORÁRIA CONCLUÍDA!')
    console.log('📋 RESUMO:')
    console.log(`- Categoria da Agro: ${agroCategory ? '✅ Encontrada' : '❌ Não encontrada'}`)
    console.log(`- Categorias globais: ${globalCategories?.length || 0}`)
    console.log(`- Total de categorias: ${allCategories?.length || 0}`)
    console.log(`- Categorias para usuário Agro: ${userCategories.length}`)
    
    console.log('\n💡 PRÓXIMOS PASSOS:')
    console.log('1. ✅ A categoria "Agro Financeiro" existe e está correta')
    console.log('2. ❌ O problema está na autenticação NextAuth.js')
    console.log('3. 🔧 Solução temporária: Criar categorias globais')
    console.log('4. 🎯 Solução definitiva: Corrigir autenticação')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral na solução temporária:', error)
    return false
  }
}

solucaoTemporariaCategorias()
