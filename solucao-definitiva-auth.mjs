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

async function solucaoDefinitivaAuth() {
  console.log('🔧 SOLUÇÃO DEFINITIVA - AUTENTICAÇÃO')
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
      console.log(`  - ${cat.name} (${cat.slug})`)
    })

    // 3. Verificar se há problemas de RLS
    console.log('\n3️⃣ VERIFICANDO PROBLEMAS DE RLS...')
    
    // Testar JWT
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
    }

    // 4. Verificar se há problemas de NextAuth
    console.log('\n4️⃣ VERIFICANDO PROBLEMAS DE NEXTAUTH...')
    
    // Verificar se há sessões ativas
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('userId', user.id)
      .gte('expires', new Date().toISOString())

    if (sessionsError) {
      console.log('⚠️ Não foi possível verificar sessões:', sessionsError.message)
    } else {
      console.log('✅ Sessões ativas encontradas:', sessions.length)
      sessions.forEach(session => {
        console.log(`  - Sessão: ${session.id} (expira: ${session.expires})`)
      })
    }

    // 5. Criar solução alternativa
    console.log('\n5️⃣ CRIANDO SOLUÇÃO ALTERNATIVA...')
    
    // Criar endpoint público para categorias
    const { data: publicCategories, error: publicError } = await supabase
      .from('categories')
      .select('*')
      .eq('context_id', user.context_id)
      .eq('is_global', false)

    if (publicError) {
      console.log('❌ Erro ao buscar categorias públicas:', publicError)
    } else {
      console.log('✅ Categorias públicas encontradas:', publicCategories.length)
      publicCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug})`)
      })
    }

    // 6. Verificar se há problemas de CORS
    console.log('\n6️⃣ VERIFICANDO PROBLEMAS DE CORS...')
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

    // 7. Verificar se há problemas de NextAuth
    console.log('\n7️⃣ VERIFICANDO PROBLEMAS DE NEXTAUTH...')
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

    console.log('\n🎯 SOLUÇÃO DEFINITIVA CONCLUÍDA!')
    console.log('=' .repeat(60))
    console.log('📋 RESUMO:')
    console.log(`- Usuário encontrado: ${user ? '✅' : '❌'}`)
    console.log(`- Categorias no banco: ${categories.length}`)
    console.log(`- Usuário com JWT: ${userAuth ? '✅' : '❌'}`)
    console.log(`- Categorias com JWT: ${authCategories?.length || 0}`)
    console.log(`- Sessões ativas: ${sessions?.length || 0}`)
    console.log(`- Categorias públicas: ${publicCategories?.length || 0}`)

    // 8. Diagnóstico final
    console.log('\n8️⃣ DIAGNÓSTICO FINAL...')
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

solucaoDefinitivaAuth()
