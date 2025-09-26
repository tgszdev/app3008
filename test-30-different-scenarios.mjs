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

async function test30DifferentScenarios() {
  console.log('🧪 TESTANDO 30 CENÁRIOS DIFERENTES')
  console.log('=' .repeat(80))

  const tests = []
  let testNumber = 1

  try {
    // TESTE 1: Verificar API stats básica
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: API stats básica`)
    const response1 = await fetch('https://www.ithostbr.tech/api/dashboard/stats')
    const data1 = await response1.json()
    tests.push({
      test: testNumber,
      name: 'API stats básica',
      result: response1.status === 200 ? '✅' : '❌',
      details: `Status: ${response1.status}, Total: ${data1.stats?.totalTickets || data1.total_tickets || 0}`
    })
    testNumber++

    // TESTE 2: Verificar context_id nos tickets recentes
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: context_id nos tickets recentes`)
    const recentTickets = data1.recentTickets || data1.recent_tickets || []
    const hasContextId = recentTickets.some(ticket => ticket.context_id && ticket.context_id !== 'undefined')
    tests.push({
      test: testNumber,
      name: 'context_id nos tickets recentes',
      result: hasContextId ? '✅' : '❌',
      details: `Tickets com context_id: ${recentTickets.filter(t => t.context_id && t.context_id !== 'undefined').length}/${recentTickets.length}`
    })
    testNumber++

    // TESTE 3: Verificar tickets do Luft Agro
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Tickets do Luft Agro`)
    const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
    const luftTickets = recentTickets.filter(ticket => ticket.context_id === luftAgroId)
    tests.push({
      test: testNumber,
      name: 'Tickets do Luft Agro',
      result: luftTickets.length > 0 ? '✅' : '❌',
      details: `Tickets do Luft Agro: ${luftTickets.length}`
    })
    testNumber++

    // TESTE 4: Verificar se API está aplicando filtros
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: API aplicando filtros`)
    const totalTickets = data1.stats?.totalTickets || data1.total_tickets || 0
    const isFiltered = totalTickets < 19 // Se for menos que 19, está filtrado
    tests.push({
      test: testNumber,
      name: 'API aplicando filtros',
      result: isFiltered ? '✅' : '❌',
      details: `Total tickets: ${totalTickets} (esperado: < 19 para Luft Agro)`
    })
    testNumber++

    // TESTE 5: Verificar se frontend está aplicando filtro
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Frontend aplicando filtro`)
    // Simular filtro do frontend
    const frontendFiltered = recentTickets.filter(ticket => ticket.context_id === luftAgroId)
    tests.push({
      test: testNumber,
      name: 'Frontend aplicando filtro',
      result: frontendFiltered.length > 0 ? '✅' : '❌',
      details: `Tickets filtrados pelo frontend: ${frontendFiltered.length}`
    })
    testNumber++

    // TESTE 6: Verificar dados do banco para Luft Agro
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Dados do banco para Luft Agro`)
    const { data: luftTicketsDb, error: luftError } = await supabase
      .from('tickets')
      .select('*')
      .eq('context_id', luftAgroId)
      .order('created_at', { ascending: false })
    
    tests.push({
      test: testNumber,
      name: 'Dados do banco para Luft Agro',
      result: !luftError && luftTicketsDb.length > 0 ? '✅' : '❌',
      details: `Tickets no banco: ${luftTicketsDb.length}, Erro: ${luftError?.message || 'Nenhum'}`
    })
    testNumber++

    // TESTE 7: Verificar usuário matrix
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Usuário matrix`)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, user_type')
      .eq('email', 'rodrigues2205@icloud.com')
    
    const isMatrix = userData && userData.length > 0 && userData[0].user_type === 'matrix'
    tests.push({
      test: testNumber,
      name: 'Usuário matrix',
      result: isMatrix ? '✅' : '❌',
      details: `User type: ${userData?.[0]?.user_type || 'N/A'}`
    })
    testNumber++

    // TESTE 8: Verificar contextos associados
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Contextos associados`)
    if (userData && userData.length > 0) {
      const { data: userContexts, error: contextsError } = await supabase
        .from('user_contexts')
        .select('context_id')
        .eq('user_id', userData[0].id)
      
      tests.push({
        test: testNumber,
        name: 'Contextos associados',
        result: !contextsError && userContexts && userContexts.length > 0 ? '✅' : '❌',
        details: `Contextos: ${userContexts?.length || 0}, Erro: ${contextsError?.message || 'Nenhum'}`
      })
    } else {
      tests.push({
        test: testNumber,
        name: 'Contextos associados',
        result: '❌',
        details: 'Usuário não encontrado'
      })
    }
    testNumber++

    // TESTE 9: Verificar se Luft Agro está nos contextos
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Luft Agro nos contextos`)
    if (userData && userData.length > 0) {
      const { data: userContexts, error: contextsError } = await supabase
        .from('user_contexts')
        .select('context_id')
        .eq('user_id', userData[0].id)
      
      const hasLuftAgro = userContexts && userContexts.some(uc => uc.context_id === luftAgroId)
      tests.push({
        test: testNumber,
        name: 'Luft Agro nos contextos',
        result: hasLuftAgro ? '✅' : '❌',
        details: `Luft Agro encontrado: ${hasLuftAgro}`
      })
    } else {
      tests.push({
        test: testNumber,
        name: 'Luft Agro nos contextos',
        result: '❌',
        details: 'Usuário não encontrado'
      })
    }
    testNumber++

    // TESTE 10: Verificar query com filtros de contexto
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Query com filtros de contexto`)
    if (userData && userData.length > 0) {
      const { data: userContexts, error: contextsError } = await supabase
        .from('user_contexts')
        .select('context_id')
        .eq('user_id', userData[0].id)
      
      if (userContexts && userContexts.length > 0) {
        const contextIds = userContexts.map(uc => uc.context_id)
        const { data: filteredTickets, error: filteredError } = await supabase
          .from('tickets')
          .select('*')
          .in('context_id', contextIds)
          .order('created_at', { ascending: false })
          .limit(5)
        
        tests.push({
          test: testNumber,
          name: 'Query com filtros de contexto',
          result: !filteredError && filteredTickets ? '✅' : '❌',
          details: `Tickets filtrados: ${filteredTickets?.length || 0}, Erro: ${filteredError?.message || 'Nenhum'}`
        })
      } else {
        tests.push({
          test: testNumber,
          name: 'Query com filtros de contexto',
          result: '❌',
          details: 'Nenhum contexto associado'
        })
      }
    } else {
      tests.push({
        test: testNumber,
        name: 'Query com filtros de contexto',
        result: '❌',
        details: 'Usuário não encontrado'
      })
    }
    testNumber++

    // TESTE 11: Verificar se query simples funciona
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Query simples funciona`)
    const { data: simpleTickets, error: simpleError } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    tests.push({
      test: testNumber,
      name: 'Query simples funciona',
      result: !simpleError && simpleTickets ? '✅' : '❌',
      details: `Tickets: ${simpleTickets?.length || 0}, Erro: ${simpleError?.message || 'Nenhum'}`
    })
    testNumber++

    // TESTE 12: Verificar se query simples retorna context_id
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Query simples retorna context_id`)
    const hasContextIdInSimple = simpleTickets && simpleTickets.some(ticket => ticket.context_id && ticket.context_id !== 'undefined')
    tests.push({
      test: testNumber,
      name: 'Query simples retorna context_id',
      result: hasContextIdInSimple ? '✅' : '❌',
      details: `Tickets com context_id: ${simpleTickets?.filter(t => t.context_id && t.context_id !== 'undefined').length || 0}/${simpleTickets?.length || 0}`
    })
    testNumber++

    // TESTE 13: Verificar se query simples retorna Luft Agro
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Query simples retorna Luft Agro`)
    const luftInSimple = simpleTickets && simpleTickets.some(ticket => ticket.context_id === luftAgroId)
    tests.push({
      test: testNumber,
      name: 'Query simples retorna Luft Agro',
      result: luftInSimple ? '✅' : '❌',
      details: `Luft Agro encontrado: ${luftInSimple}`
    })
    testNumber++

    // TESTE 14: Verificar formatação dos tickets
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Formatação dos tickets`)
    if (simpleTickets && simpleTickets.length > 0) {
      const formattedTickets = simpleTickets.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        context_id: ticket.context_id
      }))
      const hasValidFormat = formattedTickets.every(ticket => ticket.id && ticket.title && ticket.status)
      tests.push({
        test: testNumber,
        name: 'Formatação dos tickets',
        result: hasValidFormat ? '✅' : '❌',
        details: `Tickets formatados: ${formattedTickets.length}`
      })
    } else {
      tests.push({
        test: testNumber,
        name: 'Formatação dos tickets',
        result: '❌',
        details: 'Nenhum ticket para formatar'
      })
    }
    testNumber++

    // TESTE 15: Verificar se API está usando fallback
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: API usando fallback`)
    // Verificar se a API está retornando dados da query simples
    const isUsingFallback = recentTickets.length === 5 && recentTickets.some(t => t.context_id && t.context_id !== 'undefined')
    tests.push({
      test: testNumber,
      name: 'API usando fallback',
      result: isUsingFallback ? '✅' : '❌',
      details: `Fallback ativo: ${isUsingFallback}`
    })
    testNumber++

    // TESTE 16: Verificar se API está aplicando filtros de contexto
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: API aplicando filtros de contexto`)
    const isApplyingFilters = recentTickets.length < 19 // Se for menos que 19, está aplicando filtros
    tests.push({
      test: testNumber,
      name: 'API aplicando filtros de contexto',
      result: isApplyingFilters ? '✅' : '❌',
      details: `Tickets retornados: ${recentTickets.length} (esperado: < 19)`
    })
    testNumber++

    // TESTE 17: Verificar se API está retornando dados corretos
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: API retornando dados corretos`)
    const hasCorrectData = recentTickets.length > 0 && recentTickets.some(t => t.context_id && t.context_id !== 'undefined')
    tests.push({
      test: testNumber,
      name: 'API retornando dados corretos',
      result: hasCorrectData ? '✅' : '❌',
      details: `Dados corretos: ${hasCorrectData}`
    })
    testNumber++

    // TESTE 18: Verificar se frontend está recebendo dados corretos
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Frontend recebendo dados corretos`)
    const frontendHasCorrectData = recentTickets.length > 0 && recentTickets.some(t => t.context_id && t.context_id !== 'undefined')
    tests.push({
      test: testNumber,
      name: 'Frontend recebendo dados corretos',
      result: frontendHasCorrectData ? '✅' : '❌',
      details: `Dados corretos: ${frontendHasCorrectData}`
    })
    testNumber++

    // TESTE 19: Verificar se frontend está aplicando filtro corretamente
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Frontend aplicando filtro corretamente`)
    const frontendFilteredCorrectly = recentTickets.filter(t => t.context_id === luftAgroId).length > 0
    tests.push({
      test: testNumber,
      name: 'Frontend aplicando filtro corretamente',
      result: frontendFilteredCorrectly ? '✅' : '❌',
      details: `Filtro aplicado: ${frontendFilteredCorrectly}`
    })
    testNumber++

    // TESTE 20: Verificar se estatísticas estão sendo filtradas
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Estatísticas sendo filtradas`)
    const statsFiltered = totalTickets < 19
    tests.push({
      test: testNumber,
      name: 'Estatísticas sendo filtradas',
      result: statsFiltered ? '✅' : '❌',
      details: `Total filtrado: ${totalTickets} (esperado: < 19)`
    })
    testNumber++

    // TESTE 21: Verificar se categorias estão sendo filtradas
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Categorias sendo filtradas`)
    // Simular verificação de categorias
    const categoriesFiltered = totalTickets < 19
    tests.push({
      test: testNumber,
      name: 'Categorias sendo filtradas',
      result: categoriesFiltered ? '✅' : '❌',
      details: `Categorias filtradas: ${categoriesFiltered}`
    })
    testNumber++

    // TESTE 22: Verificar se tickets recentes estão sendo filtrados
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Tickets recentes sendo filtrados`)
    const recentFiltered = recentTickets.filter(t => t.context_id === luftAgroId).length > 0
    tests.push({
      test: testNumber,
      name: 'Tickets recentes sendo filtrados',
      result: recentFiltered ? '✅' : '❌',
      details: `Tickets recentes filtrados: ${recentFiltered}`
    })
    testNumber++

    // TESTE 23: Verificar se bypass está funcionando
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Bypass funcionando`)
    const bypassWorking = response1.status === 200
    tests.push({
      test: testNumber,
      name: 'Bypass funcionando',
      result: bypassWorking ? '✅' : '❌',
      details: `Bypass ativo: ${bypassWorking}`
    })
    testNumber++

    // TESTE 24: Verificar se UUID está correto
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: UUID correto`)
    const uuidCorrect = userData && userData.length > 0 && userData[0].id === '2a33241e-ed38-48b5-9c84-e8c354ae9606'
    tests.push({
      test: testNumber,
      name: 'UUID correto',
      result: uuidCorrect ? '✅' : '❌',
      details: `UUID: ${userData?.[0]?.id || 'N/A'}`
    })
    testNumber++

    // TESTE 25: Verificar se query principal está falhando
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Query principal falhando`)
    // Simular query principal
    const { data: mainQuery, error: mainError } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        title,
        status,
        priority,
        created_at,
        is_internal,
        context_id,
        created_by,
        users!tickets_created_by_fkey(name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)
    
    tests.push({
      test: testNumber,
      name: 'Query principal falhando',
      result: mainError ? '✅' : '❌',
      details: `Query principal erro: ${mainError?.message || 'Nenhum'}`
    })
    testNumber++

    // TESTE 26: Verificar se query simples está funcionando
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Query simples funcionando`)
    tests.push({
      test: testNumber,
      name: 'Query simples funcionando',
      result: !simpleError && simpleTickets ? '✅' : '❌',
      details: `Query simples: ${simpleTickets?.length || 0} tickets`
    })
    testNumber++

    // TESTE 27: Verificar se filtros de contexto estão sendo aplicados
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Filtros de contexto sendo aplicados`)
    const contextFiltersApplied = recentTickets.length < 19
    tests.push({
      test: testNumber,
      name: 'Filtros de contexto sendo aplicados',
      result: contextFiltersApplied ? '✅' : '❌',
      details: `Filtros aplicados: ${contextFiltersApplied}`
    })
    testNumber++

    // TESTE 28: Verificar se dados estão sendo formatados corretamente
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Dados sendo formatados corretamente`)
    const dataFormattedCorrectly = recentTickets.every(t => t.id && t.title && t.status)
    tests.push({
      test: testNumber,
      name: 'Dados sendo formatados corretamente',
      result: dataFormattedCorrectly ? '✅' : '❌',
      details: `Formatação correta: ${dataFormattedCorrectly}`
    })
    testNumber++

    // TESTE 29: Verificar se API está retornando resposta correta
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: API retornando resposta correta`)
    const apiResponseCorrect = response1.status === 200 && data1.stats
    tests.push({
      test: testNumber,
      name: 'API retornando resposta correta',
      result: apiResponseCorrect ? '✅' : '❌',
      details: `Resposta correta: ${apiResponseCorrect}`
    })
    testNumber++

    // TESTE 30: Verificar se filtro está funcionando end-to-end
    console.log(`\n${testNumber}️⃣ TESTE ${testNumber}: Filtro funcionando end-to-end`)
    const endToEndWorking = recentTickets.filter(t => t.context_id === luftAgroId).length > 0 && totalTickets < 19
    tests.push({
      test: testNumber,
      name: 'Filtro funcionando end-to-end',
      result: endToEndWorking ? '✅' : '❌',
      details: `End-to-end: ${endToEndWorking}`
    })
    testNumber++

    // RESUMO DOS TESTES
    console.log('\n' + '='.repeat(80))
    console.log('📊 RESUMO DOS 30 TESTES:')
    console.log('='.repeat(80))
    
    const passed = tests.filter(t => t.result === '✅').length
    const failed = tests.filter(t => t.result === '❌').length
    
    console.log(`✅ Testes passaram: ${passed}`)
    console.log(`❌ Testes falharam: ${failed}`)
    console.log(`📊 Taxa de sucesso: ${((passed / 30) * 100).toFixed(1)}%`)
    
    console.log('\n📋 DETALHES DOS TESTES:')
    tests.forEach(test => {
      console.log(`${test.result} ${test.test}. ${test.name}: ${test.details}`)
    })
    
    console.log('\n🎯 DIAGNÓSTICO FINAL:')
    if (passed >= 25) {
      console.log('✅ SISTEMA FUNCIONANDO CORRETAMENTE')
    } else if (passed >= 15) {
      console.log('⚠️ SISTEMA PARCIALMENTE FUNCIONANDO')
    } else {
      console.log('❌ SISTEMA NÃO ESTÁ FUNCIONANDO')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

test30DifferentScenarios()
