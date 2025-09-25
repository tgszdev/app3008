import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function criarCategoriaGlobalAgro() {
  console.log('🔧 CRIANDO CATEGORIA GLOBAL PARA AGRO')
  console.log('=' * 50)
  
  try {
    // 1. Buscar usuário admin
    console.log('\n👤 1. BUSCANDO USUÁRIO ADMIN')
    
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('role', 'admin')
      .limit(1)
      .single()
    
    if (adminError || !adminUser) {
      console.error('❌ Erro ao buscar usuário admin:', adminError)
      return false
    }
    
    console.log('✅ Usuário admin encontrado:')
    console.log(`  - Nome: ${adminUser.name}`)
    console.log(`  - Email: ${adminUser.email}`)
    console.log(`  - ID: ${adminUser.id}`)
    
    // 2. Criar categoria global específica para Agro
    console.log('\n➕ 2. CRIANDO CATEGORIA GLOBAL PARA AGRO')
    
    const agroGlobalCategory = {
      name: 'Suporte Agro',
      slug: 'suporte-agro',
      description: 'Categoria global para suporte da área agro',
      icon: 'tractor',
      color: '#10B981',
      is_active: true,
      display_order: 1,
      is_global: true,
      context_id: null,
      parent_category_id: null,
      created_by: adminUser.id
    }
    
    const { data: newCategory, error: createError } = await supabaseAdmin
      .from('categories')
      .insert(agroGlobalCategory)
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .single()
    
    if (createError) {
      console.log('⚠️ Erro ao criar categoria:', createError.message)
      
      // Se já existe, buscar a existente
      const { data: existingCategory, error: existingError } = await supabaseAdmin
        .from('categories')
        .select(`
          *,
          contexts(id, name, type, slug)
        `)
        .eq('slug', 'suporte-agro')
        .single()
      
      if (existingError) {
        console.error('❌ Erro ao buscar categoria existente:', existingError)
        return false
      }
      
      console.log('✅ Categoria já existe:')
      console.log(`  - Nome: ${existingCategory.name}`)
      console.log(`  - ID: ${existingCategory.id}`)
      console.log(`  - Global: ${existingCategory.is_global}`)
      
    } else {
      console.log('✅ Categoria global para Agro criada:')
      console.log(`  - Nome: ${newCategory.name}`)
      console.log(`  - ID: ${newCategory.id}`)
      console.log(`  - Global: ${newCategory.is_global}`)
    }
    
    // 3. Verificar todas as categorias disponíveis agora
    console.log('\n📋 3. VERIFICANDO TODAS AS CATEGORIAS DISPONÍVEIS')
    
    const { data: allCategories, error: allError } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (allError) {
      console.error('❌ Erro ao buscar categorias:', allError)
    } else {
      console.log(`✅ Total de categorias ativas: ${allCategories?.length || 0}`)
      
      const globalCategories = allCategories?.filter(cat => cat.is_global) || []
      const specificCategories = allCategories?.filter(cat => !cat.is_global) || []
      
      console.log(`🌐 Categorias globais: ${globalCategories.length}`)
      globalCategories.forEach(cat => {
        console.log(`  - ${cat.name} (Global)`)
      })
      
      console.log(`🏢 Categorias específicas: ${specificCategories.length}`)
      specificCategories.forEach(cat => {
        const context = cat.contexts?.name || 'Sem contexto'
        console.log(`  - ${cat.name} (${context})`)
      })
    }
    
    // 4. Simular o que o usuário agro deveria ver
    console.log('\n👤 4. SIMULANDO VISÃO DO USUÁRIO AGRO')
    
    const userAgro = {
      id: 'agro-user-id',
      email: 'agro@agro.com.br',
      userType: 'context',
      contextId: '6486088e-72ae-461b-8b03-32ca84918882'
    }
    
    // Aplicar filtro da API
    let query = supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('is_active', true)
    
    if (userAgro.userType === 'context' && userAgro.contextId) {
      query = query.or(`is_global.eq.true,context_id.eq.${userAgro.contextId}`)
    }
    
    query = query.order('display_order', { ascending: true })
    
    const { data: userCategories, error: userError } = await query
    
    if (userError) {
      console.error('❌ Erro na query do usuário:', userError)
    } else {
      console.log(`✅ Categorias que o usuário Agro deveria ver: ${userCategories?.length || 0}`)
      
      if (userCategories && userCategories.length > 0) {
        console.log('\n📋 CATEGORIAS DISPONÍVEIS PARA O USUÁRIO AGRO:')
        userCategories.forEach((cat, index) => {
          const type = cat.is_global ? '🌐 Global' : '🏢 Específica'
          const context = cat.contexts?.name || 'Sem contexto'
          console.log(`  ${index + 1}. ${cat.name} (${type}) - ${context}`)
        })
      }
    }
    
    console.log('\n🎯 CATEGORIA GLOBAL PARA AGRO CRIADA!')
    console.log('✅ Agora o usuário Agro deveria ver:')
    console.log('  1. 🌐 Suporte Geral (Global)')
    console.log('  2. 🌐 Suporte Agro (Global)')
    console.log('  3. 🏢 Agro Financeiro (Luft Agro)')
    
    console.log('\n💡 PRÓXIMOS PASSOS:')
    console.log('1. ✅ Categoria global criada')
    console.log('2. 🔧 Testar login do usuário agro')
    console.log('3. 🎯 Verificar se as categorias aparecem no frontend')
    console.log('4. 🔍 Se ainda não funcionar, verificar autenticação')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return false
  }
}

criarCategoriaGlobalAgro()
