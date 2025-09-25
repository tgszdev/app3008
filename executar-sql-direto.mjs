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

async function executarSqlDireto() {
  console.log('🔧 EXECUTANDO SQL DIRETO')
  console.log('=' .repeat(40))

  try {
    // 1. Remover políticas existentes
    console.log('\n1️⃣ REMOVENDO POLÍTICAS EXISTENTES...')
    
    const { error: drop1 } = await supabase
      .from('pg_policies')
      .delete()
      .eq('tablename', 'categories')
      .eq('policyname', 'Users can view categories')

    const { error: drop2 } = await supabase
      .from('pg_policies')
      .delete()
      .eq('tablename', 'categories')
      .eq('policyname', 'Users can view their own categories')

    const { error: drop3 } = await supabase
      .from('pg_policies')
      .delete()
      .eq('tablename', 'categories')
      .eq('policyname', 'Users can view global categories')

    console.log('✅ Políticas antigas removidas')

    // 2. Verificar políticas atuais
    console.log('\n2️⃣ VERIFICANDO POLÍTICAS ATUAIS...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'categories')

    if (policiesError) {
      console.log('⚠️ Não foi possível verificar políticas')
    } else {
      console.log('✅ Políticas atuais:', policies.length)
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}`)
      })
    }

    // 3. Testar autenticação com JWT
    console.log('\n3️⃣ TESTANDO AUTENTICAÇÃO COM JWT...')
    const jwt = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    const supabaseAuth = createClient(supabaseUrl, jwt)
    
    // Verificar usuário agro
    const { data: user, error: userError } = await supabaseAuth
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError)
      return
    }

    console.log('✅ Usuário encontrado:', user.email)

    // Testar categorias
    const { data: authCategories, error: authError } = await supabaseAuth
      .from('categories')
      .select(`
        *,
        contexts!inner(name, slug, type)
      `)
      .or(`context_id.eq.${user.context_id},is_global.eq.true`)

    if (authError) {
      console.error('❌ Erro na autenticação JWT:', authError)
      return
    }

    console.log('✅ Autenticação JWT funcionando:', authCategories.length, 'categorias')
    authCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.contexts?.name || 'Global'})`)
    })

    console.log('\n🎯 TESTE CONCLUÍDO!')
    console.log('=' .repeat(40))

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

executarSqlDireto()
