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

async function testarEndpointsPublicos() {
  console.log('🔍 TESTANDO ENDPOINTS PÚBLICOS')
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

    // 3. Testar endpoint público
    console.log('\n3️⃣ TESTANDO ENDPOINT PÚBLICO...')
    try {
      const response1 = await fetch('https://www.ithostbr.tech/api/categories/public', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('✅ Resposta da API pública:', response1.status, response1.statusText)
      
      if (response1.ok) {
        const data1 = await response1.json()
        console.log('✅ Dados recebidos:', data1.length, 'categorias')
        data1.forEach(cat => {
          console.log(`  - ${cat.name} (${cat.slug}) - Global: ${cat.is_global}`)
        })
      } else {
        const errorText = await response1.text()
        console.log('❌ Erro da API pública:', errorText)
      }
    } catch (error) {
      console.log('❌ Erro na requisição pública:', error.message)
    }

    // 4. Testar endpoint público com contexto
    console.log('\n4️⃣ TESTANDO ENDPOINT PÚBLICO COM CONTEXTO...')
    try {
      const response2 = await fetch(`https://www.ithostbr.tech/api/categories/public?context_id=${user.context_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('✅ Resposta da API pública com contexto:', response2.status, response2.statusText)
      
      if (response2.ok) {
        const data2 = await response2.json()
        console.log('✅ Dados recebidos:', data2.length, 'categorias')
        data2.forEach(cat => {
          console.log(`  - ${cat.name} (${cat.slug}) - Global: ${cat.is_global}`)
        })
      } else {
        const errorText = await response2.text()
        console.log('❌ Erro da API pública com contexto:', errorText)
      }
    } catch (error) {
      console.log('❌ Erro na requisição pública com contexto:', error.message)
    }

    // 5. Testar endpoint de teste
    console.log('\n5️⃣ TESTANDO ENDPOINT DE TESTE...')
    try {
      const response3 = await fetch('https://www.ithostbr.tech/api/categories/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('✅ Resposta da API de teste:', response3.status, response3.statusText)
      
      if (response3.ok) {
        const data3 = await response3.json()
        console.log('✅ Dados recebidos:', data3.length, 'categorias')
        data3.forEach(cat => {
          console.log(`  - ${cat.name} (${cat.slug}) - Global: ${cat.is_global}`)
        })
      } else {
        const errorText = await response3.text()
        console.log('❌ Erro da API de teste:', errorText)
      }
    } catch (error) {
      console.log('❌ Erro na requisição de teste:', error.message)
    }

    // 6. Testar endpoint original
    console.log('\n6️⃣ TESTANDO ENDPOINT ORIGINAL...')
    try {
      const response4 = await fetch('https://www.ithostbr.tech/api/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('✅ Resposta da API original:', response4.status, response4.statusText)
      
      if (response4.ok) {
        const data4 = await response4.json()
        console.log('✅ Dados recebidos:', data4.length, 'categorias')
        data4.forEach(cat => {
          console.log(`  - ${cat.name} (${cat.slug}) - Global: ${cat.is_global}`)
        })
      } else {
        const errorText = await response4.text()
        console.log('❌ Erro da API original:', errorText)
      }
    } catch (error) {
      console.log('❌ Erro na requisição original:', error.message)
    }

    console.log('\n🎯 TESTE ENDPOINTS PÚBLICOS CONCLUÍDO!')
    console.log('=' .repeat(60))
    console.log('📋 RESUMO:')
    console.log(`- Usuário encontrado: ${user ? '✅' : '❌'}`)
    console.log(`- Categorias no banco: ${categories.length}`)
    console.log(`- Endpoints funcionando: Verificar logs acima`)

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testarEndpointsPublicos()
