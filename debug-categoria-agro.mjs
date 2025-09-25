import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugCategoriaAgro() {
  console.log('🔍 DEBUG - CATEGORIA VINCULADA À ORGANIZAÇÃO AGRO')
  console.log('=' * 70)
  
  try {
    // 1. Verificar se a organização Agro existe
    console.log('\n🏢 1. VERIFICANDO ORGANIZAÇÃO AGRO')
    const { data: agroOrg, error: agroError } = await supabaseAdmin
      .from('contexts')
      .select('*')
      .ilike('name', '%agro%')
      .eq('is_active', true)
    
    if (agroError) {
      console.error('❌ Erro ao buscar organização Agro:', agroError)
      return false
    }
    
    if (!agroOrg || agroOrg.length === 0) {
      console.log('❌ Organização Agro não encontrada')
      return false
    }
    
    console.log('✅ Organização Agro encontrada:')
    agroOrg.forEach(org => {
      console.log(`  - ${org.name} (${org.type}) - ID: ${org.id}`)
    })
    
    // 2. Verificar categorias vinculadas à organização Agro
    console.log('\n📋 2. VERIFICANDO CATEGORIAS VINCULADAS À AGRO')
    const { data: agroCategories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .in('context_id', agroOrg.map(org => org.id))
      .eq('is_active', true)
    
    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias da Agro:', categoriesError)
      return false
    }
    
    console.log(`✅ Categorias vinculadas à Agro: ${agroCategories?.length || 0}`)
    if (agroCategories && agroCategories.length > 0) {
      agroCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.contexts?.name || 'Sem contexto'})`)
        console.log(`    - ID: ${cat.id}`)
        console.log(`    - Global: ${cat.is_global}`)
        console.log(`    - Context ID: ${cat.context_id}`)
        console.log(`    - Ativa: ${cat.is_active}`)
      })
    } else {
      console.log('❌ Nenhuma categoria vinculada à Agro encontrada')
    }
    
    // 3. Verificar todas as categorias (globais + específicas)
    console.log('\n🌐 3. VERIFICANDO TODAS AS CATEGORIAS')
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
      return false
    }
    
    console.log(`✅ Total de categorias ativas: ${allCategories?.length || 0}`)
    
    const globalCategories = allCategories?.filter(cat => cat.is_global) || []
    const specificCategories = allCategories?.filter(cat => !cat.is_global) || []
    
    console.log(`📊 Categorias globais: ${globalCategories.length}`)
    globalCategories.forEach(cat => {
      console.log(`  - ${cat.name} (Global)`)
    })
    
    console.log(`📊 Categorias específicas: ${specificCategories.length}`)
    specificCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.contexts?.name || 'Sem contexto'})`)
    })
    
    // 4. Verificar se há usuário vinculado à Agro
    console.log('\n👤 4. VERIFICANDO USUÁRIOS VINCULADOS À AGRO')
    const { data: agroUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .in('context_id', agroOrg.map(org => org.id))
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários da Agro:', usersError)
    } else {
      console.log(`✅ Usuários vinculados à Agro: ${agroUsers?.length || 0}`)
      if (agroUsers && agroUsers.length > 0) {
        agroUsers.forEach(user => {
          console.log(`  - ${user.name} (${user.email}) - Context: ${user.context_id}`)
        })
      }
    }
    
    // 5. Verificar associações user_contexts
    console.log('\n🔗 5. VERIFICANDO ASSOCIAÇÕES USER_CONTEXTS')
    const { data: userContexts, error: userContextsError } = await supabaseAdmin
      .from('user_contexts')
      .select(`
        *,
        contexts(id, name, type),
        users(id, name, email)
      `)
      .in('context_id', agroOrg.map(org => org.id))
    
    if (userContextsError) {
      console.error('❌ Erro ao buscar associações user_contexts:', userContextsError)
    } else {
      console.log(`✅ Associações user_contexts: ${userContexts?.length || 0}`)
      if (userContexts && userContexts.length > 0) {
        userContexts.forEach(uc => {
          console.log(`  - ${uc.users?.name} -> ${uc.contexts?.name}`)
        })
      }
    }
    
    // 6. Testar API de categorias
    console.log('\n🌐 6. TESTANDO API DE CATEGORIAS')
    try {
      const response = await fetch('https://www.ithostbr.tech/api/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ API de categorias funcionando')
        console.log(`📊 Categorias retornadas pela API: ${data?.length || 0}`)
        
        if (data && data.length > 0) {
          data.forEach(cat => {
            const type = cat.is_global ? 'Global' : 'Específica'
            const context = cat.contexts?.name || 'Sem contexto'
            console.log(`  - ${cat.name} (${type}) - ${context}`)
          })
        }
      } else {
        console.log(`❌ API retornou status: ${response.status}`)
      }
    } catch (error) {
      console.log('❌ Erro ao testar API:', error.message)
    }
    
    console.log('\n🎯 DIAGNÓSTICO CONCLUÍDO!')
    console.log('📋 RESUMO:')
    console.log(`- Organização Agro: ${agroOrg?.length || 0} encontrada(s)`)
    console.log(`- Categorias da Agro: ${agroCategories?.length || 0}`)
    console.log(`- Total de categorias: ${allCategories?.length || 0}`)
    console.log(`- Categorias globais: ${globalCategories.length}`)
    console.log(`- Categorias específicas: ${specificCategories.length}`)
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral no debug:', error)
    return false
  }
}

debugCategoriaAgro()
