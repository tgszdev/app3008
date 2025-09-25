import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugCompletoCategorias() {
  console.log('🔍 DEBUG COMPLETO - CATEGORIAS FRONTEND')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar usuário agro com service role
    console.log('\n1️⃣ VERIFICANDO USUÁRIO AGRO (SERVICE ROLE)...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError)
      return
    }

    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      user_type: user.user_type,
      context_id: user.context_id,
      role: user.role
    })

    // 2. Verificar contexto Luft Agro
    console.log('\n2️⃣ VERIFICANDO CONTEXTO LUFT AGRO...')
    const { data: context, error: contextError } = await supabase
      .from('contexts')
      .select('*')
      .eq('id', user.context_id)
      .single()

    if (contextError) {
      console.error('❌ Erro ao buscar contexto:', contextError)
      return
    }

    console.log('✅ Contexto encontrado:', {
      id: context.id,
      name: context.name,
      slug: context.slug,
      type: context.type,
      is_active: context.is_active
    })

    // 3. Verificar todas as categorias
    console.log('\n3️⃣ VERIFICANDO TODAS AS CATEGORIAS...')
    const { data: allCategories, error: allError } = await supabase
      .from('categories')
      .select('*')

    if (allError) {
      console.error('❌ Erro ao buscar todas as categorias:', allError)
      return
    }

    console.log('✅ Total de categorias no banco:', allCategories.length)
    allCategories.forEach(cat => {
      console.log(`  - ${cat.name} (context_id: ${cat.context_id}, is_global: ${cat.is_global})`)
    })

    // 4. Verificar categorias específicas do contexto
    console.log('\n4️⃣ VERIFICANDO CATEGORIAS ESPECÍFICAS...')
    const { data: specificCategories, error: specificError } = await supabase
      .from('categories')
      .select('*')
      .eq('context_id', user.context_id)
      .eq('is_global', false)

    if (specificError) {
      console.error('❌ Erro ao buscar categorias específicas:', specificError)
      return
    }

    console.log('✅ Categorias específicas encontradas:', specificCategories.length)
    specificCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug})`)
    })

    // 5. Verificar categorias globais
    console.log('\n5️⃣ VERIFICANDO CATEGORIAS GLOBAIS...')
    const { data: globalCategories, error: globalError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_global', true)

    if (globalError) {
      console.error('❌ Erro ao buscar categorias globais:', globalError)
      return
    }

    console.log('✅ Categorias globais encontradas:', globalCategories.length)
    globalCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug})`)
    })

    // 6. Testar autenticação com JWT
    console.log('\n6️⃣ TESTANDO AUTENTICAÇÃO COM JWT...')
    const jwt = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    const supabaseAuth = createClient(supabaseUrl, jwt)
    
    // Verificar usuário agro com JWT
    const { data: userAuth, error: userAuthError } = await supabaseAuth
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')
      .single()

    if (userAuthError) {
      console.error('❌ Erro ao buscar usuário com JWT:', userAuthError)
      console.log('🔍 PROBLEMA: RLS na tabela users está bloqueando acesso')
    } else {
      console.log('✅ Usuário encontrado com JWT:', userAuth.email)
    }

    // 7. Testar categorias com JWT
    console.log('\n7️⃣ TESTANDO CATEGORIAS COM JWT...')
    const { data: authCategories, error: authError } = await supabaseAuth
      .from('categories')
      .select(`
        *,
        contexts!inner(name, slug, type)
      `)
      .or(`context_id.eq.${user.context_id},is_global.eq.true`)

    if (authError) {
      console.error('❌ Erro na autenticação JWT para categorias:', authError)
    } else {
      console.log('✅ Categorias encontradas com JWT:', authCategories.length)
      authCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.contexts?.name || 'Global'})`)
      })
    }

    // 8. Verificar políticas RLS
    console.log('\n8️⃣ VERIFICANDO POLÍTICAS RLS...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'categories')

    if (policiesError) {
      console.log('⚠️ Não foi possível verificar políticas RLS')
    } else {
      console.log('✅ Políticas RLS encontradas:', policies.length)
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.qual}`)
      })
    }

    // 9. Verificar políticas RLS para users
    console.log('\n9️⃣ VERIFICANDO POLÍTICAS RLS USERS...')
    const { data: userPolicies, error: userPoliciesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'users')

    if (userPoliciesError) {
      console.log('⚠️ Não foi possível verificar políticas RLS users')
    } else {
      console.log('✅ Políticas RLS users encontradas:', userPolicies.length)
      userPolicies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.qual}`)
      })
    }

    // 10. Simular query da API
    console.log('\n🔟 SIMULANDO QUERY DA API...')
    const { data: apiCategories, error: apiError } = await supabase
      .from('categories')
      .select(`
        *,
        contexts!inner(name, slug, type),
        parent_category:parent_category_id(name, slug)
      `)
      .or(`context_id.eq.${user.context_id},is_global.eq.true`)

    if (apiError) {
      console.error('❌ Erro na query da API:', apiError)
      return
    }

    console.log('✅ Query da API retornou:', apiCategories.length, 'categorias')
    apiCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.contexts?.name || 'Global'})`)
    })

    // 11. Verificar se há problemas de sessão
    console.log('\n1️⃣1️⃣ VERIFICANDO SESSÕES...')
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('userId', user.id)
      .gte('expires', new Date().toISOString())

    if (sessionsError) {
      console.log('⚠️ Não foi possível verificar sessões:', sessionsError.message)
    } else {
      console.log('✅ Sessões ativas encontradas:', sessions.length)
      sessions.forEach(session => {
        console.log(`  - Sessão: ${session.id} (expira: ${session.expires})`)
      })
    }

    console.log('\n🎯 DEBUG COMPLETO CONCLUÍDO!')
    console.log('=' .repeat(60))
    console.log('📋 RESUMO:')
    console.log(`- Usuário encontrado: ${user ? '✅' : '❌'}`)
    console.log(`- Contexto encontrado: ${context ? '✅' : '❌'}`)
    console.log(`- Categorias específicas: ${specificCategories.length}`)
    console.log(`- Categorias globais: ${globalCategories.length}`)
    console.log(`- Usuário com JWT: ${userAuth ? '✅' : '❌'}`)
    console.log(`- Categorias com JWT: ${authCategories?.length || 0}`)
    console.log(`- Políticas RLS: ${policies?.length || 0}`)
    console.log(`- Políticas RLS users: ${userPolicies?.length || 0}`)

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugCompletoCategorias()
