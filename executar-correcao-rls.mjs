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

async function executarCorrecaoRLS() {
  console.log('🔧 EXECUTANDO CORREÇÃO RLS CATEGORIAS')
  console.log('=' .repeat(50))

  try {
    // 1. Ler o arquivo SQL
    console.log('\n1️⃣ LENDO ARQUIVO SQL...')
    const sqlContent = fs.readFileSync('corrigir-rls-categorias.sql', 'utf8')
    console.log('✅ Arquivo SQL lido com sucesso')

    // 2. Executar SQL
    console.log('\n2️⃣ EXECUTANDO SQL...')
    const { data, error } = await supabase.rpc('exec', { sql: sqlContent })

    if (error) {
      console.error('❌ Erro ao executar SQL:', error)
      return
    }

    console.log('✅ SQL executado com sucesso')

    // 3. Verificar políticas criadas
    console.log('\n3️⃣ VERIFICANDO POLÍTICAS CRIADAS...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'categories')

    if (policiesError) {
      console.error('❌ Erro ao verificar políticas:', policiesError)
      return
    }

    console.log('✅ Políticas encontradas:', policies.length)
    policies.forEach(policy => {
      console.log(`  - ${policy.policyname}: ${policy.qual}`)
    })

    // 4. Testar autenticação com JWT
    console.log('\n4️⃣ TESTANDO AUTENTICAÇÃO COM JWT...')
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

    console.log('\n🎯 CORREÇÃO RLS CONCLUÍDA!')
    console.log('=' .repeat(50))

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

executarCorrecaoRLS()
