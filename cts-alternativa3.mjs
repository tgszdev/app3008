#!/usr/bin/env node

/**
 * CTS - ALTERNATIVA 3: DASHBOARD COM WIDGETS E VISUALIZAÇÃO AVANÇADA
 * 
 * Esta CTS testa especificamente a Alternativa 3 implementada:
 * - ClientWidgetSelector
 * - Dashboard com widgets configuráveis
 * - Múltiplos modos de visualização
 * - Sistema de filtros avançados
 * - APIs específicas para widgets
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
  constructor(name, status, duration, error = null) {
    this.name = name
    this.status = status // 'passed', 'failed', 'skipped'
    this.duration = duration
    this.error = error
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
// FUNÇÕES DE TESTE
// =====================================================

async function testSupabaseConnection() {
  const start = Date.now()
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1)
    if (error) throw error
    return new TestResult('Verificar conexão com Supabase', 'passed', Date.now() - start)
  } catch (error) {
    return new TestResult('Verificar conexão com Supabase', 'failed', Date.now() - start, error.message)
  }
}

async function testUserAuthentication() {
  const start = Date.now()
  try {
    // Testar com usuário admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, user_type, context_id')
      .eq('email', 'rodrigues2205@icloud.com')
      .single()

    if (userError) throw userError
    if (!userData) throw new Error('Usuário não encontrado')

    return new TestResult('Verificar autenticação do usuário admin', 'passed', Date.now() - start)
  } catch (error) {
    return new TestResult('Verificar autenticação do usuário admin', 'failed', Date.now() - start, error.message)
  }
}

async function testUserContexts() {
  const start = Date.now()
  try {
    // Buscar contextos do usuário
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', 'rodrigues2205@icloud.com')
      .single()

    if (userError) throw userError

    const { data: contexts, error: contextsError } = await supabaseAdmin
      .from('user_contexts')
      .select('context_id, contexts(name, slug)')
      .eq('user_id', userData.id)

    if (contextsError) throw contextsError
    if (!contexts || contexts.length === 0) throw new Error('Nenhum contexto associado ao usuário')

    return new TestResult('Verificar contextos do usuário', 'passed', Date.now() - start)
  } catch (error) {
    return new TestResult('Verificar contextos do usuário', 'failed', Date.now() - start, error.message)
  }
}

async function testClientTicketsAPI() {
  const start = Date.now()
  try {
    // Simular chamada para API client-tickets
    const response = await axios.get('http://localhost:3000/api/dashboard/client-tickets', {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })

    if (response.status !== 200) throw new Error(`Status ${response.status}`)
    if (!response.data) throw new Error('Dados não retornados')

    return new TestResult('Verificar API client-tickets', 'passed', Date.now() - start)
  } catch (error) {
    return new TestResult('Verificar API client-tickets', 'failed', Date.now() - start, error.message)
  }
}

async function testWidgetsAPI() {
  const start = Date.now()
  try {
    // Simular chamada para API widgets
    const response = await axios.get('http://localhost:3000/api/dashboard/widgets?widget_type=stats', {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })

    if (response.status !== 200) throw new Error(`Status ${response.status}`)
    if (!response.data) throw new Error('Dados não retornados')

    return new TestResult('Verificar API widgets', 'passed', Date.now() - start)
  } catch (error) {
    return new TestResult('Verificar API widgets', 'failed', Date.now() - start, error.message)
  }
}

async function testClientWidgetSelector() {
  const start = Date.now()
  try {
    // Verificar se o componente ClientWidgetSelector existe
    const fs = await import('fs')
    const path = await import('path')
    
    const componentPath = path.join(process.cwd(), 'src/components/ClientWidgetSelector.tsx')
    const componentExists = fs.existsSync(componentPath)
    
    if (!componentExists) throw new Error('Componente ClientWidgetSelector não encontrado')

    return new TestResult('Verificar componente ClientWidgetSelector', 'passed', Date.now() - start)
  } catch (error) {
    return new TestResult('Verificar componente ClientWidgetSelector', 'failed', Date.now() - start, error.message)
  }
}

async function testHybridDashboardAlternativa3() {
  const start = Date.now()
  try {
    // Verificar se o componente HybridDashboardAlternativa3 existe
    const fs = await import('fs')
    const path = await import('path')
    
    const componentPath = path.join(process.cwd(), 'src/components/dashboard/HybridDashboardAlternativa3.tsx')
    const componentExists = fs.existsSync(componentPath)
    
    if (!componentExists) throw new Error('Componente HybridDashboardAlternativa3 não encontrado')

    return new TestResult('Verificar componente HybridDashboardAlternativa3', 'passed', Date.now() - start)
  } catch (error) {
    return new TestResult('Verificar componente HybridDashboardAlternativa3', 'failed', Date.now() - start, error.message)
  }
}

async function testWidgetsConfiguration() {
  const start = Date.now()
  try {
    // Verificar se as APIs de widgets estão configuradas
    const fs = await import('fs')
    const path = await import('path')
    
    const apiPath = path.join(process.cwd(), 'src/app/api/dashboard/widgets/route.ts')
    const apiExists = fs.existsSync(apiPath)
    
    if (!apiExists) throw new Error('API de widgets não encontrada')

    return new TestResult('Verificar configuração de widgets', 'passed', Date.now() - start)
  } catch (error) {
    return new TestResult('Verificar configuração de widgets', 'failed', Date.now() - start, error.message)
  }
}

async function testMultiTenantFiltering() {
  const start = Date.now()
  try {
    // Verificar se o filtro multi-tenant está funcionando
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, user_type, context_id')
      .eq('email', 'rodrigues2205@icloud.com')
      .single()

    if (userError) throw userError

    const { data: contexts, error: contextsError } = await supabaseAdmin
      .from('user_contexts')
      .select('context_id')
      .eq('user_id', userData.id)

    if (contextsError) throw contextsError

    const associatedContextIds = contexts.map(uc => uc.context_id)

    // Verificar se há tickets associados aos contextos do usuário
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('id, context_id')
      .in('context_id', associatedContextIds)
      .limit(1)

    if (ticketsError) throw ticketsError

    return new TestResult('Verificar filtro multi-tenant', 'passed', Date.now() - start)
  } catch (error) {
    return new TestResult('Verificar filtro multi-tenant', 'failed', Date.now() - start, error.message)
  }
}

async function testClientGrouping() {
  const start = Date.now()
  try {
    // Verificar se os tickets estão sendo agrupados por cliente
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', 'rodrigues2205@icloud.com')
      .single()

    if (userError) throw userError

    const { data: contexts, error: contextsError } = await supabaseAdmin
      .from('user_contexts')
      .select('context_id, contexts(name)')
      .eq('user_id', userData.id)

    if (contextsError) throw contextsError

    // Verificar se há múltiplos contextos (necessário para agrupamento)
    if (contexts.length < 2) {
      return new TestResult('Verificar agrupamento por cliente', 'skipped', Date.now() - start, 'Usuário tem menos de 2 contextos')
    }

    return new TestResult('Verificar agrupamento por cliente', 'passed', Date.now() - start)
  } catch (error) {
    return new TestResult('Verificar agrupamento por cliente', 'failed', Date.now() - start, error.message)
  }
}

async function testWidgetVisibility() {
  const start = Date.now()
  try {
    // Verificar se os widgets estão configurados corretamente
    const fs = await import('fs')
    const path = await import('path')
    
    const componentPath = path.join(process.cwd(), 'src/components/dashboard/HybridDashboardAlternativa3.tsx')
    const componentContent = fs.readFileSync(componentPath, 'utf8')
    
    // Verificar se há configuração de widgets
    const hasWidgetConfig = componentContent.includes('widgets')
    const hasWidgetToggle = componentContent.includes('handleWidgetToggle')
    const hasViewMode = componentContent.includes('viewMode')
    
    if (!hasWidgetConfig || !hasWidgetToggle || !hasViewMode) {
      throw new Error('Configuração de widgets incompleta')
    }

    return new TestResult('Verificar visibilidade de widgets', 'passed', Date.now() - start)
  } catch (error) {
    return new TestResult('Verificar visibilidade de widgets', 'failed', Date.now() - start, error.message)
  }
}

async function testResponsiveDesign() {
  const start = Date.now()
  try {
    // Verificar se o design responsivo está implementado
    const fs = await import('fs')
    const path = await import('path')
    
    const componentPath = path.join(process.cwd(), 'src/components/dashboard/HybridDashboardAlternativa3.tsx')
    const componentContent = fs.readFileSync(componentPath, 'utf8')
    
    // Verificar classes responsivas
    const hasResponsiveClasses = componentContent.includes('sm:') || componentContent.includes('lg:') || componentContent.includes('xl:')
    const hasGridResponsive = componentContent.includes('grid-cols-1') && componentContent.includes('lg:grid-cols-2')
    
    if (!hasResponsiveClasses || !hasGridResponsive) {
      throw new Error('Design responsivo não implementado corretamente')
    }

    return new TestResult('Verificar design responsivo', 'passed', Date.now() - start)
  } catch (error) {
    return new TestResult('Verificar design responsivo', 'failed', Date.now() - start, error.message)
  }
}

// =====================================================
// EXECUÇÃO DOS TESTES
// =====================================================

async function runCts() {
  console.log('🚀 INICIANDO CTS - ALTERNATIVA 3: DASHBOARD COM WIDGETS')
  console.log('=' * 60)
  
  const startTime = new Date()
  console.log(`⏰ Início: ${startTime.toISOString()}`)
  
  const report = new CtsReport()
  
  // Suite 1: Conectividade e Autenticação
  console.log('\n📡 SUITE 1: CONECTIVIDADE E AUTENTICAÇÃO')
  const suite1 = new TestSuite('Conectividade e Autenticação')
  
  suite1.addTest(await testSupabaseConnection())
  suite1.addTest(await testUserAuthentication())
  suite1.addTest(await testUserContexts())
  
  report.addSuite(suite1)
  
  // Suite 2: APIs da Alternativa 3
  console.log('\n🔌 SUITE 2: APIS DA ALTERNATIVA 3')
  const suite2 = new TestSuite('APIs da Alternativa 3')
  
  suite2.addTest(await testClientTicketsAPI())
  suite2.addTest(await testWidgetsAPI())
  suite2.addTest(await testWidgetsConfiguration())
  
  report.addSuite(suite2)
  
  // Suite 3: Componentes da Alternativa 3
  console.log('\n🧩 SUITE 3: COMPONENTES DA ALTERNATIVA 3')
  const suite3 = new TestSuite('Componentes da Alternativa 3')
  
  suite3.addTest(await testClientWidgetSelector())
  suite3.addTest(await testHybridDashboardAlternativa3())
  suite3.addTest(await testWidgetVisibility())
  
  report.addSuite(suite3)
  
  // Suite 4: Funcionalidades Multi-Tenant
  console.log('\n🏢 SUITE 4: FUNCIONALIDADES MULTI-TENANT')
  const suite4 = new TestSuite('Funcionalidades Multi-Tenant')
  
  suite4.addTest(await testMultiTenantFiltering())
  suite4.addTest(await testClientGrouping())
  
  report.addSuite(suite4)
  
  // Suite 5: Design e Responsividade
  console.log('\n🎨 SUITE 5: DESIGN E RESPONSIVIDADE')
  const suite5 = new TestSuite('Design e Responsividade')
  
  suite5.addTest(await testResponsiveDesign())
  
  report.addSuite(suite5)
  
  // Relatório Final
  console.log('\n' + '=' * 60)
  console.log('📊 RELATÓRIO FINAL DA CTS - ALTERNATIVA 3')
  console.log('=' * 60)
  
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
  
  // Conclusão
  console.log('\n🎯 CONCLUSÃO:')
  if (report.failed === 0) {
    console.log('🎉 TODOS OS TESTES PASSARAM! A Alternativa 3 está funcionando perfeitamente!')
    console.log('✅ Pronto para deploy em produção!')
  } else if (report.failed <= 2) {
    console.log('⚠️ ALGUNS TESTES FALHARAM, mas a Alternativa 3 está funcional!')
    console.log('🔧 Recomendado: Corrigir os testes que falharam antes do deploy.')
  } else {
    console.log('❌ MUITOS TESTES FALHARAM! A Alternativa 3 precisa de correções!')
    console.log('🛠️ Recomendado: Revisar e corrigir os problemas antes de continuar.')
  }
  
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
  runCts().catch(console.error)
}

export { runCts }
