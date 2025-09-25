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

async function debugCategoriasJWT() {
  console.log('🔍 DEBUG CATEGORIAS COM JWT')
  console.log('=' .repeat(50))

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

    console.log('✅ Usuário encontrado:', user.email)
    console.log('✅ Context ID:', user.context_id)

    // 2. Testar JWT
    console.log('\n2️⃣ TESTANDO JWT...')
    const jwt = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseAuth = createClient(supabaseUrl, jwt)
    
    // Verificar usuário com JWT
    const { data: userAuth, error: userAuthError } = await supabaseAuth
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')
      .single()

    if (userAuthError) {
      console.error('❌ Erro ao buscar usuário com JWT:', userAuthError)
      return
    }

    console.log('✅ Usuário encontrado com JWT:', userAuth.email)
    console.log('✅ Context ID do usuário:', userAuth.context_id)

    // 3. Testar categorias globais com JWT
    console.log('\n3️⃣ TESTANDO CATEGORIAS GLOBAIS COM JWT...')
    const { data: globalCategories, error: globalError } = await supabaseAuth
      .from('categories')
      .select('*')
      .eq('is_global', true)

    if (globalError) {
      console.error('❌ Erro ao buscar categorias globais:', globalError)
    } else {
      console.log('✅ Categorias globais encontradas:', globalCategories.length)
      globalCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug})`)
      })
    }

    // 4. Testar categorias específicas com JWT
    console.log('\n4️⃣ TESTANDO CATEGORIAS ESPECÍFICAS COM JWT...')
    const { data: specificCategories, error: specificError } = await supabaseAuth
      .from('categories')
      .select('*')
      .eq('context_id', userAuth.context_id)
      .eq('is_global', false)

    if (specificError) {
      console.error('❌ Erro ao buscar categorias específicas:', specificError)
    } else {
      console.log('✅ Categorias específicas encontradas:', specificCategories.length)
      specificCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug})`)
      })
    }

    // 5. Testar query OR com JWT
    console.log('\n5️⃣ TESTANDO QUERY OR COM JWT...')
    const { data: orCategories, error: orError } = await supabaseAuth
      .from('categories')
      .select('*')
      .or(`context_id.eq.${userAuth.context_id},is_global.eq.true`)

    if (orError) {
      console.error('❌ Erro na query OR:', orError)
    } else {
      console.log('✅ Query OR retornou:', orCategories.length, 'categorias')
      orCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug}) - Global: ${cat.is_global}`)
      })
    }

    // 6. Testar query com join com JWT
    console.log('\n6️⃣ TESTANDO QUERY COM JOIN COM JWT...')
    const { data: joinCategories, error: joinError } = await supabaseAuth
      .from('categories')
      .select(`
        *,
        contexts!inner(name, slug, type)
      `)
      .or(`context_id.eq.${userAuth.context_id},is_global.eq.true`)

    if (joinError) {
      console.error('❌ Erro na query com join:', joinError)
    } else {
      console.log('✅ Query com join retornou:', joinCategories.length, 'categorias')
      joinCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.contexts?.name || 'Global'})`)
      })
    }

    // 7. Testar query simples com JWT
    console.log('\n7️⃣ TESTANDO QUERY SIMPLES COM JWT...')
    const { data: simpleCategories, error: simpleError } = await supabaseAuth
      .from('categories')
      .select('*')
      .limit(5)

    if (simpleError) {
      console.error('❌ Erro na query simples:', simpleError)
    } else {
      console.log('✅ Query simples retornou:', simpleCategories.length, 'categorias')
      simpleCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug}) - Context: ${cat.context_id}`)
      })
    }

    // 8. Verificar se há problemas de RLS específicos
    console.log('\n8️⃣ VERIFICANDO PROBLEMAS DE RLS ESPECÍFICOS...')
    
    // Tentar buscar categorias sem filtro
    const { data: allCategories, error: allError } = await supabaseAuth
      .from('categories')
      .select('*')

    if (allError) {
      console.log('❌ RLS bloqueando acesso total às categorias:', allError.message)
    } else {
      console.log('✅ Acesso total às categorias funcionando:', allCategories.length, 'categorias')
    }

    // 9. Verificar se há problemas de contexto
    console.log('\n9️⃣ VERIFICANDO PROBLEMAS DE CONTEXTO...')
    
    // Verificar se o contexto existe
    const { data: context, error: contextError } = await supabaseAuth
      .from('contexts')
      .select('*')
      .eq('id', userAuth.context_id)
      .single()

    if (contextError) {
      console.log('❌ Erro ao buscar contexto:', contextError)
    } else {
      console.log('✅ Contexto encontrado:', context.name)
    }

    // 10. Testar query específica do contexto
    console.log('\n🔟 TESTANDO QUERY ESPECÍFICA DO CONTEXTO...')
    const { data: contextCategories, error: contextCatError } = await supabaseAuth
      .from('categories')
      .select('*')
      .eq('context_id', userAuth.context_id)

    if (contextCatError) {
      console.log('❌ Erro ao buscar categorias do contexto:', contextCatError)
    } else {
      console.log('✅ Categorias do contexto encontradas:', contextCategories.length)
      contextCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug})`)
      })
    }

    console.log('\n🎯 DEBUG CATEGORIAS CONCLUÍDO!')
    console.log('=' .repeat(50))
    console.log('📋 RESUMO:')
    console.log(`- Usuário com JWT: ${userAuth ? '✅' : '❌'}`)
    console.log(`- Categorias globais: ${globalCategories?.length || 0}`)
    console.log(`- Categorias específicas: ${specificCategories?.length || 0}`)
    console.log(`- Query OR: ${orCategories?.length || 0}`)
    console.log(`- Query com join: ${joinCategories?.length || 0}`)
    console.log(`- Query simples: ${simpleCategories?.length || 0}`)
    console.log(`- Acesso total: ${allCategories?.length || 0}`)
    console.log(`- Contexto: ${context ? '✅' : '❌'}`)
    console.log(`- Categorias do contexto: ${contextCategories?.length || 0}`)

    // 11. Diagnóstico final
    console.log('\n1️⃣1️⃣ DIAGNÓSTICO FINAL...')
    if (orCategories && orCategories.length > 0) {
      console.log('✅ QUERY OR FUNCIONANDO - Categorias devem aparecer no frontend')
    } else if (simpleCategories && simpleCategories.length > 0) {
      console.log('⚠️ QUERY SIMPLES FUNCIONANDO - Problema na query OR')
    } else if (allCategories && allCategories.length > 0) {
      console.log('⚠️ ACESSO TOTAL FUNCIONANDO - Problema nas queries específicas')
    } else {
      console.log('❌ RLS BLOQUEANDO TUDO - Necessário corrigir políticas RLS')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugCategoriasJWT()
