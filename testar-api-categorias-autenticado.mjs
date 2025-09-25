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

async function testarApiCategoriasAutenticado() {
  console.log('🔍 TESTANDO API CATEGORIAS AUTENTICADO')
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

    // 3. Testar API com diferentes métodos
    console.log('\n3️⃣ TESTANDO API COM DIFERENTES MÉTODOS...')
    
    // Método 1: Teste direto com fetch
    console.log('\n📋 MÉTODO 1: Teste direto com fetch...')
    try {
      const response1 = await fetch('https://www.ithostbr.tech/api/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; test-bot)'
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

    // 4. Verificar se há problemas de CORS
    console.log('\n4️⃣ VERIFICANDO PROBLEMAS DE CORS...')
    try {
      const response4 = await fetch('https://www.ithostbr.tech/api/categories', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://www.ithostbr.tech',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      })

      console.log('✅ Resposta CORS:', response4.status, response4.statusText)
      console.log('✅ Headers CORS:', response4.headers.get('Access-Control-Allow-Origin'))
    } catch (error) {
      console.log('❌ Erro CORS:', error.message)
    }

    // 5. Verificar se há problemas de NextAuth
    console.log('\n5️⃣ VERIFICANDO PROBLEMAS DE NEXTAUTH...')
    try {
      const response5 = await fetch('https://www.ithostbr.tech/api/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('✅ Resposta NextAuth:', response5.status, response5.statusText)
      
      if (response5.ok) {
        const sessionData = await response5.json()
        console.log('✅ Dados da sessão:', sessionData)
      } else {
        const errorText = await response5.text()
        console.log('❌ Erro NextAuth:', errorText)
      }
    } catch (error) {
      console.log('❌ Erro NextAuth:', error.message)
    }

    console.log('\n🎯 TESTE API CONCLUÍDO!')
    console.log('=' .repeat(60))
    console.log('📋 RESUMO:')
    console.log(`- Usuário encontrado: ${user ? '✅' : '❌'}`)
    console.log(`- Categorias no banco: ${categories.length}`)
    console.log(`- API funcionando: Verificar logs acima`)

    // 6. Instruções para verificar logs
    console.log('\n6️⃣ COMO VERIFICAR LOGS:')
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

testarApiCategoriasAutenticado()
