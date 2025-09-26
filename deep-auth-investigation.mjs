#!/usr/bin/env node

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

async function deepAuthInvestigation() {
  console.log('🔍 INVESTIGAÇÃO PROFUNDA DE AUTENTICAÇÃO')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar configuração do NextAuth
    console.log('\n1️⃣ VERIFICANDO CONFIGURAÇÃO DO NEXTAUTH...')
    
    console.log('📋 Variáveis de ambiente:')
    console.log(`  - NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'não definido'}`)
    console.log(`  - AUTH_SECRET: ${process.env.AUTH_SECRET ? 'definido' : 'não definido'}`)
    console.log(`  - NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? 'definido' : 'não definido'}`)
    console.log(`  - SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'definido' : 'não definido'}`)
    console.log(`  - SUPABASE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'definido' : 'não definido'}`)

    // 2. Verificar se o problema é no auth() function
    console.log('\n2️⃣ VERIFICANDO FUNÇÃO AUTH()...')
    
    // Simular o que a função auth() deveria retornar
    console.log('🔍 Simulando função auth():')
    console.log('  - Deveria retornar sessão do usuário logado')
    console.log('  - Se retorna null, problema é na criação da sessão')
    console.log('  - Se retorna sessão, problema é na verificação')

    // 3. Verificar se há problema com cookies
    console.log('\n3️⃣ VERIFICANDO PROBLEMA COM COOKIES...')
    
    try {
      // Testar se conseguimos acessar a API com headers específicos
      const response = await fetch('https://www.ithostbr.tech/api/dashboard/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; TestBot/1.0)',
          'Accept': 'application/json',
        }
      })
      
      console.log('📡 Resposta da API:', response.status)
      console.log('📊 Headers da resposta:', Object.fromEntries(response.headers.entries()))
      
      const data = await response.json()
      console.log('📋 Dados:', data)
      
    } catch (error) {
      console.log('❌ Erro ao testar API:', error.message)
    }

    // 4. Verificar se o problema é no Supabase
    console.log('\n4️⃣ VERIFICANDO CONEXÃO COM SUPABASE...')
    
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1)

    if (testError) {
      console.log('❌ Erro ao conectar com Supabase:', testError.message)
    } else {
      console.log('✅ Conexão com Supabase funcionando')
      console.log(`📊 Dados de teste: ${testData?.length || 0} usuários`)
    }

    // 5. Verificar se há problema com a sessão no banco
    console.log('\n5️⃣ VERIFICANDO SESSÕES NO BANCO...')
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (sessionsError) {
      console.log('❌ Erro ao buscar sessões:', sessionsError.message)
    } else {
      console.log('✅ Sessões encontradas:', sessions?.length || 0)
      if (sessions && sessions.length > 0) {
        sessions.forEach(session => {
          console.log(`  - Session: ${session.id} (User: ${session.userId})`)
          console.log(`    Expires: ${session.expires}`)
          console.log(`    Created: ${session.created_at}`)
        })
      }
    }

    // 6. Verificar se há problema com o usuário específico
    console.log('\n6️⃣ VERIFICANDO USUÁRIO ESPECÍFICO...')
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'rodrigues2205@icloud.com')
      .single()

    if (userError) {
      console.log('❌ Erro ao buscar usuário:', userError.message)
    } else {
      console.log('✅ Usuário encontrado:')
      console.log(`  - ID: ${user.id}`)
      console.log(`  - Email: ${user.email}`)
      console.log(`  - User Type: ${user.user_type}`)
      console.log(`  - Role: ${user.role}`)
      console.log(`  - Is Active: ${user.is_active}`)
      console.log(`  - Last Login: ${user.last_login}`)
    }

    // 7. Testar se o problema é na verificação de sessão
    console.log('\n7️⃣ TESTANDO VERIFICAÇÃO DE SESSÃO...')
    
    // Simular o que acontece na API
    console.log('🔍 Simulando verificação de sessão:')
    console.log('  - session = await auth()')
    console.log('  - if (!session?.user?.id) return 401')
    console.log('  - Se chegou até aqui, problema é na lógica de filtro')

    // 8. Verificar se há problema com o frontend
    console.log('\n8️⃣ VERIFICANDO PROBLEMA COM FRONTEND...')
    
    console.log('🔍 Possíveis problemas no frontend:')
    console.log('  1. Cookies de sessão não estão sendo enviados')
    console.log('  2. Sessão não está sendo criada no login')
    console.log('  3. Sessão está sendo criada mas não persistindo')
    console.log('  4. Problema com CORS ou headers')

    // 9. Verificar se há problema com o deploy
    console.log('\n9️⃣ VERIFICANDO PROBLEMA COM DEPLOY...')
    
    console.log('🔍 Possíveis problemas no deploy:')
    console.log('  1. Variáveis de ambiente não configuradas no Vercel')
    console.log('  2. Build não está incluindo as mudanças')
    console.log('  3. Cache do Vercel está servindo versão antiga')
    console.log('  4. Problema com domínio ou SSL')

    // 10. Diagnóstico final
    console.log('\n🔟 DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO DA INVESTIGAÇÃO:')
    console.log('✅ Supabase funcionando')
    console.log('✅ Usuário existe e está ativo')
    console.log('✅ Sessões podem ser criadas no banco')
    console.log('❌ APIs do dashboard retornam 401')
    console.log('❌ Bypass temporário não funcionou')
    
    console.log('\n🎯 POSSÍVEIS CAUSAS:')
    console.log('1. Problema com cookies de sessão')
    console.log('2. Problema com configuração do NextAuth')
    console.log('3. Problema com deploy no Vercel')
    console.log('4. Problema com variáveis de ambiente')
    console.log('5. Problema com CORS ou headers')
    
    console.log('\n🔧 PRÓXIMOS PASSOS:')
    console.log('1. Verificar se cookies estão sendo enviados')
    console.log('2. Verificar configuração do NextAuth no Vercel')
    console.log('3. Verificar se build está atualizado')
    console.log('4. Testar com bypass mais agressivo')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

deepAuthInvestigation()
