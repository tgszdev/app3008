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

async function debugAgroContextos() {
  console.log('🔍 DEBUG USUÁRIO AGRO - CONTEXTOS')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar usuário agro
    console.log('\n1️⃣ VERIFICANDO USUÁRIO AGRO...')
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

    // 5. Testar JWT com categorias (simulando API)
    console.log('\n5️⃣ TESTANDO JWT COM CATEGORIAS...')
    const jwt = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseAuth = createClient(supabaseUrl, jwt)
    
    // Buscar usuário com JWT
    const { data: userAuth, error: userAuthError } = await supabaseAuth
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')
      .single()

    if (userAuthError) {
      console.log('❌ RLS bloqueando acesso ao usuário:', userAuthError.message)
    } else {
      console.log('✅ Usuário acessível com JWT:', userAuth.email)
      console.log('✅ Tipo de usuário:', userAuth.user_type)
    }

    // Buscar categorias com JWT baseado no tipo de usuário
    let authCategories = []
    if (userAuth?.user_type === 'matrix') {
      // Usuário matrix: buscar categorias de todos os contextos
      const contextIds = userContexts.map(uc => uc.context_id)
      const { data: matrixCategories, error: matrixError } = await supabaseAuth
        .from('categories')
        .select('*')
        .or(`is_global.eq.true,context_id.in.(${contextIds.join(',')})`)
        .eq('is_active', true)

      if (matrixError) {
        console.log('❌ RLS bloqueando acesso às categorias matrix:', matrixError.message)
      } else {
        authCategories = matrixCategories || []
        console.log('✅ Categorias matrix com JWT:', authCategories.length)
      }
    } else if (userAuth?.user_type === 'context' && userAuth.context_id) {
      // Usuário context: buscar categorias globais + do seu contexto
      const { data: contextCategories, error: contextError } = await supabaseAuth
        .from('categories')
        .select('*')
        .or(`is_global.eq.true,context_id.eq.${userAuth.context_id}`)
        .eq('is_active', true)

      if (contextError) {
        console.log('❌ RLS bloqueando acesso às categorias context:', contextError.message)
      } else {
        authCategories = contextCategories || []
        console.log('✅ Categorias context com JWT:', authCategories.length)
      }
    }

    authCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug}) - Global: ${cat.is_global}`)
    })

    console.log('\n🎯 DEBUG USUÁRIO AGRO CONCLUÍDO!')
    console.log('=' .repeat(60))
    console.log('📋 RESUMO:')
    console.log(`- Usuário encontrado: ${user ? '✅' : '❌'}`)
    console.log(`- Tipo de usuário: ${user.user_type}`)
    console.log(`- Contextos associados: ${userContexts.length}`)
    console.log(`- Categorias globais: ${globalCategories.length}`)
    console.log(`- Usuário com JWT: ${userAuth ? '✅' : '❌'}`)
    console.log(`- Categorias com JWT: ${authCategories.length}`)

    // 6. Verificar se o usuário foi alterado para matrix
    if (user.user_type === 'context') {
      console.log('\n⚠️ PROBLEMA IDENTIFICADO:')
      console.log('O usuário agro é do tipo "context" mas tem múltiplos contextos associados!')
      console.log('Para ver todas as categorias, ele deveria ser do tipo "matrix"')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugAgroContextos()
