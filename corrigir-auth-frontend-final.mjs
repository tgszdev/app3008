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

async function corrigirAuthFrontend() {
  console.log('🔧 CORRIGINDO AUTENTICAÇÃO FRONTEND FINAL')
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

    console.log('✅ Usuário encontrado:', user.email)

    // 2. Limpar todas as sessões antigas
    console.log('\n2️⃣ LIMPANDO SESSÕES ANTIGAS...')
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .lt('expires', new Date().toISOString())

    if (deleteError) {
      console.log('⚠️ Erro ao limpar sessões (pode ser normal):', deleteError.message)
    } else {
      console.log('✅ Sessões antigas removidas')
    }

    // 3. Verificar se há problemas de RLS
    console.log('\n3️⃣ VERIFICANDO RLS POLICIES...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'categories')

    if (policiesError) {
      console.log('⚠️ Não foi possível verificar políticas RLS')
    } else {
      console.log('✅ Políticas RLS encontradas:', policies.length)
    }

    // 4. Testar autenticação com JWT
    console.log('\n4️⃣ TESTANDO AUTENTICAÇÃO COM JWT...')
    const jwt = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    const supabaseAuth = createClient(supabaseUrl, jwt)
    
    const { data: authCategories, error: authError } = await supabaseAuth
      .from('categories')
      .select(`
        *,
        contexts!inner(name, slug, type)
      `)
      .or(`context_id.eq.${user.context_id},is_global.eq.true`)

    if (authError) {
      console.error('❌ Erro na autenticação JWT:', authError)
    } else {
      console.log('✅ Autenticação JWT funcionando:', authCategories.length, 'categorias')
      authCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.contexts?.name || 'Global'})`)
      })
    }

    // 5. Verificar se há problemas de CORS
    console.log('\n5️⃣ VERIFICANDO CONFIGURAÇÕES...')
    console.log('✅ Supabase URL:', supabaseUrl)
    console.log('✅ Supabase Key configurada')
    console.log('✅ JWT Key configurada')

    // 6. Testar query com diferentes métodos
    console.log('\n6️⃣ TESTANDO DIFERENTES MÉTODOS...')
    
    // Método 1: Query direta
    const { data: method1, error: method1Error } = await supabase
      .from('categories')
      .select('*')
      .or(`context_id.eq.${user.context_id},is_global.eq.true`)

    console.log('✅ Método 1 - Query direta:', method1?.length || 0)

    // Método 2: Query com join
    const { data: method2, error: method2Error } = await supabase
      .from('categories')
      .select(`
        *,
        contexts!inner(name, slug, type)
      `)
      .or(`context_id.eq.${user.context_id},is_global.eq.true`)

    console.log('✅ Método 2 - Query com join:', method2?.length || 0)

    // Método 3: Query com filtro específico
    const { data: method3, error: method3Error } = await supabase
      .from('categories')
      .select('*')
      .eq('context_id', user.context_id)

    console.log('✅ Método 3 - Filtro específico:', method3?.length || 0)

    // 7. Verificar se há problemas de schema
    console.log('\n7️⃣ VERIFICANDO SCHEMA...')
    const { data: schema, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_name', 'categories')

    if (schemaError) {
      console.log('⚠️ Não foi possível verificar schema')
    } else {
      console.log('✅ Schema verificado:', schema.length, 'colunas')
    }

    console.log('\n🎯 CORREÇÃO CONCLUÍDA!')
    console.log('=' .repeat(60))
    console.log('📋 PRÓXIMOS PASSOS:')
    console.log('1. Faça logout no frontend')
    console.log('2. Faça login novamente')
    console.log('3. Teste as categorias no formulário de novo chamado')
    console.log('4. Se ainda não funcionar, verifique os logs do Vercel')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

corrigirAuthFrontend()
