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

async function debugFrontendAuthCompleto() {
  console.log('🔍 DEBUG FRONTEND AUTH COMPLETO')
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

    // 2. Verificar categorias no banco
    console.log('\n2️⃣ VERIFICANDO CATEGORIAS NO BANCO...')
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('context_id', user.context_id)
      .eq('is_global', false)

    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError)
      return
    }

    console.log('✅ Categorias no banco:', categories.length)
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug}) - Ativa: ${cat.is_active}`)
    })

    // 3. Verificar sessões ativas
    console.log('\n3️⃣ VERIFICANDO SESSÕES ATIVAS...')
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('userId', user.id)
      .gte('expires', new Date().toISOString())

    if (sessionsError) {
      console.log('⚠️ Erro ao verificar sessões:', sessionsError.message)
    } else {
      console.log('✅ Sessões ativas encontradas:', sessions.length)
      sessions.forEach(session => {
        console.log(`  - Sessão: ${session.id} (expira: ${session.expires})`)
      })
    }

    // 4. Testar JWT com categorias
    console.log('\n4️⃣ TESTANDO JWT COM CATEGORIAS...')
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

    // Buscar categorias com JWT
    const { data: authCategories, error: authError } = await supabaseAuth
      .from('categories')
      .select('*')
      .or(`context_id.eq.${user.context_id},is_global.eq.true`)

    if (authError) {
      console.log('❌ RLS bloqueando acesso às categorias:', authError.message)
    } else {
      console.log('✅ Categorias acessíveis com JWT:', authCategories.length)
      authCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug}) - Global: ${cat.is_global}`)
      })
    }

    // 5. Testar API da aplicação com diferentes métodos
    console.log('\n5️⃣ TESTANDO API DA APLICAÇÃO...')
    
    // Método 1: Teste básico
    console.log('\n📋 MÉTODO 1: Teste básico...')
    try {
      const response1 = await fetch('https://www.ithostbr.tech/api/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('✅ Resposta da API:', response1.status, response1.statusText)
      
      if (response1.ok) {
        const data1 = await response1.json()
        console.log('✅ Dados recebidos:', data1.length, 'categorias')
        data1.forEach(cat => {
          console.log(`  - ${cat.name} (${cat.slug})`)
        })
      } else {
        const errorText = await response1.text()
        console.log('❌ Erro da API:', errorText)
      }
    } catch (error) {
      console.log('❌ Erro na requisição:', error.message)
    }

    // Método 2: Teste com cookie de sessão
    console.log('\n📋 MÉTODO 2: Teste com cookie de sessão...')
    try {
      const response2 = await fetch('https://www.ithostbr.tech/api/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=test-session-token'
        }
      })

      console.log('✅ Resposta da API:', response2.status, response2.statusText)
      
      if (response2.ok) {
        const data2 = await response2.json()
        console.log('✅ Dados recebidos:', data2.length, 'categorias')
        data2.forEach(cat => {
          console.log(`  - ${cat.name} (${cat.slug})`)
        })
      } else {
        const errorText = await response2.text()
        console.log('❌ Erro da API:', errorText)
      }
    } catch (error) {
      console.log('❌ Erro na requisição:', error.message)
    }

    // Método 3: Teste com headers de autenticação
    console.log('\n📋 MÉTODO 3: Teste com headers de autenticação...')
    try {
      const response3 = await fetch('https://www.ithostbr.tech/api/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
          'X-User-ID': user.id
        }
      })

      console.log('✅ Resposta da API:', response3.status, response3.statusText)
      
      if (response3.ok) {
        const data3 = await response3.json()
        console.log('✅ Dados recebidos:', data3.length, 'categorias')
        data3.forEach(cat => {
          console.log(`  - ${cat.name} (${cat.slug})`)
        })
      } else {
        const errorText = await response3.text()
        console.log('❌ Erro da API:', errorText)
      }
    } catch (error) {
      console.log('❌ Erro na requisição:', error.message)
    }

    // 6. Verificar NextAuth session
    console.log('\n6️⃣ VERIFICANDO NEXTAUTH SESSION...')
    try {
      const response4 = await fetch('https://www.ithostbr.tech/api/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('✅ Resposta NextAuth:', response4.status, response4.statusText)
      
      if (response4.ok) {
        const sessionData = await response4.json()
        console.log('✅ Dados da sessão:', sessionData)
      } else {
        const errorText = await response4.text()
        console.log('❌ Erro NextAuth:', errorText)
      }
    } catch (error) {
      console.log('❌ Erro NextAuth:', error.message)
    }

    // 7. Verificar se há problemas de CORS
    console.log('\n7️⃣ VERIFICANDO PROBLEMAS DE CORS...')
    try {
      const response5 = await fetch('https://www.ithostbr.tech/api/categories', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://www.ithostbr.tech',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      })

      console.log('✅ Resposta CORS:', response5.status, response5.statusText)
      console.log('✅ Headers CORS:', response5.headers.get('Access-Control-Allow-Origin'))
    } catch (error) {
      console.log('❌ Erro CORS:', error.message)
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

    console.log('\n🎯 DEBUG FRONTEND AUTH CONCLUÍDO!')
    console.log('=' .repeat(60))
    console.log('📋 RESUMO:')
    console.log(`- Usuário encontrado: ${user ? '✅' : '❌'}`)
    console.log(`- Categorias no banco: ${categories.length}`)
    console.log(`- Sessões ativas: ${sessions?.length || 0}`)
    console.log(`- Usuário com JWT: ${userAuth ? '✅' : '❌'}`)
    console.log(`- Categorias com JWT: ${authCategories?.length || 0}`)
    console.log(`- Usuários com RLS: ${usersRLS?.length || 0}`)
    console.log(`- Categorias com RLS: ${categoriesRLS?.length || 0}`)

    // 9. Diagnóstico final
    console.log('\n9️⃣ DIAGNÓSTICO FINAL...')
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

    // 10. Instruções para verificar logs
    console.log('\n🔟 COMO VERIFICAR LOGS:')
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

debugFrontendAuthCompleto()
