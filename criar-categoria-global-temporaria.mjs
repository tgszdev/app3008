import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function criarCategoriaGlobalTemporaria() {
  console.log('🔧 CRIANDO CATEGORIA GLOBAL TEMPORÁRIA')
  console.log('=' * 50)
  
  try {
    // 1. Buscar um usuário admin para usar como created_by
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
    
    // 2. Criar categoria global temporária
    console.log('\n➕ 2. CRIANDO CATEGORIA GLOBAL TEMPORÁRIA')
    
    const tempCategory = {
      name: 'Suporte Geral',
      slug: 'suporte-geral',
      description: 'Categoria global para suporte geral',
      icon: 'headphones',
      color: '#10B981',
      is_active: true,
      display_order: 0,
      is_global: true,
      context_id: null,
      parent_category_id: null,
      created_by: adminUser.id
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
      
      // Se já existe, buscar a existente
      const { data: existingCategory, error: existingError } = await supabaseAdmin
        .from('categories')
        .select(`
          *,
          contexts(id, name, type, slug)
        `)
        .eq('slug', 'suporte-geral')
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
      console.log('✅ Categoria global temporária criada:')
      console.log(`  - Nome: ${newCategory.name}`)
      console.log(`  - ID: ${newCategory.id}`)
      console.log(`  - Global: ${newCategory.is_global}`)
    }
    
    // 3. Verificar categorias disponíveis agora
    console.log('\n📋 3. VERIFICANDO CATEGORIAS DISPONÍVEIS')
    
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
    
    console.log('\n🎯 CATEGORIA GLOBAL TEMPORÁRIA CRIADA!')
    console.log('✅ Agora o usuário Agro deveria ver:')
    console.log('  1. 🌐 Suporte Geral (Global)')
    console.log('  2. 🏢 Agro Financeiro (Luft Agro)')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return false
  }
}

criarCategoriaGlobalTemporaria()
