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

async function debugSessaoUsuario() {
  console.log('🔍 DIAGNÓSTICO SESSÃO USUÁRIO')
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
      context_id: user.context_id,
      role: user.role
    })

    // 2. Simular a lógica da API
    console.log('\n2️⃣ SIMULANDO LÓGICA DA API...')
    
    // Simular session.user
    const sessionUser = {
      id: user.id,
      userType: user.user_type,
      contextId: user.context_id,
      role: user.role
    }

    console.log('✅ Session user simulado:', sessionUser)

    // 3. Aplicar lógica de filtragem
    console.log('\n3️⃣ APLICANDO LÓGICA DE FILTRAGEM...')
    
    let query = supabase
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug),
        parent_category:parent_category_id(id, name, slug)
      `)

    if (sessionUser.userType === 'matrix') {
      console.log('✅ Usuário matrix - sem filtro')
      // Não adicionar filtro
    } else if (sessionUser.userType === 'context' && sessionUser.contextId) {
      console.log('✅ Usuário context - aplicando filtro OR')
      query = query.or(`is_global.eq.true,context_id.eq.${sessionUser.contextId}`)
    } else {
      console.log('✅ Fallback - apenas categorias globais')
      query = query.eq('is_global', true)
    }

    // 4. Executar query
    console.log('\n4️⃣ EXECUTANDO QUERY...')
    const { data: categories, error } = await query.order('display_order', { ascending: true })

    if (error) {
      console.error('❌ Erro na query:', error)
      return
    }

    console.log('✅ Categorias retornadas:', categories.length)
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.contexts?.name || 'Global'})`)
    })

    // 5. Verificar se há problemas de RLS
    console.log('\n5️⃣ VERIFICANDO RLS POLICIES...')
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

    // 6. Testar query direta
    console.log('\n6️⃣ TESTANDO QUERY DIRETA...')
    const { data: directCategories, error: directError } = await supabase
      .from('categories')
      .select('*')
      .or(`is_global.eq.true,context_id.eq.${user.context_id}`)

    if (directError) {
      console.error('❌ Erro na query direta:', directError)
      return
    }

    console.log('✅ Query direta retornou:', directCategories.length, 'categorias')
    directCategories.forEach(cat => {
      console.log(`  - ${cat.name} (context_id: ${cat.context_id}, is_global: ${cat.is_global})`)
    })

    console.log('\n🎯 DIAGNÓSTICO CONCLUÍDO!')
    console.log('=' .repeat(50))

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugSessaoUsuario()
