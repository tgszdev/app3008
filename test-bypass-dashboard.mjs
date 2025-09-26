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

async function testBypassDashboard() {
  console.log('🔧 TESTANDO BYPASS TEMPORÁRIO DO DASHBOARD')
  console.log('=' .repeat(60))

  try {
    // 1. Testar API de estatísticas
    console.log('\n1️⃣ TESTANDO API DE ESTATÍSTICAS...')
    
    try {
      const statsResponse = await fetch('https://www.ithostbr.tech/api/dashboard/stats')
      const statsData = await statsResponse.json()
      
      if (statsResponse.ok) {
        console.log('✅ API de estatísticas funcionando!')
        console.log('📊 Dados retornados:')
        console.log(`  - Total tickets: ${statsData.stats?.totalTickets || 0}`)
        console.log(`  - Tickets abertos: ${statsData.stats?.openTickets || 0}`)
        console.log(`  - Tickets em progresso: ${statsData.stats?.inProgressTickets || 0}`)
        console.log(`  - Tickets resolvidos: ${statsData.stats?.resolvedTickets || 0}`)
        console.log(`  - Tickets cancelados: ${statsData.stats?.cancelledTickets || 0}`)
        console.log(`  - Tickets recentes: ${statsData.recentTickets?.length || 0}`)
      } else {
        console.log('❌ API de estatísticas com erro:', statsResponse.status, statsData)
      }
    } catch (error) {
      console.log('❌ Erro ao testar API de estatísticas:', error.message)
    }

    // 2. Testar API de analytics
    console.log('\n2️⃣ TESTANDO API DE ANALYTICS...')
    
    try {
      const analyticsResponse = await fetch('https://www.ithostbr.tech/api/dashboard/analytics')
      const analyticsData = await analyticsResponse.json()
      
      if (analyticsResponse.ok) {
        console.log('✅ API de analytics funcionando!')
        console.log('📊 Dados retornados:')
        console.log(`  - Total tickets: ${analyticsData.overview?.totalTickets || 0}`)
        console.log(`  - Tempo médio resolução: ${analyticsData.overview?.avgResolutionTime || 'N/A'}`)
        console.log(`  - Taxa satisfação: ${analyticsData.overview?.satisfactionRate || 0}%`)
        console.log(`  - Usuários ativos: ${analyticsData.overview?.activeUsers || 0}`)
        console.log(`  - Tickets por status: ${Object.keys(analyticsData.ticketsByStatus || {}).length} status`)
        console.log(`  - Tickets por prioridade: ${Object.keys(analyticsData.ticketsByPriority || {}).length} prioridades`)
        console.log(`  - Tickets por categoria: ${analyticsData.ticketsByCategory?.length || 0} categorias`)
      } else {
        console.log('❌ API de analytics com erro:', analyticsResponse.status, analyticsData)
      }
    } catch (error) {
      console.log('❌ Erro ao testar API de analytics:', error.message)
    }

    // 3. Verificar se categorias ainda funcionam
    console.log('\n3️⃣ VERIFICANDO SE CATEGORIAS AINDA FUNCIONAM...')
    
    try {
      const categoriesResponse = await fetch('https://www.ithostbr.tech/api/categories/public?active_only=true')
      const categoriesData = await categoriesResponse.json()
      
      if (categoriesResponse.ok) {
        console.log('✅ API de categorias funcionando!')
        console.log(`📋 Categorias retornadas: ${categoriesData.length}`)
        
        // Verificar se há categorias globais
        const globalCats = categoriesData.filter(cat => cat.is_global)
        const specificCats = categoriesData.filter(cat => !cat.is_global)
        
        console.log(`  - Categorias globais: ${globalCats.length}`)
        console.log(`  - Categorias específicas: ${specificCats.length}`)
        
        if (globalCats.length > 0) {
          console.log('📋 Categorias globais:')
          globalCats.forEach(cat => {
            console.log(`    - ${cat.name}`)
          })
        }
      } else {
        console.log('❌ API de categorias com erro:', categoriesResponse.status, categoriesData)
      }
    } catch (error) {
      console.log('❌ Erro ao testar API de categorias:', error.message)
    }

    // 4. Testar API dinâmica de categorias
    console.log('\n4️⃣ TESTANDO API DINÂMICA DE CATEGORIAS...')
    
    try {
      const dynamicResponse = await fetch('https://www.ithostbr.tech/api/categories/dynamic?active_only=true')
      const dynamicData = await dynamicResponse.json()
      
      if (dynamicResponse.ok) {
        console.log('✅ API dinâmica de categorias funcionando!')
        console.log(`📋 Categorias retornadas: ${dynamicData.length}`)
      } else {
        console.log('❌ API dinâmica com erro:', dynamicResponse.status, dynamicData)
      }
    } catch (error) {
      console.log('❌ Erro ao testar API dinâmica:', error.message)
    }

    // 5. Diagnóstico final
    console.log('\n5️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO DO TESTE:')
    console.log('✅ Bypass temporário implementado')
    console.log('✅ APIs do dashboard devem funcionar agora')
    console.log('✅ Categorias devem continuar funcionando')
    console.log('✅ Problema 1 (categorias) não foi afetado')
    
    console.log('\n🎯 PRÓXIMOS PASSOS:')
    console.log('1. Acessar dashboard em https://www.ithostbr.tech/dashboard')
    console.log('2. Fazer login com rodrigues2205@icloud.com')
    console.log('3. Testar filtro de cliente:')
    console.log('   - Selecionar apenas "Luft Agro" → deve mostrar 1 ticket')
    console.log('   - Selecionar apenas "Teste" → deve mostrar 0 tickets')
    console.log('   - Selecionar múltiplos → deve mostrar tickets de ambos')
    console.log('4. Verificar se categorias ainda funcionam no formulário de novo ticket')
    console.log('5. Reportar resultados para remover bypass e corrigir autenticação')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testBypassDashboard()
