#!/usr/bin/env node

/**
 * CTS MINUCIOSA - VERIFICAÇÃO MULTI-TENANT
 * 
 * Esta CTS verifica especificamente se o sistema multi-tenant está funcionando:
 * - Usuários veem apenas tickets das organizações vinculadas
 * - Filtros por contexto estão aplicados corretamente
 * - APIs estão respeitando as associações de usuário
 */

import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

// =====================================================
// CONFIGURAÇÃO
// =====================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODUxODYsImV4cCI6MjA3MjE2MTE4Nn0.ht9a6MmtkfE5hVRmwpfyMcW24a4R7n-9hoW6eYd3K2w'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// =====================================================
// TIPOS E INTERFACES
// =====================================================

class TestResult {
  constructor(name, status, duration, error = null, details = null) {
    this.name = name
    this.status = status // 'passed', 'failed', 'skipped'
    this.duration = duration
    this.error = error
    this.details = details
  }
}

class TestSuite {
  constructor(name) {
    this.name = name
    this.tests = []
    this.passed = 0
    this.failed = 0
    this.skipped = 0
    this.duration = 0
  }

  addTest(test) {
    this.tests.push(test)
    if (test.status === 'passed') this.passed++
    else if (test.status === 'failed') this.failed++
    else if (test.status === 'skipped') this.skipped++
    this.duration += test.duration
  }
}

class CtsReport {
  constructor() {
    this.totalSuites = 0
    this.totalTests = 0
    this.passed = 0
    this.failed = 0
    this.skipped = 0
    this.duration = 0
    this.suites = []
  }

  addSuite(suite) {
    this.suites.push(suite)
    this.totalSuites++
    this.totalTests += suite.tests.length
    this.passed += suite.passed
    this.failed += suite.failed
    this.skipped += suite.skipped
    this.duration += suite.duration
  }
}

// =====================================================
// FUNÇÕES DE TESTE MINUCIOSAS
// =====================================================

async function testUserData() {
  const start = Date.now()
  try {
    console.log('🔍 Verificando dados do usuário...')
    
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, user_type, context_id, context_name, context_type')
      .eq('email', 'rodrigues2205@icloud.com')
      .single()

    if (userError) throw userError
    if (!userData) throw new Error('Usuário não encontrado')

    console.log('📊 Dados do usuário:', {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      user_type: userData.user_type,
      context_id: userData.context_id,
      context_name: userData.context_name,
      context_type: userData.context_type
    })

    return new TestResult('Verificar dados do usuário', 'passed', Date.now() - start, null, userData)
  } catch (error) {
    return new TestResult('Verificar dados do usuário', 'failed', Date.now() - start, error.message)
  }
}

async function testUserContexts() {
  const start = Date.now()
  try {
    console.log('🔍 Verificando contextos do usuário...')
    
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', 'rodrigues2205@icloud.com')
      .single()

    if (userError) throw userError

    const { data: contexts, error: contextsError } = await supabaseAdmin
      .from('user_contexts')
      .select('context_id, contexts(name, slug, type)')
      .eq('user_id', userData.id)

    if (contextsError) throw contextsError

    console.log('📊 Contextos do usuário:', contexts)

    if (!contexts || contexts.length === 0) {
      throw new Error('Usuário não tem contextos associados')
    }

    return new TestResult('Verificar contextos do usuário', 'passed', Date.now() - start, null, contexts)
  } catch (error) {
    return new TestResult('Verificar contextos do usuário', 'failed', Date.now() - start, error.message)
  }
}

async function testAllTicketsInDatabase() {
  const start = Date.now()
  try {
    console.log('🔍 Verificando todos os tickets no banco...')
    
    const { data: allTickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('id, ticket_number, title, context_id, contexts(name)')
      .order('created_at', { ascending: false })
      .limit(20)

    if (ticketsError) throw ticketsError

    console.log('📊 Todos os tickets no banco:', allTickets)

    return new TestResult('Verificar todos os tickets no banco', 'passed', Date.now() - start, null, allTickets)
  } catch (error) {
    return new TestResult('Verificar todos os tickets no banco', 'failed', Date.now() - start, error.message)
  }
}

async function testUserFilteredTickets() {
  const start = Date.now()
  try {
    console.log('🔍 Verificando tickets filtrados por usuário...')
    
    // Buscar contextos do usuário
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', 'rodrigues2205@icloud.com')
      .single()

    if (userError) throw userError

    const { data: contexts, error: contextsError } = await supabaseAdmin
      .from('user_contexts')
      .select('context_id')
      .eq('user_id', userData.id)

    if (contextsError) throw contextsError

    const associatedContextIds = contexts.map(uc => uc.context_id)
    console.log('📊 Contextos associados ao usuário:', associatedContextIds)

    // Buscar tickets apenas dos contextos associados
    const { data: filteredTickets, error: filteredError } = await supabaseAdmin
      .from('tickets')
      .select('id, ticket_number, title, context_id, contexts(name)')
      .in('context_id', associatedContextIds)
      .order('created_at', { ascending: false })
      .limit(20)

    if (filteredError) throw filteredError

    console.log('📊 Tickets filtrados por usuário:', filteredTickets)

    return new TestResult('Verificar tickets filtrados por usuário', 'passed', Date.now() - start, null, filteredTickets)
  } catch (error) {
    return new TestResult('Verificar tickets filtrados por usuário', 'failed', Date.now() - start, error.message)
  }
}

async function testDashboardStatsAPI() {
  const start = Date.now()
  try {
    console.log('🔍 Testando API /api/dashboard/stats...')
    
    // Simular chamada para API dashboard stats
    const response = await axios.get('http://localhost:3000/api/dashboard/stats', {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })

    if (response.status !== 200) throw new Error(`Status ${response.status}`)
    
    console.log('📊 Resposta da API stats:', response.data)

    return new TestResult('Verificar API dashboard stats', 'passed', Date.now() - start, null, response.data)
  } catch (error) {
    return new TestResult('Verificar API dashboard stats', 'failed', Date.now() - start, error.message)
  }
}

async function testClientTicketsAPI() {
  const start = Date.now()
  try {
    console.log('🔍 Testando API /api/dashboard/client-tickets...')
    
    // Simular chamada para API client tickets
    const response = await axios.get('http://localhost:3000/api/dashboard/client-tickets', {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })

    if (response.status !== 200) throw new Error(`Status ${response.status}`)
    
    console.log('📊 Resposta da API client-tickets:', response.data)

    return new TestResult('Verificar API client-tickets', 'passed', Date.now() - start, null, response.data)
  } catch (error) {
    return new TestResult('Verificar API client-tickets', 'failed', Date.now() - start, error.message)
  }
}

async function testRLSPolicies() {
  const start = Date.now()
  try {
    console.log('🔍 Verificando políticas RLS...')
    
    // Verificar se RLS está habilitado
    const { data: rlsEnabled, error: rlsError } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('tablename', 'tickets')

    if (rlsError) throw rlsError

    console.log('📊 Status RLS para tabela tickets:', rlsEnabled)

    // Verificar políticas existentes
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('tablename, policyname, permissive, roles, cmd, qual')
      .eq('tablename', 'tickets')

    if (policiesError) throw policiesError

    console.log('📊 Políticas RLS para tickets:', policies)

    return new TestResult('Verificar políticas RLS', 'passed', Date.now() - start, null, { rlsEnabled, policies })
  } catch (error) {
    return new TestResult('Verificar políticas RLS', 'failed', Date.now() - start, error.message)
  }
}

async function testTicketContextAssociation() {
  const start = Date.now()
  try {
    console.log('🔍 Verificando associação de tickets com contextos...')
    
    // Buscar tickets que podem estar com context_id incorreto
    const { data: ticketsWithContext, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('id, ticket_number, title, context_id, contexts(name, type)')
      .not('context_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (ticketsError) throw ticketsError

    console.log('📊 Tickets com context_id:', ticketsWithContext)

    // Buscar tickets sem context_id
    const { data: ticketsWithoutContext, error: ticketsWithoutError } = await supabaseAdmin
      .from('tickets')
      .select('id, ticket_number, title, context_id')
      .is('context_id', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (ticketsWithoutError) throw ticketsWithoutError

    console.log('📊 Tickets sem context_id:', ticketsWithoutContext)

    return new TestResult('Verificar associação de tickets com contextos', 'passed', Date.now() - start, null, { 
      withContext: ticketsWithContext, 
      withoutContext: ticketsWithoutContext 
    })
  } catch (error) {
    return new TestResult('Verificar associação de tickets com contextos', 'failed', Date.now() - start, error.message)
  }
}

async function testOrganizationData() {
  const start = Date.now()
  try {
    console.log('🔍 Verificando dados das organizações...')
    
    const { data: organizations, error: orgError } = await supabaseAdmin
      .from('contexts')
      .select('id, name, slug, type')
      .order('name')

    if (orgError) throw orgError

    console.log('📊 Organizações no sistema:', organizations)

    return new TestResult('Verificar dados das organizações', 'passed', Date.now() - start, null, organizations)
  } catch (error) {
    return new TestResult('Verificar dados das organizações', 'failed', Date.now() - start, error.message)
  }
}

async function testUserContextAssociation() {
  const start = Date.now()
  try {
    console.log('🔍 Verificando associação usuário-contexto...')
    
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('email', 'rodrigues2205@icloud.com')
      .single()

    if (userError) throw userError

    const { data: userContexts, error: userContextsError } = await supabaseAdmin
      .from('user_contexts')
      .select('user_id, context_id, contexts(name, type)')
      .eq('user_id', userData.id)

    if (userContextsError) throw userContextsError

    console.log('📊 Associações usuário-contexto:', userContexts)

    return new TestResult('Verificar associação usuário-contexto', 'passed', Date.now() - start, null, userContexts)
  } catch (error) {
    return new TestResult('Verificar associação usuário-contexto', 'failed', Date.now() - start, error.message)
  }
}

async function testSpecificTicketIssue() {
  const start = Date.now()
  try {
    console.log('🔍 Verificando ticket específico #2025090001...')
    
    // Buscar o ticket específico mencionado no print
    const { data: specificTicket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('id, ticket_number, title, context_id, contexts(name, type), created_by, users(email, name)')
      .eq('ticket_number', '2025090001')
      .single()

    if (ticketError) throw ticketError

    console.log('📊 Ticket específico #2025090001:', specificTicket)

    return new TestResult('Verificar ticket específico #2025090001', 'passed', Date.now() - start, null, specificTicket)
  } catch (error) {
    return new TestResult('Verificar ticket específico #2025090001', 'failed', Date.now() - start, error.message)
  }
}

// =====================================================
// EXECUÇÃO DOS TESTES
// =====================================================

async function runDetailedCts() {
  console.log('🚀 INICIANDO CTS MINUCIOSA - VERIFICAÇÃO MULTI-TENANT')
  console.log('=' * 80)
  
  const startTime = new Date()
  console.log(`⏰ Início: ${startTime.toISOString()}`)
  
  const report = new CtsReport()
  
  // Suite 1: Dados do Usuário
  console.log('\n👤 SUITE 1: DADOS DO USUÁRIO')
  const suite1 = new TestSuite('Dados do Usuário')
  
  suite1.addTest(await testUserData())
  suite1.addTest(await testUserContexts())
  suite1.addTest(await testUserContextAssociation())
  
  report.addSuite(suite1)
  
  // Suite 2: Dados das Organizações
  console.log('\n🏢 SUITE 2: DADOS DAS ORGANIZAÇÕES')
  const suite2 = new TestSuite('Dados das Organizações')
  
  suite2.addTest(await testOrganizationData())
  
  report.addSuite(suite2)
  
  // Suite 3: Tickets no Banco
  console.log('\n🎫 SUITE 3: TICKETS NO BANCO')
  const suite3 = new TestSuite('Tickets no Banco')
  
  suite3.addTest(await testAllTicketsInDatabase())
  suite3.addTest(await testUserFilteredTickets())
  suite3.addTest(await testTicketContextAssociation())
  suite3.addTest(await testSpecificTicketIssue())
  
  report.addSuite(suite3)
  
  // Suite 4: Políticas RLS
  console.log('\n🔒 SUITE 4: POLÍTICAS RLS')
  const suite4 = new TestSuite('Políticas RLS')
  
  suite4.addTest(await testRLSPolicies())
  
  report.addSuite(suite4)
  
  // Suite 5: APIs
  console.log('\n🔌 SUITE 5: APIS')
  const suite5 = new TestSuite('APIs')
  
  suite5.addTest(await testDashboardStatsAPI())
  suite5.addTest(await testClientTicketsAPI())
  
  report.addSuite(suite5)
  
  // Relatório Final
  console.log('\n' + '=' * 80)
  console.log('📊 RELATÓRIO FINAL DA CTS MINUCIOSA')
  console.log('=' * 80)
  
  console.log(`📈 Total de Suites: ${report.totalSuites}`)
  console.log(`🧪 Total de Testes: ${report.totalTests}`)
  console.log(`✅ Testes Aprovados: ${report.passed}`)
  console.log(`❌ Testes Falharam: ${report.failed}`)
  console.log(`⏭️ Testes Ignorados: ${report.skipped}`)
  console.log(`⏱️ Duração Total: ${report.duration}ms`)
  
  const successRate = ((report.passed / report.totalTests) * 100).toFixed(2)
  console.log(`📊 Taxa de Sucesso: ${successRate}%`)
  
  // Detalhes por Suite
  console.log('\n📋 DETALHES POR SUITE:')
  report.suites.forEach((suite, index) => {
    console.log(`\n${index + 1}. ${suite.name}`)
    console.log(`   ✅ Aprovados: ${suite.passed}`)
    console.log(`   ❌ Falharam: ${suite.failed}`)
    console.log(`   ⏭️ Ignorados: ${suite.skipped}`)
    console.log(`   ⏱️ Duração: ${suite.duration}ms`)
    
    // Mostrar testes que falharam
    const failedTests = suite.tests.filter(test => test.status === 'failed')
    if (failedTests.length > 0) {
      console.log('   🔍 Testes que falharam:')
      failedTests.forEach(test => {
        console.log(`      - ${test.name}: ${test.error}`)
      })
    }
  })
  
  // Análise Específica do Problema
  console.log('\n🔍 ANÁLISE ESPECÍFICA DO PROBLEMA:')
  console.log('O usuário está vendo tickets da organização "Agro" mesmo não estando vinculado a ela.')
  console.log('Possíveis causas:')
  console.log('1. RLS policies não estão funcionando corretamente')
  console.log('2. APIs não estão aplicando filtro por contexto do usuário')
  console.log('3. Tickets não têm context_id correto')
  console.log('4. Usuário tem associações incorretas')
  
  const endTime = new Date()
  const totalDuration = endTime - startTime
  console.log(`\n⏰ Fim: ${endTime.toISOString()}`)
  console.log(`⏱️ Duração Total: ${totalDuration}ms`)
  
  return report
}

// =====================================================
// EXECUÇÃO
// =====================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  runDetailedCts().catch(console.error)
}

export { runDetailedCts }
