import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qjqjqjqjqjqjqjqj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCompleteDashboardFlow() {
  console.log('🔍 TESTE COMPLETO DO FLUXO DO DASHBOARD')
  console.log('=' .repeat(60))
  
  const luftAgroContextId = '6486088e-72ae-461b-8b03-32ca84918882'
  
  try {
    // 1. TESTAR API STATS COM CONTEXTO
    console.log('\n📡 1. TESTANDO API STATS COM CONTEXTO:')
    console.log('-'.repeat(40))
    
    const statsResponse = await fetch(`https://www.ithostbr.tech/api/dashboard/stats?context_id=${luftAgroContextId}`)
    const statsData = await statsResponse.json()
    
    console.log('✅ Resposta da API stats:')
    console.log(`  Total: ${statsData.totalTickets || 'undefined'}`)
    console.log(`  Abertos: ${statsData.openTickets || 'undefined'}`)
    console.log(`  Fechados: ${statsData.closedTickets || 'undefined'}`)
    console.log(`  Recentes: ${statsData.recentTickets?.length || 0}`)
    
    // 2. TESTAR API CATEGORIES-STATS COM CONTEXTO
    console.log('\n📡 2. TESTANDO API CATEGORIES-STATS COM CONTEXTO:')
    console.log('-'.repeat(40))
    
    const categoriesResponse = await fetch(`https://www.ithostbr.tech/api/dashboard/categories-stats?context_id=${luftAgroContextId}`)
    const categoriesData = await categoriesResponse.json()
    
    console.log('✅ Resposta da API categories-stats:')
    console.log(`  Total: ${categoriesData.total_tickets || 'undefined'}`)
    console.log(`  Categorias: ${categoriesData.categorias?.length || 0}`)
    console.log(`  Status Summary: ${JSON.stringify(categoriesData.status_summary || {})}`)
    
    // 3. TESTAR API CATEGORIES-STATS SEM CONTEXTO
    console.log('\n📡 3. TESTANDO API CATEGORIES-STATS SEM CONTEXTO:')
    console.log('-'.repeat(40))
    
    const categoriesResponseNoContext = await fetch('https://www.ithostbr.tech/api/dashboard/categories-stats')
    const categoriesDataNoContext = await categoriesResponseNoContext.json()
    
    console.log('✅ Resposta da API categories-stats sem contexto:')
    console.log(`  Total: ${categoriesDataNoContext.total_tickets || 'undefined'}`)
    console.log(`  Categorias: ${categoriesDataNoContext.categorias?.length || 0}`)
    console.log(`  Status Summary: ${JSON.stringify(categoriesDataNoContext.status_summary || {})}`)
    
    // 4. COMPARAR RESULTADOS
    console.log('\n🔍 4. COMPARAÇÃO:')
    console.log('-'.repeat(40))
    
    if (categoriesData.total_tickets !== categoriesDataNoContext.total_tickets) {
      console.log('✅ FILTRO FUNCIONANDO: Valores diferentes com e sem contexto')
      console.log(`  Com contexto: ${categoriesData.total_tickets}`)
      console.log(`  Sem contexto: ${categoriesDataNoContext.total_tickets}`)
    } else {
      console.log('❌ FILTRO NÃO FUNCIONANDO: Valores iguais com e sem contexto')
      console.log(`  Ambos: ${categoriesData.total_tickets}`)
    }
    
    // 5. VERIFICAR ESTRUTURA DAS RESPOSTAS
    console.log('\n📋 5. ESTRUTURA DAS RESPOSTAS:')
    console.log('-'.repeat(40))
    
    console.log('📊 Stats API:')
    console.log('  Chaves:', Object.keys(statsData))
    
    console.log('📊 Categories API:')
    console.log('  Chaves:', Object.keys(categoriesData))
    
    // 6. VERIFICAR SE HÁ ERROS
    console.log('\n❌ 6. VERIFICANDO ERROS:')
    console.log('-'.repeat(40))
    
    if (statsData.error) {
      console.log('❌ Erro na API stats:', statsData.error)
    }
    
    if (categoriesData.error) {
      console.log('❌ Erro na API categories:', categoriesData.error)
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testCompleteDashboardFlow()
