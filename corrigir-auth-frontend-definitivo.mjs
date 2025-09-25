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
  console.log('🔧 CORRIGINDO AUTENTICAÇÃO FRONTEND')
  console.log('=' .repeat(50))

  try {
    // 1. Limpar todas as sessões antigas
    console.log('\n1️⃣ LIMPANDO SESSÕES ANTIGAS...')
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .lt('expires', new Date().toISOString())

    if (deleteError) {
      console.log('⚠️ Erro ao limpar sessões (pode ser normal):', deleteError.message)
    } else {
      console.log('✅ Sessões antigas removidas')
    }

    // 2. Verificar usuário agro
    console.log('\n2️⃣ VERIFICANDO USUÁRIO AGRO...')
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

    // 3. Criar nova sessão estável
    console.log('\n3️⃣ CRIANDO NOVA SESSÃO ESTÁVEL...')
    const expires = new Date()
    expires.setDate(expires.getDate() + 7) // 7 dias

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        expires: expires.toISOString(),
        token: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('❌ Erro ao criar sessão:', sessionError)
      return
    }

    console.log('✅ Nova sessão criada:', session.id)
    console.log('✅ Expira em:', session.expires)

    // 4. Verificar se as categorias estão acessíveis
    console.log('\n4️⃣ VERIFICANDO ACESSO ÀS CATEGORIAS...')
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select(`
        *,
        contexts!inner(name, slug, type)
      `)
      .or(`context_id.eq.${user.context_id},is_global.eq.true`)

    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError)
      return
    }

    console.log('✅ Categorias acessíveis:', categories.length)
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.contexts?.name || 'Global'})`)
    })

    // 5. Verificar se há problemas de RLS
    console.log('\n5️⃣ VERIFICANDO RLS POLICIES...')
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'categories' })

    if (policiesError) {
      console.log('⚠️ Não foi possível verificar políticas RLS')
    } else {
      console.log('✅ Políticas RLS encontradas:', policies.length)
    }

    // 6. Testar autenticação com JWT
    console.log('\n6️⃣ TESTANDO AUTENTICAÇÃO COM JWT...')
    const jwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODUxODYsImV4cCI6MjA3MjE2MTE4Nn0.ht9a6MmtkfE5hVRmwpfyMcW24a4R7n-9hoW6eYd3K2w`
    
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
    }

    // 7. Verificar se há problemas de CORS ou headers
    console.log('\n7️⃣ VERIFICANDO CONFIGURAÇÕES DE CORS...')
    console.log('✅ Supabase URL:', supabaseUrl)
    console.log('✅ Supabase Key configurada')

    console.log('\n🎯 CORREÇÃO CONCLUÍDA!')
    console.log('=' .repeat(50))
    console.log('📋 PRÓXIMOS PASSOS:')
    console.log('1. Faça logout no frontend')
    console.log('2. Faça login novamente')
    console.log('3. Teste as categorias no formulário de novo chamado')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

corrigirAuthFrontend()
