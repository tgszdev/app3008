import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testarCategoriasSemAuth() {
  console.log('🔓 TESTANDO CATEGORIAS SEM AUTENTICAÇÃO')
  console.log('=' * 50)
  
  try {
    // 1. Simular exatamente o que a API deveria retornar para o usuário Agro
    console.log('\n👤 1. SIMULANDO USUÁRIO AGRO')
    
    const userAgro = {
      id: 'agro-user-id',
      email: 'agro@agro.com.br',
      userType: 'context',
      contextId: '6486088e-72ae-461b-8b03-32ca84918882'
    }
    
    console.log('✅ Usuário simulado:')
    console.log(`  - Email: ${userAgro.email}`)
    console.log(`  - Tipo: ${userAgro.userType}`)
    console.log(`  - Context ID: ${userAgro.contextId}`)
    
    // 2. Aplicar a mesma lógica da API
    console.log('\n📋 2. APLICANDO LÓGICA DA API')
    
    let query = supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug),
        parent_category:parent_category_id(id, name, slug)
      `)
      .eq('is_active', true)
    
    // Aplicar filtro baseado no tipo de usuário
    if (userAgro.userType === 'context' && userAgro.contextId) {
      // Usuários context veem categorias globais + do seu contexto
      query = query.or(`is_global.eq.true,context_id.eq.${userAgro.contextId}`)
    } else if (userAgro.userType === 'matrix') {
      // Usuários matrix veem todas as categorias
      // Não adicionar filtro
    } else {
      // Fallback: apenas categorias globais
      query = query.eq('is_global', true)
    }
    
    query = query.order('display_order', { ascending: true })
    
    const { data: categories, error } = await query
    
    if (error) {
      console.error('❌ Erro na query:', error)
      return false
    }
    
    console.log(`✅ Categorias retornadas: ${categories?.length || 0}`)
    
    if (categories && categories.length > 0) {
      console.log('\n📋 CATEGORIAS DISPONÍVEIS PARA O USUÁRIO AGRO:')
      categories.forEach((cat, index) => {
        const type = cat.is_global ? '🌐 Global' : '🏢 Específica'
        const context = cat.contexts?.name || 'Sem contexto'
        console.log(`  ${index + 1}. ${cat.name} (${type}) - ${context}`)
      })
      
      // Verificar se a categoria da Agro está presente
      const agroCategory = categories.find(cat => 
        cat.contexts?.name?.toLowerCase().includes('agro') || 
        cat.name?.toLowerCase().includes('agro')
      )
      
      if (agroCategory) {
        console.log('\n✅ CATEGORIA DA AGRO ENCONTRADA:')
        console.log(`  - Nome: ${agroCategory.name}`)
        console.log(`  - Contexto: ${agroCategory.contexts?.name}`)
        console.log(`  - Global: ${agroCategory.is_global}`)
        console.log(`  - Ativa: ${agroCategory.is_active}`)
      } else {
        console.log('\n❌ CATEGORIA DA AGRO NÃO ENCONTRADA')
      }
      
      // Verificar se há categorias globais
      const globalCategories = categories.filter(cat => cat.is_global)
      console.log(`\n🌐 Categorias globais: ${globalCategories.length}`)
      globalCategories.forEach(cat => {
        console.log(`  - ${cat.name} (Global)`)
      })
      
    } else {
      console.log('❌ Nenhuma categoria encontrada')
    }
    
    // 3. Testar com diferentes parâmetros
    console.log('\n🎯 3. TESTANDO DIFERENTES PARÂMETROS')
    
    // Teste 1: Apenas categorias globais
    const { data: globalOnly, error: globalError } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('is_global', true)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (!globalError) {
      console.log(`✅ Apenas globais: ${globalOnly?.length || 0}`)
    }
    
    // Teste 2: Apenas categorias do contexto Agro
    const { data: agroOnly, error: agroError } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('context_id', userAgro.contextId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (!agroError) {
      console.log(`✅ Apenas Agro: ${agroOnly?.length || 0}`)
    }
    
    console.log('\n🎯 TESTE CONCLUÍDO!')
    console.log('📋 RESUMO:')
    console.log(`- Categorias para usuário Agro: ${categories?.length || 0}`)
    console.log(`- Categorias globais: ${globalOnly?.length || 0}`)
    console.log(`- Categorias da Agro: ${agroOnly?.length || 0}`)
    
    if (categories && categories.length > 0) {
      console.log('\n✅ A LÓGICA ESTÁ FUNCIONANDO!')
      console.log('🎯 O problema está na autenticação, não na lógica de categorias')
      console.log('💡 Solução: Corrigir autenticação NextAuth.js')
    } else {
      console.log('\n❌ PROBLEMA NA LÓGICA DE CATEGORIAS')
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
    return false
  }
}

testarCategoriasSemAuth()
