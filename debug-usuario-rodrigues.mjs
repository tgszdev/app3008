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

async function debugUsuarioRodrigues() {
  console.log('🔍 DEBUG USUÁRIO RODRIGUES')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar usuário rodrigues
    console.log('\n1️⃣ VERIFICANDO USUÁRIO RODRIGUES...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'rodrigues2205@icloud.com')
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

    // 2. Verificar contextos associados
    console.log('\n2️⃣ VERIFICANDO CONTEXTOS ASSOCIADOS...')
    const { data: userContexts, error: contextsError } = await supabase
      .from('user_contexts')
      .select(`
        *,
        contexts(id, name, slug, type, is_active)
      `)
      .eq('user_id', user.id)

    if (contextsError) {
      console.error('❌ Erro ao buscar contextos:', contextsError)
      return
    }

    console.log('✅ Contextos associados:', userContexts.length)
    userContexts.forEach(uc => {
      console.log(`  - ${uc.contexts.name} (${uc.contexts.slug}) - Tipo: ${uc.contexts.type} - Ativo: ${uc.contexts.is_active}`)
    })

    // 3. Verificar categorias específicas de cada contexto
    console.log('\n3️⃣ VERIFICANDO CATEGORIAS POR CONTEXTO...')
    for (const uc of userContexts) {
      console.log(`\n📋 Contexto: ${uc.contexts.name}`)
      
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('context_id', uc.context_id)
        .eq('is_global', false)
        .eq('is_active', true)

      if (categoriesError) {
        console.error('❌ Erro ao buscar categorias:', categoriesError)
        continue
      }

      console.log(`  ✅ Categorias específicas: ${categories.length}`)
      categories.forEach(cat => {
        console.log(`    - ${cat.name} (${cat.slug})`)
      })
    }

    // 4. Verificar categorias globais
    console.log('\n4️⃣ VERIFICANDO CATEGORIAS GLOBAIS...')
    const { data: globalCategories, error: globalError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_global', true)
      .eq('is_active', true)

    if (globalError) {
      console.error('❌ Erro ao buscar categorias globais:', globalError)
      return
    }

    console.log('✅ Categorias globais:', globalCategories.length)
    globalCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug})`)
    })

    // 5. Testar JWT com categorias
    console.log('\n5️⃣ TESTANDO JWT COM CATEGORIAS...')
    const jwt = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseAuth = createClient(supabaseUrl, jwt)
    
    // Buscar usuário com JWT
    const { data: userAuth, error: userAuthError } = await supabaseAuth
      .from('users')
      .select('*')
      .eq('email', 'rodrigues2205@icloud.com')
      .single()

    if (userAuthError) {
      console.log('❌ RLS bloqueando acesso ao usuário:', userAuthError.message)
    } else {
      console.log('✅ Usuário acessível com JWT:', userAuth.email)
    }

    // Buscar categorias com JWT (todas as categorias do usuário)
    const contextIds = userContexts.map(uc => uc.context_id)
    const { data: authCategories, error: authError } = await supabaseAuth
      .from('categories')
      .select('*')
      .or(`is_global.eq.true,context_id.in.(${contextIds.join(',')})`)
      .eq('is_active', true)

    if (authError) {
      console.log('❌ RLS bloqueando acesso às categorias:', authError.message)
    } else {
      console.log('✅ Categorias acessíveis com JWT:', authCategories.length)
      authCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug}) - Global: ${cat.is_global}`)
      })
    }

    console.log('\n🎯 DEBUG USUÁRIO RODRIGUES CONCLUÍDO!')
    console.log('=' .repeat(60))
    console.log('📋 RESUMO:')
    console.log(`- Usuário encontrado: ${user ? '✅' : '❌'}`)
    console.log(`- Contextos associados: ${userContexts.length}`)
    console.log(`- Categorias globais: ${globalCategories.length}`)
    console.log(`- Usuário com JWT: ${userAuth ? '✅' : '❌'}`)
    console.log(`- Categorias com JWT: ${authCategories?.length || 0}`)

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugUsuarioRodrigues()
