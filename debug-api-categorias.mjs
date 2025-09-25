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

async function debugApiCategorias() {
  console.log('🔍 DIAGNÓSTICO API CATEGORIAS')
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

    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      user_type: user.user_type,
      context_id: user.context_id
    })

    // 2. Verificar todas as categorias no banco
    console.log('\n2️⃣ VERIFICANDO TODAS AS CATEGORIAS...')
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

    // 3. Verificar categorias específicas do contexto
    console.log('\n3️⃣ VERIFICANDO CATEGORIAS ESPECÍFICAS...')
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

    // 4. Verificar categorias globais
    console.log('\n4️⃣ VERIFICANDO CATEGORIAS GLOBAIS...')
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

    // 5. Simular a query da API /api/categories
    console.log('\n5️⃣ SIMULANDO QUERY DA API...')
    const { data: apiCategories, error: apiError } = await supabase
      .from('categories')
      .select(`
        *,
        contexts!inner(name, slug, type),
        parent_category:categories!parent_category_id(name, slug)
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

    // 6. Verificar se há problemas de RLS
    console.log('\n6️⃣ VERIFICANDO RLS POLICIES...')
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

    // 7. Testar query com diferentes filtros
    console.log('\n7️⃣ TESTANDO DIFERENTES FILTROS...')
    
    // Teste 1: Apenas categorias específicas
    const { data: test1, error: test1Error } = await supabase
      .from('categories')
      .select('*')
      .eq('context_id', user.context_id)

    console.log('✅ Teste 1 - Apenas específicas:', test1?.length || 0)

    // Teste 2: Apenas categorias globais
    const { data: test2, error: test2Error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_global', true)

    console.log('✅ Teste 2 - Apenas globais:', test2?.length || 0)

    // Teste 3: Query com OR
    const { data: test3, error: test3Error } = await supabase
      .from('categories')
      .select('*')
      .or(`context_id.eq.${user.context_id},is_global.eq.true`)

    console.log('✅ Teste 3 - OR query:', test3?.length || 0)

    console.log('\n🎯 DIAGNÓSTICO CONCLUÍDO!')
    console.log('=' .repeat(50))

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugApiCategorias()
