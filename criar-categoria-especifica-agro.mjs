import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function criarCategoriaEspecificaAgro() {
  console.log('🏢 CRIANDO CATEGORIA ESPECÍFICA PARA AGRO')
  console.log('=' * 50)
  
  try {
    // 1. Verificar contexto Luft Agro
    console.log('\n🏢 1. VERIFICANDO CONTEXTO LUFT AGRO')
    
    const { data: agroContext, error: contextError } = await supabaseAdmin
      .from('contexts')
      .select('*')
      .ilike('name', '%agro%')
      .eq('is_active', true)
      .single()
    
    if (contextError) {
      console.error('❌ Erro ao buscar contexto Agro:', contextError)
      return false
    }
    
    if (!agroContext) {
      console.log('❌ Contexto Agro não encontrado')
      return false
    }
    
    console.log('✅ Contexto Agro encontrado:')
    console.log(`  - Nome: ${agroContext.name}`)
    console.log(`  - ID: ${agroContext.id}`)
    console.log(`  - Tipo: ${agroContext.type}`)
    console.log(`  - Ativo: ${agroContext.is_active}`)
    
    // 2. Buscar usuário admin
    console.log('\n👤 2. BUSCANDO USUÁRIO ADMIN')
    
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
    
    // 3. Criar categoria específica para Agro
    console.log('\n➕ 3. CRIANDO CATEGORIA ESPECÍFICA PARA AGRO')
    
    const agroSpecificCategory = {
      name: 'Suporte Técnico Agro',
      slug: 'suporte-tecnico-agro',
      description: 'Categoria específica para suporte técnico da área agro',
      icon: 'tractor',
      color: '#10B981',
      is_active: true,
      display_order: 1,
      is_global: false,
      context_id: agroContext.id,
      parent_category_id: null,
      created_by: adminUser.id
    }
    
    const { data: newCategory, error: createError } = await supabaseAdmin
      .from('categories')
      .insert(agroSpecificCategory)
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
        .eq('slug', 'suporte-tecnico-agro')
        .single()
      
      if (existingError) {
        console.error('❌ Erro ao buscar categoria existente:', existingError)
        return false
      }
      
      console.log('✅ Categoria já existe:')
      console.log(`  - Nome: ${existingCategory.name}`)
      console.log(`  - ID: ${existingCategory.id}`)
      console.log(`  - Contexto: ${existingCategory.contexts?.name}`)
      console.log(`  - Global: ${existingCategory.is_global}`)
      
    } else {
      console.log('✅ Categoria específica para Agro criada:')
      console.log(`  - Nome: ${newCategory.name}`)
      console.log(`  - ID: ${newCategory.id}`)
      console.log(`  - Contexto: ${newCategory.contexts?.name}`)
      console.log(`  - Global: ${newCategory.is_global}`)
    }
    
    // 4. Verificar todas as categorias do contexto Agro
    console.log('\n📋 4. VERIFICANDO CATEGORIAS DO CONTEXTO AGRO')
    
    const { data: agroCategories, error: agroCategoriesError } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('context_id', agroContext.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (agroCategoriesError) {
      console.error('❌ Erro ao buscar categorias do Agro:', agroCategoriesError)
    } else {
      console.log(`✅ Categorias do contexto Agro: ${agroCategories?.length || 0}`)
      
      if (agroCategories && agroCategories.length > 0) {
        console.log('\n📋 CATEGORIAS DO CONTEXTO AGRO:')
        agroCategories.forEach((cat, index) => {
          console.log(`  ${index + 1}. ${cat.name} (${cat.contexts?.name})`)
        })
      }
    }
    
    // 5. Simular o que o usuário agro deveria ver
    console.log('\n👤 5. SIMULANDO VISÃO DO USUÁRIO AGRO')
    
    const userAgro = {
      id: 'agro-user-id',
      email: 'agro@agro.com.br',
      userType: 'context',
      contextId: agroContext.id
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
      // Usuários context veem categorias globais + do seu contexto
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
    
    console.log('\n🎯 CATEGORIA ESPECÍFICA PARA AGRO CRIADA!')
    console.log('✅ Agora o usuário Agro deveria ver:')
    console.log('  1. 🏢 Agro Financeiro (Luft Agro)')
    console.log('  2. 🏢 Suporte Técnico Agro (Luft Agro)')
    
    console.log('\n💡 PRÓXIMOS PASSOS:')
    console.log('1. ✅ Categoria específica criada')
    console.log('2. 🔧 Testar login do usuário agro')
    console.log('3. 🎯 Verificar se as categorias aparecem no frontend')
    console.log('4. 🔍 Se ainda não funcionar, verificar autenticação')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return false
  }
}

criarCategoriaEspecificaAgro()
