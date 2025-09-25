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

async function debugMonitorLogs() {
  console.log('🔍 DEBUG MONITOR - LOGS E DIAGNÓSTICO')
  console.log('=' .repeat(60))
  console.log('📅 Data/Hora:', new Date().toISOString())
  console.log('🌐 Supabase URL:', supabaseUrl)
  console.log('🔑 Service Role Key:', supabaseKey ? '✅ Configurada' : '❌ Não encontrada')
  console.log('🔑 Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Não encontrada')

  try {
    // 1. Verificar conexão com Supabase
    console.log('\n1️⃣ VERIFICANDO CONEXÃO COM SUPABASE...')
    const { data: testConnection, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (connectionError) {
      console.error('❌ Erro de conexão:', connectionError)
      return
    }

    console.log('✅ Conexão com Supabase funcionando')

    // 2. Verificar usuário agro
    console.log('\n2️⃣ VERIFICANDO USUÁRIO AGRO...')
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
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    })

    // 3. Verificar contexto
    console.log('\n3️⃣ VERIFICANDO CONTEXTO...')
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
      is_active: context.is_active,
      created_at: context.created_at,
      updated_at: context.updated_at
    })

    // 4. Verificar todas as categorias
    console.log('\n4️⃣ VERIFICANDO TODAS AS CATEGORIAS...')
    const { data: allCategories, error: allError } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false })

    if (allError) {
      console.error('❌ Erro ao buscar todas as categorias:', allError)
      return
    }

    console.log('✅ Total de categorias no banco:', allCategories.length)
    console.log('📋 Lista de categorias:')
    allCategories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.name} (${cat.slug})`)
      console.log(`     - context_id: ${cat.context_id}`)
      console.log(`     - is_global: ${cat.is_global}`)
      console.log(`     - is_active: ${cat.is_active}`)
      console.log(`     - created_at: ${cat.created_at}`)
      console.log('')
    })

    // 5. Verificar categorias específicas do contexto
    console.log('\n5️⃣ VERIFICANDO CATEGORIAS ESPECÍFICAS...')
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
      console.log(`  - ${cat.name} (${cat.slug}) - Criada em: ${cat.created_at}`)
    })

    // 6. Verificar categorias globais
    console.log('\n6️⃣ VERIFICANDO CATEGORIAS GLOBAIS...')
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
      console.log(`  - ${cat.name} (${cat.slug}) - Criada em: ${cat.created_at}`)
    })

    // 7. Testar autenticação com JWT
    console.log('\n7️⃣ TESTANDO AUTENTICAÇÃO COM JWT...')
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
      console.log('🔍 DETALHES DO ERRO:')
      console.log('  - Código:', userAuthError.code)
      console.log('  - Mensagem:', userAuthError.message)
      console.log('  - Detalhes:', userAuthError.details)
      console.log('  - Hint:', userAuthError.hint)
    } else {
      console.log('✅ Usuário encontrado com JWT:', userAuth.email)
    }

    // 8. Testar categorias com JWT
    console.log('\n8️⃣ TESTANDO CATEGORIAS COM JWT...')
    const { data: authCategories, error: authError } = await supabaseAuth
      .from('categories')
      .select(`
        *,
        contexts!inner(name, slug, type)
      `)
      .or(`context_id.eq.${user.context_id},is_global.eq.true`)

    if (authError) {
      console.error('❌ Erro na autenticação JWT para categorias:', authError)
      console.log('🔍 DETALHES DO ERRO:')
      console.log('  - Código:', authError.code)
      console.log('  - Mensagem:', authError.message)
      console.log('  - Detalhes:', authError.details)
      console.log('  - Hint:', authError.hint)
    } else {
      console.log('✅ Categorias encontradas com JWT:', authCategories.length)
      authCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.contexts?.name || 'Global'})`)
      })
    }

    // 9. Verificar políticas RLS
    console.log('\n9️⃣ VERIFICANDO POLÍTICAS RLS...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'categories')

    if (policiesError) {
      console.log('⚠️ Não foi possível verificar políticas RLS:', policiesError.message)
    } else {
      console.log('✅ Políticas RLS encontradas:', policies.length)
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.qual}`)
      })
    }

    // 10. Verificar políticas RLS para users
    console.log('\n🔟 VERIFICANDO POLÍTICAS RLS USERS...')
    const { data: userPolicies, error: userPoliciesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'users')

    if (userPoliciesError) {
      console.log('⚠️ Não foi possível verificar políticas RLS users:', userPoliciesError.message)
    } else {
      console.log('✅ Políticas RLS users encontradas:', userPolicies.length)
      userPolicies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.qual}`)
      })
    }

    // 11. Verificar sessões
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
        console.log(`  - Sessão: ${session.id}`)
        console.log(`    - Expira: ${session.expires}`)
        console.log(`    - Criada: ${session.createdAt}`)
        console.log(`    - Atualizada: ${session.updatedAt}`)
      })
    }

    // 12. Simular query da API
    console.log('\n1️⃣2️⃣ SIMULANDO QUERY DA API...')
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
    } else {
      console.log('✅ Query da API retornou:', apiCategories.length, 'categorias')
      apiCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.contexts?.name || 'Global'})`)
      })
    }

    console.log('\n🎯 DEBUG MONITOR CONCLUÍDO!')
    console.log('=' .repeat(60))
    console.log('📋 RESUMO FINAL:')
    console.log(`- Usuário encontrado: ${user ? '✅' : '❌'}`)
    console.log(`- Contexto encontrado: ${context ? '✅' : '❌'}`)
    console.log(`- Total de categorias: ${allCategories.length}`)
    console.log(`- Categorias específicas: ${specificCategories.length}`)
    console.log(`- Categorias globais: ${globalCategories.length}`)
    console.log(`- Usuário com JWT: ${userAuth ? '✅' : '❌'}`)
    console.log(`- Categorias com JWT: ${authCategories?.length || 0}`)
    console.log(`- Políticas RLS: ${policies?.length || 0}`)
    console.log(`- Políticas RLS users: ${userPolicies?.length || 0}`)
    console.log(`- Sessões ativas: ${sessions?.length || 0}`)
    console.log(`- Query da API: ${apiCategories?.length || 0} categorias`)

    // 13. Diagnóstico final
    console.log('\n1️⃣3️⃣ DIAGNÓSTICO FINAL...')
    if (userAuth && authCategories && authCategories.length > 0) {
      console.log('✅ TUDO FUNCIONANDO - Categorias devem aparecer no frontend')
    } else if (!userAuth) {
      console.log('❌ PROBLEMA: Usuário não encontrado com JWT - RLS bloqueando')
      console.log('🔧 SOLUÇÃO: Executar SQL no Supabase Dashboard para corrigir RLS')
    } else if (!authCategories || authCategories.length === 0) {
      console.log('❌ PROBLEMA: Categorias não encontradas com JWT - RLS bloqueando')
      console.log('🔧 SOLUÇÃO: Executar SQL no Supabase Dashboard para corrigir RLS')
    } else {
      console.log('❌ PROBLEMA: Desconhecido')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
    console.log('🔍 Stack trace:', error.stack)
  }
}

debugMonitorLogs()
