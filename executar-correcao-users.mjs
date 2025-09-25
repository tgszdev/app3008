import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function executarCorrecaoUsers() {
  console.log('🔧 EXECUTANDO CORREÇÃO RLS USERS')
  console.log('=' .repeat(50))

  try {
    // 1. Verificar usuário agro com service role
    console.log('\n1️⃣ VERIFICANDO USUÁRIO AGRO COM SERVICE ROLE...')
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

    // 2. Testar autenticação com JWT
    console.log('\n2️⃣ TESTANDO AUTENTICAÇÃO COM JWT...')
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
      console.log('🔍 Isso indica problema de RLS na tabela users')
    } else {
      console.log('✅ Usuário encontrado com JWT:', userAuth.email)
    }

    // 3. Verificar políticas RLS atuais
    console.log('\n3️⃣ VERIFICANDO POLÍTICAS RLS ATUAIS...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'users')

    if (policiesError) {
      console.log('⚠️ Não foi possível verificar políticas RLS')
    } else {
      console.log('✅ Políticas RLS encontradas:', policies.length)
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.qual}`)
      })
    }

    // 4. Testar categorias com JWT
    console.log('\n4️⃣ TESTANDO CATEGORIAS COM JWT...')
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

    console.log('\n🎯 DIAGNÓSTICO CONCLUÍDO!')
    console.log('=' .repeat(50))
    console.log('📋 PRÓXIMOS PASSOS:')
    console.log('1. Executar SQL para corrigir RLS na tabela users')
    console.log('2. Testar novamente a autenticação JWT')
    console.log('3. Verificar se as categorias aparecem no frontend')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

executarCorrecaoUsers()
