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

async function diagnosticoCompletoCategorias() {
  console.log('🔍 DIAGNÓSTICO COMPLETO - CATEGORIAS')
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

    // 2. Verificar contexto
    console.log('\n2️⃣ VERIFICANDO CONTEXTO...')
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

    // 3. Verificar categorias específicas
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

    console.log('✅ Categorias específicas:', specificCategories.length)
    specificCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug}) - Ativa: ${cat.is_active}`)
    })

    // 4. Verificar categorias globais
    console.log('\n4️⃣ VERIFICANDO CATEGORIAS GLOBAIS...')
    const { data: globalCategories, error: globalError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_global', true)
      .eq('is_active', true)

    if (globalError) {
      console.error('❌ Erro ao buscar categorias globais:', globalError)
      return
    }

    console.log('✅ Categorias globais:', globalCategories.length)
    globalCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug}) - Ativa: ${cat.is_active}`)
    })

    // 5. Testar JWT com categorias
    console.log('\n5️⃣ TESTANDO JWT COM CATEGORIAS...')
    const jwt = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseAuth = createClient(supabaseUrl, jwt)
    
    // Buscar usuário com JWT
    const { data: userAuth, error: userAuthError } = await supabaseAuth
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')
      .single()

    if (userAuthError) {
      console.log('❌ RLS bloqueando acesso ao usuário:', userAuthError.message)
    } else {
      console.log('✅ Usuário acessível com JWT:', userAuth.email)
    }

    // Buscar categorias com JWT (específicas + globais)
    const { data: authCategories, error: authError } = await supabaseAuth
      .from('categories')
      .select('*')
      .or(`context_id.eq.${user.context_id},is_global.eq.true`)
      .eq('is_active', true)

    if (authError) {
      console.log('❌ RLS bloqueando acesso às categorias:', authError.message)
    } else {
      console.log('✅ Categorias acessíveis com JWT:', authCategories.length)
      authCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug}) - Global: ${cat.is_global}`)
      })
    }

    // 6. Testar API da aplicação
    console.log('\n6️⃣ TESTANDO API DA APLICAÇÃO...')
    try {
      const response = await fetch('https://www.ithostbr.tech/api/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('✅ Resposta da API:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Dados recebidos:', data.length, 'categorias')
        data.forEach(cat => {
          console.log(`  - ${cat.name} (${cat.slug}) - Global: ${cat.is_global}`)
        })
      } else {
        const errorText = await response.text()
        console.log('❌ Erro da API:', errorText)
      }
    } catch (error) {
      console.log('❌ Erro na requisição:', error.message)
    }

    // 7. Verificar NextAuth session
    console.log('\n7️⃣ VERIFICANDO NEXTAUTH SESSION...')
    try {
      const response = await fetch('https://www.ithostbr.tech/api/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('✅ Resposta NextAuth:', response.status, response.statusText)
      
      if (response.ok) {
        const sessionData = await response.json()
        console.log('✅ Dados da sessão:', sessionData)
      } else {
        const errorText = await response.text()
        console.log('❌ Erro NextAuth:', errorText)
      }
    } catch (error) {
      console.log('❌ Erro NextAuth:', error.message)
    }

    // 8. Verificar se há problemas de RLS
    console.log('\n8️⃣ VERIFICANDO PROBLEMAS DE RLS...')
    
    // Testar RLS para usuários
    const { data: usersRLS, error: usersRLSError } = await supabaseAuth
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')

    if (usersRLSError) {
      console.log('❌ RLS bloqueando acesso aos usuários:', usersRLSError.message)
    } else {
      console.log('✅ Usuários acessíveis com RLS:', usersRLS.length)
    }

    // Testar RLS para categorias
    const { data: categoriesRLS, error: categoriesRLSError } = await supabaseAuth
      .from('categories')
      .select('*')
      .eq('context_id', user.context_id)

    if (categoriesRLSError) {
      console.log('❌ RLS bloqueando acesso às categorias:', categoriesRLSError.message)
    } else {
      console.log('✅ Categorias acessíveis com RLS:', categoriesRLS.length)
    }

    // 9. Verificar se há problemas de CORS
    console.log('\n9️⃣ VERIFICANDO PROBLEMAS DE CORS...')
    try {
      const response = await fetch('https://www.ithostbr.tech/api/categories', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://www.ithostbr.tech',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      })

      console.log('✅ Resposta CORS:', response.status, response.statusText)
      console.log('✅ Headers CORS:', response.headers.get('Access-Control-Allow-Origin'))
    } catch (error) {
      console.log('❌ Erro CORS:', error.message)
    }

    console.log('\n🎯 DIAGNÓSTICO COMPLETO CONCLUÍDO!')
    console.log('=' .repeat(60))
    console.log('📋 RESUMO:')
    console.log(`- Usuário encontrado: ${user ? '✅' : '❌'}`)
    console.log(`- Contexto encontrado: ${context ? '✅' : '❌'}`)
    console.log(`- Categorias específicas: ${specificCategories.length}`)
    console.log(`- Categorias globais: ${globalCategories.length}`)
    console.log(`- Usuário com JWT: ${userAuth ? '✅' : '❌'}`)
    console.log(`- Categorias com JWT: ${authCategories?.length || 0}`)
    console.log(`- Usuários com RLS: ${usersRLS?.length || 0}`)
    console.log(`- Categorias com RLS: ${categoriesRLS?.length || 0}`)

    // 10. Diagnóstico final
    console.log('\n🔟 DIAGNÓSTICO FINAL...')
    if (userAuth && authCategories && authCategories.length > 0) {
      console.log('✅ BACKEND FUNCIONANDO - Problema está no NextAuth')
      console.log('🔧 SOLUÇÃO: Corrigir autenticação NextAuth')
    } else if (!userAuth) {
      console.log('❌ RLS BLOQUEANDO USUÁRIO - Necessário corrigir políticas RLS')
    } else if (!authCategories || authCategories.length === 0) {
      console.log('❌ RLS BLOQUEANDO CATEGORIAS - Necessário corrigir políticas RLS')
    } else {
      console.log('❌ PROBLEMA DESCONHECIDO')
    }

    // 11. Instruções para verificar logs
    console.log('\n1️⃣1️⃣ COMO VERIFICAR LOGS:')
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

diagnosticoCompletoCategorias()
