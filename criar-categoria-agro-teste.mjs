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

async function criarCategoriaAgroTeste() {
  console.log('🔧 CRIANDO CATEGORIA ESPECÍFICA PARA AGRO')
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

    // 2. Verificar contexto Luft Agro
    console.log('\n2️⃣ VERIFICANDO CONTEXTO LUFT AGRO...')
    const { data: context, error: contextError } = await supabase
      .from('contexts')
      .select('*')
      .eq('id', user.context_id)
      .single()

    if (contextError) {
      console.error('❌ Erro ao buscar contexto:', contextError)
      return
    }

    console.log('✅ Contexto encontrado:', {
      id: context.id,
      name: context.name,
      slug: context.slug,
      type: context.type,
      is_active: context.is_active
    })

    // 3. Verificar categorias existentes
    console.log('\n3️⃣ VERIFICANDO CATEGORIAS EXISTENTES...')
    const { data: existingCategories, error: existingError } = await supabase
      .from('categories')
      .select('*')
      .eq('context_id', user.context_id)
      .eq('is_global', false)

    if (existingError) {
      console.error('❌ Erro ao buscar categorias existentes:', existingError)
      return
    }

    console.log('✅ Categorias existentes:', existingCategories.length)
    existingCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug})`)
    })

    // 4. Criar nova categoria específica
    console.log('\n4️⃣ CRIANDO NOVA CATEGORIA ESPECÍFICA...')
    const novaCategoria = {
      name: 'Teste Agro Específica',
      slug: 'teste-agro-especifica',
      description: 'Categoria específica para teste da organização Agro',
      is_global: false,
      context_id: user.context_id,
      is_active: true,
      display_order: 100,
      color: '#10b981',
      icon: 'test-tube',
      created_by: user.id
    }

    const { data: newCategory, error: createError } = await supabase
      .from('categories')
      .insert(novaCategoria)
      .select()
      .single()

    if (createError) {
      console.error('❌ Erro ao criar categoria:', createError)
      return
    }

    console.log('✅ Nova categoria criada:', {
      id: newCategory.id,
      name: newCategory.name,
      slug: newCategory.slug,
      context_id: newCategory.context_id,
      is_global: newCategory.is_global,
      is_active: newCategory.is_active
    })

    // 5. Verificar se a categoria foi criada
    console.log('\n5️⃣ VERIFICANDO SE A CATEGORIA FOI CRIADA...')
    const { data: verifyCategory, error: verifyError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', newCategory.id)
      .single()

    if (verifyError) {
      console.error('❌ Erro ao verificar categoria:', verifyError)
      return
    }

    console.log('✅ Categoria verificada:', {
      id: verifyCategory.id,
      name: verifyCategory.name,
      slug: verifyCategory.slug,
      context_id: verifyCategory.context_id,
      is_global: verifyCategory.is_global,
      is_active: verifyCategory.is_active,
      created_at: verifyCategory.created_at
    })

    // 6. Testar JWT com a nova categoria
    console.log('\n6️⃣ TESTANDO JWT COM A NOVA CATEGORIA...')
    const jwt = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseAuth = createClient(supabaseUrl, jwt)
    
    // Buscar usuário com JWT
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

    // Buscar categorias com JWT
    const { data: authCategories, error: authError } = await supabaseAuth
      .from('categories')
      .select('*')
      .or(`context_id.eq.${userAuth.context_id},is_global.eq.true`)

    if (authError) {
      console.error('❌ Erro ao buscar categorias com JWT:', authError)
      return
    }

    console.log('✅ Categorias encontradas com JWT:', authCategories.length)
    authCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug}) - Global: ${cat.is_global}`)
    })

    // 7. Verificar se a nova categoria está na lista
    console.log('\n7️⃣ VERIFICANDO SE A NOVA CATEGORIA ESTÁ NA LISTA...')
    const novaCategoriaEncontrada = authCategories.find(cat => cat.id === newCategory.id)
    
    if (novaCategoriaEncontrada) {
      console.log('✅ Nova categoria encontrada na lista JWT:', novaCategoriaEncontrada.name)
    } else {
      console.log('❌ Nova categoria NÃO encontrada na lista JWT')
    }

    // 8. Testar API da aplicação
    console.log('\n8️⃣ TESTANDO API DA APLICAÇÃO...')
    try {
      const response = await fetch('https://www.ithostbr.tech/api/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `next-auth.session-token=test-token`
        }
      })

      if (response.ok) {
        const apiCategories = await response.json()
        console.log('✅ API da aplicação funcionando:', apiCategories.length, 'categorias')
        
        const novaCategoriaAPI = apiCategories.find(cat => cat.id === newCategory.id)
        if (novaCategoriaAPI) {
          console.log('✅ Nova categoria encontrada na API:', novaCategoriaAPI.name)
        } else {
          console.log('❌ Nova categoria NÃO encontrada na API')
        }
      } else {
        console.log('❌ API da aplicação retornou erro:', response.status, response.statusText)
      }
    } catch (apiError) {
      console.log('⚠️ Erro ao testar API da aplicação:', apiError.message)
    }

    console.log('\n🎯 TESTE CONCLUÍDO!')
    console.log('=' .repeat(60))
    console.log('📋 RESUMO:')
    console.log(`- Usuário encontrado: ${user ? '✅' : '❌'}`)
    console.log(`- Contexto encontrado: ${context ? '✅' : '❌'}`)
    console.log(`- Categorias existentes: ${existingCategories.length}`)
    console.log(`- Nova categoria criada: ${newCategory ? '✅' : '❌'}`)
    console.log(`- Categoria verificada: ${verifyCategory ? '✅' : '❌'}`)
    console.log(`- Usuário com JWT: ${userAuth ? '✅' : '❌'}`)
    console.log(`- Categorias com JWT: ${authCategories.length}`)
    console.log(`- Nova categoria na lista JWT: ${novaCategoriaEncontrada ? '✅' : '❌'}`)

    // 9. Instruções para verificar logs
    console.log('\n9️⃣ COMO VERIFICAR LOGS:')
    console.log('📋 LOGS DO VERCEL:')
    console.log('  1. Acesse: https://vercel.com/dashboard')
    console.log('  2. Selecione o projeto: app3008')
    console.log('  3. Vá para a aba "Functions"')
    console.log('  4. Clique em "View Function Logs"')
    console.log('  5. Filtre por data/hora atual')
    console.log('  6. Procure por erros 401/403/500')
    console.log('')
    console.log('📋 LOGS DO SUPABASE:')
    console.log('  1. Acesse: https://supabase.com/dashboard')
    console.log('  2. Selecione o projeto: eyfvvximmeqmwdfqzqov')
    console.log('  3. Vá para a aba "Logs"')
    console.log('  4. Filtre por "API" ou "Database"')
    console.log('  5. Procure por erros 401/403/500')
    console.log('')
    console.log('📋 LOGS DO NAVEGADOR:')
    console.log('  1. Abra o DevTools (F12)')
    console.log('  2. Vá para a aba "Console"')
    console.log('  3. Vá para a aba "Network"')
    console.log('  4. Procure por requisições com erro 401/403/500')
    console.log('  5. Clique em uma requisição para ver detalhes')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

criarCategoriaAgroTeste()
