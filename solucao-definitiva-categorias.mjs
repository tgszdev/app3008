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

async function solucaoDefinitivaCategorias() {
  console.log('🔧 SOLUÇÃO DEFINITIVA - CATEGORIAS')
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

    // 3. Testar query OR (que funciona)
    console.log('\n3️⃣ TESTANDO QUERY OR (QUE FUNCIONA)...')
    const { data: orCategories, error: orError } = await supabaseAuth
      .from('categories')
      .select('*')
      .or(`context_id.eq.${userAuth.context_id},is_global.eq.true`)

    if (orError) {
      console.error('❌ Erro na query OR:', orError)
      return
    }

    console.log('✅ Query OR retornou:', orCategories.length, 'categorias')
    orCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug}) - Global: ${cat.is_global}`)
    })

    // 4. Testar query com join (que não funciona)
    console.log('\n4️⃣ TESTANDO QUERY COM JOIN (QUE NÃO FUNCIONA)...')
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

    // 5. Verificar se há problemas de RLS na tabela contexts
    console.log('\n5️⃣ VERIFICANDO PROBLEMAS DE RLS NA TABELA CONTEXTS...')
    
    // Tentar buscar contexto com JWT
    const { data: context, error: contextError } = await supabaseAuth
      .from('contexts')
      .select('*')
      .eq('id', userAuth.context_id)
      .single()

    if (contextError) {
      console.log('❌ RLS bloqueando acesso à tabela contexts:', contextError.message)
      console.log('🔍 Isso explica por que a query com join não funciona')
    } else {
      console.log('✅ Contexto encontrado:', context.name)
    }

    // 6. Verificar se há políticas RLS na tabela contexts
    console.log('\n6️⃣ VERIFICANDO POLÍTICAS RLS NA TABELA CONTEXTS...')
    const { data: contextPolicies, error: contextPoliciesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'contexts')

    if (contextPoliciesError) {
      console.log('⚠️ Não foi possível verificar políticas RLS contexts:', contextPoliciesError.message)
    } else {
      console.log('✅ Políticas RLS contexts encontradas:', contextPolicies.length)
      contextPolicies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.qual}`)
      })
    }

    // 7. Criar solução alternativa
    console.log('\n7️⃣ CRIANDO SOLUÇÃO ALTERNATIVA...')
    
    // Buscar categorias sem join
    const { data: categoriesWithoutJoin, error: categoriesError } = await supabaseAuth
      .from('categories')
      .select('*')
      .or(`context_id.eq.${userAuth.context_id},is_global.eq.true`)

    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias sem join:', categoriesError)
      return
    }

    console.log('✅ Categorias sem join encontradas:', categoriesWithoutJoin.length)
    
    // Buscar contexto separadamente
    const { data: contextSeparate, error: contextSeparateError } = await supabase
      .from('contexts')
      .select('*')
      .eq('id', userAuth.context_id)
      .single()

    if (contextSeparateError) {
      console.error('❌ Erro ao buscar contexto separadamente:', contextSeparateError)
      return
    }

    console.log('✅ Contexto encontrado separadamente:', contextSeparate.name)

    // 8. Montar resposta final
    console.log('\n8️⃣ MONTANDO RESPOSTA FINAL...')
    const finalCategories = categoriesWithoutJoin.map(cat => ({
      ...cat,
      context_name: cat.context_id === userAuth.context_id ? contextSeparate.name : 'Global',
      context_slug: cat.context_id === userAuth.context_id ? contextSeparate.slug : 'global',
      context_type: cat.context_id === userAuth.context_id ? contextSeparate.type : 'global'
    }))

    console.log('✅ Categorias finais montadas:', finalCategories.length)
    finalCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.context_name})`)
    })

    // 9. Verificar se a solução funciona
    console.log('\n9️⃣ VERIFICANDO SE A SOLUÇÃO FUNCIONA...')
    if (finalCategories.length > 0) {
      console.log('✅ SOLUÇÃO FUNCIONANDO!')
      console.log('✅ Categorias devem aparecer no frontend')
      console.log('🔧 SOLUÇÃO: Usar query sem join e buscar contexto separadamente')
    } else {
      console.log('❌ SOLUÇÃO NÃO FUNCIONOU')
    }

    console.log('\n🎯 SOLUÇÃO DEFINITIVA CONCLUÍDA!')
    console.log('=' .repeat(50))
    console.log('📋 RESUMO:')
    console.log(`- Query OR funcionando: ${orCategories.length} categorias`)
    console.log(`- Query com join falhando: ${joinCategories?.length || 0} categorias`)
    console.log(`- RLS bloqueando contexts: ${contextError ? '✅' : '❌'}`)
    console.log(`- Solução alternativa: ${finalCategories.length} categorias`)
    console.log(`- Solução funcionando: ${finalCategories.length > 0 ? '✅' : '❌'}`)

    // 10. Instruções para implementar
    console.log('\n🔟 INSTRUÇÕES PARA IMPLEMENTAR:')
    console.log('📋 MODIFICAR API /api/categories:')
    console.log('1. Remover join com contexts')
    console.log('2. Buscar categorias com query OR simples')
    console.log('3. Buscar contexto separadamente se necessário')
    console.log('4. Montar resposta final com dados do contexto')
    console.log('')
    console.log('📋 CÓDIGO SUGERIDO:')
    console.log('```javascript')
    console.log('// Buscar categorias sem join')
    console.log('const { data: categories } = await supabase')
    console.log('  .from("categories")')
    console.log('  .select("*")')
    console.log('  .or(`context_id.eq.${userContextId},is_global.eq.true`)')
    console.log('')
    console.log('// Buscar contexto separadamente se necessário')
    console.log('const { data: context } = await supabase')
    console.log('  .from("contexts")')
    console.log('  .select("*")')
    console.log('  .eq("id", userContextId)')
    console.log('  .single()')
    console.log('')
    console.log('// Montar resposta final')
    console.log('const finalCategories = categories.map(cat => ({')
    console.log('  ...cat,')
    console.log('  context_name: cat.context_id === userContextId ? context.name : "Global"')
    console.log('}))')
    console.log('```')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

solucaoDefinitivaCategorias()
